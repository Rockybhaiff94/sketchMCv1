import { MinecraftBlock, ShapeType } from '../../types/minecraft.ts';
import { getMinecraftBlock, getBlocksForVersion, isValidBlockId, isValidBlockState } from '../registry.ts';
import { getOrCreateBlockTexture } from '../textureGenerator.ts';

/**
 * Model definition matching Minecraft Java Edition block model JSON format
 */
export interface MinecraftBlockModelDefinition {
  parent?: string;
  ambientocclusion?: boolean;
  textures?: Record<string, string>;
  elements?: {
    from: [number, number, number];
    to: [number, number, number];
    rotation?: { origin: [number, number, number]; axis: 'x' | 'y' | 'z'; angle: number };
    faces: Record<string, { uv?: [number, number, number, number]; texture: string; cullface?: string; tintindex?: number }>;
  }[];
}

/**
 * Blockstate definition matching Minecraft Java Edition blockstate JSON format
 */
export interface MinecraftBlockStateDefinition {
  variants?: Record<
    string,
    | { model: string; x?: number; y?: number; uvlock?: boolean }
    | { model: string; x?: number; y?: number; uvlock?: boolean }[]
  >;
  multipart?: {
    when?: Record<string, string>;
    apply: { model: string; x?: number; y?: number; uvlock?: boolean };
  }[];
}

/**
 * Universal Minecraft Asset Provider Interface
 */
export interface MinecraftAssetProvider {
  id: string;
  name: string;
  getBlockDefinition(blockId: string, version?: '1.20' | '1.21'): MinecraftBlock | undefined;
  getBlockState(blockId: string, state?: Record<string, string>, version?: '1.20' | '1.21'): MinecraftBlockStateDefinition | undefined;
  getBlockModel(modelId: string, version?: '1.20' | '1.21'): MinecraftBlockModelDefinition | undefined;
  getTexture(textureId: string, version?: '1.20' | '1.21'): any;
  isVersionSupported(version: string): boolean;
  listBlocks(version?: '1.20' | '1.21'): MinecraftBlock[];
}

/**
 * Vanilla Java Resource Provider for Java 1.20 and Java 1.21
 */
export class VanillaJavaResourceProvider implements MinecraftAssetProvider {
  id = 'vanilla_java';
  name = 'Vanilla Minecraft Java Edition Resource Provider';

  private modelCache = new Map<string, MinecraftBlockModelDefinition>();
  private stateCache = new Map<string, MinecraftBlockStateDefinition>();

  isVersionSupported(version: string): boolean {
    return version === '1.20' || version === '1.21';
  }

  getBlockDefinition(blockId: string, version: '1.20' | '1.21' = '1.21'): MinecraftBlock | undefined {
    const cleanId = blockId.startsWith('minecraft:') ? blockId : `minecraft:${blockId}`;
    const def = getMinecraftBlock(cleanId);
    if (!def) return undefined;

    // Version gate 1.21 exclusive features
    if (version === '1.20' && def.sinceVersion === '1.21') {
      return undefined;
    }
    return def;
  }

  listBlocks(version: '1.20' | '1.21' = '1.21'): MinecraftBlock[] {
    return getBlocksForVersion(version);
  }

  getBlockState(
    blockId: string,
    state?: Record<string, string>,
    version: '1.20' | '1.21' = '1.21'
  ): MinecraftBlockStateDefinition | undefined {
    const cleanId = blockId.replace('minecraft:', '');
    const cacheKey = `${cleanId}_${version}`;
    if (this.stateCache.has(cacheKey)) {
      return this.stateCache.get(cacheKey);
    }

    const def = this.getBlockDefinition(blockId, version);
    if (!def) return undefined;

    let stateDef: MinecraftBlockStateDefinition;

    if (def.shapeType === 'stairs') {
      stateDef = {
        variants: {
          'facing=north,half=bottom,shape=straight': { model: `block/${cleanId}`, y: 0 },
          'facing=south,half=bottom,shape=straight': { model: `block/${cleanId}`, y: 180 },
          'facing=west,half=bottom,shape=straight': { model: `block/${cleanId}`, y: 270 },
          'facing=east,half=bottom,shape=straight': { model: `block/${cleanId}`, y: 90 },
          'facing=north,half=top,shape=straight': { model: `block/${cleanId}`, x: 180, y: 0 },
          'facing=south,half=top,shape=straight': { model: `block/${cleanId}`, x: 180, y: 180 },
          'facing=west,half=top,shape=straight': { model: `block/${cleanId}`, x: 180, y: 270 },
          'facing=east,half=top,shape=straight': { model: `block/${cleanId}`, x: 180, y: 90 },
        },
      };
    } else if (def.shapeType === 'slab') {
      stateDef = {
        variants: {
          'type=bottom': { model: `block/${cleanId}` },
          'type=top': { model: `block/${cleanId}_top` },
          'type=double': { model: `block/${cleanId.replace('_slab', '')}` },
        },
      };
    } else {
      stateDef = {
        variants: {
          '': { model: `block/${cleanId}` },
        },
      };
    }

    this.stateCache.set(cacheKey, stateDef);
    return stateDef;
  }

  getBlockModel(modelId: string, version: '1.20' | '1.21' = '1.21'): MinecraftBlockModelDefinition | undefined {
    const cacheKey = `${modelId}_${version}`;
    if (this.modelCache.has(cacheKey)) {
      return this.modelCache.get(cacheKey);
    }

    const cleanModel = modelId.replace('minecraft:', '').replace('block/', '');

    const modelDef: MinecraftBlockModelDefinition = {
      parent: 'block/block',
      textures: {
        all: `block/${cleanModel}`,
        particle: `block/${cleanModel}`,
      },
      elements: [
        {
          from: [0, 0, 0],
          to: [16, 16, 16],
          faces: {
            down: { uv: [0, 0, 16, 16], texture: '#all', cullface: 'down' },
            up: { uv: [0, 0, 16, 16], texture: '#all', cullface: 'up' },
            north: { uv: [0, 0, 16, 16], texture: '#all', cullface: 'north' },
            south: { uv: [0, 0, 16, 16], texture: '#all', cullface: 'south' },
            west: { uv: [0, 0, 16, 16], texture: '#all', cullface: 'west' },
            east: { uv: [0, 0, 16, 16], texture: '#all', cullface: 'east' },
          },
        },
      ],
    };

    this.modelCache.set(cacheKey, modelDef);
    return modelDef;
  }

  getTexture(textureId: string, version: '1.20' | '1.21' = '1.21'): any {
    const clean = textureId.replace('minecraft:', '').replace('block/', '');
    const def = getMinecraftBlock(`minecraft:${clean}`) || getMinecraftBlock('minecraft:stone');
    return getOrCreateBlockTexture(def?.textureType || 'smooth', def?.colorHex || '#808080');
  }
}

/**
 * Local Minecraft Resource Provider (caches extracted vanilla assets)
 */
export class LocalMinecraftResourceProvider extends VanillaJavaResourceProvider {
  override id = 'local_minecraft';
  override name = 'Local Minecraft Installation Cache Provider';
}

/**
 * Imported Resource Pack Provider
 * Allows drag-and-drop or server zip packs to override models and textures
 */
export class ImportedResourcePackProvider implements MinecraftAssetProvider {
  id = 'imported_pack';
  name = 'Imported Resource Pack Provider';
  private fallback = new VanillaJavaResourceProvider();
  private packBlocks = new Map<string, MinecraftBlock>();

  isVersionSupported(version: string): boolean {
    return this.fallback.isVersionSupported(version);
  }

  getBlockDefinition(blockId: string, version: '1.20' | '1.21' = '1.21'): MinecraftBlock | undefined {
    return this.packBlocks.get(blockId) || this.fallback.getBlockDefinition(blockId, version);
  }

  listBlocks(version: '1.20' | '1.21' = '1.21'): MinecraftBlock[] {
    return this.fallback.listBlocks(version);
  }

  getBlockState(blockId: string, state?: Record<string, string>, version: '1.20' | '1.21' = '1.21'): MinecraftBlockStateDefinition | undefined {
    return this.fallback.getBlockState(blockId, state, version);
  }

  getBlockModel(modelId: string, version: '1.20' | '1.21' = '1.21'): MinecraftBlockModelDefinition | undefined {
    return this.fallback.getBlockModel(modelId, version);
  }

  getTexture(textureId: string, version: '1.20' | '1.21' = '1.21'): any {
    return this.fallback.getTexture(textureId, version);
  }
}

/**
 * Optional Blender / MCprep Pipeline Provider
 * Provides bridge data structures and material schemas compatible with MCprep shaders and node groups.
 * Does NOT require Blender installation on client.
 */
export class OptionalBlenderResourceProvider implements MinecraftAssetProvider {
  id = 'blender_mcprep';
  name = 'Optional Blender MCprep Material & Geometry Pipeline';
  private fallback = new VanillaJavaResourceProvider();

  isVersionSupported(version: string): boolean {
    return this.fallback.isVersionSupported(version);
  }

  getBlockDefinition(blockId: string, version: '1.20' | '1.21' = '1.21'): MinecraftBlock | undefined {
    return this.fallback.getBlockDefinition(blockId, version);
  }

  listBlocks(version: '1.20' | '1.21' = '1.21'): MinecraftBlock[] {
    return this.fallback.listBlocks(version);
  }

  getBlockState(blockId: string, state?: Record<string, string>, version: '1.20' | '1.21' = '1.21'): MinecraftBlockStateDefinition | undefined {
    return this.fallback.getBlockState(blockId, state, version);
  }

  getBlockModel(modelId: string, version: '1.20' | '1.21' = '1.21'): MinecraftBlockModelDefinition | undefined {
    return this.fallback.getBlockModel(modelId, version);
  }

  getTexture(textureId: string, version: '1.20' | '1.21' = '1.21'): any {
    return this.fallback.getTexture(textureId, version);
  }

  /**
   * Generates MCprep material description schema for optional external rendering
   */
  getMCprepMaterialSchema(blockId: string) {
    const def = this.getBlockDefinition(blockId);
    return {
      shaderNodeGroup: 'MCprep_Block_Shader',
      principledBSDF: {
        baseColorHex: def?.colorHex || '#FFFFFF',
        roughness: def?.roughness ?? 0.8,
        specular: 0.15,
        transmission: def?.transparent ? (def.opacity !== undefined ? 1 - def.opacity : 0.8) : 0.0,
        alpha: def?.opacity ?? 1.0,
      },
      emission: blockId.includes('lantern') || blockId.includes('torch') ? { color: '#FFAA33', strength: 8.0 } : undefined,
    };
  }
}

// Active singleton provider
export const activeAssetProvider: MinecraftAssetProvider = new VanillaJavaResourceProvider();
