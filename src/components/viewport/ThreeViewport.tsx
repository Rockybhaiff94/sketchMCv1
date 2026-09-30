import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { BlockPlacement, MinecraftBuild } from '../../types/minecraft.ts';
import { getMinecraftBlock } from '../../lib/registry.ts';
import { getBlockGeometry } from '../../lib/models/blockModelRegistry.ts';
import { getOrCreateBlockTexture } from '../../lib/textureGenerator.ts';
import { OrientationGizmo, GizmoViewTarget } from './OrientationGizmo.tsx';
import {
  Focus,
  Maximize2,
  RotateCcw,
  Compass,
} from 'lucide-react';

export type CameraViewMode =
  | 'perspective'
  | 'front'
  | 'back'
  | 'left'
  | 'right'
  | 'top'
  | 'bottom'
  | 'isometric'
  | 'first_person';

export type ToolMode =
  | 'select'
  | 'move'
  | 'rotate'
  | 'scale'
  | 'add'
  | 'delete'
  | 'fill'
  | 'paint'
  | 'eyedropper';

export type ShadingMode = 'material' | 'solid' | 'wireframe' | 'blueprint';

interface ThreeViewportProps {
  build: MinecraftBuild;
  activeTool: ToolMode;
  selectedBlockId: string;
  selectedBlockPlacement: BlockPlacement | null;
  maxLayerSlice: number;
  shadingMode: ShadingMode;
  onSelectBlock: (block: BlockPlacement | null) => void;
  onAddBlock?: (position: { x: number; y: number; z: number }, blockId: string) => void;
  onDeleteBlock?: (blockId: string, position: { x: number; y: number; z: number }) => void;
  onPaintBlock?: (position: { x: number; y: number; z: number }, newBlockId: string) => void;
  onEyedropperPick?: (blockId: string) => void;
  hoveredCoords: { x: number; y: number; z: number } | null;
  setHoveredCoords: (coords: { x: number; y: number; z: number } | null) => void;
}

interface CameraAnimation {
  startPos: THREE.Vector3;
  targetPos: THREE.Vector3;
  startTarget: THREE.Vector3;
  targetTarget: THREE.Vector3;
  startTime: number;
  duration: number;
}

export const ThreeViewport: React.FC<ThreeViewportProps> = ({
  build,
  activeTool,
  selectedBlockId,
  selectedBlockPlacement,
  maxLayerSlice,
  shadingMode,
  onSelectBlock,
  onAddBlock,
  onDeleteBlock,
  onPaintBlock,
  onEyedropperPick,
  hoveredCoords,
  setHoveredCoords,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewMode, setViewMode] = useState<CameraViewMode>('perspective');
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [isPointerLocked, setIsPointerLocked] = useState<boolean>(false);
  const [, setRerenderTicker] = useState(0);

  // References to keep Three.js state persistent
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const meshesRef = useRef<THREE.InstancedMesh[]>([]);
  const blockLookupRef = useRef<Map<string, BlockPlacement>>(new Map());
  const instanceToBlockRef = useRef<Map<string, BlockPlacement>>(new Map());
  const outlineMeshRef = useRef<THREE.LineSegments | null>(null);
  const hoverOutlineRef = useRef<THREE.LineSegments | null>(null);
  const ghostMeshRef = useRef<THREE.Mesh | null>(null);

  // Camera Orbit & Pivot state
  // cameraTarget is the stable 3D pivot around which orbit occurs
  const cameraTarget = useRef(new THREE.Vector3(0, 5, 0));
  const cameraSpherical = useRef({ radius: 30, theta: Math.PI / 4, phi: Math.PI / 3 });
  const cameraAnimRef = useRef<CameraAnimation | null>(null);

  // Mouse & Drag State
  const isOrbitingRef = useRef(false);
  const isPanningRef = useRef(false);
  const isFastPanRef = useRef(false);
  const mouseDownDataRef = useRef<{ x: number; y: number; time: number; button: number }>({
    x: 0,
    y: 0,
    time: 0,
    button: 0,
  });
  const previousMousePosition = useRef({ x: 0, y: 0 });

  // Touch State
  const touchStateRef = useRef<{
    startDist: number;
    startMidX: number;
    startMidY: number;
    isMultiTouch: boolean;
    startTime: number;
    startX: number;
    startY: number;
  }>({ startDist: 0, startMidX: 0, startMidY: 0, isMultiTouch: false, startTime: 0, startX: 0, startY: 0 });

  // First Person Controls state
  const keysPressed = useRef<{ [key: string]: boolean }>({});
  const fpPitch = useRef(0);
  const fpYaw = useRef(0);

  // Compute Build Bounding Box
  const getBuildBounds = useCallback(() => {
    if (!build || build.blocks.length === 0) {
      return {
        min: new THREE.Vector3(-6, 0, -6),
        max: new THREE.Vector3(6, 12, 6),
        center: new THREE.Vector3(0, 6, 0),
        size: new THREE.Vector3(12, 12, 12),
        radius: 12,
        maxDim: 12,
      };
    }

    const min = new THREE.Vector3(Infinity, Infinity, Infinity);
    const max = new THREE.Vector3(-Infinity, -Infinity, -Infinity);

    for (const b of build.blocks) {
      min.x = Math.min(min.x, b.position.x);
      min.y = Math.min(min.y, b.position.y);
      min.z = Math.min(min.z, b.position.z);
      max.x = Math.max(max.x, b.position.x);
      max.y = Math.max(max.y, b.position.y);
      max.z = Math.max(max.z, b.position.z);
    }

    min.subScalar(0.5);
    max.addScalar(0.5);

    const center = new THREE.Vector3().addVectors(min, max).multiplyScalar(0.5);
    const size = new THREE.Vector3().subVectors(max, min);
    const radius = Math.max(6, size.length() * 0.5);
    const maxDim = Math.max(size.x, size.y, size.z, 12);

    return { min, max, center, size, radius, maxDim };
  }, [build]);

  // Dynamic Camera near/far and fog
  const updateDynamicClipping = useCallback(() => {
    const camera = cameraRef.current;
    const scene = sceneRef.current;
    if (!camera || !scene) return;

    const { maxDim } = getBuildBounds();
    camera.near = Math.max(0.05, maxDim * 0.002);
    camera.far = Math.max(2500, maxDim * 45);
    camera.updateProjectionMatrix();

    if (shadingMode === 'blueprint') {
      scene.fog = new THREE.Fog(0x020b18, Math.max(450, maxDim * 12), Math.max(3000, maxDim * 50));
    } else {
      scene.fog = new THREE.Fog(0x090d16, Math.max(400, maxDim * 10), Math.max(2500, maxDim * 35));
    }
  }, [getBuildBounds, shadingMode]);

  // Update Camera Positioning from stable pivot (cameraTarget) and spherical coords
  const updateCameraPosition = useCallback(() => {
    if (!cameraRef.current || viewMode === 'first_person' || cameraAnimRef.current) return;

    const { radius, theta, phi } = cameraSpherical.current;
    const target = cameraTarget.current;

    const sinPhi = Math.sin(phi);
    const x = target.x + radius * sinPhi * Math.sin(theta);
    const y = target.y + radius * Math.cos(phi);
    const z = target.z + radius * sinPhi * Math.cos(theta);

    cameraRef.current.position.set(x, y, z);
    cameraRef.current.lookAt(target);
  }, [viewMode]);

  // Smooth Camera Animation to Target Position & Target LookAt
  const animateCameraTo = useCallback(
    (targetPos: THREE.Vector3, targetTarget: THREE.Vector3, duration: number = 400) => {
      if (!cameraRef.current) return;

      cameraAnimRef.current = {
        startPos: cameraRef.current.position.clone(),
        targetPos: targetPos.clone(),
        startTarget: cameraTarget.current.clone(),
        targetTarget: targetTarget.clone(),
        startTime: performance.now(),
        duration,
      };
    },
    []
  );

  // Frame All: Center & fit the entire build inside viewport
  const handleFrameAll = useCallback(() => {
    const camera = cameraRef.current;
    if (!camera) return;

    const { center, radius } = getBuildBounds();
    const fov = (camera.fov * Math.PI) / 180;
    const fitDistance = Math.max(14, (radius / Math.sin(fov / 2)) * 1.25);

    const { theta, phi } = cameraSpherical.current;
    const safePhi = Math.max(0.1, Math.min(Math.PI - 0.1, phi));

    const sinPhi = Math.sin(safePhi);
    const newPos = new THREE.Vector3(
      center.x + fitDistance * sinPhi * Math.sin(theta),
      center.y + fitDistance * Math.cos(safePhi),
      center.z + fitDistance * sinPhi * Math.cos(theta)
    );

    cameraSpherical.current.radius = fitDistance;
    cameraSpherical.current.phi = safePhi;
    animateCameraTo(newPos, center);
    setViewMode('perspective');
  }, [getBuildBounds, animateCameraTo]);

  // Frame Selected Block
  const handleFrameSelected = useCallback(() => {
    if (!selectedBlockPlacement) {
      handleFrameAll();
      return;
    }

    const blockCenter = new THREE.Vector3(
      selectedBlockPlacement.position.x,
      selectedBlockPlacement.position.y,
      selectedBlockPlacement.position.z
    );

    const fitDistance = 7;
    const { theta, phi } = cameraSpherical.current;
    const safePhi = Math.max(0.2, Math.min(Math.PI - 0.2, phi));
    const sinPhi = Math.sin(safePhi);

    const newPos = new THREE.Vector3(
      blockCenter.x + fitDistance * sinPhi * Math.sin(theta),
      blockCenter.y + fitDistance * Math.cos(safePhi),
      blockCenter.z + fitDistance * sinPhi * Math.cos(theta)
    );

    cameraSpherical.current.radius = fitDistance;
    animateCameraTo(newPos, blockCenter);
    setViewMode('perspective');
  }, [selectedBlockPlacement, handleFrameAll, animateCameraTo]);

  // Reset Camera
  const handleResetCamera = useCallback(() => {
    const { center, radius } = getBuildBounds();
    const targetDist = Math.max(22, radius * 2.2);

    cameraSpherical.current = {
      radius: targetDist,
      theta: Math.PI / 4,
      phi: Math.PI / 3,
    };

    const targetPos = new THREE.Vector3(
      center.x + targetDist * Math.sin(Math.PI / 3) * Math.sin(Math.PI / 4),
      center.y + targetDist * Math.cos(Math.PI / 3),
      center.z + targetDist * Math.sin(Math.PI / 3) * Math.cos(Math.PI / 4)
    );

    animateCameraTo(targetPos, center);
    setViewMode('perspective');
  }, [getBuildBounds, animateCameraTo]);

  // Camera Presets
  const setCameraPreset = useCallback(
    (mode: CameraViewMode | GizmoViewTarget) => {
      setViewMode(mode as CameraViewMode);
      const { center, radius } = getBuildBounds();
      const r = Math.max(cameraSpherical.current.radius, radius * 1.8);

      let targetPos = new THREE.Vector3();
      let newTheta = cameraSpherical.current.theta;
      let newPhi = cameraSpherical.current.phi;

      if (mode === 'front') {
        newTheta = 0;
        newPhi = Math.PI / 2;
        targetPos.set(center.x, center.y, center.z + r);
      } else if (mode === 'back') {
        newTheta = Math.PI;
        newPhi = Math.PI / 2;
        targetPos.set(center.x, center.y, center.z - r);
      } else if (mode === 'left') {
        newTheta = -Math.PI / 2;
        newPhi = Math.PI / 2;
        targetPos.set(center.x - r, center.y, center.z);
      } else if (mode === 'right') {
        newTheta = Math.PI / 2;
        newPhi = Math.PI / 2;
        targetPos.set(center.x + r, center.y, center.z);
      } else if (mode === 'top') {
        newTheta = 0;
        newPhi = 0.01;
        targetPos.set(center.x, center.y + r, center.z + 0.001);
      } else if (mode === 'bottom') {
        newTheta = 0;
        newPhi = Math.PI - 0.01;
        targetPos.set(center.x, center.y - r, center.z + 0.001);
      } else if (mode === 'isometric') {
        newTheta = Math.PI / 4;
        newPhi = Math.PI / 3;
        const sinPhi = Math.sin(newPhi);
        targetPos.set(
          center.x + r * sinPhi * Math.sin(newTheta),
          center.y + r * Math.cos(newPhi),
          center.z + r * sinPhi * Math.cos(newTheta)
        );
      } else if (mode === 'first_person') {
        if (cameraRef.current) {
          const spawnY = Math.max(1, center.y);
          cameraRef.current.position.set(center.x, spawnY, center.z + radius + 3);
          cameraRef.current.lookAt(center.x, spawnY, center.z);
          fpPitch.current = 0;
          fpYaw.current = 0;
        }
        return;
      }

      cameraSpherical.current = { radius: r, theta: newTheta, phi: newPhi };
      animateCameraTo(targetPos, center);
    },
    [getBuildBounds, animateCameraTo]
  );

  // Initialize Scene, Renderer, Geometries
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(shadingMode === 'blueprint' ? '#020B18' : '#090D16');
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 3000);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Three-point lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.95);
    ambientLight.name = 'ambientLight';
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfff5e6, 1.4);
    dirLight.position.set(45, 70, 45);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.name = 'dirLight';
    scene.add(dirLight);

    const rimLight = new THREE.DirectionalLight(0x7090b0, 0.65);
    rimLight.position.set(-45, 35, -45);
    rimLight.name = 'rimLight';
    scene.add(rimLight);

    // Ground Grid Helper
    const gridColor1 = shadingMode === 'blueprint' ? 0x0ea5e9 : 0x475569;
    const gridColor2 = shadingMode === 'blueprint' ? 0x0369a1 : 0x1e293b;
    const gridHelper = new THREE.GridHelper(100, 100, gridColor1, gridColor2);
    gridHelper.position.y = -0.5;
    gridHelper.name = 'gridHelper';
    scene.add(gridHelper);

    // Selection Outline Helper
    const outlineGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(1.025, 1.025, 1.025));
    const outlineMat = new THREE.LineBasicMaterial({ color: 0x38bdf8, linewidth: 2.5, depthTest: true });
    const outlineMesh = new THREE.LineSegments(outlineGeo, outlineMat);
    outlineMesh.renderOrder = 999;
    outlineMesh.visible = false;
    scene.add(outlineMesh);
    outlineMeshRef.current = outlineMesh;

    // Hover Outline Helper
    const hoverGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(1.015, 1.015, 1.015));
    const hoverMat = new THREE.LineBasicMaterial({ color: 0xf59e0b, linewidth: 2, depthTest: true });
    const hoverMesh = new THREE.LineSegments(hoverGeo, hoverMat);
    hoverMesh.renderOrder = 998;
    hoverMesh.visible = false;
    scene.add(hoverMesh);
    hoverOutlineRef.current = hoverMesh;

    // Ghost Placement Preview Mesh
    const ghostMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.45,
      wireframe: true,
    });
    const ghostMesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), ghostMat);
    ghostMesh.visible = false;
    ghostMesh.renderOrder = 997;
    scene.add(ghostMesh);
    ghostMeshRef.current = ghostMesh;

    // Initial camera positioning
    handleFrameAll();

    // Resize Handler
    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Animation Loop
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);

      // Handle Smooth Camera Interpolation
      if (cameraAnimRef.current && cameraRef.current) {
        const anim = cameraAnimRef.current;
        const now = performance.now();
        const elapsed = now - anim.startTime;
        const progress = Math.min(1, elapsed / anim.duration);
        const t = 1 - Math.pow(1 - progress, 3); // cubic ease-out

        cameraRef.current.position.lerpVectors(anim.startPos, anim.targetPos, t);
        cameraTarget.current.lerpVectors(anim.startTarget, anim.targetTarget, t);
        cameraRef.current.lookAt(cameraTarget.current);

        if (progress >= 1) {
          cameraAnimRef.current = null;
          const offset = cameraRef.current.position.clone().sub(cameraTarget.current);
          const r = offset.length();
          cameraSpherical.current.radius = r;
          cameraSpherical.current.phi = Math.acos(Math.max(-1, Math.min(1, offset.y / r)));
          cameraSpherical.current.theta = Math.atan2(offset.x, offset.z);
        }
      }

      // Handle Walk Mode Movement
      if (viewMode === 'first_person' && cameraRef.current) {
        const speed = keysPressed.current['ShiftLeft'] || keysPressed.current['ShiftRight'] ? 0.35 : 0.18;
        const forward = new THREE.Vector3();
        cameraRef.current.getWorldDirection(forward);
        forward.y = 0;
        forward.normalize();
        const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

        if (keysPressed.current['KeyW'] || keysPressed.current['ArrowUp']) {
          cameraRef.current.position.addScaledVector(forward, speed);
        }
        if (keysPressed.current['KeyS'] || keysPressed.current['ArrowDown']) {
          cameraRef.current.position.addScaledVector(forward, -speed);
        }
        if (keysPressed.current['KeyA'] || keysPressed.current['ArrowLeft']) {
          cameraRef.current.position.addScaledVector(right, -speed);
        }
        if (keysPressed.current['KeyD'] || keysPressed.current['ArrowRight']) {
          cameraRef.current.position.addScaledVector(right, speed);
        }
        if (keysPressed.current['Space']) {
          cameraRef.current.position.y += speed;
        }
        if (keysPressed.current['KeyQ'] || keysPressed.current['ControlLeft']) {
          cameraRef.current.position.y -= speed;
        }
      }

      renderer.render(scene, cameraRef.current || camera);
      setRerenderTicker((prev) => (prev + 1) % 1000);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      outlineGeo.dispose();
      outlineMat.dispose();
      hoverGeo.dispose();
      hoverMat.dispose();
      ghostMat.dispose();
    };
  }, []);

  // Update background styling on Shading Mode change
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    scene.background = new THREE.Color(shadingMode === 'blueprint' ? '#020B18' : '#090D16');
    updateDynamicClipping();
  }, [shadingMode, updateDynamicClipping]);

  // Update clipping & fog whenever build changes
  useEffect(() => {
    updateDynamicClipping();
  }, [build, updateDynamicClipping]);

  // Re-build Instanced Meshes using real Minecraft model geometries
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    meshesRef.current.forEach((m) => {
      scene.remove(m);
      (m.material as THREE.Material).dispose();
    });
    meshesRef.current = [];
    blockLookupRef.current.clear();
    instanceToBlockRef.current.clear();

    const visibleBlocks = build.blocks.filter((b) => b.position.y <= maxLayerSlice);

    // Group blocks by (blockId + shapeType + stateSignature) to use accurate geometries
    const groups = new Map<string, { blockId: string; state?: Record<string, string>; blocks: BlockPlacement[] }>();

    for (const b of visibleBlocks) {
      blockLookupRef.current.set(`${b.position.x},${b.position.y},${b.position.z}`, b);
      const def = getMinecraftBlock(b.blockId);
      const shapeType = def?.shapeType || 'full_cube';

      // Shape state key for geometry selection
      const typeKey = b.state?.type || '';
      const halfKey = b.state?.half || '';
      const shapeKey = b.state?.shape || '';
      const groupKey = `${b.blockId}__${shapeType}__${typeKey}_${halfKey}_${shapeKey}`;

      if (!groups.has(groupKey)) {
        groups.set(groupKey, { blockId: b.blockId, state: b.state, blocks: [] });
      }
      groups.get(groupKey)!.blocks.push(b);
    }

    const dummy = new THREE.Object3D();

    for (const group of groups.values()) {
      const def = getMinecraftBlock(group.blockId);
      const shapeType = def?.shapeType || 'full_cube';

      // Retrieve cached BufferGeometry tailored to Minecraft model
      const geo = getBlockGeometry(shapeType, group.state);

      // Material according to ShadingMode
      let mat: THREE.Material;
      if (shadingMode === 'solid') {
        mat = new THREE.MeshStandardMaterial({
          color: new THREE.Color('#c8ccd4'),
          roughness: 0.85,
          metalness: 0.05,
        });
      } else if (shadingMode === 'wireframe') {
        mat = new THREE.MeshBasicMaterial({
          color: new THREE.Color('#38bdf8'),
          wireframe: true,
        });
      } else if (shadingMode === 'blueprint') {
        mat = new THREE.MeshStandardMaterial({
          color: new THREE.Color('#0284c7'),
          roughness: 0.6,
          metalness: 0.1,
          transparent: true,
          opacity: 0.55,
          depthWrite: true,
        });
      } else {
        const texture = getOrCreateBlockTexture(group.blockId, def?.colorHex);
        const cleanId = group.blockId.replace('minecraft:', '').toLowerCase();
        const isGlass = cleanId.includes('glass');
        const isLeaves = cleanId.includes('leaves') || cleanId.includes('vine');
        const isPlant = shapeType === 'plant' || shapeType === 'torch';
        const isDoor = cleanId.includes('door') || cleanId.includes('grate');
        const isTransparent = isGlass || isLeaves || isPlant || isDoor || !!def?.transparent;

        mat = new THREE.MeshStandardMaterial({
          map: texture,
          color: new THREE.Color(isPlant || isLeaves || isGlass ? '#ffffff' : (def?.colorHex || '#ffffff')),
          roughness: isGlass ? 0.05 : (def?.roughness ?? 0.8),
          metalness: isGlass ? 0.1 : (def?.metalness ?? 0.05),
          transparent: isTransparent,
          opacity: isGlass ? (cleanId.includes('tinted') ? 0.75 : 0.55) : 1.0,
          alphaTest: (isPlant || isLeaves || isDoor) ? 0.25 : 0,
          side: isPlant ? THREE.DoubleSide : THREE.FrontSide,
          depthWrite: !isGlass,
        });
      }

      const instancedMesh = new THREE.InstancedMesh(geo, mat, group.blocks.length);
      instancedMesh.castShadow = shadingMode === 'material' || shadingMode === 'solid';
      instancedMesh.receiveShadow = shadingMode === 'material' || shadingMode === 'solid';
      instancedMesh.name = group.blockId;

      for (let i = 0; i < group.blocks.length; i++) {
        const b = group.blocks[i];
        dummy.position.set(b.position.x, b.position.y, b.position.z);
        dummy.rotation.set(0, 0, 0);

        // Rotate according to Minecraft facing / axis
        if (b.state?.facing) {
          if (b.state.facing === 'south') dummy.rotation.y = Math.PI;
          else if (b.state.facing === 'west') dummy.rotation.y = Math.PI / 2;
          else if (b.state.facing === 'east') dummy.rotation.y = -Math.PI / 2;
        } else if (b.state?.axis) {
          if (b.state.axis === 'x') dummy.rotation.z = Math.PI / 2;
          else if (b.state.axis === 'z') dummy.rotation.x = Math.PI / 2;
        }

        dummy.updateMatrix();
        instancedMesh.setMatrixAt(i, dummy.matrix);
        instanceToBlockRef.current.set(`${instancedMesh.uuid}_${i}`, b);
      }

      instancedMesh.instanceMatrix.needsUpdate = true;
      scene.add(instancedMesh);
      meshesRef.current.push(instancedMesh);
    }
  }, [build, maxLayerSlice, shadingMode]);

  // Update Outlines
  useEffect(() => {
    if (outlineMeshRef.current) {
      if (selectedBlockPlacement) {
        outlineMeshRef.current.position.set(
          selectedBlockPlacement.position.x,
          selectedBlockPlacement.position.y,
          selectedBlockPlacement.position.z
        );
        outlineMeshRef.current.visible = true;
      } else {
        outlineMeshRef.current.visible = false;
      }
    }
  }, [selectedBlockPlacement]);

  useEffect(() => {
    if (hoverOutlineRef.current) {
      if (hoveredCoords && activeTool !== 'add') {
        hoverOutlineRef.current.position.set(hoveredCoords.x, hoveredCoords.y, hoveredCoords.z);
        hoverOutlineRef.current.visible = true;
      } else {
        hoverOutlineRef.current.visible = false;
      }
    }
  }, [hoveredCoords, activeTool]);

  // Pointer Lock handling for Walk Mode
  const togglePointerLock = () => {
    if (!containerRef.current) return;
    if (document.pointerLockElement === containerRef.current) {
      document.exitPointerLock();
    } else {
      containerRef.current.requestPointerLock();
    }
  };

  useEffect(() => {
    const handlePointerLockChange = () => {
      setIsPointerLocked(document.pointerLockElement === containerRef.current);
    };
    document.addEventListener('pointerlockchange', handlePointerLockChange);
    return () => document.removeEventListener('pointerlockchange', handlePointerLockChange);
  }, []);

  // Raycasting for block picking & tools
  const performRaycast = (clientX: number, clientY: number, isClick: boolean) => {
    if (!containerRef.current || !cameraRef.current || !sceneRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1
    );

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, cameraRef.current);
    const intersects = raycaster.intersectObjects(meshesRef.current);

    if (intersects.length > 0) {
      const hit = intersects[0];
      const instanceId = hit.instanceId;
      if (instanceId !== undefined && hit.object instanceof THREE.InstancedMesh) {
        const key = `${hit.object.uuid}_${instanceId}`;
        const clickedBlock = instanceToBlockRef.current.get(key);

        if (clickedBlock) {
          setHoveredCoords(clickedBlock.position);

          // Update Ghost preview when in add mode
          if (activeTool === 'add' && hit.face && ghostMeshRef.current) {
            const normal = hit.face.normal;
            const targetPos = {
              x: clickedBlock.position.x + Math.round(normal.x),
              y: clickedBlock.position.y + Math.round(normal.y),
              z: clickedBlock.position.z + Math.round(normal.z),
            };
            ghostMeshRef.current.position.set(targetPos.x, targetPos.y, targetPos.z);
            ghostMeshRef.current.visible = true;
          }

          if (isClick) {
            if (activeTool === 'select') {
              onSelectBlock(clickedBlock);
            } else if (activeTool === 'eyedropper') {
              onEyedropperPick?.(clickedBlock.blockId);
            } else if (activeTool === 'delete') {
              onDeleteBlock?.(clickedBlock.id, clickedBlock.position);
            } else if (activeTool === 'paint') {
              onPaintBlock?.(clickedBlock.position, selectedBlockId);
            } else if (activeTool === 'add' && hit.face) {
              const normal = hit.face.normal;
              const newPos = {
                x: clickedBlock.position.x + Math.round(normal.x),
                y: clickedBlock.position.y + Math.round(normal.y),
                z: clickedBlock.position.z + Math.round(normal.z),
              };
              onAddBlock?.(newPos, selectedBlockId);
            }
          }
        }
      }
    } else {
      setHoveredCoords(null);
      if (ghostMeshRef.current) {
        ghostMeshRef.current.visible = false;
      }
      if (isClick && activeTool === 'select') {
        onSelectBlock(null);
      }
    }
  };

  // Mouse Handlers - Dedicated CAD/Blender/Blockbench Navigation:
  // RIGHT CLICK + DRAG = Orbit around current 3D pivot (cameraTarget)
  // MOUSE WHEEL = Zoom in/out (maintaining pivot)
  // MIDDLE CLICK + DRAG = Pan
  // SHIFT + MIDDLE CLICK + DRAG = Faster Pan (2.5x)
  // ALT + LEFT CLICK + DRAG = Orbit
  // LEFT CLICK = Tool action (if movement < 4px)
  const onMouseDown = (e: React.MouseEvent) => {
    if (viewMode === 'first_person') {
      togglePointerLock();
      return;
    }

    mouseDownDataRef.current = {
      x: e.clientX,
      y: e.clientY,
      time: performance.now(),
      button: e.button,
    };
    previousMousePosition.current = { x: e.clientX, y: e.clientY };

    // Cancel any ongoing camera animation immediately on user interaction
    if (cameraAnimRef.current) {
      cameraAnimRef.current = null;
    }

    // Right Mouse Button (button 2) = ORBIT around pivot
    if (e.button === 2) {
      isOrbitingRef.current = true;
    } else if (e.button === 1) {
      // Middle Mouse Button (button 1) = PAN
      isPanningRef.current = true;
      isFastPanRef.current = e.shiftKey;
    } else if (e.button === 0) {
      if (e.altKey) {
        // Alt + Left Drag = Orbit
        isOrbitingRef.current = true;
      } else if (e.shiftKey) {
        // Shift + Left Drag = Pan
        isPanningRef.current = true;
        isFastPanRef.current = false;
      } else {
        // Left Drag = Orbit or Tool Action
        isOrbitingRef.current = true;
      }
    }
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (viewMode === 'first_person' && isPointerLocked && cameraRef.current) {
      const sensitivity = 0.0022;
      fpYaw.current -= e.movementX * sensitivity;
      fpPitch.current = Math.max(-1.48, Math.min(1.48, fpPitch.current - e.movementY * sensitivity));

      const euler = new THREE.Euler(0, 0, 0, 'YXZ');
      euler.x = fpPitch.current;
      euler.y = fpYaw.current;
      cameraRef.current.quaternion.setFromEuler(euler);
      return;
    }

    const deltaX = e.clientX - previousMousePosition.current.x;
    const deltaY = e.clientY - previousMousePosition.current.y;
    previousMousePosition.current = { x: e.clientX, y: e.clientY };

    if (isOrbitingRef.current && viewMode !== 'first_person') {
      // Orbit around stable cameraTarget pivot:
      cameraSpherical.current.theta -= deltaX * 0.008;
      cameraSpherical.current.phi = Math.max(
        0.01,
        Math.min(Math.PI - 0.01, cameraSpherical.current.phi - deltaY * 0.008)
      );
      updateCameraPosition();
    } else if (isPanningRef.current && viewMode !== 'first_person') {
      // Pan cameraTarget and camera in lockstep
      const speedMultiplier = isFastPanRef.current ? 0.004 : 0.0016;
      const panSpeed = speedMultiplier * Math.max(3, cameraSpherical.current.radius);
      const camera = cameraRef.current;
      if (camera) {
        const right = new THREE.Vector3();
        const up = new THREE.Vector3();
        camera.matrix.extractBasis(right, up, new THREE.Vector3());

        cameraTarget.current.addScaledVector(right, -deltaX * panSpeed);
        cameraTarget.current.addScaledVector(up, deltaY * panSpeed);
        updateCameraPosition();
      }
    } else {
      performRaycast(e.clientX, e.clientY, false);
    }
  };

  const onMouseUp = (e: React.MouseEvent) => {
    const down = mouseDownDataRef.current;
    const moveDist = Math.hypot(e.clientX - down.x, e.clientY - down.y);
    const duration = performance.now() - down.time;

    // Distinguish between Click and Drag:
    // If movement < 4px and under 400ms, it is a genuine Click
    if (moveDist < 4 && duration < 400) {
      if (e.button === 0) {
        performRaycast(e.clientX, e.clientY, true);
      } else if (e.button === 2) {
        // Right click without dragging: clear selection
        onSelectBlock(null);
      }
    }

    isOrbitingRef.current = false;
    isPanningRef.current = false;
    isFastPanRef.current = false;
  };

  // Zoom with Mouse Wheel — Maintains stable orbit pivot (cameraTarget)
  const onWheel = (e: React.WheelEvent) => {
    if (viewMode === 'first_person') return;
    if (cameraAnimRef.current) {
      cameraAnimRef.current = null;
    }

    // Zoom delta proportional to radius so zooming feels natural near and far
    const zoomDelta = e.deltaY * 0.0014 * cameraSpherical.current.radius;
    cameraSpherical.current.radius = Math.max(0.8, Math.min(1200, cameraSpherical.current.radius + zoomDelta));
    updateCameraPosition();
  };

  // Touch Handlers
  const onTouchStart = (e: React.TouchEvent) => {
    if (cameraAnimRef.current) {
      cameraAnimRef.current = null;
    }
    if (e.touches.length === 1) {
      touchStateRef.current.isMultiTouch = false;
      touchStateRef.current.startTime = performance.now();
      touchStateRef.current.startX = e.touches[0].clientX;
      touchStateRef.current.startY = e.touches[0].clientY;
      previousMousePosition.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      isOrbitingRef.current = true;
    } else if (e.touches.length === 2) {
      touchStateRef.current.isMultiTouch = true;
      isOrbitingRef.current = false;
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      touchStateRef.current.startDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      touchStateRef.current.startMidX = (t1.clientX + t2.clientX) / 2;
      touchStateRef.current.startMidY = (t1.clientY + t2.clientY) / 2;
    }
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && !touchStateRef.current.isMultiTouch) {
      const deltaX = e.touches[0].clientX - previousMousePosition.current.x;
      const deltaY = e.touches[0].clientY - previousMousePosition.current.y;
      previousMousePosition.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };

      cameraSpherical.current.theta -= deltaX * 0.009;
      cameraSpherical.current.phi = Math.max(
        0.01,
        Math.min(Math.PI - 0.01, cameraSpherical.current.phi - deltaY * 0.009)
      );
      updateCameraPosition();
    } else if (e.touches.length === 2) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      const midX = (t1.clientX + t2.clientX) / 2;
      const midY = (t1.clientY + t2.clientY) / 2;

      // Pinch Zoom
      const distDiff = touchStateRef.current.startDist - dist;
      cameraSpherical.current.radius = Math.max(
        0.8,
        Math.min(1200, cameraSpherical.current.radius + distDiff * 0.08)
      );
      touchStateRef.current.startDist = dist;

      // Two-Finger Pan
      const deltaMidX = midX - touchStateRef.current.startMidX;
      const deltaMidY = midY - touchStateRef.current.startMidY;
      touchStateRef.current.startMidX = midX;
      touchStateRef.current.startMidY = midY;

      const panSpeed = 0.002 * cameraSpherical.current.radius;
      const camera = cameraRef.current;
      if (camera) {
        const right = new THREE.Vector3();
        const up = new THREE.Vector3();
        camera.matrix.extractBasis(right, up, new THREE.Vector3());
        cameraTarget.current.addScaledVector(right, -deltaMidX * panSpeed);
        cameraTarget.current.addScaledVector(up, deltaMidY * panSpeed);
      }

      updateCameraPosition();
    }
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touchStateRef.current.isMultiTouch && e.changedTouches.length === 1) {
      const touch = e.changedTouches[0];
      const moveDist = Math.hypot(
        touch.clientX - touchStateRef.current.startX,
        touch.clientY - touchStateRef.current.startY
      );
      const duration = performance.now() - touchStateRef.current.startTime;
      if (moveDist < 6 && duration < 350) {
        performRaycast(touch.clientX, touch.clientY, true);
      }
    }
    isOrbitingRef.current = false;
    isPanningRef.current = false;
  };

  // Keyboard Navigation:
  // F (Frame Selected or All), Home (Frame All), Delete (Erase Selected)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      keysPressed.current[e.code] = true;

      if (e.key === 'f' || e.key === 'F') {
        if (e.shiftKey) {
          handleFrameAll();
        } else if (selectedBlockPlacement) {
          handleFrameSelected();
        } else {
          handleFrameAll();
        }
      } else if (e.key === 'Home') {
        handleFrameAll();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedBlockPlacement) {
          onDeleteBlock?.(selectedBlockPlacement.id, selectedBlockPlacement.position);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current[e.code] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [selectedBlockPlacement, handleFrameSelected, handleFrameAll, onDeleteBlock]);

  return (
    <div className="relative w-full h-full select-none overflow-hidden bg-slate-950">
      {/* 3D WebGL Canvas */}
      <div
        ref={containerRef}
        className={`w-full h-full ${viewMode === 'first_person' ? 'cursor-none' : 'cursor-crosshair'}`}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onWheel={onWheel}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onContextMenu={(e) => e.preventDefault()}
      />

      {/* Top-Left Floating Controls: Camera Presets (Front, Back, Left, Right, Iso, Walk) */}
      <div className="absolute top-3 left-3 z-10 flex flex-wrap items-center gap-1 p-1 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-lg shadow-xl">
        <div className="flex items-center gap-1 pr-1 border-r border-slate-800">
          <button
            onClick={() => setCameraPreset('perspective')}
            className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
              viewMode === 'perspective'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
            title="Perspective Orbit Camera (Right-click drag to orbit)"
          >
            Perspective
          </button>
          <button
            onClick={() => setCameraPreset('isometric')}
            className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
              viewMode === 'isometric'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
            title="Isometric View"
          >
            Iso
          </button>
        </div>

        {/* Orthogonal Presets */}
        <div className="flex items-center gap-0.5">
          {(['front', 'back', 'left', 'right', 'top', 'bottom'] as const).map((dir) => (
            <button
              key={dir}
              onClick={() => setCameraPreset(dir)}
              className={`px-1.5 py-1 text-xs font-medium capitalize rounded transition-colors ${
                viewMode === dir
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
              title={`Align to ${dir} view`}
            >
              {dir}
            </button>
          ))}
        </div>

        <div className="h-4 w-px bg-slate-800 mx-0.5" />

        <button
          onClick={() => setCameraPreset('first_person')}
          className={`px-2 py-1 text-xs font-medium rounded transition-colors flex items-center gap-1 ${
            viewMode === 'first_person'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
          title="First-Person Walk (WASD + Mouse Look)"
        >
          <Compass className="w-3.5 h-3.5 text-amber-400" />
          <span>Walk</span>
        </button>
      </div>

      {/* Top-Right: Fixed XYZ Orientation Gizmo & Quick Framing (Docked in Viewport canvas) */}
      <div className="absolute top-3 right-3 z-10 flex flex-col items-end gap-2 pointer-events-auto">
        <div className="p-1 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-2xl shadow-2xl">
          <OrientationGizmo camera={cameraRef.current} onSelectView={setCameraPreset} />
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-lg shadow-xl text-slate-300">
          <button
            onClick={handleFrameAll}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded hover:bg-slate-800 text-slate-300 hover:text-emerald-400 transition-colors"
            title="Frame Entire Build (Key: Home, Shift+F)"
          >
            <Maximize2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Frame All (Home)</span>
          </button>

          {selectedBlockPlacement && (
            <button
              onClick={handleFrameSelected}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded hover:bg-slate-800 text-sky-400 transition-colors"
              title="Focus Selected Block (Key: F)"
            >
              <Focus className="w-3.5 h-3.5" />
              <span>Focus (F)</span>
            </button>
          )}

          <button
            onClick={handleResetCamera}
            className="p-1.5 text-xs rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            title="Reset Camera to default"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => {
              const next = !showGrid;
              setShowGrid(next);
              const grid = sceneRef.current?.getObjectByName('gridHelper');
              if (grid) grid.visible = next;
            }}
            className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
              showGrid ? 'bg-slate-800 text-slate-200' : 'text-slate-500 hover:text-slate-300'
            }`}
            title="Toggle Ground Grid"
          >
            Grid
          </button>
        </div>
      </div>

      {/* Walk mode instructions */}
      {viewMode === 'first_person' && (
        <>
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-10 px-4 py-1.5 bg-amber-500/15 border border-amber-500/30 rounded-full text-xs font-mono text-amber-300 backdrop-blur-md shadow-lg pointer-events-none">
            {isPointerLocked
              ? 'Click ESC to release mouse · WASD to walk · Space to ascend · Q to descend'
              : 'Click viewport to capture mouse look (Pointer Lock)'}
          </div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10">
            <div className="w-3.5 h-3.5 border border-white/70 rounded-full flex items-center justify-center">
              <div className="w-1 h-1 bg-white rounded-full" />
            </div>
          </div>
        </>
      )}
    </div>
  );
};
