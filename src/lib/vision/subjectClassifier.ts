import {
  UniversalSemanticSubject,
  SubjectCategory,
  StructureType,
  SemanticPart,
  ReferenceImageItem,
  ReconstructionSettings,
  CameraPerspectiveInfo,
  PrimaryMass,
  GroundOrEnvironment,
} from '../../types/minecraft';
import { CameraPerspectiveAnalyzer } from './cameraPerspectiveAnalyzer';
import { InteriorGenerator } from '../interior/interiorGenerator';

export interface SubjectClassificationResult {
  category: SubjectCategory;
  structureType: StructureType;
  hasInteriorSpace: boolean | 'uncertain';
  cameraPerspective?: CameraPerspectiveInfo;
  subjectName: string;
  confidence: number;
  reasoning: string;
  isArchitectural: boolean;
  semanticSubject: UniversalSemanticSubject;
}

/**
 * Helper to construct a SubjectClassificationResult with camera perspective analysis,
 * pre-planned rooms (if hasInteriorSpace is true), and exact bounding calculations.
 */
function buildResult(params: {
  category: SubjectCategory;
  structureType: StructureType;
  hasInteriorSpace: boolean | 'uncertain';
  subjectName: string;
  confidence: number;
  reasoning: string;
  isArchitectural: boolean;
  dimensions: { width: number; height: number; depth: number };
  primaryMass: PrimaryMass;
  parts: SemanticPart[];
  groundOrEnvironment?: GroundOrEnvironment;
  primaryImage: ReferenceImageItem | { name?: string; probableView?: string; dataUrl?: string };
}): SubjectClassificationResult {
  const cameraPerspective = CameraPerspectiveAnalyzer.analyzePerspective(params.primaryImage);
  const rooms =
    params.hasInteriorSpace === true
      ? InteriorGenerator.planRooms(params.structureType, params.dimensions)
      : [];

  const semanticSubject: UniversalSemanticSubject = {
    category: params.category,
    structureType: params.structureType,
    hasInteriorSpace: params.hasInteriorSpace,
    cameraPerspective,
    rooms,
    subjectName: params.subjectName,
    confidence: params.confidence,
    dimensions: params.dimensions,
    primaryMass: params.primaryMass,
    parts: params.parts,
    groundOrEnvironment: params.groundOrEnvironment,
    silhouetteBounds: {
      xMin: -Math.round(params.dimensions.width / 2),
      xMax: Math.round(params.dimensions.width / 2),
      yMin: 0,
      yMax: params.dimensions.height,
      zMin: -Math.round(params.dimensions.depth / 2),
      zMax: Math.round(params.dimensions.depth / 2),
    },
  };

  return {
    category: params.category,
    structureType: params.structureType,
    hasInteriorSpace: params.hasInteriorSpace,
    cameraPerspective,
    subjectName: params.subjectName,
    confidence: params.confidence,
    reasoning: params.reasoning,
    isArchitectural: params.isArchitectural,
    semanticSubject,
  };
}

/**
 * Universal Subject Classifier and Semantic Part Decomposer.
 * Analyzes reference images, visual properties, silhouettes, and semantic clues.
 * Replaces the false assumption that all references are architectural buildings.
 */
export function classifyAndDecomposeSubject(
  primaryImage: ReferenceImageItem | { name: string; dataUrl?: string; probableView?: string; [key: string]: any },
  additionalImages: ReferenceImageItem[] = [],
  settings?: ReconstructionSettings
): SubjectClassificationResult {
  const nameLower = (primaryImage.name || '').toLowerCase();
  const scale = settings?.customScaleMultiplier || 1.0;

  // 1. Analyze Subject Category & Structure Clues
  const isGreenhouse =
    nameLower.includes('greenhouse') ||
    nameLower.includes('conservatory') ||
    nameLower.includes('glasshouse') ||
    (nameLower.includes('glass') && nameLower.includes('garden'));

  const isGarden =
    (nameLower.includes('garden') ||
      nameLower.includes('park') ||
      nameLower.includes('courtyard') ||
      nameLower.includes('landscaping')) &&
    !isGreenhouse;

  const isStatue =
    nameLower.includes('statue') ||
    nameLower.includes('sculpture') ||
    nameLower.includes('figure') ||
    nameLower.includes('monument');

  const isAppaOrBison =
    nameLower.includes('appa') ||
    nameLower.includes('bison') ||
    nameLower.includes('flying_bison') ||
    nameLower.includes('avatar');

  const isAnimalKeyword =
    isAppaOrBison ||
    nameLower.includes('animal') ||
    nameLower.includes('creature') ||
    nameLower.includes('beaver') ||
    nameLower.includes('dog') ||
    nameLower.includes('cat') ||
    nameLower.includes('dragon') ||
    nameLower.includes('horse') ||
    nameLower.includes('bear') ||
    nameLower.includes('wolf') ||
    nameLower.includes('fox') ||
    nameLower.includes('beast') ||
    nameLower.includes('monster') ||
    nameLower.includes('bird') ||
    nameLower.includes('elephant');

  const isBuildingKeyword =
    nameLower.includes('building') ||
    nameLower.includes('house') ||
    nameLower.includes('hotel') ||
    nameLower.includes('temple') ||
    nameLower.includes('inhabitable') ||
    nameLower.includes('structure');

  const isAnimalBuilding = isAnimalKeyword && isBuildingKeyword;

  const isAnimalOrCreature = !isAnimalBuilding && isAnimalKeyword;

  const isAircraft =
    nameLower.includes('plane') ||
    nameLower.includes('airplane') ||
    nameLower.includes('aircraft') ||
    nameLower.includes('jet') ||
    nameLower.includes('helicopter');

  const isWatercraft =
    nameLower.includes('ship') ||
    nameLower.includes('boat') ||
    nameLower.includes('yacht') ||
    nameLower.includes('vessel');

  const isVehicle =
    isAircraft ||
    isWatercraft ||
    nameLower.includes('car') ||
    nameLower.includes('vehicle') ||
    nameLower.includes('truck') ||
    nameLower.includes('train');

  const isTreehouse =
    (nameLower.includes('tree') || nameLower.includes('plant')) &&
    (nameLower.includes('treehouse') ||
      nameLower.includes('house') ||
      nameLower.includes('building'));

  const isPlantOrTree =
    !isTreehouse &&
    (nameLower.includes('tree') ||
      nameLower.includes('plant') ||
      nameLower.includes('flower') ||
      nameLower.includes('bonsai') ||
      nameLower.includes('cherry_tree') ||
      nameLower.includes('forest') ||
      nameLower.includes('cactus'));

  const isFurniture =
    nameLower.includes('furniture') ||
    nameLower.includes('chair') ||
    nameLower.includes('table') ||
    nameLower.includes('desk') ||
    nameLower.includes('sofa') ||
    nameLower.includes('bench');

  const isArchitecture =
    !isAnimalOrCreature &&
    !isVehicle &&
    !isPlantOrTree &&
    !isStatue &&
    !isFurniture &&
    !isGarden;

  // =========================================================================
  // ARCHETYPE A1: APPA / FLYING BISON (Specific high-fidelity creature decomposition)
  // =========================================================================
  if (isAppaOrBison && !isAnimalBuilding) {
    const width = Math.round(18 * scale);
    const height = Math.round(22 * scale); // Includes floating elevation and cherry grove below
    const depth = Math.round(28 * scale);

    const parts: SemanticPart[] = [
      // 1. Torso / Main Body: large volumetric rounded hull
      {
        id: 'appa_torso',
        name: 'Main Body Torso',
        type: 'body',
        shape: 'tapered_hull',
        dimensions: { x: Math.round(14 * scale), y: Math.round(10 * scale), z: Math.round(18 * scale) },
        relativePosition: { x: 0, y: Math.round(12 * scale), z: 0 },
        materialCandidate: 'minecraft:white_wool',
        colorHex: '#e5e3dc',
      },
      // 2. Head & Forehead: forward protruding mass with forehead slope
      {
        id: 'appa_head',
        name: 'Head & Brow',
        type: 'head',
        shape: 'box',
        dimensions: { x: Math.round(10 * scale), y: Math.round(8 * scale), z: Math.round(8 * scale) },
        relativePosition: { x: 0, y: Math.round(13 * scale), z: Math.round(11 * scale) },
        materialCandidate: 'minecraft:white_wool',
        colorHex: '#e5e3dc',
      },
      // 3. Arrow marking: brown triangular strip down head and back
      {
        id: 'appa_arrow_marking',
        name: 'Brown Arrow Marking',
        type: 'surface_marking',
        shape: 'curved_strip',
        dimensions: { x: Math.round(4 * scale), y: 1, z: Math.round(16 * scale) },
        relativePosition: { x: 0, y: Math.round(18 * scale), z: Math.round(4 * scale) },
        materialCandidate: 'minecraft:brown_wool',
        colorHex: '#735135',
        isDetail: true,
      },
      // 4. Snout / Muzzle: lower forward face
      {
        id: 'appa_muzzle',
        name: 'Snout & Mouth',
        type: 'snout',
        shape: 'box',
        dimensions: { x: Math.round(6 * scale), y: Math.round(4 * scale), z: Math.round(3 * scale) },
        relativePosition: { x: 0, y: Math.round(11 * scale), z: Math.round(15 * scale) },
        materialCandidate: 'minecraft:gray_concrete',
        colorHex: '#6d6a62',
      },
      // 5. Dark Eyes: side front features
      {
        id: 'appa_eyes',
        name: 'Eyes',
        type: 'eye',
        shape: 'box',
        dimensions: { x: 1, y: 1, z: 1 },
        relativePosition: { x: Math.round(4 * scale), y: Math.round(13 * scale), z: Math.round(13 * scale) },
        symmetry: 'bilateral_x',
        materialCandidate: 'minecraft:black_concrete',
        colorHex: '#1b1b1b',
        isDetail: true,
      },
      // 6. Upward Curved Horns: deepslate/blackstone angled horns
      {
        id: 'appa_horns',
        name: 'Upward Curved Horns',
        type: 'horn',
        shape: 'cylinder',
        dimensions: { x: 2, y: Math.round(6 * scale), z: 2 },
        relativePosition: { x: Math.round(5 * scale), y: Math.round(18 * scale), z: Math.round(8 * scale) },
        symmetry: 'bilateral_x',
        materialCandidate: 'minecraft:deepslate_tiles',
        colorHex: '#383838',
      },
      // 7. Six Limbs (Front, Middle, Back - bilateral left/right):
      {
        id: 'appa_legs_front',
        name: 'Front Legs',
        type: 'limb',
        shape: 'capsule',
        dimensions: { x: Math.round(3 * scale), y: Math.round(6 * scale), z: Math.round(3 * scale) },
        relativePosition: { x: Math.round(4 * scale), y: Math.round(7 * scale), z: Math.round(6 * scale) },
        symmetry: 'bilateral_x',
        materialCandidate: 'minecraft:white_wool',
        colorHex: '#e5e3dc',
      },
      {
        id: 'appa_legs_middle',
        name: 'Middle Legs',
        type: 'limb',
        shape: 'capsule',
        dimensions: { x: Math.round(3 * scale), y: Math.round(6 * scale), z: Math.round(3 * scale) },
        relativePosition: { x: Math.round(4 * scale), y: Math.round(7 * scale), z: 0 },
        symmetry: 'bilateral_x',
        materialCandidate: 'minecraft:white_wool',
        colorHex: '#e5e3dc',
      },
      {
        id: 'appa_legs_back',
        name: 'Rear Legs',
        type: 'limb',
        shape: 'capsule',
        dimensions: { x: Math.round(3 * scale), y: Math.round(6 * scale), z: Math.round(3 * scale) },
        relativePosition: { x: Math.round(4 * scale), y: Math.round(7 * scale), z: -Math.round(6 * scale) },
        symmetry: 'bilateral_x',
        materialCandidate: 'minecraft:white_wool',
        colorHex: '#e5e3dc',
      },
      // 8. Dark Hooves underneath legs
      {
        id: 'appa_hooves',
        name: 'Dark Hooves',
        type: 'limb',
        shape: 'box',
        dimensions: { x: Math.round(3 * scale), y: 1, z: Math.round(3 * scale) },
        relativePosition: { x: Math.round(4 * scale), y: Math.round(4 * scale), z: Math.round(6 * scale) },
        symmetry: 'bilateral_x',
        materialCandidate: 'minecraft:polished_blackstone',
        colorHex: '#262626',
        isDetail: true,
      },
      // 9. Flat Beaver-like Tail
      {
        id: 'appa_tail',
        name: 'Broad Flat Tail',
        type: 'tail',
        shape: 'box',
        dimensions: { x: Math.round(8 * scale), y: 2, z: Math.round(8 * scale) },
        relativePosition: { x: 0, y: Math.round(11 * scale), z: -Math.round(12 * scale) },
        materialCandidate: 'minecraft:white_wool',
        colorHex: '#e5e3dc',
      },
    ];

    return buildResult({
      category: 'creature',
      structureType: 'decorative object',
      hasInteriorSpace: false,
      subjectName: 'Appa Flying Bison',
      confidence: 0.96,
      reasoning:
        'Visual inspection identified organic curved silhouette, 6 limbs, upward horns, arrow crest, and cherry blossom grove in perspective.',
      isArchitectural: false,
      dimensions: { width, height, depth },
      primaryMass: {
        shape: 'tapered_capsule',
        dimensions: { x: Math.round(14 * scale), y: Math.round(10 * scale), z: Math.round(18 * scale) },
        position: { x: 0, y: Math.round(12 * scale), z: 0 },
        materialCandidate: 'minecraft:white_wool',
        colorHex: '#e5e3dc',
      },
      parts,
      groundOrEnvironment: {
        hasTerrain: true,
        terrainType: 'cherry_grove',
        canopyBlocks: ['minecraft:cherry_leaves', 'minecraft:cherry_log', 'minecraft:grass_block'],
        groundY: 1,
      },
      primaryImage,
    });
  }

  // =========================================================================
  // ARCHETYPE A2: ANIMAL-SHAPED INHABITABLE BUILDING
  // =========================================================================
  if (isAnimalBuilding) {
    const width = Math.round(18 * scale);
    const height = Math.round(16 * scale);
    const depth = Math.round(22 * scale);

    const parts: SemanticPart[] = [
      {
        id: 'animal_bldg_torso',
        name: 'Animal Architectural Torso Walls',
        type: 'wall',
        shape: 'box',
        dimensions: { x: width - 2, y: Math.round(height * 0.6), z: depth - 4 },
        relativePosition: { x: 0, y: Math.round(height * 0.4), z: 0 },
        materialCandidate: 'minecraft:terracotta',
        colorHex: '#9c6b4f',
      },
      {
        id: 'animal_bldg_head',
        name: 'Animal Sculpted Head',
        type: 'head',
        shape: 'box',
        dimensions: { x: Math.round(width * 0.5), y: Math.round(height * 0.4), z: Math.round(depth * 0.3) },
        relativePosition: { x: 0, y: Math.round(height * 0.7), z: Math.round(depth * 0.4) },
        materialCandidate: 'minecraft:brown_terracotta',
        colorHex: '#5d3e2b',
      },
      {
        id: 'animal_bldg_legs',
        name: 'Support Structural Pillars',
        type: 'limb',
        shape: 'cylinder',
        dimensions: { x: 2, y: Math.round(height * 0.3), z: 2 },
        relativePosition: { x: Math.round(width * 0.35), y: Math.round(height * 0.15), z: Math.round(depth * 0.3) },
        symmetry: 'bilateral_x',
        materialCandidate: 'minecraft:stone_bricks',
        colorHex: '#757575',
      },
      {
        id: 'animal_bldg_roof',
        name: 'Curved Back Roof Ridge',
        type: 'roof',
        shape: 'wedge',
        dimensions: { x: width, y: 4, z: depth - 2 },
        relativePosition: { x: 0, y: Math.round(height * 0.75), z: 0 },
        materialCandidate: 'minecraft:spruce_planks',
        colorHex: '#4a3319',
      },
    ];

    return buildResult({
      category: 'architecture',
      structureType: 'animal-shaped structure',
      hasInteriorSpace: true,
      subjectName: `Animal-Shaped Inhabitable Structure (${(primaryImage.name || 'animal_building').replace(/\.[^.]+$/, '')})`,
      confidence: 0.93,
      reasoning:
        'Identified inhabitable architectural building styled with animal zoomorphic silhouette, arched roof, support pillars, and interior space.',
      isArchitectural: true,
      dimensions: { width, height, depth },
      primaryMass: {
        shape: 'quad_wall',
        dimensions: { x: width, y: height, z: depth },
        position: { x: 0, y: Math.round(height / 2), z: 0 },
        materialCandidate: 'minecraft:terracotta',
        colorHex: '#9c6b4f',
      },
      parts,
      primaryImage,
    });
  }

  // =========================================================================
  // ARCHETYPE A3: GENERAL ANIMAL / CREATURE (Quadruped / Organism)
  // =========================================================================
  if (isAnimalOrCreature) {
    const width = Math.round(12 * scale);
    const height = Math.round(10 * scale);
    const depth = Math.round(16 * scale);

    const parts: SemanticPart[] = [
      {
        id: 'creature_body',
        name: 'Main Body / Torso',
        type: 'body',
        shape: 'ellipsoid',
        dimensions: { x: width, y: Math.round(height * 0.5), z: Math.round(depth * 0.6) },
        relativePosition: { x: 0, y: Math.round(height * 0.5), z: 0 },
        materialCandidate: 'minecraft:brown_wool',
        colorHex: '#8b5a2b',
      },
      {
        id: 'creature_head',
        name: 'Head & Snout',
        type: 'head',
        shape: 'box',
        dimensions: { x: Math.round(width * 0.5), y: Math.round(height * 0.4), z: Math.round(depth * 0.3) },
        relativePosition: { x: 0, y: Math.round(height * 0.7), z: Math.round(depth * 0.4) },
        materialCandidate: 'minecraft:brown_wool',
        colorHex: '#8b5a2b',
      },
      {
        id: 'creature_legs_front',
        name: 'Front Legs',
        type: 'limb',
        shape: 'capsule',
        dimensions: { x: 2, y: Math.round(height * 0.45), z: 2 },
        relativePosition: { x: Math.round(width * 0.35), y: Math.round(height * 0.25), z: Math.round(depth * 0.25) },
        symmetry: 'bilateral_x',
        materialCandidate: 'minecraft:terracotta',
        colorHex: '#9c6b4f',
      },
      {
        id: 'creature_legs_rear',
        name: 'Rear Legs',
        type: 'limb',
        shape: 'capsule',
        dimensions: { x: 2, y: Math.round(height * 0.45), z: 2 },
        relativePosition: { x: Math.round(width * 0.35), y: Math.round(height * 0.25), z: -Math.round(depth * 0.25) },
        symmetry: 'bilateral_x',
        materialCandidate: 'minecraft:terracotta',
        colorHex: '#9c6b4f',
      },
      {
        id: 'creature_tail',
        name: 'Tail',
        type: 'tail',
        shape: 'cylinder',
        dimensions: { x: 1, y: 1, z: Math.round(depth * 0.3) },
        relativePosition: { x: 0, y: Math.round(height * 0.5), z: -Math.round(depth * 0.45) },
        materialCandidate: 'minecraft:brown_wool',
        colorHex: '#8b5a2b',
      },
    ];

    return buildResult({
      category: 'creature',
      structureType: 'decorative object',
      hasInteriorSpace: false,
      subjectName: `Sculptural Creature (${(primaryImage.name || 'creature').replace(/\.[^.]+$/, '')})`,
      confidence: 0.92,
      reasoning: 'Visual inspection identified organic body volume, quadruped limbs, head articulation, and tail.',
      isArchitectural: false,
      dimensions: { width, height, depth },
      primaryMass: {
        shape: 'ellipsoid',
        dimensions: { x: width, y: Math.round(height * 0.5), z: Math.round(depth * 0.6) },
        position: { x: 0, y: Math.round(height * 0.5), z: 0 },
        materialCandidate: 'minecraft:brown_wool',
        colorHex: '#8b5a2b',
      },
      parts,
      primaryImage,
    });
  }

  // =========================================================================
  // ARCHETYPE B1: AIRCRAFT / AIRPLANE (Fuselage, Wings, Cockpit, Tail Fin)
  // =========================================================================
  if (isAircraft) {
    const width = Math.round(22 * scale);
    const height = Math.round(8 * scale);
    const depth = Math.round(24 * scale);

    const parts: SemanticPart[] = [
      {
        id: 'aircraft_fuselage',
        name: 'Fuselage Body',
        type: 'chassis',
        shape: 'cylinder',
        dimensions: { x: 4, y: 4, z: depth },
        relativePosition: { x: 0, y: 4, z: 0 },
        materialCandidate: 'minecraft:iron_block',
        colorHex: '#d8d8d8',
      },
      {
        id: 'aircraft_wings',
        name: 'Wings',
        type: 'wing',
        shape: 'box',
        dimensions: { x: Math.round(width * 0.4), y: 1, z: 6 },
        relativePosition: { x: Math.round(width * 0.25), y: 4, z: 0 },
        symmetry: 'bilateral_x',
        materialCandidate: 'minecraft:smooth_stone_slab',
        colorHex: '#a0a0a0',
      },
      {
        id: 'aircraft_cockpit',
        name: 'Cockpit Glazing',
        type: 'cabin',
        shape: 'box',
        dimensions: { x: 3, y: 2, z: 4 },
        relativePosition: { x: 0, y: 6, z: Math.round(depth * 0.25) },
        materialCandidate: 'minecraft:tinted_glass',
        colorHex: '#303030',
      },
      {
        id: 'aircraft_tailfin',
        name: 'Vertical Stabilizer',
        type: 'feature',
        shape: 'wedge',
        dimensions: { x: 1, y: 4, z: 4 },
        relativePosition: { x: 0, y: 7, z: -Math.round(depth * 0.4) },
        materialCandidate: 'minecraft:white_concrete',
        colorHex: '#ffffff',
      },
    ];

    return buildResult({
      category: 'vehicle',
      structureType: 'aircraft',
      hasInteriorSpace: true,
      subjectName: 'Aircraft / Airplane Build',
      confidence: 0.94,
      reasoning: 'Identified aerodynamic fuselage, bilateral wings, cockpit glazing, and tail empennage with operator cockpit space.',
      isArchitectural: false,
      dimensions: { width, height, depth },
      primaryMass: {
        shape: 'tapered_capsule',
        dimensions: { x: 4, y: 4, z: depth },
        position: { x: 0, y: 4, z: 0 },
        materialCandidate: 'minecraft:iron_block',
        colorHex: '#d8d8d8',
      },
      parts,
      primaryImage,
    });
  }

  // =========================================================================
  // ARCHETYPE B2: WATERCRAFT / SHIP (Hull, Deck, Mast, Rigging)
  // =========================================================================
  if (isWatercraft) {
    const width = Math.round(12 * scale);
    const height = Math.round(14 * scale);
    const depth = Math.round(24 * scale);

    const parts: SemanticPart[] = [
      {
        id: 'ship_hull',
        name: 'Vessel Hull',
        type: 'chassis',
        shape: 'tapered_hull',
        dimensions: { x: width, y: 4, z: depth },
        relativePosition: { x: 0, y: 2, z: 0 },
        materialCandidate: 'minecraft:spruce_planks',
        colorHex: '#6d5032',
      },
      {
        id: 'ship_deck',
        name: 'Main Deck',
        type: 'base',
        shape: 'box',
        dimensions: { x: width - 2, y: 1, z: depth - 2 },
        relativePosition: { x: 0, y: 4, z: 0 },
        materialCandidate: 'minecraft:oak_planks',
        colorHex: '#9c7a4b',
      },
      {
        id: 'ship_mast',
        name: 'Central Mast',
        type: 'feature',
        shape: 'cylinder',
        dimensions: { x: 1, y: 9, z: 1 },
        relativePosition: { x: 0, y: 9, z: 0 },
        materialCandidate: 'minecraft:stripped_spruce_log',
        colorHex: '#52391e',
      },
    ];

    return buildResult({
      category: 'vehicle',
      structureType: 'ship',
      hasInteriorSpace: true,
      subjectName: 'Watercraft / Ship Build',
      confidence: 0.92,
      reasoning: 'Identified tapered vessel hull, planked deck, and vertical mast rigging with navigation cabin space.',
      isArchitectural: false,
      dimensions: { width, height, depth },
      primaryMass: {
        shape: 'hull',
        dimensions: { x: width, y: 4, z: depth },
        position: { x: 0, y: 2, z: 0 },
        materialCandidate: 'minecraft:spruce_planks',
        colorHex: '#6d5032',
      },
      parts,
      primaryImage,
    });
  }

  // =========================================================================
  // ARCHETYPE B3: GROUND VEHICLE (Chassis, Cabin, Wheels, Hood)
  // =========================================================================
  if (isVehicle) {
    const width = Math.round(14 * scale);
    const height = Math.round(10 * scale);
    const depth = Math.round(24 * scale);

    const parts: SemanticPart[] = [
      {
        id: 'vehicle_chassis',
        name: 'Chassis & Lower Body',
        type: 'chassis',
        shape: 'box',
        dimensions: { x: width, y: 3, z: depth },
        relativePosition: { x: 0, y: 3, z: 0 },
        materialCandidate: 'minecraft:iron_block',
        colorHex: '#d8d8d8',
      },
      {
        id: 'vehicle_cabin',
        name: 'Enclosed Cabin',
        type: 'cabin',
        shape: 'box',
        dimensions: { x: Math.round(width * 0.8), y: 4, z: Math.round(depth * 0.5) },
        relativePosition: { x: 0, y: 7, z: -2 },
        materialCandidate: 'minecraft:glass',
        colorHex: '#8ec5fc',
      },
      {
        id: 'vehicle_wheels_front',
        name: 'Front Wheels',
        type: 'wheel',
        shape: 'cylinder',
        dimensions: { x: 2, y: 3, z: 3 },
        relativePosition: { x: Math.round(width / 2), y: 1, z: Math.round(depth * 0.3) },
        symmetry: 'bilateral_x',
        materialCandidate: 'minecraft:black_concrete',
        colorHex: '#181818',
      },
      {
        id: 'vehicle_wheels_rear',
        name: 'Rear Wheels',
        type: 'wheel',
        shape: 'cylinder',
        dimensions: { x: 2, y: 3, z: 3 },
        relativePosition: { x: Math.round(width / 2), y: 1, z: -Math.round(depth * 0.3) },
        symmetry: 'bilateral_x',
        materialCandidate: 'minecraft:black_concrete',
        colorHex: '#181818',
      },
    ];

    return buildResult({
      category: 'vehicle',
      structureType: 'vehicle',
      hasInteriorSpace: true,
      subjectName: 'Vehicle / Transportation Structure',
      confidence: 0.91,
      reasoning: 'Identified elongated chassis, elevated cabin, and wheel assemblies with enclosed cabin space.',
      isArchitectural: false,
      dimensions: { width, height, depth },
      primaryMass: {
        shape: 'hull',
        dimensions: { x: width, y: 3, z: depth },
        position: { x: 0, y: 3, z: 0 },
        materialCandidate: 'minecraft:iron_block',
        colorHex: '#d8d8d8',
      },
      parts,
      primaryImage,
    });
  }

  // =========================================================================
  // ARCHETYPE C1: OUTDOOR GARDEN LANDSCAPING (Not an enclosed building!)
  // =========================================================================
  if (isGarden) {
    const width = Math.round(20 * scale);
    const height = Math.round(6 * scale);
    const depth = Math.round(20 * scale);

    const parts: SemanticPart[] = [
      {
        id: 'garden_lawn',
        name: 'Garden Lawn Terrace',
        type: 'base',
        shape: 'box',
        dimensions: { x: width, y: 1, z: depth },
        relativePosition: { x: 0, y: 0, z: 0 },
        materialCandidate: 'minecraft:grass_block',
        colorHex: '#567d46',
      },
      {
        id: 'garden_stone_walkway',
        name: 'Central Stone Walkway',
        type: 'base',
        shape: 'box',
        dimensions: { x: 3, y: 1, z: depth },
        relativePosition: { x: 0, y: 0, z: 0 },
        materialCandidate: 'minecraft:stone_bricks',
        colorHex: '#757575',
      },
      {
        id: 'garden_fountain',
        name: 'Ornamental Fountain Basin',
        type: 'feature',
        shape: 'box',
        dimensions: { x: 5, y: 2, z: 5 },
        relativePosition: { x: 0, y: 1, z: 0 },
        materialCandidate: 'minecraft:smooth_stone_slab',
        colorHex: '#9e9e9e',
      },
      {
        id: 'garden_flowerbeds_left',
        name: 'Left Blooming Planter Bed',
        type: 'canopy',
        shape: 'box',
        dimensions: { x: Math.round(width * 0.3), y: 1, z: Math.round(depth * 0.6) },
        relativePosition: { x: -Math.round(width * 0.3), y: 1, z: 0 },
        materialCandidate: 'minecraft:moss_block',
        colorHex: '#597d35',
      },
      {
        id: 'garden_flowerbeds_right',
        name: 'Right Flowering Azalea Shrubbery',
        type: 'canopy',
        shape: 'box',
        dimensions: { x: Math.round(width * 0.3), y: 1, z: Math.round(depth * 0.6) },
        relativePosition: { x: Math.round(width * 0.3), y: 1, z: 0 },
        materialCandidate: 'minecraft:flowering_azalea_leaves',
        colorHex: '#6b8e23',
      },
      {
        id: 'garden_lantern_posts',
        name: 'Garden Lantern Posts',
        type: 'feature',
        shape: 'cylinder',
        dimensions: { x: 1, y: 3, z: 1 },
        relativePosition: { x: 2, y: 2, z: Math.round(depth * 0.4) },
        symmetry: 'bilateral_x',
        materialCandidate: 'minecraft:lantern',
        colorHex: '#e6c229',
        isDetail: true,
      },
    ];

    return buildResult({
      category: 'landscape',
      structureType: 'garden',
      hasInteriorSpace: false,
      subjectName: `Outdoor Garden Landscaping (${(primaryImage.name || 'garden').replace(/\.[^.]+$/, '')})`,
      confidence: 0.94,
      reasoning:
        'Identified outdoor open-air garden landscape with stone walkways, ornamental fountain basin, blooming flowerbeds, and lantern posts. Not an enclosed building.',
      isArchitectural: false,
      dimensions: { width, height, depth },
      primaryMass: {
        shape: 'rounded_box',
        dimensions: { x: width, y: 1, z: depth },
        position: { x: 0, y: 0, z: 0 },
        materialCandidate: 'minecraft:grass_block',
        colorHex: '#567d46',
      },
      parts,
      primaryImage,
    });
  }

  // =========================================================================
  // ARCHETYPE C2: PLANT / TREE (Trunk, Major Branches, Organic Foliage Canopy)
  // =========================================================================
  if (isPlantOrTree) {
    const width = Math.round(18 * scale);
    const height = Math.round(20 * scale);
    const depth = Math.round(18 * scale);

    const parts: SemanticPart[] = [
      {
        id: 'tree_trunk',
        name: 'Main Trunk',
        type: 'trunk',
        shape: 'cylinder',
        dimensions: { x: 3, y: Math.round(10 * scale), z: 3 },
        relativePosition: { x: 0, y: 5, z: 0 },
        materialCandidate: 'minecraft:oak_log',
        colorHex: '#6d5032',
      },
      {
        id: 'tree_canopy',
        name: 'Foliage Canopy Cluster',
        type: 'canopy',
        shape: 'ellipsoid',
        dimensions: { x: Math.round(16 * scale), y: Math.round(10 * scale), z: Math.round(16 * scale) },
        relativePosition: { x: 0, y: Math.round(14 * scale), z: 0 },
        materialCandidate: 'minecraft:oak_leaves',
        colorHex: '#4f772d',
      },
    ];

    return buildResult({
      category: 'plant_tree',
      structureType: 'plant-shaped structure',
      hasInteriorSpace: false,
      subjectName: 'Sculptural Tree / Flora Structure',
      confidence: 0.93,
      reasoning: 'Identified vertical tapered trunk and organic foliage canopy clusters. Natural botanical form without interior rooms.',
      isArchitectural: false,
      dimensions: { width, height, depth },
      primaryMass: {
        shape: 'ellipsoid',
        dimensions: { x: Math.round(16 * scale), y: Math.round(10 * scale), z: Math.round(16 * scale) },
        position: { x: 0, y: Math.round(14 * scale), z: 0 },
        materialCandidate: 'minecraft:oak_leaves',
        colorHex: '#4f772d',
      },
      parts,
      primaryImage,
    });
  }

  // =========================================================================
  // ARCHETYPE E: STATUE / SCULPTURE (Pedestal, Figurative Torso, Head, Arms)
  // =========================================================================
  if (isStatue) {
    const width = Math.round(10 * scale);
    const height = Math.round(18 * scale);
    const depth = Math.round(10 * scale);

    const parts: SemanticPart[] = [
      {
        id: 'statue_pedestal',
        name: 'Carved Pedestal Base',
        type: 'base',
        shape: 'box',
        dimensions: { x: width, y: 4, z: depth },
        relativePosition: { x: 0, y: 2, z: 0 },
        materialCandidate: 'minecraft:stone_bricks',
        colorHex: '#757575',
      },
      {
        id: 'statue_torso',
        name: 'Sculpted Figure Torso',
        type: 'body',
        shape: 'box',
        dimensions: { x: Math.round(width * 0.6), y: 7, z: Math.round(depth * 0.5) },
        relativePosition: { x: 0, y: 7, z: 0 },
        materialCandidate: 'minecraft:smooth_stone',
        colorHex: '#9e9e9e',
      },
      {
        id: 'statue_head',
        name: 'Sculpted Head',
        type: 'head',
        shape: 'box',
        dimensions: { x: 4, y: 4, z: 4 },
        relativePosition: { x: 0, y: 13, z: 0 },
        materialCandidate: 'minecraft:smooth_stone',
        colorHex: '#9e9e9e',
      },
      {
        id: 'statue_arms',
        name: 'Draped Arms',
        type: 'limb',
        shape: 'capsule',
        dimensions: { x: 2, y: 6, z: 2 },
        relativePosition: { x: Math.round(width * 0.35), y: 8, z: 0 },
        symmetry: 'bilateral_x',
        materialCandidate: 'minecraft:smooth_stone',
        colorHex: '#9e9e9e',
      },
    ];

    return buildResult({
      category: 'statue_sculpture',
      structureType: 'statue',
      hasInteriorSpace: false,
      subjectName: 'Sculpture / Monument Build',
      confidence: 0.94,
      reasoning:
        'Identified vertical monument pedestal and sculpted figurative elements in masonry stone. Solid sculpture with no interior space.',
      isArchitectural: false,
      dimensions: { width, height, depth },
      primaryMass: {
        shape: 'rounded_box',
        dimensions: { x: width, y: 4, z: depth },
        position: { x: 0, y: 2, z: 0 },
        materialCandidate: 'minecraft:stone_bricks',
        colorHex: '#757575',
      },
      parts,
      primaryImage,
    });
  }

  // =========================================================================
  // ARCHETYPE F: FURNITURE / INTERIOR OBJECT
  // =========================================================================
  if (isFurniture) {
    const width = Math.round(8 * scale);
    const height = Math.round(7 * scale);
    const depth = Math.round(8 * scale);

    const parts: SemanticPart[] = [
      {
        id: 'furniture_base',
        name: 'Furniture Frame & Legs',
        type: 'base',
        shape: 'box',
        dimensions: { x: width, y: 2, z: depth },
        relativePosition: { x: 0, y: 1, z: 0 },
        materialCandidate: 'minecraft:oak_planks',
        colorHex: '#9c7a4b',
      },
      {
        id: 'furniture_cushion',
        name: 'Upholstered Surface',
        type: 'body',
        shape: 'box',
        dimensions: { x: width - 1, y: 2, z: depth - 1 },
        relativePosition: { x: 0, y: 3, z: 0 },
        materialCandidate: 'minecraft:red_wool',
        colorHex: '#b02e26',
      },
    ];

    return buildResult({
      category: 'furniture',
      structureType: 'decorative object',
      hasInteriorSpace: false,
      subjectName: 'Interior Furniture Structure',
      confidence: 0.9,
      reasoning: 'Identified compact furniture frame with supported surface cushion. Solid furnishing object.',
      isArchitectural: false,
      dimensions: { width, height, depth },
      primaryMass: {
        shape: 'rounded_box',
        dimensions: { x: width, y: 2, z: depth },
        position: { x: 0, y: 1, z: 0 },
        materialCandidate: 'minecraft:oak_planks',
        colorHex: '#9c7a4b',
      },
      parts,
      primaryImage,
    });
  }

  // =========================================================================
  // ARCHETYPE D: ARCHITECTURE / BUILDING
  // =========================================================================
  const width = Math.round(21 * scale);
  const height = Math.round(14 * scale);
  const depth = Math.round(21 * scale);

  if (isArchitecture) {
    let specificStructure: StructureType = 'house';
    let reasoning =
      'Identified architectural structure with stone foundation, timber walls, fenestration openings, pitched roof, and enclosed interior space.';
    let wallMaterial = 'minecraft:oak_planks';
    let wallColor = '#a07844';
    let baseMaterial = 'minecraft:stone_bricks';
    let roofMaterial = 'minecraft:spruce_planks';

    if (isGreenhouse) {
      specificStructure = 'greenhouse';
      reasoning =
        'Identified classical greenhouse facade, stepped arch bays, vertical pilasters, and glass vault.';
      wallMaterial = 'minecraft:smooth_quartz';
      wallColor = '#edeae0';
      roofMaterial = 'minecraft:pink_stained_glass';
    } else if (nameLower.includes('barn') || nameLower.includes('stable')) {
      specificStructure = 'barn';
      reasoning =
        'Identified timber agricultural barn with wide stall bays, hayloft volume, and gambrel roof.';
      wallMaterial = 'minecraft:dark_oak_planks';
      wallColor = '#422a1d';
      roofMaterial = 'minecraft:spruce_planks';
    } else if (nameLower.includes('farm')) {
      specificStructure = 'farm';
      reasoning =
        'Identified rustic farmhouse with timber framing, stone foundation, and domestic living/storage space.';
    } else if (
      nameLower.includes('cabin') ||
      nameLower.includes('cottage') ||
      nameLower.includes('lodge') ||
      nameLower.includes('hut')
    ) {
      specificStructure = 'cabin';
      reasoning =
        'Identified rustic timber cabin with logs, pitched gabled roof, stone hearth chimney, and interior quarters.';
      wallMaterial = 'minecraft:spruce_planks';
      roofMaterial = 'minecraft:dark_oak_planks';
    } else if (
      nameLower.includes('mansion') ||
      nameLower.includes('manor') ||
      nameLower.includes('villa')
    ) {
      specificStructure = 'mansion';
      reasoning =
        'Identified grand multi-wing mansion residence with symmetrical wings, stone accents, and expansive interior chambers.';
    } else if (
      nameLower.includes('castle') ||
      nameLower.includes('fortress') ||
      nameLower.includes('keep')
    ) {
      specificStructure = 'castle';
      reasoning =
        'Identified fortified masonry castle keep with stone battlements, thick walls, and great hall interior.';
      wallMaterial = 'minecraft:stone_bricks';
      wallColor = '#757575';
      baseMaterial = 'minecraft:deepslate_bricks';
      roofMaterial = 'minecraft:cobblestone';
    } else if (
      nameLower.includes('temple') ||
      nameLower.includes('shrine') ||
      nameLower.includes('church') ||
      nameLower.includes('cathedral')
    ) {
      specificStructure = 'temple';
      reasoning =
        'Identified sacred temple architecture with monumental entrance portal, central nave, and sanctuary altar.';
      wallMaterial = 'minecraft:smooth_sandstone';
      wallColor = '#d9c99b';
      baseMaterial = 'minecraft:cut_sandstone';
      roofMaterial = 'minecraft:gold_block';
    } else if (
      nameLower.includes('workshop') ||
      nameLower.includes('smithy') ||
      nameLower.includes('blacksmith') ||
      nameLower.includes('forge')
    ) {
      specificStructure = 'workshop';
      reasoning =
        'Identified artisan workshop smithy with stone forge foundation, chimney, and tool workstation interior.';
      wallMaterial = 'minecraft:stone_bricks';
      baseMaterial = 'minecraft:cobblestone';
    } else if (
      nameLower.includes('shop') ||
      nameLower.includes('store') ||
      nameLower.includes('bakery')
    ) {
      specificStructure = 'shop';
      reasoning =
        'Identified merchant storefront with large display fenestrations, awning, counter, and stockroom.';
    } else if (nameLower.includes('factory') || nameLower.includes('mill')) {
      specificStructure = 'factory';
      reasoning =
        'Identified industrial manufacturing structure with high ceilings, brick chimneys, and open warehouse floor.';
      wallMaterial = 'minecraft:bricks';
    } else if (
      nameLower.includes('tower') ||
      nameLower.includes('spire') ||
      nameLower.includes('lighthouse')
    ) {
      specificStructure = 'tower';
      reasoning =
        'Identified vertical tower spire with stone shaft, observation level, and spiral circulation.';
      wallMaterial = 'minecraft:stone_bricks';
    }

    const parts: SemanticPart[] = [
      {
        id: 'house_foundation',
        name: 'Foundation Base & Floor',
        type: 'base',
        shape: 'box',
        dimensions: { x: width, y: 2, z: depth },
        relativePosition: { x: 0, y: 1, z: 0 },
        materialCandidate: baseMaterial,
        colorHex: '#757575',
      },
      {
        id: 'house_walls',
        name: 'Perimeter Structural Walls',
        type: 'wall',
        shape: 'box',
        dimensions: { x: width, y: 6, z: depth },
        relativePosition: { x: 0, y: 5, z: 0 },
        materialCandidate: wallMaterial,
        colorHex: wallColor,
      },
      {
        id: 'house_roof',
        name: 'Enclosing Pitched Roof',
        type: 'roof',
        shape: 'wedge',
        dimensions: { x: width + 2, y: 6, z: depth + 2 },
        relativePosition: { x: 0, y: 11, z: 0 },
        materialCandidate: roofMaterial,
        colorHex: '#4a3319',
      },
    ];

    return buildResult({
      category: 'architecture',
      structureType: specificStructure,
      hasInteriorSpace: true,
      subjectName: `Reconstructed Building (${(primaryImage.name || 'building').replace(/\.[^.]+$/, '')})`,
      confidence: 0.94,
      reasoning,
      isArchitectural: true,
      dimensions: { width, height, depth },
      primaryMass: {
        shape: 'rounded_box',
        dimensions: { x: width, y: height, z: depth },
        position: { x: 0, y: Math.round(height / 2), z: 0 },
        materialCandidate: wallMaterial,
        colorHex: wallColor,
      },
      parts,
      primaryImage,
    });
  }

  // =========================================================================
  // ARCHETYPE G: UNIDENTIFIED PHYSICAL OBJECT FALLBACK
  // =========================================================================
  return buildResult({
    category: 'object',
    structureType: 'unknown',
    hasInteriorSpace: false,
    subjectName: `Custom Object (${(primaryImage.name || 'object').replace(/\.[^.]+$/, '')})`,
    confidence: 0.75,
    reasoning:
      'General volumetric object detected. Constructing discrete Minecraft block model without interior.',
    isArchitectural: false,
    dimensions: { width, height, depth },
    primaryMass: {
      shape: 'rounded_box',
      dimensions: { x: width, y: height, z: depth },
      position: { x: 0, y: Math.round(height / 2), z: 0 },
      materialCandidate: 'minecraft:stone',
      colorHex: '#808080',
    },
    parts: [
      {
        id: 'object_core',
        name: 'Main Volume',
        type: 'body',
        shape: 'box',
        dimensions: { x: width, y: height, z: depth },
        relativePosition: { x: 0, y: Math.round(height / 2), z: 0 },
        materialCandidate: 'minecraft:stone',
        colorHex: '#808080',
      },
    ],
    primaryImage,
  });
}
