import { SnapshotStorage } from '../registry/SnapshotStorage';
import { SourceAdapterRegistry } from '../adapters/SourceAdapterRegistry';
import { VersionValidationService } from './VersionValidationService';
import { VersionManifest, RegistrySnapshot } from '../../../types/registry';

export interface ImportProgressCallback {
  (stage: 'FETCHING' | 'PARSING' | 'NORMALIZING' | 'VALIDATING' | 'PERSISTING' | 'COMPLETE' | 'FAILED', detail: string): void;
}

export class VersionImportService {
  private storage: SnapshotStorage;
  private adapterRegistry: SourceAdapterRegistry;

  constructor(storage?: SnapshotStorage, adapterRegistry?: SourceAdapterRegistry) {
    this.storage = storage || new SnapshotStorage();
    this.adapterRegistry = adapterRegistry || SourceAdapterRegistry.getInstance();
  }

  /**
   * Executes the full deterministic import pipeline for a Minecraft version.
   */
  public async importVersion(
    version: string,
    edition: 'java' | 'bedrock' = 'java',
    onProgress?: ImportProgressCallback
  ): Promise<{ success: boolean; manifest?: VersionManifest; error?: string }> {
    try {
      // Step 1: Check if already installed and READY
      if (this.storage.hasSnapshot(version, edition)) {
        const existing = this.storage.readManifest(version, edition);
        if (existing && existing.status === 'READY') {
          onProgress?.('COMPLETE', `Version ${version} already installed and validated.`);
          return { success: true, manifest: existing };
        }
      }

      onProgress?.('FETCHING', `Fetching raw data for Minecraft ${version} from adapters...`);

      // Step 2: Build unified snapshot (combining assets and data)
      onProgress?.('NORMALIZING', `Normalizing block definitions, states, collision shapes, and models...`);
      const snapshot: RegistrySnapshot = await this.adapterRegistry.buildUnifiedSnapshot(version);

      // Step 3: Strict Validation
      onProgress?.('VALIDATING', `Running deterministic geometry, collision, and state validation...`);
      const validation = VersionValidationService.validateSnapshot(snapshot);

      if (!validation.valid) {
        const errorMsg = `Validation failed: ${validation.errors.join('; ')}`;
        onProgress?.('FAILED', errorMsg);

        // Record failed manifest without corrupting data
        const failedManifest: VersionManifest = {
          ...snapshot.manifest,
          status: 'FAILED',
          failureReason: errorMsg,
          validatedAt: new Date().toISOString(),
        };

        return {
          success: false,
          manifest: failedManifest,
          error: errorMsg,
        };
      }

      // Step 4: Persist as immutable snapshot
      onProgress?.('PERSISTING', `Writing immutable snapshot and calculating SHA-256 integrity hash...`);
      await this.storage.saveSnapshot(snapshot);

      onProgress?.('COMPLETE', `Minecraft ${version} snapshot successfully stored and ready for reconstruction.`);

      const finalManifest = this.storage.readManifest(version, edition);
      return {
        success: true,
        manifest: finalManifest || snapshot.manifest,
      };
    } catch (err: any) {
      const errorMsg = err?.message || String(err);
      onProgress?.('FAILED', errorMsg);
      return {
        success: false,
        error: errorMsg,
      };
    }
  }
}
