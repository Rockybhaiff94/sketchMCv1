import { VersionManifest, RegistrySnapshot } from '../../../types/registry';

export interface SourceValidationResult {
  valid: boolean;
  errors: string[];
  warnings?: string[];
  blockCount: number;
}

export interface MinecraftSourceAdapter {
  getSourceName(): string;
  getDescription(): string;
  discoverVersions(): Promise<string[]>;
  fetchVersion(version: string): Promise<any>;
  parseVersion(version: string, rawData: any): Promise<any>;
  normalizeVersion(version: string, parsedData: any): Promise<RegistrySnapshot>;
  validateVersion(version: string, snapshot: RegistrySnapshot): Promise<SourceValidationResult>;
  getManifest(version: string): Promise<VersionManifest>;
}
