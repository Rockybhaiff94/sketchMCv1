import { MinecraftBuild, ValidationResult, ValidationError, ValidationWarning } from '../types/minecraft.ts';
import { getMinecraftBlock, isValidBlockId, isValidBlockState } from './registry.ts';

export function validateMinecraftBuild(build: MinecraftBuild): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  const uniqueBlockSet = new Set<string>();
  const positionMap = new Map<string, string>();

  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  let minZ = Infinity, maxZ = -Infinity;

  for (const block of build.blocks) {
    const { x, y, z } = block.position;
    const posKey = `${x},${y},${z}`;

    // 1. Check coordinates bounds
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
    if (z < minZ) minZ = z;
    if (z > maxZ) maxZ = z;

    // 2. Check duplicate positions
    if (positionMap.has(posKey)) {
      errors.push({
        type: 'duplicate_position',
        message: `Duplicate block at position (${x}, ${y}, ${z}): '${block.blockId}' conflicts with '${positionMap.get(posKey)}'`,
        position: { x, y, z },
        blockId: block.blockId,
      });
    } else {
      positionMap.set(posKey, block.blockId);
    }

    // 3. Check registered block ID
    if (!isValidBlockId(block.blockId)) {
      errors.push({
        type: 'invalid_block_id',
        message: `Unknown or illegitimate Minecraft block ID: '${block.blockId}'`,
        position: { x, y, z },
        blockId: block.blockId,
      });
      continue;
    }

    uniqueBlockSet.add(block.blockId);

    // 4. Check block state validity
    if (block.state && !isValidBlockState(block.blockId, block.state)) {
      errors.push({
        type: 'invalid_state',
        message: `Invalid block state for '${block.blockId}': ${JSON.stringify(block.state)}`,
        position: { x, y, z },
        blockId: block.blockId,
      });
    }

    // 5. Floating gravity warnings (e.g. lanterns, doors, or top stairs without support)
    const blockDef = getMinecraftBlock(block.blockId);
    if (blockDef?.shapeType === 'lantern' && block.state?.hanging !== 'true') {
      const belowKey = `${x},${y - 1},${z}`;
      if (!positionMap.has(belowKey) && y > 0) {
        warnings.push({
          type: 'floating_block',
          message: `Lantern at (${x}, ${y}, ${z}) has no supporting block directly beneath it`,
          position: { x, y, z },
        });
      }
    }
  }

  // Dimension statistics
  const calculatedWidth = build.blocks.length > 0 ? maxX - minX + 1 : 0;
  const calculatedHeight = build.blocks.length > 0 ? maxY - minY + 1 : 0;
  const calculatedDepth = build.blocks.length > 0 ? maxZ - minZ + 1 : 0;

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    statistics: {
      totalBlocks: build.blocks.length,
      uniqueBlocks: uniqueBlockSet.size,
      dimensions: {
        width: calculatedWidth,
        height: calculatedHeight,
        depth: calculatedDepth,
      },
    },
  };
}
