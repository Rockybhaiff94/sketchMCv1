import { BlockPlacement } from '../types/minecraft.ts';
import { getMinecraftBlock } from './registry.ts';

/**
 * Solves contextual Minecraft block states (e.g. stair connections,
 * corner shapes, log orientation, and door pairs).
 */
export function solveBlockOrientations(blocks: BlockPlacement[]): BlockPlacement[] {
  // Build a 3D coordinate spatial index: "x,y,z" => BlockPlacement
  const grid = new Map<string, BlockPlacement>();
  for (const b of blocks) {
    grid.set(`${b.position.x},${b.position.y},${b.position.z}`, b);
  }

  const result: BlockPlacement[] = [];

  for (const block of blocks) {
    const def = getMinecraftBlock(block.blockId);
    if (!def) {
      result.push(block);
      continue;
    }

    // Clone block state
    const state: Record<string, string> = { ...(block.state || def.defaultState || {}) };

    if (def.shapeType === 'stairs') {
      const facing = state.facing || 'north';
      const half = state.half || 'bottom';
      const shape = computeStairShape(grid, block.position.x, block.position.y, block.position.z, facing, half);
      state.shape = shape;
      state.facing = facing;
      state.half = half;
    } else if (def.shapeType === 'log' && !state.axis) {
      state.axis = 'y'; // Default vertical log column
    }

    result.push({
      ...block,
      state: Object.keys(state).length > 0 ? state : undefined,
    });
  }

  return result;
}

/**
 * Computes Minecraft stair corner shape:
 * - 'straight'
 * - 'inner_left'
 * - 'inner_right'
 * - 'outer_left'
 * - 'outer_right'
 */
function computeStairShape(
  grid: Map<string, BlockPlacement>,
  x: number,
  y: number,
  z: number,
  facing: string,
  half: string
): string {
  // Offsets for 4 cardinal directions
  const neighbors: Record<string, BlockPlacement | undefined> = {
    north: grid.get(`${x},${y},${z - 1}`),
    south: grid.get(`${x},${y},${z + 1}`),
    west: grid.get(`${x - 1},${y},${z}`),
    east: grid.get(`${x + 1},${y},${z}`),
  };

  const isMatchingStair = (b?: BlockPlacement) => {
    if (!b) return false;
    const def = getMinecraftBlock(b.blockId);
    if (def?.shapeType !== 'stairs') return false;
    const bHalf = b.state?.half || 'bottom';
    return bHalf === half;
  };

  // Determine back and front relative to facing
  let backDir = 'south';
  let leftDir = 'west';
  let rightDir = 'east';

  if (facing === 'south') {
    backDir = 'north';
    leftDir = 'east';
    rightDir = 'west';
  } else if (facing === 'west') {
    backDir = 'east';
    leftDir = 'south';
    rightDir = 'north';
  } else if (facing === 'east') {
    backDir = 'west';
    leftDir = 'north';
    rightDir = 'south';
  }

  const backStair = neighbors[backDir];
  const leftStair = neighbors[leftDir];
  const rightStair = neighbors[rightDir];

  // Check for inner corner (turning into a corner stair behind)
  if (isMatchingStair(backStair)) {
    const backFacing = backStair?.state?.facing;
    if (backFacing === leftDir) return 'inner_left';
    if (backFacing === rightDir) return 'inner_right';
  }

  // Check for outer corner (turning outward towards front)
  if (isMatchingStair(leftStair)) {
    const leftFacing = leftStair?.state?.facing;
    if (leftFacing === facing) {
      // Normal alignment
    } else if (leftFacing === backDir) {
      return 'outer_left';
    }
  }

  if (isMatchingStair(rightStair)) {
    const rightFacing = rightStair?.state?.facing;
    if (rightFacing === backDir) {
      return 'outer_right';
    }
  }

  return 'straight';
}
