import * as THREE from 'three';
import { ShapeType } from '../../types/minecraft.ts';

// Cache generated BufferGeometries by key to ensure 60fps performance and zero memory leaks
const geometryCache = new Map<string, THREE.BufferGeometry>();

/**
 * Creates standard 1x1x1 cube geometry
 */
function createCubeGeometry(): THREE.BufferGeometry {
  return new THREE.BoxGeometry(1, 1, 1);
}

/**
 * Creates Slab geometry (bottom, top, or double)
 */
function createSlabGeometry(type: string = 'bottom'): THREE.BufferGeometry {
  const geo = new THREE.BoxGeometry(1, 0.5, 1);
  if (type === 'top') {
    geo.translate(0, 0.25, 0);
  } else if (type === 'double') {
    return new THREE.BoxGeometry(1, 1, 1);
  } else {
    // bottom slab
    geo.translate(0, -0.25, 0);
  }
  return geo;
}

/**
 * Creates authentic Minecraft Stair geometry
 * Base: 1 x 0.5 x 1
 * Step: 1 x 0.5 x 0.5 (or corner shapes)
 */
function createStairGeometry(
  half: string = 'bottom',
  shape: string = 'straight'
): THREE.BufferGeometry {
  const isTop = half === 'top';

  // Base box (full width and depth, half height)
  const baseBox = new THREE.BoxGeometry(1, 0.5, 1);
  baseBox.translate(0, isTop ? 0.25 : -0.25, 0);

  let stepBox: THREE.BoxGeometry;
  if (shape === 'inner_left') {
    // L-shaped step covering 3/4 of upper area
    stepBox = new THREE.BoxGeometry(0.75, 0.5, 0.75);
    stepBox.translate(-0.125, isTop ? -0.25 : 0.25, -0.125);
  } else if (shape === 'inner_right') {
    stepBox = new THREE.BoxGeometry(0.75, 0.5, 0.75);
    stepBox.translate(0.125, isTop ? -0.25 : 0.25, -0.125);
  } else if (shape === 'outer_left') {
    // Corner step covering 1/4 of upper area
    stepBox = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    stepBox.translate(-0.25, isTop ? -0.25 : 0.25, -0.25);
  } else if (shape === 'outer_right') {
    stepBox = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    stepBox.translate(0.25, isTop ? -0.25 : 0.25, -0.25);
  } else {
    // Straight step covering north half (z < 0)
    stepBox = new THREE.BoxGeometry(1, 0.5, 0.5);
    stepBox.translate(0, isTop ? -0.25 : 0.25, -0.25);
  }

  // Combine geometries into single BufferGeometry
  // Merge baseBox and stepBox
  const merged = mergeBufferGeometries([baseBox, stepBox]);
  baseBox.dispose();
  stepBox.dispose();
  return merged;
}

/**
 * Creates Glass Pane geometry: thin central glass plane (1 x 1 x 0.125)
 */
function createPaneGeometry(): THREE.BufferGeometry {
  return new THREE.BoxGeometry(1, 1, 0.125);
}

/**
 * Creates Fence geometry: center post (0.25 x 1 x 0.25)
 */
function createFenceGeometry(): THREE.BufferGeometry {
  const post = new THREE.BoxGeometry(0.25, 1, 0.25);
  return post;
}

/**
 * Creates Wall geometry: center stone post (0.375 x 1 x 0.375)
 */
function createWallGeometry(): THREE.BufferGeometry {
  const post = new THREE.BoxGeometry(0.375, 1, 0.375);
  return post;
}

/**
 * Creates Lantern geometry: body (0.375 x 0.55 x 0.375) with top chain loop
 */
function createLanternGeometry(): THREE.BufferGeometry {
  const body = new THREE.BoxGeometry(0.375, 0.55, 0.375);
  body.translate(0, -0.1, 0);
  const top = new THREE.BoxGeometry(0.15, 0.2, 0.15);
  top.translate(0, 0.25, 0);
  const merged = mergeBufferGeometries([body, top]);
  body.dispose();
  top.dispose();
  return merged;
}

/**
 * Creates Door geometry: vertical wooden/iron panel (1 x 1 x 0.1875)
 */
function createDoorGeometry(half: string = 'lower'): THREE.BufferGeometry {
  const panel = new THREE.BoxGeometry(1, 1, 0.1875);
  panel.translate(0, 0, -0.40625);
  return panel;
}

/**
 * Creates Trapdoor geometry: horizontal slab when closed, vertical when open
 */
function createTrapdoorGeometry(open: boolean = false, half: string = 'bottom'): THREE.BufferGeometry {
  if (open) {
    const geo = new THREE.BoxGeometry(1, 1, 0.1875);
    geo.translate(0, 0, -0.40625);
    return geo;
  }
  const geo = new THREE.BoxGeometry(1, 0.1875, 1);
  geo.translate(0, half === 'top' ? 0.40625 : -0.40625, 0);
  return geo;
}

/**
 * Creates Minecraft Cross-Quad geometry for Torches, Flowers, Saplings, Plants
 * Two vertical double-sided quads intersecting at 90 degrees (45 deg angle)
 */
function createCrossQuadGeometry(): THREE.BufferGeometry {
  const plane1 = new THREE.PlaneGeometry(0.85, 0.85);
  plane1.rotateY(Math.PI / 4);
  const plane2 = new THREE.PlaneGeometry(0.85, 0.85);
  plane2.rotateY(-Math.PI / 4);
  const merged = mergeBufferGeometries([plane1, plane2]);
  plane1.dispose();
  plane2.dispose();
  return merged;
}

/**
 * Helper to merge two or more BufferGeometries into a single BufferGeometry
 */
function mergeBufferGeometries(geometries: THREE.BufferGeometry[]): THREE.BufferGeometry {
  let totalPositions = 0;
  let totalNormals = 0;
  let totalUvs = 0;
  let totalIndices = 0;

  for (const g of geometries) {
    const pos = g.getAttribute('position');
    if (pos) totalPositions += pos.array.length;
    const norm = g.getAttribute('normal');
    if (norm) totalNormals += norm.array.length;
    const uv = g.getAttribute('uv');
    if (uv) totalUvs += uv.array.length;
    if (g.index) totalIndices += g.index.array.length;
  }

  const mergedPos = new Float32Array(totalPositions);
  const mergedNorm = new Float32Array(totalNormals);
  const mergedUv = new Float32Array(totalUvs);
  const mergedIndices = totalIndices > 0 ? new Uint32Array(totalIndices) : null;

  let posOffset = 0;
  let normOffset = 0;
  let uvOffset = 0;
  let indexOffset = 0;
  let vertexOffset = 0;

  for (const g of geometries) {
    const pos = g.getAttribute('position');
    if (pos) {
      mergedPos.set(pos.array, posOffset);
      posOffset += pos.array.length;
    }
    const norm = g.getAttribute('normal');
    if (norm) {
      mergedNorm.set(norm.array, normOffset);
      normOffset += norm.array.length;
    }
    const uv = g.getAttribute('uv');
    if (uv) {
      mergedUv.set(uv.array, uvOffset);
      uvOffset += uv.array.length;
    }
    if (g.index && mergedIndices) {
      for (let i = 0; i < g.index.array.length; i++) {
        mergedIndices[indexOffset + i] = g.index.array[i] + vertexOffset;
      }
      indexOffset += g.index.array.length;
    }
    if (pos) {
      vertexOffset += pos.count;
    }
  }

  const result = new THREE.BufferGeometry();
  result.setAttribute('position', new THREE.BufferAttribute(mergedPos, 3));
  if (totalNormals > 0) {
    result.setAttribute('normal', new THREE.BufferAttribute(mergedNorm, 3));
  }
  if (totalUvs > 0) {
    result.setAttribute('uv', new THREE.BufferAttribute(mergedUv, 2));
  }
  if (mergedIndices) {
    result.setIndex(new THREE.BufferAttribute(mergedIndices, 1));
  }

  return result;
}

/**
 * Returns or creates the cached BufferGeometry for a given shapeType and blockstate
 */
export function getBlockGeometry(
  shapeType: ShapeType,
  state?: Record<string, string>
): THREE.BufferGeometry {
  const typeKey = state?.type || 'bottom';
  const halfKey = state?.half || 'bottom';
  const shapeKey = state?.shape || 'straight';
  const openKey = state?.open || 'false';

  const cacheKey = `${shapeType}_${typeKey}_${halfKey}_${shapeKey}_${openKey}`;

  if (geometryCache.has(cacheKey)) {
    return geometryCache.get(cacheKey)!;
  }

  let geo: THREE.BufferGeometry;

  switch (shapeType) {
    case 'stairs':
      geo = createStairGeometry(halfKey, shapeKey);
      break;
    case 'slab':
      geo = createSlabGeometry(typeKey);
      break;
    case 'pane':
      geo = createPaneGeometry();
      break;
    case 'fence':
      geo = createFenceGeometry();
      break;
    case 'wall':
      geo = createWallGeometry();
      break;
    case 'lantern':
      geo = createLanternGeometry();
      break;
    case 'door':
      geo = createDoorGeometry(halfKey);
      break;
    case 'trapdoor':
      geo = createTrapdoorGeometry(openKey === 'true', halfKey);
      break;
    case 'plant':
    case 'torch':
      geo = createCrossQuadGeometry();
      break;
    default:
      geo = createCubeGeometry();
      break;
  }

  geometryCache.set(cacheKey, geo);
  return geo;
}
