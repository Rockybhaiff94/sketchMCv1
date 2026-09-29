export type BlockCategory =
  | 'building'
  | 'wood'
  | 'stone'
  | 'glass'
  | 'concrete'
  | 'terracotta'
  | 'wool'
  | 'nature'
  | 'plants'
  | 'lighting'
  | 'functional'
  | 'redstone'
  | 'decoration'
  | 'nether'
  | 'end';

export type BlockMaterial =
  | 'stone'
  | 'wood'
  | 'glass'
  | 'brick'
  | 'metal'
  | 'sandstone'
  | 'deepslate'
  | 'quartz'
  | 'terracotta'
  | 'concrete'
  | 'wool'
  | 'foliage';

export type ShapeType =
  | 'full_cube'
  | 'stairs'
  | 'slab'
  | 'pane'
  | 'fence'
  | 'wall'
  | 'door'
  | 'trapdoor'
  | 'lantern'
  | 'log'
  | 'torch'
  | 'plant';

export interface MinecraftBlock {
  id: string; // e.g. "minecraft:stone_bricks"
  name: string;
  category: BlockCategory;
  subCategory?: string;
  material: BlockMaterial;
  shapeType: ShapeType;
  colorHex: string;
  textureType?: string;
  sinceVersion?: '1.20' | '1.21';
  roughness?: number;
  metalness?: number;
  opacity?: number;
  transparent?: boolean;
  supportsRotation: boolean;
  allowedRotations?: string[]; // e.g. ["north", "south", "east", "west"]
  defaultState?: Record<string, string>;
  properties?: Record<string, string[]>;
  tags?: string[];
}

export interface BlockPlacement {
  id: string;
  blockId: string;
  position: {
    x: number;
    y: number;
    z: number;
  };
  state?: Record<string, string>; // e.g. { facing: "north", half: "bottom", shape: "straight" }
}

export interface BuildDimensions {
  width: number;
  height: number;
  depth: number;
}

export interface ConfidenceReport {
  overall: number;
  front: number;
  roof: number;
  sides: number;
  rear: number;
  materials: number;
}

export interface MinecraftBuild {
  id: string;
  name: string;
  version: '1.20' | '1.21';
  dimensions: BuildDimensions;
  blocks: BlockPlacement[];
  metadata: {
    sourceImage?: string;
    style: string;
    scale: number; // 1 = 1:1, 0.5 = compact, etc.
    confidence: ConfidenceReport;
    generatedByAI: boolean;
    createdAt: string;
    iterationCount?: number;
  };
}

export interface SceneAnalysis {
  structureType: string;
  style: string;
  archetype?: 'conservatory_glass_garden' | 'modern_glass_villa' | 'medieval_building' | 'pagoda_temple' | 'cathedral_arch' | 'cottage' | 'generic';
  estimatedDimensions: BuildDimensions;
  cameraPerspective: 'ground_front' | 'three_quarter_elevated' | 'orthographic' | 'isometric';
  confidence: ConfidenceReport;
  hasVegetation?: boolean;
  hasGardenBeds?: boolean;
  hasPathway?: boolean;
  hasArchedRibs?: boolean;
  hasGlassRoof?: boolean;
  paletteRecommendation: {
    walls: string;
    roof: string;
    trim: string;
    windows: string;
    foundation: string;
    details: string;
    doors: string;
  };
  floors: {
    level: number;
    height: number;
    wallMaterial: string;
    floorMaterial: string;
  }[];
  roof: {
    shape: 'gable' | 'hip' | 'flat' | 'mansard' | 'steeple' | 'pagoda_curved';
    pitch: number;
    overhang: number;
    primaryMaterial: string;
    trimMaterial: string;
  };
  openings: {
    type: 'window' | 'door' | 'archway';
    wall: 'front' | 'back' | 'left' | 'right';
    floorLevel: number;
    xOffsetRatio: number; // -0.5 to 0.5 along wall width
    widthRatio: number;
    heightRatio: number;
  }[];
  columns: {
    position: 'corners' | 'facade_spaced' | 'portico';
    material: string;
  }[];
  decorativeFeatures: string[];
}

export interface ArchitecturalModel {
  walls: {
    wallId: string;
    side: 'front' | 'back' | 'left' | 'right';
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
    minZ: number;
    maxZ: number;
    material: string;
    thickness: number;
  }[];
  roofs: {
    roofId: string;
    shape: 'gable' | 'hip' | 'flat' | 'mansard' | 'steeple' | 'pagoda_curved';
    minX: number;
    maxX: number;
    baseY: number;
    peakY: number;
    minZ: number;
    maxZ: number;
    material: string;
    trimMaterial: string;
    overhang: number;
  }[];
  openings: {
    type: 'window' | 'door' | 'archway';
    x: number;
    y: number;
    z: number;
    width: number;
    height: number;
    facing: 'north' | 'south' | 'east' | 'west';
  }[];
  columns: {
    x: number;
    z: number;
    minY: number;
    maxY: number;
    material: string;
  }[];
  floors: {
    y: number;
    minX: number;
    maxX: number;
    minZ: number;
    maxZ: number;
    material: string;
  }[];
}

export interface ValidationError {
  type: 'invalid_block_id' | 'invalid_state' | 'duplicate_position' | 'out_of_bounds' | 'unsupported_version';
  message: string;
  position?: { x: number; y: number; z: number };
  blockId?: string;
}

export interface ValidationWarning {
  type: 'floating_block' | 'unconnected_stair' | 'missing_door_bottom';
  message: string;
  position?: { x: number; y: number; z: number };
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  statistics: {
    totalBlocks: number;
    uniqueBlocks: number;
    dimensions: BuildDimensions;
  };
}

export interface BuildOperation {
  type:
    | 'replace_block'
    | 'move_component'
    | 'scale_component'
    | 'add_component'
    | 'remove_component'
    | 'modify_property';
  target: string; // e.g. "roof", "windows", "walls", "oak_planks"
  parameters: Record<string, any>;
}

export interface ProjectRecord {
  id: string;
  name: string;
  status:
    | 'created'
    | 'image_uploaded'
    | 'analyzing'
    | 'reconstructing'
    | 'optimizing'
    | 'validating'
    | 'completed'
    | 'failed';
  originalImage?: string;
  minecraftVersion: '1.20' | '1.21';
  scale: number;
  build?: MinecraftBuild;
  history: MinecraftBuild[];
  historyIndex: number;
  createdAt: string;
  updatedAt: string;
}
