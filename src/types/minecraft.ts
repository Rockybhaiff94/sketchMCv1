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
  provenance?: ProvenanceType; // 'observed' | 'inferred' | 'generated'
  customData?: Record<string, any>;
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
  silhouetteSimilarity?: number;
  geometryConsistency?: number;
  multiViewAgreement?: number;
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
    referenceBuilding?: ReferenceBuilding;
    iterationHistory?: IterationStepReport[];
    minecraftVersion?: string;
    registrySnapshot?: string;
    registrySchemaVersion?: string;
    subjectCategory?: SubjectCategory;
    semanticSubject?: UniversalSemanticSubject;
    fidelityReport?: FidelityReport;
    provenanceSummary?: {
      observedPercent: number;
      inferredPercent: number;
      generatedPercent: number;
    };
  };
}

export type SubjectCategory =
  | 'architecture'
  | 'animal'
  | 'creature'
  | 'human_character'
  | 'statue_sculpture'
  | 'vehicle'
  | 'machine'
  | 'plant_tree'
  | 'furniture'
  | 'object'
  | 'monument'
  | 'terrain_object'
  | 'unknown';

export interface SemanticPart {
  id: string;
  name: string;
  type:
    | 'body'
    | 'head'
    | 'limb'
    | 'horn'
    | 'tail'
    | 'snout'
    | 'ear'
    | 'eye'
    | 'surface_marking'
    | 'chassis'
    | 'cabin'
    | 'wheel'
    | 'wing'
    | 'trunk'
    | 'branch'
    | 'canopy'
    | 'wall'
    | 'roof'
    | 'base'
    | 'feature';
  shape: 'ellipsoid' | 'capsule' | 'cylinder' | 'box' | 'tapered_hull' | 'curved_strip' | 'wedge';
  dimensions: { x: number; y: number; z: number };
  relativePosition: { x: number; y: number; z: number };
  rotation?: { x?: number; y?: number; z?: number };
  symmetry?: 'bilateral_x' | 'radial' | 'none';
  materialCandidate: string;
  colorHex: string;
  isDetail?: boolean;
}

export interface UniversalSemanticSubject {
  category: SubjectCategory;
  subjectName: string;
  confidence: number;
  dimensions: BuildDimensions;
  primaryMass: {
    shape: 'rounded_box' | 'ellipsoid' | 'tapered_capsule' | 'hull' | 'quad_wall';
    dimensions: { x: number; y: number; z: number };
    position: { x: number; y: number; z: number };
    materialCandidate: string;
    colorHex: string;
  };
  parts: SemanticPart[];
  groundOrEnvironment?: {
    hasTerrain: boolean;
    terrainType?: 'cherry_grove' | 'grass_plains' | 'road' | 'water';
    canopyBlocks?: string[];
    groundY?: number;
  };
  silhouetteBounds: {
    xMin: number;
    xMax: number;
    yMin: number;
    yMax: number;
    zMin: number;
    zMax: number;
  };
}

export interface FidelityReport {
  silhouette: number;
  proportions: number;
  palette: number;
  majorFeatures: number;
  overall: number;
  status: 'SUCCESS' | 'NEEDS_ITERATION' | 'FIDELITY_MISMATCH' | 'ANALYSIS_FAILED';
  reason?: string;
  mismatches?: string[];
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
  target: string;
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

// ===================================================================
// REFERENCE-FIRST INTERMEDIATE ARCHITECTURAL REPRESENTATION
// ===================================================================

export type ReferenceViewType =
  | 'front'
  | 'back'
  | 'left'
  | 'right'
  | 'top'
  | 'bottom'
  | 'interior'
  | 'detail'
  | 'unknown';

export interface ReferenceImageItem {
  id: string;
  name: string;
  dataUrl: string;
  mimeType: string;
  probableView: ReferenceViewType;
  userAssignedView?: ReferenceViewType;
  confidence: number;
  fileSize?: number;
  width?: number;
  height?: number;
}

export type BuildScaleOption = 'small' | 'medium' | 'large' | 'custom';
export type ReferenceModeOption =
  | 'single_image'
  | 'multi_image'
  | 'architecture_only'
  | 'architecture_environment'
  | 'architecture_interior';
export type AccuracyOption = 'fast' | 'balanced' | 'high_detail';
export type InferenceOption = 'conservative' | 'balanced' | 'creative';

export interface ReconstructionSettings {
  buildScale: BuildScaleOption;
  customScaleMultiplier?: number;
  referenceMode: ReferenceModeOption;
  accuracy: AccuracyOption;
  inference: InferenceOption;
  minecraftVersion: '1.20' | '1.21';
}

export type ProvenanceType = 'observed' | 'inferred' | 'generated';

export interface ReferenceBuildingBay {
  bayIndex: number;
  type: 'entrance_arch' | 'arched_window' | 'flat_window' | 'wall' | 'open_portico';
  xMinRatio: number; // normalized -0.5 to 0.5
  xMaxRatio: number;
  archStyle: 'stepped' | 'rounded' | 'gothic' | 'flat';
  archApexYRatio: number;
  doorType?: string;
  windowType?: string;
  sillHeightRatio: number;
}

export interface ReferenceBuildingFloor {
  level: number;
  height: number;
  wallMaterial: string;
  floorMaterial: string;
  ceilingMaterial: string;
}

export interface ReferenceBuildingRoof {
  shape: 'gable' | 'curved_vault' | 'mansard' | 'hip' | 'flat';
  pitch: number;
  heightBlocks: number;
  ribCount: number;
  ribSpacing: number;
  ribMaterial: string;
  canopyMaterial: string; // e.g. glass, tinted glass
  trimMaterial: string;
  isGlass: boolean;
  overhang: number;
}

export interface ReferenceBuildingColumn {
  x: number;
  z: number;
  minY: number;
  maxY: number;
  thickness: number;
  material: string;
  isFacadeRibContinuity: boolean;
}

export interface ReferenceBuildingVegetation {
  hasClimbingLeaves: boolean;
  climbingSide: 'left' | 'right' | 'both' | 'none';
  climbingMaterial: string;
  sideTrees: {
    side: 'left' | 'right';
    species: 'spruce' | 'oak' | 'birch' | 'cherry';
    count: number;
    height: number;
  }[];
  flowerBeds: {
    side: 'left' | 'right' | 'front';
    borderMaterial: string;
    flowerSpecies: string[];
    width: number;
    length: number;
  }[];
}

export interface ReferenceBuildingTerrain {
  hasCentralPath: boolean;
  pathWidth: number;
  pathMaterial: string;
  lawnMaterial: string;
  platformPadding: number;
}

export interface ReferenceBuilding {
  id: string;
  name: string;
  overallWidth: number;
  overallHeight: number;
  estimatedDepth: number;

  floors: ReferenceBuildingFloor[];
  facadeBays: ReferenceBuildingBay[];
  roof: ReferenceBuildingRoof;
  columns: ReferenceBuildingColumn[];

  glassRegions: {
    region: 'lower_facade' | 'upper_canopy' | 'side_walls' | 'roof';
    tint: 'clear' | 'pink_rose' | 'cyan_blue' | 'light_gray';
    blockId: string;
  }[];

  opaqueRegions: {
    role: 'foundation_skirting' | 'columns' | 'architraves' | 'trim';
    blockId: string;
  }[];

  vegetation: ReferenceBuildingVegetation;
  terrain: ReferenceBuildingTerrain;

  symmetry: {
    hasBilateralSymmetry: boolean;
    symmetryAxis: 'x';
    confidence: number;
  };

  repeatedElements: {
    type: 'arched_bay' | 'roof_rib' | 'column' | 'window';
    count: number;
    spacingRatio: number;
  }[];

  materialMapping: {
    referenceFeature: string;
    detectedColor: string;
    candidateBlocks: string[];
    bestBlockId: string;
  }[];

  provenanceSummary: {
    observedPercent: number;
    inferredPercent: number;
    generatedPercent: number;
  };
}

export interface IterationStepReport {
  iteration: number;
  stepName: string;
  description: string;
  silhouetteOverlapScore: number;
  proportionsError: number;
  facadeAlignmentScore: number;
  materialAccuracyScore: number;
  converged: boolean;
}

export interface ReconstructionAnalysisResult {
  referenceBuilding: ReferenceBuilding;
  viewsDetected: { view: ReferenceViewType; confidence: number; imageId: string }[];
  iterationHistory: IterationStepReport[];
  validation: ValidationResult;
  confidenceBreakdown: {
    silhouetteSimilarity: number;
    geometryConsistency: number;
    multiViewAgreement: number;
    materialMappingConfidence: number;
    overall: number;
  };
}

// =========================================================================
// MULTI-AGENT ARCHITECTURE & CANONICAL PROJECT STATE (MASTER SPECIFICATION)
// =========================================================================

export type AgentType = 'hermes' | 'gpt' | 'gemini' | 'grok';
export type AgentStatus = 'idle' | 'working' | 'complete' | 'failed' | 'not_configured';

export interface Observation {
  regionId: string;
  semanticType: 'wall' | 'window' | 'door' | 'roof' | 'column' | 'vegetation' | 'ground' | 'machine' | 'opening' | 'trim' | 'road' | 'water' | string;
  polygon2D?: number[][];
  estimatedDepth: number; // in meters
  thickness: number; // in meters
  material: string; // e.g. "dark_masonry", "curved_glass", "rose_stained_vault"
  color: string; // hex string e.g. "#343434"
  textureType: string; // e.g. "brick", "smooth", "leafy", "ribbed"
  transparency: number; // 0 to 1
  geometry: string; // e.g. "vertical_plane", "curved_arch", "vault_rib"
  observedOrInferred: 'observed' | 'inferred';
  confidence: number;
}

export interface Hypothesis {
  id: string;
  description: string;
  candidateBlockIds: string[];
  probability: number;
  rationale: string;
  adversarialChallenger?: string;
}

export interface CandidateScores {
  visualSimilarity: number;
  geometrySimilarity: number;
  textureSimilarity: number;
  colorSimilarity: number;
  depthSimilarity: number;
  neighborCompatibility: number;
  architecturalCompatibility: number;
  schematicPatternSimilarity: number;
  minecraftStateValidity: number;
  structuralValidity: number;
  overallScore: number;
}

export interface CandidateSolution {
  id: string;
  regionId: string;
  category: string;
  blocks: {
    blockId: string;
    state?: Record<string, string>;
    relativePos?: { x: number; y: number; z: number };
  }[];
  scores: CandidateScores;
  isMultiBlock: boolean;
  why: string;
  valid: boolean;
  rejectionReason?: string;
}

export interface Uncertainty {
  regionId: string;
  aspect: string;
  description: string;
  alternativeInterpretations: string[];
}

export interface EvidenceItem {
  type: 'pixel_color' | 'edge_contour' | 'depth_gradient' | 'texture_frequency' | 'schematic_match' | 'structural_symmetry';
  description: string;
  value: string | number;
  confidence: number;
}

export interface AgentReport {
  agent: AgentType;
  agentName: string;
  role: string;
  taskId: string;
  analysisType: string;
  status: AgentStatus;
  observations: Observation[];
  hypotheses: Hypothesis[];
  candidateSolutions: CandidateSolution[];
  confidence: number;
  uncertainties: Uncertainty[];
  evidence: EvidenceItem[];
  recommendedNextAction?: string;
  durationMs?: number;
  rawOutput?: string;
}

// -------------------------------------------------------------------------
// Neutral Continuous 3D Model & Depth/Occlusion
// -------------------------------------------------------------------------

export interface ArchitecturalComponent {
  id: string;
  type: 'wall_plane' | 'column_shaft' | 'arch_curved' | 'roof_vault' | 'slab_floor' | 'beam_horizontal' | 'frame_perimeter' | 'vegetation_cluster' | 'path_ribbon' | 'opening_void';
  name: string;
  bounds: { min: { x: number; y: number; z: number }; max: { x: number; y: number; z: number } };
  orientation: 'x' | 'y' | 'z' | 'none';
  thickness: number;
  curvatureRadius?: number;
  slopeAngle?: number;
  materialRegionId: string;
  depthLayerIndex: number;
  provenance: ProvenanceType;
}

export interface SurfaceRegion {
  id: string;
  componentId: string;
  normal: { x: number; y: number; z: number };
  areaMetersSq: number;
  roughness: number;
  colorHex: string;
}

export interface Opening3D {
  id: string;
  type: 'window' | 'door' | 'archway';
  hostComponentId: string;
  center: { x: number; y: number; z: number };
  width: number;
  height: number;
  hasFrame: boolean;
  depthInset: number;
}

export interface MaterialRegion3D {
  id: string;
  name: string;
  apparentColor: string;
  surfaceRoughness: number;
  transparency: number;
  subsurfaceType: 'masonry' | 'timber' | 'iron_frame' | 'stained_glass' | 'clear_glass' | 'living_foliage' | 'paved_stone';
  candidateMinecraftIds: string[];
}

export interface DepthLayer {
  index: number;
  depthMeters: number;
  description: string;
  regionIds: string[];
  isForeground: boolean;
  isInterior: boolean;
}

export interface CameraEstimate {
  position: { x: number; y: number; z: number };
  target: { x: number; y: number; z: number };
  fov: number;
  pitchDegrees: number;
  yawDegrees: number;
  projectionType: 'perspective' | 'orthographic';
  estimatedHorizonRatio: number;
}

export interface SymmetryInfo {
  plane: 'yz' | 'xy' | 'xz';
  centerCoordinate: number;
  confidence: number;
  matchedComponentsCount: number;
}

export interface ArchitecturalModule {
  id: string;
  name: string;
  moduleType: 'window_bay' | 'arched_entrance' | 'column_pair' | 'roof_truss' | 'road_segment' | 'balcony';
  dimension: { x: number; y: number; z: number };
  instancePositions: { x: number; y: number; z: number }[];
  repeatCount: number;
}

export interface Neutral3DModel {
  dimensions: { x: number; y: number; z: number };
  components: ArchitecturalComponent[];
  surfaces: SurfaceRegion[];
  openings: Opening3D[];
  materials: MaterialRegion3D[];
  depthLayers: DepthLayer[];
  camera: CameraEstimate;
  symmetry: SymmetryInfo[];
  modules: ArchitecturalModule[];
}

export interface DepthOcclusionItem {
  foregroundRegionId: string;
  backgroundRegionId: string;
  overlapRatio: number;
  distanceSeparationMeters: number;
}

export interface DepthModel {
  layers: DepthLayer[];
  occlusionMap: DepthOcclusionItem[];
  focalPlaneDepth: number;
  maxEstimatedDepth: number;
}

// -------------------------------------------------------------------------
// Schematic Knowledge & Construction Patterns
// -------------------------------------------------------------------------

export interface MaterialPattern {
  role: string;
  blockIds: string[];
  frequencyRatio: number;
  stateRequirements?: Record<string, string>;
}

export interface GeometryPattern {
  structuralType: string;
  typicalWidth: number;
  typicalHeight: number;
  stepRatio?: number;
}

export interface ModulePattern {
  name: string;
  type: string;
  blockGrid: { relX: number; relY: number; relZ: number; blockId: string; state?: Record<string, string> }[];
  tags: string[];
}

export interface LayerPattern {
  layerIndex: number;
  depthOffset: number;
  typicalBlocks: string[];
  semanticRole: string;
}

export interface BlockRelationship {
  primaryBlockId: string;
  adjacentBlockId: string;
  direction: 'above' | 'below' | 'adjacent' | 'embedded';
  coOccurrenceFrequency: number;
}

export interface VisualFeature {
  featureName: string;
  texturePattern: string;
  contrastLevel: 'subtle' | 'high_contrast' | 'monochrome';
}

export interface FunctionalFeature {
  componentType: 'redstone_machine' | 'lighting_circuit' | 'item_transport' | 'piston_door';
  functionalBlocks: string[];
  triggerBlock?: string;
  outputAction?: string;
  isolatedFromVisualShell: boolean;
}

export interface ConstructionPattern {
  id: string;
  category: 'road' | 'house' | 'roof' | 'window' | 'redstone_machine' | 'decoration' | 'bridge' | 'terrain';
  subtype?: string;
  name: string;
  description: string;
  materials: MaterialPattern[];
  geometry: GeometryPattern[];
  modules: ModulePattern[];
  layering: LayerPattern[];
  blockRelationships: BlockRelationship[];
  visualFeatures: VisualFeature[];
  functionalFeatures?: FunctionalFeature[];
  sourceSchematicId?: string;
  privacyScope: 'private' | 'project' | 'shared';
  tags: string[];
}

// -------------------------------------------------------------------------
// Render / Comparison / Decision / Project
// -------------------------------------------------------------------------

export interface RenderResult {
  view: 'front' | 'side' | 'perspective' | 'top';
  dataUrl?: string;
  resolution: { width: number; height: number };
  timestamp: string;
}

export interface VisualMismatch {
  regionId: string;
  description: string;
  mismatchType: 'silhouette' | 'roof_pitch' | 'opening_size' | 'column_spacing' | 'texture_density' | 'depth_layer';
  severity: 'minor' | 'moderate' | 'critical';
  recommendedCorrection: string;
}

export interface ComparisonResult {
  iteration: number;
  silhouetteMatchScore: number;
  facadeOverlapScore: number;
  materialSimilarityScore: number;
  depthConsistencyScore: number;
  overallFidelity: number;
  mismatches: VisualMismatch[];
  summary: string;
}

export interface ProjectDecision {
  id: string;
  timestamp: string;
  agent: AgentType | 'user' | 'deterministic_engine';
  topic: string;
  chosenOption: string;
  rationale: string;
  rejectedOptions?: string[];
}

export interface ReconstructionIteration {
  iterationNumber: number;
  hermesDirective: string;
  agentContributions: { agent: AgentType; summary: string }[];
  changesApplied: number;
  scoreAfterIteration: number;
  converged: boolean;
}

export interface UserEdit {
  id: string;
  timestamp: string;
  action: 'replace' | 'place' | 'remove' | 'paint';
  targetBlockId?: string;
  newBlockId?: string;
  position?: { x: number; y: number; z: number };
  regionId?: string;
  rationale?: string;
}

export interface ReconstructionProject {
  projectId: string;
  name: string;
  referenceImages: ReferenceImageItem[];
  referenceAnalysis?: SceneAnalysis;
  neutralModel: Neutral3DModel;
  depthModel: DepthModel;
  minecraftVersion: '1.20' | '1.21';
  schematicKnowledge: ConstructionPattern[];
  candidateSolutions: CandidateSolution[];
  currentBuild: MinecraftBuild;
  renderResults: RenderResult[];
  comparisonResults: ComparisonResult[];
  agentReports: AgentReport[];
  decisions: ProjectDecision[];
  iterations: ReconstructionIteration[];
  userEdits: UserEdit[];
  activeTask?: {
    taskId: string;
    name: string;
    status: 'idle' | 'working' | 'complete' | 'failed';
    progressPercent: number;
    currentStep: string;
  };
  metadata: {
    createdAt: string;
    updatedAt: string;
    scale: number;
    provenanceSummary: {
      observedPercent: number;
      inferredPercent: number;
      generatedPercent: number;
    };
  };
}
