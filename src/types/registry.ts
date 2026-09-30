import { BlockCategory, BlockMaterial, ShapeType } from './minecraft';
import { MinecraftBlockStateDefinition, MinecraftBlockModelDefinition } from '../lib/assets/assetProvider';

export type SourceType = 'minecraft-assets' | 'minecraft-data' | 'official' | 'community';
export type VersionStatus = 'DETECTED' | 'IMPORTING' | 'VALIDATING' | 'READY' | 'FAILED';

export interface SourceValidationResult {
  valid: boolean;
  errors: string[];
  warnings?: string[];
  blockCount: number;
}

export interface SourceManifest {
  adapter: string;
  repository: string;
  revision: string;
  commit?: string;
  tag?: string;
}

export interface VersionManifest {
  minecraftVersion: string;
  edition: 'java' | 'bedrock';
  source: SourceManifest;
  schemaVersion: string;
  status: VersionStatus;
  checksum: string; // SHA-256 content hash
  importedAt: string;
  validatedAt?: string;
  blockCount: number;
  stateCount: number;
  modelCount: number;
  textureCount: number;
  geometryCount: number;
  importerVersion: string;
  failureReason?: string;
}

export interface NormalizedBlockDefinition {
  id: string; // e.g. "minecraft:deepslate_tile_stairs"
  namespace: string; // e.g. "minecraft"
  version: string; // e.g. "1.21.1"
  name: string;
  category: BlockCategory;
  subCategory?: string;
  material: BlockMaterial;
  shapeType: ShapeType;
  colorHex: string;
  roughness?: number;
  metalness?: number;
  opacity?: number;
  transparent: boolean;
  luminance?: number;
  hardness?: number;

  defaultState: Record<string, string>;
  properties: Record<string, string[]>;
  tags: string[];

  states: {
    stateId: number;
    properties: Record<string, string>;
    default?: boolean;
  }[];

  modelReferences: string[];
  blockstateDefinition?: MinecraftBlockStateDefinition;

  geometry: {
    collisionShape: { boxes: [number, number, number, number, number, number][] };
    selectionShape: { boxes: [number, number, number, number, number, number][] };
    occlusionShape?: { boxes: [number, number, number, number, number, number][] };
  };

  orientationRules: {
    supportsRotation: boolean;
    allowedRotations?: string[];
    allowedAxes?: ('x' | 'y' | 'z')[];
    allowedHalves?: ('top' | 'bottom')[];
    allowedShapes?: string[];
  };

  connectionRules: {
    canConnectToStairs: boolean;
    canConnectToWalls: boolean;
    canConnectToPanes: boolean;
    canConnectToFences: boolean;
    waterloggable: boolean;
  };

  redstoneProperties?: {
    isPowerSource: boolean;
    conductsRedstone: boolean;
    signalStrength?: number;
    isTrigger: boolean;
  };

  provenance: {
    sourceAdapter: string;
    sourceCommit?: string;
    importedAt: string;
  };
}

export interface ProjectPinningInfo {
  minecraftVersion: string;
  registrySnapshot: string; // SHA-256 hash
  registrySchemaVersion: string;
}

export interface MigrationDifference {
  type: 'removed' | 'renamed' | 'changed_states' | 'changed_models' | 'changed_texture' | 'added';
  oldBlockId: string;
  newBlockId?: string;
  severity: 'info' | 'warning' | 'breaking';
  description: string;
  automaticMappingAvailable: boolean;
  replacementRule?: {
    replacementBlockId: string;
    stateMapping?: Record<string, string>;
  };
}

export interface MigrationReport {
  fromVersion: string;
  toVersion: string;
  fromSnapshot: string;
  toSnapshot: string;
  differences: MigrationDifference[];
  affectedBlockCount: number;
  requiresManualReview: boolean;
  timestamp: string;
}

export interface RegistrySnapshot {
  manifest: VersionManifest;
  blocks: Record<string, NormalizedBlockDefinition>;
  blockstates: Record<string, MinecraftBlockStateDefinition>;
  models: Record<string, MinecraftBlockModelDefinition>;
}
