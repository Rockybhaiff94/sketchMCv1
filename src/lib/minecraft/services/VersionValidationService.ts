import { RegistrySnapshot, SourceValidationResult } from '../../../types/registry';

export class VersionValidationService {
  /**
   * Performs exhaustive deterministic validation on a normalized snapshot
   * prior to permitting it to be persisted with 'READY' status.
   */
  public static validateSnapshot(snapshot: RegistrySnapshot): SourceValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const { manifest, blocks, blockstates, models } = snapshot;

    if (!manifest) {
      errors.push('Snapshot is missing VersionManifest.');
      return { valid: false, errors, warnings, blockCount: 0 };
    }

    const blockEntries = Object.entries(blocks || {});
    const blockCount = blockEntries.length;

    if (blockCount === 0) {
      errors.push(`Version ${manifest.minecraftVersion} has 0 blocks registered.`);
      return { valid: false, errors, warnings, blockCount: 0 };
    }

    for (const [id, block] of blockEntries) {
      // 1. Namespace integrity
      if (!id.startsWith('minecraft:')) {
        errors.push(`Block ID '${id}' must start with 'minecraft:' namespace.`);
      }

      // 2. Material & Category classification
      if (!block.material) {
        errors.push(`Block '${id}' has missing or undefined material.`);
      }
      if (!block.category) {
        errors.push(`Block '${id}' has missing or undefined category.`);
      }

      // 3. Collision shape validation
      const boxes = block.geometry?.collisionShape?.boxes;
      if (!boxes || !Array.isArray(boxes) || boxes.length === 0) {
        errors.push(`Block '${id}' is missing collision bounding boxes in geometry.`);
      } else {
        for (const box of boxes) {
          if (box.length !== 6) {
            errors.push(`Block '${id}' has invalid bounding box dimensions (expected 6 values).`);
          }
        }
      }

      // 4. Orientation & connection rules validation
      if (block.shapeType === 'stairs') {
        if (!block.connectionRules?.canConnectToStairs) {
          warnings.push(`Stairs block '${id}' missing canConnectToStairs rule.`);
        }
        if (!block.orientationRules?.supportsRotation) {
          errors.push(`Stairs block '${id}' must support rotation.`);
        }
      }

      // 5. Blockstate definition matching
      if (block.shapeType === 'stairs' || block.shapeType === 'slab') {
        if (!blockstates[id] && !block.blockstateDefinition) {
          warnings.push(`Specialized shape block '${id}' has no corresponding blockstate definition.`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      blockCount,
    };
  }
}
