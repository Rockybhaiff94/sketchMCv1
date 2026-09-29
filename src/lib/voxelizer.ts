import {
  SceneAnalysis,
  BlockPlacement,
  MinecraftBuild,
} from '../types/minecraft.ts';
import {
  getFullBlockForMaterial,
  getStairBlockForMaterial,
  getSlabBlockForMaterial,
} from './registry.ts';
import { solveBlockOrientations } from './orientationSolver.ts';

let blockCounter = 0;
function createBlock(blockId: string, x: number, y: number, z: number, state?: Record<string, string>): BlockPlacement {
  blockCounter++;
  return {
    id: `blk_${blockCounter}_${x}_${y}_${z}`,
    blockId,
    position: { x, y, z },
    state,
  };
}

/**
 * Converts a structured SceneAnalysis into an authentic MinecraftBuild.
 * Respects discrete 1:1 scale grid, structural rules, and archetype compositions.
 */
export function voxelizeSceneAnalysis(
  analysis: SceneAnalysis,
  buildName: string,
  scale: number = 1.0,
  version: '1.20' | '1.21' = '1.21'
): MinecraftBuild {
  blockCounter = 0;
  const placedMap = new Map<string, BlockPlacement>();

  const put = (blockId: string, x: number, y: number, z: number, state?: Record<string, string>) => {
    const key = `${x},${y},${z}`;
    const blk = createBlock(blockId, x, y, z, state);
    placedMap.set(key, blk);
  };

  const remove = (x: number, y: number, z: number) => {
    placedMap.delete(`${x},${y},${z}`);
  };

  // Dimensions scaled to integer grid
  const width = Math.max(11, Math.round((analysis.estimatedDimensions?.width || 15) * scale));
  const depth = Math.max(13, Math.round((analysis.estimatedDimensions?.depth || 17) * scale));
  const height = Math.max(10, Math.round((analysis.estimatedDimensions?.height || 14) * scale));

  const halfW = Math.floor(width / 2);
  const halfD = Math.floor(depth / 2);

  const styleLower = (analysis.style || '').toLowerCase();
  const typeLower = (analysis.structureType || '').toLowerCase();
  const isGlassGarden =
    analysis.archetype === 'conservatory_glass_garden' ||
    styleLower.includes('glass') ||
    styleLower.includes('garden') ||
    styleLower.includes('conservatory') ||
    styleLower.includes('greenhouse') ||
    typeLower.includes('greenhouse') ||
    typeLower.includes('conservatory');

  if (isGlassGarden) {
    // ===================================================================
    // ARCHETYPE: GLASS GARDEN / CONSERVATORY PAVILION
    // White/light architectural framing, large glass walls/windows,
    // arched structural ribs, glass roof, trees, flowers, grass, pathway
    // ===================================================================

    const frameBlock = 'minecraft:smooth_quartz';
    const frameStairs = 'minecraft:smooth_quartz_stairs';
    const glassWall = 'minecraft:glass';
    const glassPane = 'minecraft:glass_pane';
    const pathBlock = 'minecraft:smooth_stone';
    const pathBorder = 'minecraft:stone_bricks';
    const grassBlock = 'minecraft:grass_block';
    const dirtBlock = 'minecraft:dirt';

    // 1. Foundation & Floor Landscaping (Y = 0)
    for (let x = -halfW - 2; x <= halfW + 2; x++) {
      for (let z = -halfD - 2; z <= halfD + 2; z++) {
        // Outer perimeter lawn
        if (Math.abs(x) > halfW || Math.abs(z) > halfD) {
          put(grassBlock, x, 0, z);
          // Outdoor shrubs along perimeter
          if ((Math.abs(x) === halfW + 2 || Math.abs(z) === halfD + 2) && (x + z) % 2 === 0) {
            put('minecraft:flowering_azalea_leaves', x, 1, z);
          }
        } else {
          // Inside building footprint:
          // Central Pathway (3 blocks wide along Z)
          if (Math.abs(x) <= 1) {
            put(pathBlock, x, 0, z);
          } else if (Math.abs(x) === 2) {
            put(pathBorder, x, 0, z);
          } else {
            // Garden planter beds on sides
            put(grassBlock, x, 0, z);
          }
        }
      }
    }

    // 2. Interior Landscaping (Trees & Flowers on garden beds)
    // Left garden bed center tree
    const treeX1 = -Math.floor(halfW / 2) - 1;
    const treeX2 = Math.floor(halfW / 2) + 1;

    [treeX1, treeX2].forEach((tx) => {
      // Tree trunk (Oak Log)
      put('minecraft:oak_log', tx, 1, 0, { axis: 'y' });
      put('minecraft:oak_log', tx, 2, 0, { axis: 'y' });
      put('minecraft:oak_log', tx, 3, 0, { axis: 'y' });

      // Tree leafy canopy
      for (let dx = -1; dx <= 1; dx++) {
        for (let dz = -1; dz <= 1; dz++) {
          put('minecraft:cherry_leaves', tx + dx, 3, dz);
          put('minecraft:cherry_leaves', tx + dx, 4, dz);
        }
      }
      put('minecraft:cherry_leaves', tx, 5, 0);
    });

    // Flower patches on interior grass beds
    for (let x = -halfW + 1; x <= halfW - 1; x++) {
      for (let z = -halfD + 2; z <= halfD - 2; z += 2) {
        if (Math.abs(x) >= 3 && (x !== treeX1 || Math.abs(z) > 1) && (x !== treeX2 || Math.abs(z) > 1)) {
          const flowerType = (x + z) % 3 === 0 ? 'minecraft:blue_orchid' : (x + z) % 3 === 1 ? 'minecraft:poppy' : 'minecraft:dandelion';
          put(flowerType, x, 1, z);
        }
      }
    }

    // 3. White Architectural Arched Ribs & Columns
    // Structural ribs spaced every 3 blocks along Z
    const ribPositionsZ: number[] = [];
    for (let z = -halfD; z <= halfD; z += 3) {
      ribPositionsZ.push(z);
    }
    if (!ribPositionsZ.includes(halfD)) ribPositionsZ.push(halfD);

    const wallHeight = 5;
    const archPeakY = Math.min(height, 13);

    ribPositionsZ.forEach((rz) => {
      // Vertical quartz columns on left and right walls
      for (let y = 1; y <= wallHeight; y++) {
        put(frameBlock, -halfW, y, rz);
        put(frameBlock, halfW, y, rz);
      }

      // Arched quartz rib spanning from -halfW to halfW
      for (let x = -halfW; x <= halfW; x++) {
        // Parabolic arch profile
        const normX = x / halfW; // -1 to 1
        const archRise = Math.round((archPeakY - wallHeight) * (1 - normX * normX));
        const ribY = wallHeight + archRise;

        put(frameBlock, x, ribY, rz);

        // Under-arch smoothing with stairs
        if (Math.abs(x) === halfW - 1) {
          put(frameStairs, x, ribY - 1, rz, { facing: x < 0 ? 'east' : 'west', half: 'top' });
        }
      }

      // Hanging lantern from central arch peak
      put('minecraft:chain', 0, archPeakY - 1, rz, { axis: 'y' });
      put('minecraft:lantern', 0, archPeakY - 2, rz, { hanging: 'true' });
    });

    // 4. Glass Infill Walls (Between ribs on perimeter)
    for (let z = -halfD; z <= halfD; z++) {
      for (let y = 1; y <= wallHeight; y++) {
        // Left & Right walls
        if (!ribPositionsZ.includes(z)) {
          put(glassWall, -halfW, y, z);
          put(glassWall, halfW, y, z);
        }
      }
    }

    // 5. Front & Back Glass Facades
    [-halfD, halfD].forEach((fz) => {
      for (let x = -halfW + 1; x <= halfW - 1; x++) {
        const normX = x / halfW;
        const archRise = Math.round((archPeakY - wallHeight) * (1 - normX * normX));
        const maxY = wallHeight + archRise;

        for (let y = 1; y < maxY; y++) {
          // Leave entrance opening at front center
          if (fz === halfD && Math.abs(x) <= 1 && y <= 3) {
            if (Math.abs(x) === 1 && y === 3) {
              put(frameStairs, x, y, fz, { facing: x < 0 ? 'east' : 'west', half: 'top' });
            }
            continue;
          }
          put(glassPane, x, y, fz);
        }
      }
    });

    // Entrance Portico framing at front
    put(frameBlock, -2, 1, halfD + 1);
    put(frameBlock, -2, 2, halfD + 1);
    put(frameBlock, -2, 3, halfD + 1);
    put(frameBlock, 2, 1, halfD + 1);
    put(frameBlock, 2, 2, halfD + 1);
    put(frameBlock, 2, 3, halfD + 1);
    put(frameBlock, -1, 4, halfD + 1);
    put(frameBlock, 0, 4, halfD + 1);
    put(frameBlock, 1, 4, halfD + 1);
    put('minecraft:lantern', -2, 4, halfD + 1);
    put('minecraft:lantern', 2, 4, halfD + 1);

    // 6. Arched Glass Roof (Glass infill spanning between ribs)
    for (let z = -halfD; z <= halfD; z++) {
      if (!ribPositionsZ.includes(z)) {
        for (let x = -halfW; x <= halfW; x++) {
          const normX = x / halfW;
          const archRise = Math.round((archPeakY - wallHeight) * (1 - normX * normX));
          const roofY = wallHeight + archRise;
          put(glassWall, x, roofY, z);
        }
      }
    }

    // Central quartz spine along ridge
    for (let z = -halfD; z <= halfD; z++) {
      put(frameBlock, 0, archPeakY, z);
    }
  } else {
    // ===================================================================
    // STANDARD / ARCHITECTURAL MULTI-STORY VOXELIZATION
    // ===================================================================

    const wallBlock = getFullBlockForMaterial(analysis.paletteRecommendation?.walls || 'stone_bricks');
    const foundationBlock = getFullBlockForMaterial(analysis.paletteRecommendation?.foundation || 'cobblestone');
    const trimBlock = getFullBlockForMaterial(analysis.paletteRecommendation?.trim || 'spruce_planks');
    const roofStairs = getStairBlockForMaterial(analysis.paletteRecommendation?.roof || 'stone_bricks');
    const roofSlab = getSlabBlockForMaterial(analysis.paletteRecommendation?.roof || 'stone_bricks');
    const windowBlock = 'minecraft:glass_pane';
    const columnBlock = getFullBlockForMaterial(analysis.paletteRecommendation?.trim || 'spruce_log');

    // 1. Foundation & Ground Floor (Y = 0)
    for (let x = -halfW; x <= halfW; x++) {
      for (let z = -halfD; z <= halfD; z++) {
        put(foundationBlock, x, 0, z);
      }
    }

    // 2. Floors & Walls
    let currentY = 1;
    const numFloors = Math.max(1, analysis.floors?.length || 1);

    for (let f = 0; f < numFloors; f++) {
      const floorHeight = Math.max(3, Math.round((analysis.floors[f]?.height || 4) * scale));
      const floorWallBlock = analysis.floors[f]?.wallMaterial
        ? getFullBlockForMaterial(analysis.floors[f].wallMaterial)
        : wallBlock;
      const floorPlanks = analysis.floors[f]?.floorMaterial
        ? getFullBlockForMaterial(analysis.floors[f].floorMaterial)
        : trimBlock;

      if (f > 0) {
        for (let x = -halfW; x <= halfW; x++) {
          for (let z = -halfD; z <= halfD; z++) {
            put(floorPlanks, x, currentY - 1, z);
          }
        }
      }

      for (let y = 0; y < floorHeight; y++) {
        const actualY = currentY + y;
        for (let x = -halfW; x <= halfW; x++) {
          for (let z = -halfD; z <= halfD; z++) {
            const isPerimeter = x === -halfW || x === halfW || z === -halfD || z === halfD;
            if (isPerimeter) {
              const isCorner = (x === -halfW || x === halfW) && (z === -halfD || z === halfD);
              if (isCorner) {
                put(columnBlock, x, actualY, z, { axis: 'y' });
              } else {
                put(floorWallBlock, x, actualY, z);
              }
            }
          }
        }
      }

      // Windows & Door
      const midWallY = currentY + 1;
      if (f === 0) {
        put('minecraft:oak_door', 0, currentY, halfD, { facing: 'north', half: 'lower' });
        put('minecraft:oak_door', 0, currentY + 1, halfD, { facing: 'north', half: 'upper' });
        remove(0, currentY, halfD - 1);
        remove(0, currentY + 1, halfD - 1);
      }

      const windowInterval = Math.max(3, Math.floor(width / 4));
      for (let x = -halfW + 2; x <= halfW - 2; x += windowInterval) {
        if (f === 0 && Math.abs(x) <= 1) continue;
        put(windowBlock, x, midWallY, halfD);
        put(windowBlock, x, midWallY + 1, halfD);
        put(windowBlock, x, midWallY, -halfD);
        put(windowBlock, x, midWallY + 1, -halfD);
      }

      const windowIntervalZ = Math.max(3, Math.floor(depth / 4));
      for (let z = -halfD + 2; z <= halfD - 2; z += windowIntervalZ) {
        put(windowBlock, -halfW, midWallY, z);
        put(windowBlock, -halfW, midWallY + 1, z);
        put(windowBlock, halfW, midWallY, z);
        put(windowBlock, halfW, midWallY + 1, z);
      }

      currentY += floorHeight;
    }

    // 3. Roof
    const roofOverhang = Math.max(1, analysis.roof?.overhang || 1);
    const roofShape = analysis.roof?.shape || 'gable';

    if (roofShape === 'flat') {
      for (let x = -halfW - roofOverhang; x <= halfW + roofOverhang; x++) {
        for (let z = -halfD - roofOverhang; z <= halfD + roofOverhang; z++) {
          put(roofSlab, x, currentY, z, { type: 'bottom' });
        }
      }
    } else {
      // Gable pitched roof
      let roofStep = 0;
      let currentRoofY = currentY;

      while (halfW - roofStep >= 0) {
        const leftX = -halfW + roofStep - roofOverhang;
        const rightX = halfW - roofStep + roofOverhang;

        for (let z = -halfD - roofOverhang; z <= halfD + roofOverhang; z++) {
          put(roofStairs, leftX, currentRoofY, z, { facing: 'east', half: 'bottom', shape: 'straight' });
          put(roofStairs, rightX, currentRoofY, z, { facing: 'west', half: 'bottom', shape: 'straight' });
        }

        // Fill gable triangular wall ends
        for (let x = leftX + 1; x < rightX; x++) {
          put(wallBlock, x, currentRoofY, -halfD);
          put(wallBlock, x, currentRoofY, halfD);
        }

        roofStep++;
        currentRoofY++;
      }

      // Ridge top slab
      for (let z = -halfD - roofOverhang; z <= halfD + roofOverhang; z++) {
        put(roofSlab, 0, currentRoofY, z, { type: 'bottom' });
      }
    }
  }

  // Convert map to BlockPlacement array
  const blocks = Array.from(placedMap.values());

  // Solve block orientations (stairs, slabs, logs, doors)
  const solvedBlocks = solveBlockOrientations(blocks);

  // Compute final dimensions
  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
  for (const b of solvedBlocks) {
    minX = Math.min(minX, b.position.x);
    minY = Math.min(minY, b.position.y);
    minZ = Math.min(minZ, b.position.z);
    maxX = Math.max(maxX, b.position.x);
    maxY = Math.max(maxY, b.position.y);
    maxZ = Math.max(maxZ, b.position.z);
  }

  return {
    id: `build_${Date.now()}`,
    name: buildName,
    version,
    dimensions: {
      width: Math.max(1, maxX - minX + 1),
      height: Math.max(1, maxY - minY + 1),
      depth: Math.max(1, maxZ - minZ + 1),
    },
    blocks: solvedBlocks,
    metadata: {
      style: analysis.style || 'Architecture',
      scale,
      confidence: analysis.confidence || {
        overall: 0.92,
        front: 0.94,
        roof: 0.9,
        sides: 0.88,
        rear: 0.85,
        materials: 0.92,
      },
      generatedByAI: true,
      createdAt: new Date().toISOString(),
    },
  };
}
