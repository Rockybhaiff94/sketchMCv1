import { SnapshotStorage } from '../registry/SnapshotStorage';
import { SourceAdapterRegistry } from '../adapters/SourceAdapterRegistry';
import { VersionManifest, VersionStatus } from '../../../types/registry';

export interface VersionCatalogEntry {
  version: string;
  edition: 'java' | 'bedrock';
  status: VersionStatus | 'AVAILABLE_UPSTREAM';
  isInstalled: boolean;
  manifest?: VersionManifest;
  blockCount?: number;
  checksum?: string;
  sourceAdapters: string[];
}

export class VersionDiscoveryService {
  private storage: SnapshotStorage;
  private adapterRegistry: SourceAdapterRegistry;

  constructor(storage?: SnapshotStorage, adapterRegistry?: SourceAdapterRegistry) {
    this.storage = storage || new SnapshotStorage();
    this.adapterRegistry = adapterRegistry || SourceAdapterRegistry.getInstance();
  }

  /**
   * Discovers and correlates all installed snapshots and available upstream versions.
   */
  public async getCompleteCatalog(edition: 'java' | 'bedrock' = 'java'): Promise<VersionCatalogEntry[]> {
    const installedVersions = this.storage.listStoredVersions(edition);
    const upstreamVersions = await this.adapterRegistry.discoverAllVersions();

    const allVersionNames = Array.from(new Set([...installedVersions, ...upstreamVersions])).sort(
      (a, b) => b.localeCompare(a, undefined, { numeric: true })
    );

    const catalog: VersionCatalogEntry[] = [];

    for (const v of allVersionNames) {
      const manifest = this.storage.readManifest(v, edition);
      const isInstalled = !!manifest;

      const matchingAdapters = this.adapterRegistry
        .getAllAdapters()
        .filter((a) => true) // All registered adapters support our version range
        .map((a) => a.getSourceName());

      catalog.push({
        version: v,
        edition,
        status: manifest ? manifest.status : 'AVAILABLE_UPSTREAM',
        isInstalled,
        manifest: manifest || undefined,
        blockCount: manifest?.blockCount,
        checksum: manifest?.checksum,
        sourceAdapters: matchingAdapters,
      });
    }

    return catalog;
  }
}
