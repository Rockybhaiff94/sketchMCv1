import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { RegistrySnapshot, VersionManifest } from '../../../types/registry';
import { SourceAdapterRegistry } from '../adapters/SourceAdapterRegistry';

export class SnapshotStorage {
  private baseDir: string;

  constructor(customBaseDir?: string) {
    this.baseDir = customBaseDir || path.resolve(process.cwd(), 'minecraft-registry');
  }

  public getVersionDir(version: string, edition: 'java' | 'bedrock' = 'java'): string {
    return path.join(this.baseDir, edition, version);
  }

  public hasSnapshot(version: string, edition: 'java' | 'bedrock' = 'java'): boolean {
    const versionDir = this.getVersionDir(version, edition);
    const manifestPath = path.join(versionDir, 'manifest.json');
    return fs.existsSync(manifestPath);
  }

  public listStoredVersions(edition: 'java' | 'bedrock' = 'java'): string[] {
    const editionDir = path.join(this.baseDir, edition);
    if (!fs.existsSync(editionDir)) {
      return [];
    }
    const entries = fs.readdirSync(editionDir, { withFileTypes: true });
    return entries
      .filter((e) => e.isDirectory() && fs.existsSync(path.join(editionDir, e.name, 'manifest.json')))
      .map((e) => e.name)
      .sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));
  }

  public readManifest(version: string, edition: 'java' | 'bedrock' = 'java'): VersionManifest | null {
    const manifestPath = path.join(this.getVersionDir(version, edition), 'manifest.json');
    if (!fs.existsSync(manifestPath)) {
      return null;
    }
    try {
      const raw = fs.readFileSync(manifestPath, 'utf-8');
      return JSON.parse(raw) as VersionManifest;
    } catch (err) {
      console.error(`Failed to parse manifest for version ${version}:`, err);
      return null;
    }
  }

  public readSnapshot(version: string, edition: 'java' | 'bedrock' = 'java'): RegistrySnapshot | null {
    const versionDir = this.getVersionDir(version, edition);
    const manifestPath = path.join(versionDir, 'manifest.json');
    const blocksPath = path.join(versionDir, 'blocks.json');

    if (!fs.existsSync(manifestPath) || !fs.existsSync(blocksPath)) {
      return null;
    }

    try {
      const manifest: VersionManifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
      const blocks = JSON.parse(fs.readFileSync(blocksPath, 'utf-8'));
      const blockstatesPath = path.join(versionDir, 'blockstates.json');
      const modelsPath = path.join(versionDir, 'models.json');

      const blockstates = fs.existsSync(blockstatesPath)
        ? JSON.parse(fs.readFileSync(blockstatesPath, 'utf-8'))
        : {};
      const models = fs.existsSync(modelsPath)
        ? JSON.parse(fs.readFileSync(modelsPath, 'utf-8'))
        : {};

      return {
        manifest,
        blocks,
        blockstates,
        models,
      };
    } catch (err) {
      console.error(`Failed to read snapshot for version ${version}:`, err);
      return null;
    }
  }

  /**
   * Persists a snapshot to disk.
   * STRICT IMMUTABILITY ENFORCEMENT:
   * If a version is already saved with status 'READY', it can NEVER be silently mutated or overwritten.
   */
  public async saveSnapshot(
    snapshot: RegistrySnapshot,
    options: { forceOverwrite?: boolean } = {}
  ): Promise<void> {
    const { manifest, blocks, blockstates, models } = snapshot;
    const edition = manifest.edition || 'java';
    const versionDir = this.getVersionDir(manifest.minecraftVersion, edition);

    if (fs.existsSync(path.join(versionDir, 'manifest.json')) && !options.forceOverwrite) {
      const existing = this.readManifest(manifest.minecraftVersion, edition);
      if (existing && existing.status === 'READY') {
        throw new Error(
          `Immutability Violation: Snapshot for ${edition} ${manifest.minecraftVersion} is marked READY and cannot be overwritten.`
        );
      }
    }

    fs.mkdirSync(versionDir, { recursive: true });

    // Compute cryptographic SHA-256 checksum over blocks content to guarantee tamper-evidence
    const serializedBlocks = JSON.stringify(blocks);
    const sha256 = crypto.createHash('sha256').update(serializedBlocks).digest('hex');

    const updatedManifest: VersionManifest = {
      ...manifest,
      checksum: sha256,
      blockCount: Object.keys(blocks).length,
      validatedAt: new Date().toISOString(),
    };

    fs.writeFileSync(path.join(versionDir, 'manifest.json'), JSON.stringify(updatedManifest, null, 2), 'utf-8');
    fs.writeFileSync(path.join(versionDir, 'blocks.json'), serializedBlocks, 'utf-8');
    fs.writeFileSync(path.join(versionDir, 'blockstates.json'), JSON.stringify(blockstates, null, 2), 'utf-8');
    fs.writeFileSync(path.join(versionDir, 'models.json'), JSON.stringify(models, null, 2), 'utf-8');
  }

  /**
   * Automatically initializes canonical baseline snapshots (1.20.1, 1.20.4, 1.21.1)
   * if they do not yet exist on disk.
   */
  public async ensureBaselineSnapshots(): Promise<string[]> {
    const baselineVersions = ['1.20.1', '1.20.4', '1.21.1'];
    const initialized: string[] = [];
    const registry = SourceAdapterRegistry.getInstance();

    for (const v of baselineVersions) {
      if (!this.hasSnapshot(v, 'java')) {
        const unified = await registry.buildUnifiedSnapshot(v);
        await this.saveSnapshot(unified);
        initialized.push(v);
      }
    }

    return initialized;
  }
}
