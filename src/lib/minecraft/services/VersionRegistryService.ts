import { SnapshotStorage } from '../registry/SnapshotStorage';
import { RegistrySnapshot, NormalizedBlockDefinition, ProjectPinningInfo } from '../../../types/registry';

export class VersionRegistryService {
  private static instance: VersionRegistryService | null = null;
  private storage: SnapshotStorage;
  private snapshotCache: Map<string, RegistrySnapshot> = new Map();

  private constructor(storage?: SnapshotStorage) {
    this.storage = storage || new SnapshotStorage();
  }

  public static getInstance(): VersionRegistryService {
    if (!VersionRegistryService.instance) {
      VersionRegistryService.instance = new VersionRegistryService();
    }
    return VersionRegistryService.instance;
  }

  public async getSnapshot(version: string, edition: 'java' | 'bedrock' = 'java'): Promise<RegistrySnapshot> {
    const key = `${edition}:${version}`;
    if (this.snapshotCache.has(key)) {
      return this.snapshotCache.get(key)!;
    }

    // Try reading from disk
    let snapshot = this.storage.readSnapshot(version, edition);
    if (!snapshot) {
      // If not yet on disk, ensure baseline or fallback
      await this.storage.ensureBaselineSnapshots();
      snapshot = this.storage.readSnapshot(version, edition);
    }

    if (!snapshot) {
      throw new Error(`Minecraft registry snapshot for ${edition} ${version} not found.`);
    }

    this.snapshotCache.set(key, snapshot);
    return snapshot;
  }

  public async getBlock(version: string, blockId: string): Promise<NormalizedBlockDefinition | null> {
    const snapshot = await this.getSnapshot(version);
    return snapshot.blocks[blockId] || null;
  }

  public async isValidBlockId(version: string, blockId: string): Promise<boolean> {
    const snapshot = await this.getSnapshot(version);
    return !!snapshot.blocks[blockId];
  }

  public async isValidBlockState(
    version: string,
    blockId: string,
    properties: Record<string, string>
  ): Promise<{ valid: boolean; reason?: string }> {
    const block = await this.getBlock(version, blockId);
    if (!block) {
      return { valid: false, reason: `Block '${blockId}' is not registered in Minecraft ${version}.` };
    }

    for (const [propName, propVal] of Object.entries(properties)) {
      const allowedValues = block.properties[propName];
      if (!allowedValues) {
        return { valid: false, reason: `Property '${propName}' does not exist on block '${blockId}'.` };
      }
      if (!allowedValues.includes(propVal)) {
        return {
          valid: false,
          reason: `Value '${propVal}' is invalid for property '${propName}' on '${blockId}' (allowed: ${allowedValues.join(', ')}).`,
        };
      }
    }

    return { valid: true };
  }

  public async getPinningInfo(version: string): Promise<ProjectPinningInfo> {
    const snapshot = await this.getSnapshot(version);
    return {
      minecraftVersion: version,
      registrySnapshot: snapshot.manifest.checksum,
      registrySchemaVersion: snapshot.manifest.schemaVersion,
    };
  }

  public getInstalledVersions(): string[] {
    return this.storage.listStoredVersions('java');
  }
}
