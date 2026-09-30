import { VersionRegistryService } from './VersionRegistryService';
import { RegistrySnapshot, MigrationReport, MigrationDifference } from '../../../types/registry';
import { MinecraftBuild, BlockPlacement } from '../../../types/minecraft';

export class VersionMigrationService {
  private registryService: VersionRegistryService;

  constructor(registryService?: VersionRegistryService) {
    this.registryService = registryService || VersionRegistryService.getInstance();
  }

  /**
   * Compares two Minecraft registry snapshots and produces an exhaustive, deterministic migration diff.
   */
  public async generateMigrationReport(fromVersion: string, toVersion: string): Promise<MigrationReport> {
    const fromSnapshot = await this.registryService.getSnapshot(fromVersion);
    const toSnapshot = await this.registryService.getSnapshot(toVersion);

    const differences: MigrationDifference[] = [];

    const fromBlocks = fromSnapshot.blocks;
    const toBlocks = toSnapshot.blocks;

    // 1. Detect removed or renamed blocks
    for (const [id, oldBlock] of Object.entries(fromBlocks)) {
      if (!toBlocks[id]) {
        // Check if there is an obvious canonical replacement or renamed counterpart
        differences.push({
          type: 'removed',
          oldBlockId: id,
          severity: 'breaking',
          description: `Block '${id}' exists in ${fromVersion} but is removed or unrecognized in ${toVersion}.`,
          automaticMappingAvailable: false,
        });
      } else {
        // Block exists in both: check property/state changes
        const newBlock = toBlocks[id];
        const oldProps = Object.keys(oldBlock.properties || {});
        const newProps = Object.keys(newBlock.properties || {});

        const missingInNew = oldProps.filter((p) => !newProps.includes(p));
        const addedInNew = newProps.filter((p) => !oldProps.includes(p));

        if (missingInNew.length > 0 || addedInNew.length > 0) {
          differences.push({
            type: 'changed_states',
            oldBlockId: id,
            severity: missingInNew.length > 0 ? 'warning' : 'info',
            description: `State property schema changed for '${id}': removed=[${missingInNew.join(', ')}], added=[${addedInNew.join(', ')}]`,
            automaticMappingAvailable: true,
            replacementRule: {
              replacementBlockId: id,
              stateMapping: newBlock.defaultState,
            },
          });
        }
      }
    }

    // 2. Detect newly added blocks in target version
    for (const id of Object.keys(toBlocks)) {
      if (!fromBlocks[id]) {
        differences.push({
          type: 'added',
          oldBlockId: id,
          severity: 'info',
          description: `New block '${id}' introduced in ${toVersion}.`,
          automaticMappingAvailable: true,
        });
      }
    }

    return {
      fromVersion,
      toVersion,
      fromSnapshot: fromSnapshot.manifest.checksum,
      toSnapshot: toSnapshot.manifest.checksum,
      differences,
      affectedBlockCount: differences.filter((d) => d.severity !== 'info').length,
      requiresManualReview: differences.some((d) => d.severity === 'breaking'),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Non-destructively migrates a project build to a target Minecraft version.
   */
  public async migrateBuild(
    build: MinecraftBuild,
    targetVersion: string
  ): Promise<{ migratedBuild: MinecraftBuild; report: MigrationReport }> {
    const fromVersion = build.metadata?.minecraftVersion || '1.20.1';
    const report = await this.generateMigrationReport(fromVersion, targetVersion);
    const targetSnapshot = await this.registryService.getSnapshot(targetVersion);

    const migratedBlocks: BlockPlacement[] = [];
    let reviewedCount = 0;

    for (const block of build.blocks) {
      const targetDef = targetSnapshot.blocks[block.blockId];

      if (targetDef) {
        // Block is valid in target version. Reconcile states
        const reconciledState: Record<string, string> = { ...(targetDef.defaultState || {}) };

        if (block.state) {
          for (const [k, v] of Object.entries(block.state)) {
            const allowed = targetDef.properties[k];
            if (allowed && allowed.includes(v)) {
              reconciledState[k] = v;
            }
          }
        }

        migratedBlocks.push({
          ...block,
          state: Object.keys(reconciledState).length > 0 ? reconciledState : undefined,
        });
      } else {
        // Block does not exist in target version: apply fallback and flag for review
        reviewedCount++;
        migratedBlocks.push({
          ...block,
          blockId: 'minecraft:stone_bricks', // Safe architectural fallback
          customData: {
            migratedFrom: block.blockId,
            requiresReview: true,
          },
        });
      }
    }

    const pinning = await this.registryService.getPinningInfo(targetVersion);

    const migratedBuild: MinecraftBuild = {
      ...build,
      blocks: migratedBlocks,
      metadata: {
        ...build.metadata,
        minecraftVersion: targetVersion,
        registrySnapshot: pinning.registrySnapshot,
        registrySchemaVersion: pinning.registrySchemaVersion,
      },
    };

    return {
      migratedBuild,
      report: {
        ...report,
        affectedBlockCount: reviewedCount,
      },
    };
  }
}
