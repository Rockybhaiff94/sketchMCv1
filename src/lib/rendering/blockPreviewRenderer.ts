import * as THREE from 'three';
import { getMinecraftBlock } from '../registry.ts';
import { getBlockGeometry } from '../models/blockModelRegistry.ts';
import { getOrCreateBlockTexture, getMultiFaceTextures, getBlockIconDataUrl } from '../textureGenerator.ts';

// In-memory cache for rendered 3D isometric thumbnails
const previewCache = new Map<string, string>();

let sharedRenderer: THREE.WebGLRenderer | null = null;
let sharedScene: THREE.Scene | null = null;
let sharedCamera: THREE.OrthographicCamera | null = null;

function initSharedPipeline(size: number) {
  if (typeof document === 'undefined' || typeof window === 'undefined') return false;

  try {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: false,
      preserveDrawingBuffer: true,
      powerPreference: 'low-power',
    });
    renderer.setSize(size, size);
    renderer.setPixelRatio(1);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.NoToneMapping;

    const scene = new THREE.Scene();

    // Classic Minecraft inventory lighting: Ambient + Upper-Right Key Light
    const ambient = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.65);
    dirLight.position.set(2.5, 4.0, 3.0);
    scene.add(dirLight);

    // Isometric orthographic projection framing 1x1x1 block
    const frustum = 0.95;
    const camera = new THREE.OrthographicCamera(
      -frustum,
      frustum,
      frustum,
      -frustum,
      0.1,
      20
    );
    // Minecraft inventory angle (approx 30 deg pitch, 45 deg yaw)
    camera.position.set(1.5, 1.25, 1.5);
    camera.lookAt(0, 0, 0);

    sharedRenderer = renderer;
    sharedScene = scene;
    sharedCamera = camera;
    return true;
  } catch (err) {
    console.warn('[VoxelForge] WebGL preview renderer initialization failed; falling back to 2D icons.', err);
    return false;
  }
}

/**
 * Creates the exact material(s) for a block, shared between the 3D world renderer and preview renderer.
 */
export function createSharedBlockMaterial(
  blockId: string,
  state?: Record<string, string>
): THREE.Material | THREE.Material[] {
  const def = getMinecraftBlock(blockId);
  const cleanId = (def?.id || blockId).replace('minecraft:', '').toLowerCase();
  const shapeType = def?.shapeType || 'full_cube';

  const multiTextures = getMultiFaceTextures(blockId, state);

  const isGlass = cleanId.includes('glass');
  const isLeaves = cleanId.includes('leaves') || cleanId.includes('vine');
  const isPlant = shapeType === 'plant' || shapeType === 'torch';
  const isDoor = cleanId.includes('door') || cleanId.includes('trapdoor') || cleanId.includes('grate') || cleanId.includes('iron_bars');
  const isCutout = isLeaves || isPlant || isDoor;
  const isTransparent = isGlass || isCutout || !!def?.transparent;

  if (multiTextures && shapeType === 'full_cube') {
    return multiTextures.map((tex) => {
      return new THREE.MeshStandardMaterial({
        map: tex,
        color: new THREE.Color(0xffffff),
        roughness: 0.9,
        metalness: 0.0,
        transparent: isTransparent,
        alphaTest: isCutout ? 0.25 : 0,
        depthWrite: !isGlass,
        side: isCutout ? THREE.DoubleSide : THREE.FrontSide,
      });
    });
  }

  const texture = getOrCreateBlockTexture(blockId, def?.colorHex);
  return new THREE.MeshStandardMaterial({
    map: texture,
    color: new THREE.Color(0xffffff),
    roughness: isGlass ? 0.1 : 0.9,
    metalness: 0.0,
    transparent: isTransparent,
    opacity: isGlass ? (cleanId.includes('tinted') ? 0.75 : 0.55) : 1.0,
    alphaTest: isCutout ? 0.25 : 0,
    depthWrite: !isGlass,
    side: isCutout ? THREE.DoubleSide : THREE.FrontSide,
  });
}

/**
 * Returns an authentic 3D isometric thumbnail data URL for any Minecraft block and state.
 * Shared by the Block Selection Palette, Inspector, and Previews.
 */
export function getBlockPreviewThumbnail(
  blockId: string,
  state?: Record<string, string>,
  size = 64
): string {
  const cleanId = blockId.startsWith('minecraft:') ? blockId : `minecraft:${blockId}`;
  const def = getMinecraftBlock(cleanId);
  const shapeType = def?.shapeType || 'full_cube';

  const stateKey = state ? Object.entries(state).sort().map(([k, v]) => `${k}=${v}`).join(';') : '';
  const cacheKey = `${cleanId}__${shapeType}__${stateKey}__${size}`;

  if (previewCache.has(cacheKey)) {
    return previewCache.get(cacheKey)!;
  }

  // If in Node.js or WebGL unavailable, fall back to crisp 2D icon
  if (typeof document === 'undefined' || typeof window === 'undefined') {
    return getBlockIconDataUrl(cleanId);
  }

  if (!sharedRenderer && !initSharedPipeline(size)) {
    return getBlockIconDataUrl(cleanId);
  }

  const renderer = sharedRenderer!;
  const scene = sharedScene!;
  const camera = sharedCamera!;

  const geo = getBlockGeometry(shapeType, state);
  const mat = createSharedBlockMaterial(cleanId, state);

  const mesh = new THREE.Mesh(geo, mat);

  // Apply state-based rotation to the preview mesh
  if (state?.facing) {
    if (state.facing === 'south') mesh.rotation.y = Math.PI;
    else if (state.facing === 'west') mesh.rotation.y = Math.PI / 2;
    else if (state.facing === 'east') mesh.rotation.y = -Math.PI / 2;
  } else if (state?.axis) {
    if (state.axis === 'x') mesh.rotation.z = Math.PI / 2;
    else if (state.axis === 'z') mesh.rotation.x = Math.PI / 2;
  }

  scene.add(mesh);
  renderer.render(scene, camera);

  const dataUrl = renderer.domElement.toDataURL('image/png');

  // Clean up mesh from scene
  scene.remove(mesh);
  if (Array.isArray(mat)) {
    mat.forEach((m) => m.dispose());
  } else {
    mat.dispose();
  }

  previewCache.set(cacheKey, dataUrl);
  return dataUrl;
}
