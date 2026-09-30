import {
  ConstructionPattern,
  MaterialPattern,
  GeometryPattern,
  ModulePattern,
  LayerPattern,
  BlockRelationship,
  FunctionalFeature,
} from '../../types/minecraft';
import { ParsedSchematicResult, isRedstoneBlock } from './schematicParser';

export class ConstructionPatternDatabase {
  private static instance: ConstructionPatternDatabase;
  private patterns: Map<string, ConstructionPattern> = new Map();

  private constructor() {
    this.seedCanonicalPatterns();
  }

  public static getInstance(): ConstructionPatternDatabase {
    if (!ConstructionPatternDatabase.instance) {
      ConstructionPatternDatabase.instance = new ConstructionPatternDatabase();
    }
    return ConstructionPatternDatabase.instance;
  }

  /**
   * Pre-seed canonical construction patterns (Medieval Road, Framed House, Redstone Machine, Conservatory)
   */
  private seedCanonicalPatterns() {
    // 1. Medieval Road Pattern
    const roadPattern: ConstructionPattern = {
      id: 'pattern_medieval_road_canonical',
      category: 'road',
      subtype: 'medieval',
      name: 'Irregular Mixed Stone Road with Slab Curbs',
      description: 'Organic cobblestone, stone, and deepslate road bed with weathered stone slab edging and gravel transitions.',
      materials: [
        { role: 'road_bed', blockIds: ['minecraft:cobblestone', 'minecraft:stone', 'minecraft:deepslate'], frequencyRatio: 0.65 },
        { role: 'edge_curb', blockIds: ['minecraft:stone_brick_slab', 'minecraft:cobblestone_slab'], frequencyRatio: 0.2 },
        { role: 'weathering_infill', blockIds: ['minecraft:gravel', 'minecraft:andesite'], frequencyRatio: 0.15 },
      ],
      geometry: [
        { structuralType: 'paved_ribbon', typicalWidth: 4, typicalHeight: 1 },
      ],
      modules: [
        {
          name: 'Straight Road Segment (4x4)',
          type: 'road_segment',
          blockGrid: [
            { relX: 0, relY: 0, relZ: 0, blockId: 'minecraft:cobblestone' },
            { relX: 1, relY: 0, relZ: 0, blockId: 'minecraft:stone' },
            { relX: 2, relY: 0, relZ: 0, blockId: 'minecraft:deepslate' },
            { relX: 3, relY: 0, relZ: 0, blockId: 'minecraft:stone_brick_slab', state: { type: 'bottom' } },
          ],
          tags: ['road', 'medieval', 'path'],
        },
      ],
      layering: [
        { layerIndex: 0, depthOffset: 0, typicalBlocks: ['minecraft:cobblestone', 'minecraft:stone'], semanticRole: 'pavement_surface' },
      ],
      blockRelationships: [
        { primaryBlockId: 'minecraft:cobblestone', adjacentBlockId: 'minecraft:stone', direction: 'adjacent', coOccurrenceFrequency: 0.8 },
        { primaryBlockId: 'minecraft:cobblestone', adjacentBlockId: 'minecraft:stone_brick_slab', direction: 'adjacent', coOccurrenceFrequency: 0.7 },
      ],
      visualFeatures: [
        { featureName: 'irregular_stonework', texturePattern: 'irregular_cobble', contrastLevel: 'subtle' },
      ],
      privacyScope: 'shared',
      tags: ['road', 'medieval', 'pathway', 'stone'],
    };

    // 2. Framed House / Facade Pattern
    const housePattern: ConstructionPattern = {
      id: 'pattern_framed_house_canonical',
      category: 'house',
      subtype: 'classical_framed',
      name: 'Tripartite Framed Masonry Wall with Arched Openings',
      description: 'Structural pilasters flanking inset window bays with stepped stair lintels and symmetrical portal entrance.',
      materials: [
        { role: 'primary_piers', blockIds: ['minecraft:deepslate_tiles', 'minecraft:deepslate_bricks'], frequencyRatio: 0.45 },
        { role: 'arched_lintels', blockIds: ['minecraft:deepslate_brick_stairs', 'minecraft:deepslate_brick_slab'], frequencyRatio: 0.25 },
        { role: 'glazing_infill', blockIds: ['minecraft:light_blue_stained_glass_pane', 'minecraft:glass_pane'], frequencyRatio: 0.3 },
      ],
      geometry: [
        { structuralType: 'stepped_arch_bay', typicalWidth: 7, typicalHeight: 9, stepRatio: 1.0 },
      ],
      modules: [
        {
          name: 'Arched Window Bay',
          type: 'window_bay',
          blockGrid: [
            { relX: 0, relY: 0, relZ: 0, blockId: 'minecraft:deepslate_tiles' },
            { relX: 1, relY: 0, relZ: 0, blockId: 'minecraft:light_blue_stained_glass_pane' },
            { relX: 2, relY: 0, relZ: 0, blockId: 'minecraft:deepslate_tiles' },
            { relX: 1, relY: 3, relZ: 0, blockId: 'minecraft:deepslate_brick_stairs', state: { facing: 'south', half: 'top' } },
          ],
          tags: ['house', 'window', 'arch'],
        },
      ],
      layering: [
        { layerIndex: 0, depthOffset: 0, typicalBlocks: ['minecraft:deepslate_tiles'], semanticRole: 'projecting_pilasters' },
        { layerIndex: 1, depthOffset: 0.5, typicalBlocks: ['minecraft:light_blue_stained_glass_pane'], semanticRole: 'inset_glazing' },
      ],
      blockRelationships: [
        { primaryBlockId: 'minecraft:deepslate_tiles', adjacentBlockId: 'minecraft:deepslate_brick_stairs', direction: 'above', coOccurrenceFrequency: 0.9 },
      ],
      visualFeatures: [
        { featureName: 'fluted_piers', texturePattern: 'ribbed_vertical', contrastLevel: 'high_contrast' },
      ],
      privacyScope: 'shared',
      tags: ['house', 'facade', 'architecture', 'arched_bays'],
    };

    // 3. Functional Redstone Mechanism Pattern (Separated from Visual Shell)
    const redstonePattern: ConstructionPattern = {
      id: 'pattern_redstone_piston_clock_canonical',
      category: 'redstone_machine',
      subtype: 'piston_pulse_generator',
      name: 'Isolated 2-Piston Observer Clock with Protective Shell',
      description: 'Functional redstone mechanism clearly decoupled from outer decorative masonry casing.',
      materials: [
        { role: 'casing_shell', blockIds: ['minecraft:smooth_stone', 'minecraft:glass'], frequencyRatio: 0.6 },
        { role: 'functional_logic', blockIds: ['minecraft:observer', 'minecraft:sticky_piston', 'minecraft:redstone_dust'], frequencyRatio: 0.4 },
      ],
      geometry: [
        { structuralType: 'enclosed_cell', typicalWidth: 3, typicalHeight: 3 },
      ],
      modules: [
        {
          name: 'Observer Piston Core',
          type: 'redstone_core',
          blockGrid: [
            { relX: 0, relY: 0, relZ: 0, blockId: 'minecraft:sticky_piston', state: { facing: 'east' } },
            { relX: 1, relY: 0, relZ: 0, blockId: 'minecraft:observer', state: { facing: 'west' } },
            { relX: 2, relY: 0, relZ: 0, blockId: 'minecraft:redstone_dust', state: { power: '0' } },
          ],
          tags: ['redstone', 'functional', 'mechanism'],
        },
      ],
      layering: [
        { layerIndex: 0, depthOffset: 0, typicalBlocks: ['minecraft:smooth_stone'], semanticRole: 'visual_housing' },
        { layerIndex: 1, depthOffset: 1, typicalBlocks: ['minecraft:observer', 'minecraft:sticky_piston'], semanticRole: 'functional_core' },
      ],
      blockRelationships: [
        { primaryBlockId: 'minecraft:sticky_piston', adjacentBlockId: 'minecraft:observer', direction: 'adjacent', coOccurrenceFrequency: 1.0 },
      ],
      visualFeatures: [
        { featureName: 'housing_inspection_window', texturePattern: 'smooth', contrastLevel: 'subtle' },
      ],
      functionalFeatures: [
        {
          componentType: 'redstone_machine',
          functionalBlocks: ['minecraft:sticky_piston', 'minecraft:observer', 'minecraft:redstone_dust'],
          triggerBlock: 'minecraft:lever',
          outputAction: 'continuous_clock_pulse',
          isolatedFromVisualShell: true,
        },
      ],
      privacyScope: 'shared',
      tags: ['redstone', 'machine', 'functional', 'piston'],
    };

    this.patterns.set(roadPattern.id, roadPattern);
    this.patterns.set(housePattern.id, housePattern);
    this.patterns.set(redstonePattern.id, redstonePattern);
  }

  /**
   * Extract a reusable ConstructionPattern from an uploaded schematic
   * Decouples the pattern from raw coordinates (Privacy isolation)
   */
  public extractPatternFromSchematic(
    schem: ParsedSchematicResult,
    privacyScope: 'private' | 'project' | 'shared' = 'project'
  ): ConstructionPattern {
    const isRedstone = schem.hasRedstone;
    let category: ConstructionPattern['category'] = 'house';

    const palStr = schem.palette.join(' ').toLowerCase();
    if (isRedstone) {
      category = 'redstone_machine';
    } else if (palStr.includes('cobble') && (palStr.includes('slab') || palStr.includes('gravel') || palStr.includes('path'))) {
      category = 'road';
    } else if (palStr.includes('glass') && palStr.includes('vault')) {
      category = 'roof';
    }

    const totalBlocks = Math.max(schem.blocks.length, 1);
    const materials: MaterialPattern[] = Object.entries(schem.blockCounts)
      .slice(0, 6)
      .map(([blockId, count]) => ({
        role: isRedstoneBlock(blockId) ? 'functional_component' : 'structural_element',
        blockIds: [blockId],
        frequencyRatio: count / totalBlocks,
      }));

    const patternId = `pattern_extracted_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    const pattern: ConstructionPattern = {
      id: patternId,
      category,
      subtype: `extracted_${schem.format}`,
      name: `Pattern from ${schem.name}`,
      description: `Learned construction pattern extracted from ${schem.name} (${schem.blocks.length} blocks analyzed).`,
      materials,
      geometry: [
        {
          structuralType: category === 'road' ? 'paved_ribbon' : 'modular_envelope',
          typicalWidth: schem.dimensions.width,
          typicalHeight: schem.dimensions.height,
        },
      ],
      modules: [
        {
          name: `${schem.name} Extracted Segment`,
          type: `${category}_module`,
          blockGrid: schem.blocks.slice(0, 16).map((b) => ({
            relX: b.position.x % 4,
            relY: b.position.y % 4,
            relZ: b.position.z % 4,
            blockId: b.blockId,
            state: b.state,
          })),
          tags: [category, 'extracted'],
        },
      ],
      layering: [
        {
          layerIndex: 0,
          depthOffset: 0,
          typicalBlocks: schem.palette.slice(0, 3),
          semanticRole: isRedstone ? 'mechanism_housing' : 'facade_surface',
        },
      ],
      blockRelationships: [
        {
          primaryBlockId: schem.palette[0] || 'minecraft:stone_bricks',
          adjacentBlockId: schem.palette[1] || 'minecraft:deepslate_bricks',
          direction: 'adjacent',
          coOccurrenceFrequency: 0.85,
        },
      ],
      visualFeatures: [
        { featureName: 'extracted_texture', texturePattern: 'composite', contrastLevel: 'high_contrast' },
      ],
      sourceSchematicId: schem.name,
      privacyScope,
      tags: [category, schem.format, ...schem.palette.slice(0, 4).map((p) => p.replace('minecraft:', ''))],
    };

    if (isRedstone) {
      pattern.functionalFeatures = [
        {
          componentType: 'redstone_machine',
          functionalBlocks: schem.palette.filter(isRedstoneBlock),
          isolatedFromVisualShell: true,
        },
      ];
    }

    this.patterns.set(patternId, pattern);
    return pattern;
  }

  /**
   * Search knowledge patterns by category, material query, or keywords
   * Enforces privacy: skips 'private' patterns not belonging to this project
   */
  public searchPatterns(
    query: {
      category?: string;
      materialKeyword?: string;
      tags?: string[];
      privacyScopeAllowed?: ('private' | 'project' | 'shared')[];
    }
  ): ConstructionPattern[] {
    const allowedScopes = query.privacyScopeAllowed || ['shared', 'project'];
    const results: ConstructionPattern[] = [];

    for (const pattern of this.patterns.values()) {
      if (!allowedScopes.includes(pattern.privacyScope)) continue;

      if (query.category && query.category !== 'all' && pattern.category !== query.category) {
        continue;
      }

      if (query.materialKeyword) {
        const matMatch = pattern.materials.some((m) =>
          m.blockIds.some((b) => b.toLowerCase().includes(query.materialKeyword!.toLowerCase()))
        );
        if (!matMatch) continue;
      }

      if (query.tags && query.tags.length > 0) {
        const tagMatch = query.tags.some((t) => pattern.tags.includes(t.toLowerCase()));
        if (!tagMatch) continue;
      }

      results.push(pattern);
    }

    return results;
  }

  public getPatternById(id: string): ConstructionPattern | undefined {
    return this.patterns.get(id);
  }

  public getAllSharedPatterns(): ConstructionPattern[] {
    return Array.from(this.patterns.values()).filter((p) => p.privacyScope === 'shared');
  }
}
