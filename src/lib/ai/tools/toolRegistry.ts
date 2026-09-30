import {
  MinecraftBuild,
  ReferenceBuilding,
  ReferenceImageItem,
  Neutral3DModel,
  DepthModel,
  CandidateSolution,
  ValidationResult,
  ComparisonResult,
} from '../../../types/minecraft';
import { getMinecraftBlock, isValidBlockId, isValidBlockState } from '../../registry';
import { validateMinecraftBuild } from '../../buildValidator';
import { ConstructionPatternDatabase } from '../../schematics/patternDatabase';
import { buildNeutral3DModel } from '../../geometry/neutralModelBuilder';

export interface VoxelForgeToolDefinition {
  name: string;
  description: string;
  permission: 'read' | 'write' | 'export';
  parameters: Record<string, string>;
  execute: (args: any, context?: any) => Promise<any>;
}

export class ToolRegistry {
  private static instance: ToolRegistry;
  private tools: Map<string, VoxelForgeToolDefinition> = new Map();

  private constructor() {
    this.registerBuiltinTools();
  }

  public static getInstance(): ToolRegistry {
    if (!ToolRegistry.instance) {
      ToolRegistry.instance = new ToolRegistry();
    }
    return ToolRegistry.instance;
  }

  private registerBuiltinTools() {
    // 1. queryMinecraftBlock (read)
    this.tools.set('queryMinecraftBlock', {
      name: 'queryMinecraftBlock',
      description: 'Query block registry data, shape, category, and allowed states for a Minecraft block ID.',
      permission: 'read',
      parameters: { blockId: 'string' },
      execute: async ({ blockId }) => {
        const block = getMinecraftBlock(blockId);
        return {
          exists: !!block,
          block: block || null,
          isValid: isValidBlockId(blockId),
        };
      },
    });

    // 2. queryMinecraftBlockState (read)
    this.tools.set('queryMinecraftBlockState', {
      name: 'queryMinecraftBlockState',
      description: 'Check whether a specific block state combination is valid in the target Minecraft version.',
      permission: 'read',
      parameters: { blockId: 'string', state: 'object', version: 'string' },
      execute: async ({ blockId, state, version = '1.21' }) => {
        const valid = isValidBlockState(blockId, state);
        return {
          blockId,
          state,
          version,
          isValid: valid,
        };
      },
    });

    // 3. searchSchematicKnowledge (read)
    this.tools.set('searchSchematicKnowledge', {
      name: 'searchSchematicKnowledge',
      description: 'Search reusable construction patterns extracted from previous schematics (roads, houses, redstone).',
      permission: 'read',
      parameters: { category: 'string', materialKeyword: 'string' },
      execute: async ({ category, materialKeyword }) => {
        const db = ConstructionPatternDatabase.getInstance();
        const patterns = db.searchPatterns({ category, materialKeyword });
        return {
          count: patterns.length,
          patterns: patterns.map((p) => ({
            id: p.id,
            name: p.name,
            category: p.category,
            description: p.description,
            materials: p.materials,
          })),
        };
      },
    });

    // 4. createNeutral3DModel (read)
    this.tools.set('createNeutral3DModel', {
      name: 'createNeutral3DModel',
      description: 'Construct the continuous neutral 3D model and depth/occlusion model from reference architecture.',
      permission: 'read',
      parameters: { scale: 'number' },
      execute: async ({ scale = 1.0 }, context) => {
        const building: ReferenceBuilding = context?.referenceBuilding;
        if (!building) {
          throw new Error('ReferenceBuilding required in context to create neutral 3D model');
        }
        return buildNeutral3DModel(building, scale);
      },
    });

    // 5. validateBuild (read)
    this.tools.set('validateBuild', {
      name: 'validateBuild',
      description: 'Validate Minecraft build against official Java block registry, coordinates, and state rules.',
      permission: 'read',
      parameters: { build: 'object' },
      execute: async ({ build }: { build: MinecraftBuild }) => {
        return validateMinecraftBuild(build);
      },
    });

    // 6. modifyBuild (write - controlled API)
    this.tools.set('modifyBuild', {
      name: 'modifyBuild',
      description: 'Controlled modification of Minecraft build blocks (passes through deterministic validation).',
      permission: 'write',
      parameters: { currentBuild: 'object', operation: 'string', blocks: 'array' },
      execute: async ({ currentBuild, blocks, operation }: { currentBuild: MinecraftBuild; blocks: any[]; operation: string }) => {
        if (!currentBuild || !Array.isArray(blocks)) {
          throw new Error('Invalid arguments to modifyBuild');
        }

        const updatedBlocks = [...currentBuild.blocks];
        // Apply controlled block replacements
        for (const newB of blocks) {
          const idx = updatedBlocks.findIndex(
            (b) => b.position.x === newB.position.x && b.position.y === newB.position.y && b.position.z === newB.position.z
          );
          if (idx >= 0) {
            updatedBlocks[idx] = newB;
          } else {
            updatedBlocks.push(newB);
          }
        }

        const newBuild: MinecraftBuild = {
          ...currentBuild,
          blocks: updatedBlocks,
          metadata: {
            ...currentBuild.metadata,
            iterationCount: (currentBuild.metadata.iterationCount || 1) + 1,
          },
        };

        const validation = validateMinecraftBuild(newBuild);
        return {
          success: validation.valid,
          validation,
          modifiedBlockCount: blocks.length,
          newBuild,
        };
      },
    });
  }

  public getTool(name: string): VoxelForgeToolDefinition | undefined {
    return this.tools.get(name);
  }

  public listTools(): { name: string; description: string; permission: string }[] {
    return Array.from(this.tools.values()).map((t) => ({
      name: t.name,
      description: t.description,
      permission: t.permission,
    }));
  }

  public async callTool(name: string, args: any, context?: any): Promise<any> {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new Error(`Tool "${name}" is not registered in VoxelForge allowlisted tools.`);
    }
    return await tool.execute(args, context);
  }
}
