import { SceneAnalysis, MinecraftBuild } from '../types/minecraft.ts';
import { voxelizeSceneAnalysis } from './voxelizer.ts';
import { analyzeReferenceArchitecture } from './vision/architecturalAnalyzer.ts';
import { buildMinecraftFromProxy } from './reconstruction/proxyBuilder.ts';

export interface PresetBuilding {
  id: string;
  name: string;
  category: string;
  style: string;
  description: string;
  dimensions: { width: number; height: number; depth: number };
  badgeColor: string;
  sceneAnalysis: SceneAnalysis;
}

export const PRESET_BUILDINGS: PresetBuilding[] = [
  {
    id: 'glass_garden_conservatory',
    name: 'Glass Garden Conservatory',
    category: 'Botanical & Glass',
    style: 'Art Nouveau Glasshouse & Conservatory',
    description: 'Authentic 3-bay symmetrical facade with stepped quartz arches, central copper door, vaulted pink-tinted glass canopy, climbing facade vines, raised flower beds, and conifer trees.',
    dimensions: { width: 21, height: 13, depth: 19 },
    badgeColor: 'border-emerald-500/30 text-emerald-300',
    sceneAnalysis: {
      structureType: 'Glass Conservatory Pavilion',
      style: 'Glass Garden',
      archetype: 'conservatory_glass_garden',
      estimatedDimensions: { width: 21, height: 13, depth: 19 },
      cameraPerspective: 'ground_front',
      confidence: {
        overall: 0.96,
        front: 0.98,
        roof: 0.95,
        sides: 0.92,
        rear: 0.89,
        materials: 0.97,
      },
      hasVegetation: true,
      hasGardenBeds: true,
      hasPathway: true,
      hasArchedRibs: true,
      hasGlassRoof: true,
      paletteRecommendation: {
        walls: 'smooth_quartz',
        roof: 'pink_stained_glass',
        trim: 'smooth_quartz',
        windows: 'light_blue_stained_glass',
        foundation: 'stone_bricks',
        details: 'stone_brick_slab',
        doors: 'copper_door',
      },
      floors: [
        { level: 0, height: 5, wallMaterial: 'smooth_quartz', floorMaterial: 'smooth_stone' },
      ],
      roof: {
        shape: 'mansard',
        pitch: 1.15,
        overhang: 0,
        primaryMaterial: 'pink_stained_glass',
        trimMaterial: 'smooth_quartz',
      },
      openings: [
        { type: 'archway', wall: 'front', floorLevel: 0, xOffsetRatio: 0, widthRatio: 0.25, heightRatio: 0.7 },
        { type: 'window', wall: 'front', floorLevel: 0, xOffsetRatio: -0.33, widthRatio: 0.25, heightRatio: 0.65 },
        { type: 'window', wall: 'front', floorLevel: 0, xOffsetRatio: 0.33, widthRatio: 0.25, heightRatio: 0.65 },
      ],
      columns: [
        { position: 'facade_spaced', material: 'smooth_quartz' },
      ],
      decorativeFeatures: [
        'Stepped quartz arches',
        'Vaulted glass canopy with continuing ribs',
        'Central entrance copper door',
        'Raised flower beds with peonies and lilacs',
        'Left facade climbing leafy vines',
        'Flanking conifer spruce trees',
      ],
    },
  },
  {
    id: 'medieval_tavern',
    name: 'Medieval Watchtower & Tavern',
    category: 'Medieval & Fantasy',
    style: '14th-century European half-timbered architecture',
    description: 'Cobblestone ground foundation with spruce timber framing, cantilevered upper floor, and steep stone brick gable roof.',
    dimensions: { width: 11, height: 16, depth: 11 },
    badgeColor: 'border-amber-500/30 text-amber-300',
    sceneAnalysis: {
      structureType: 'watchtower_tavern',
      style: 'Medieval European',
      estimatedDimensions: { width: 11, height: 16, depth: 11 },
      cameraPerspective: 'three_quarter_elevated',
      confidence: {
        overall: 0.94,
        front: 0.96,
        roof: 0.92,
        sides: 0.88,
        rear: 0.65,
        materials: 0.95,
      },
      paletteRecommendation: {
        walls: 'oak_planks',
        foundation: 'cobblestone',
        trim: 'spruce_log',
        roof: 'stone_bricks',
        windows: 'glass_pane',
        doors: 'oak_door',
        details: 'lantern',
      },
      floors: [
        { level: 1, height: 4, wallMaterial: 'cobblestone', floorMaterial: 'cobblestone' },
        { level: 2, height: 4, wallMaterial: 'oak_planks', floorMaterial: 'spruce_planks' },
        { level: 3, height: 4, wallMaterial: 'oak_planks', floorMaterial: 'spruce_planks' },
      ],
      roof: {
        shape: 'gable',
        pitch: 1.2,
        overhang: 1,
        primaryMaterial: 'stone_bricks',
        trimMaterial: 'spruce_planks',
      },
      openings: [
        { type: 'door', wall: 'front', floorLevel: 1, xOffsetRatio: 0, widthRatio: 0.15, heightRatio: 0.5 },
        { type: 'window', wall: 'front', floorLevel: 2, xOffsetRatio: -0.25, widthRatio: 0.15, heightRatio: 0.4 },
        { type: 'window', wall: 'front', floorLevel: 2, xOffsetRatio: 0.25, widthRatio: 0.15, heightRatio: 0.4 },
      ],
      columns: [
        { position: 'corners', material: 'spruce_log' },
      ],
      decorativeFeatures: ['Corner lanterns', 'Chimney stonework', 'Overhanging eaves'],
    },
  },
  {
    id: 'japanese_pagoda',
    name: 'Japanese Pagoda (5-Tier Shrine)',
    category: 'East Asian',
    style: 'Traditional Edo-period tiered wooden temple',
    description: 'Flared curved eaves with dark oak pillars, deepslate tile accents, and an elevated sacred spire.',
    dimensions: { width: 13, height: 22, depth: 13 },
    badgeColor: 'border-red-500/30 text-red-300',
    sceneAnalysis: {
      structureType: 'pagoda',
      style: 'Traditional Japanese',
      estimatedDimensions: { width: 13, height: 22, depth: 13 },
      cameraPerspective: 'three_quarter_elevated',
      confidence: {
        overall: 0.91,
        front: 0.94,
        roof: 0.95,
        sides: 0.89,
        rear: 0.72,
        materials: 0.92,
      },
      paletteRecommendation: {
        walls: 'dark_oak_planks',
        foundation: 'deepslate_tiles',
        trim: 'dark_oak_planks',
        roof: 'deepslate_tiles',
        windows: 'glass_pane',
        doors: 'dark_oak_door',
        details: 'lantern',
      },
      floors: [
        { level: 1, height: 4, wallMaterial: 'dark_oak_planks', floorMaterial: 'spruce_planks' },
        { level: 2, height: 4, wallMaterial: 'dark_oak_planks', floorMaterial: 'spruce_planks' },
      ],
      roof: {
        shape: 'pagoda_curved',
        pitch: 1.5,
        overhang: 2,
        primaryMaterial: 'deepslate_tiles',
        trimMaterial: 'dark_oak_planks',
      },
      openings: [
        { type: 'door', wall: 'front', floorLevel: 1, xOffsetRatio: 0, widthRatio: 0.2, heightRatio: 0.5 },
      ],
      columns: [
        { position: 'corners', material: 'dark_oak_log' },
      ],
      decorativeFeatures: ['Curved corner eaves', 'Spire with lantern', 'Raised timber balustrade'],
    },
  },
  {
    id: 'modern_villa',
    name: 'Modern Glass Cantilever Villa',
    category: 'Contemporary',
    style: 'Bauhaus-inspired minimalist geometric architecture',
    description: 'Smooth white quartz facades with floor-to-ceiling panoramic glass panels, cantilevered balcony, and flat rooftop lounge.',
    dimensions: { width: 15, height: 11, depth: 13 },
    badgeColor: 'border-sky-500/30 text-sky-300',
    sceneAnalysis: {
      structureType: 'modern_villa',
      style: 'Modern Minimalist',
      estimatedDimensions: { width: 15, height: 11, depth: 13 },
      cameraPerspective: 'ground_front',
      confidence: {
        overall: 0.96,
        front: 0.98,
        roof: 0.93,
        sides: 0.94,
        rear: 0.78,
        materials: 0.97,
      },
      paletteRecommendation: {
        walls: 'smooth_quartz',
        foundation: 'smooth_stone',
        trim: 'dark_oak_planks',
        roof: 'smooth_quartz',
        windows: 'glass_pane',
        doors: 'dark_oak_door',
        details: 'sea_lantern',
      },
      floors: [
        { level: 1, height: 4, wallMaterial: 'smooth_quartz', floorMaterial: 'smooth_stone' },
        { level: 2, height: 4, wallMaterial: 'smooth_quartz', floorMaterial: 'dark_oak_planks' },
      ],
      roof: {
        shape: 'flat',
        pitch: 0,
        overhang: 0,
        primaryMaterial: 'smooth_quartz',
        trimMaterial: 'glass_pane',
      },
      openings: [
        { type: 'window', wall: 'front', floorLevel: 1, xOffsetRatio: -0.2, widthRatio: 0.3, heightRatio: 0.7 },
        { type: 'window', wall: 'front', floorLevel: 2, xOffsetRatio: 0.1, widthRatio: 0.4, heightRatio: 0.7 },
        { type: 'door', wall: 'front', floorLevel: 1, xOffsetRatio: 0.35, widthRatio: 0.15, heightRatio: 0.5 },
      ],
      columns: [
        { position: 'facade_spaced', material: 'smooth_quartz' },
      ],
      decorativeFeatures: ['Rooftop glass parapet', 'Under-eave ambient lighting', 'Recessed entryway'],
    },
  },
  {
    id: 'gothic_arch',
    name: 'Gothic Cathedral Arch & Spire',
    category: 'Gothic',
    style: '13th-century High Gothic religious architecture',
    description: 'Flying buttresses of stone bricks, pointed arch windows, stained glass details, and soaring vertical roof pitch.',
    dimensions: { width: 13, height: 20, depth: 15 },
    badgeColor: 'border-purple-500/30 text-purple-300',
    sceneAnalysis: {
      structureType: 'cathedral',
      style: 'Gothic',
      estimatedDimensions: { width: 13, height: 20, depth: 15 },
      cameraPerspective: 'three_quarter_elevated',
      confidence: {
        overall: 0.89,
        front: 0.92,
        roof: 0.88,
        sides: 0.84,
        rear: 0.62,
        materials: 0.91,
      },
      paletteRecommendation: {
        walls: 'stone_bricks',
        foundation: 'cobblestone',
        trim: 'chiseled_stone_bricks',
        roof: 'deepslate_tiles',
        windows: 'glass_pane',
        doors: 'dark_oak_door',
        details: 'stone_brick_wall',
      },
      floors: [
        { level: 1, height: 5, wallMaterial: 'stone_bricks', floorMaterial: 'smooth_stone' },
        { level: 2, height: 6, wallMaterial: 'stone_bricks', floorMaterial: 'stone_bricks' },
      ],
      roof: {
        shape: 'gable',
        pitch: 1.8,
        overhang: 1,
        primaryMaterial: 'deepslate_tiles',
        trimMaterial: 'stone_bricks',
      },
      openings: [
        { type: 'archway', wall: 'front', floorLevel: 1, xOffsetRatio: 0, widthRatio: 0.25, heightRatio: 0.6 },
        { type: 'window', wall: 'front', floorLevel: 2, xOffsetRatio: 0, widthRatio: 0.3, heightRatio: 0.6 },
      ],
      columns: [
        { position: 'corners', material: 'stone_bricks' },
      ],
      decorativeFeatures: ['Pointed arch peaks', 'Stone wall pinnacles', 'Rose window recess'],
    },
  },
  {
    id: 'desert_temple',
    name: 'Desert Sandstone Temple',
    category: 'Ancient & Desert',
    style: 'Ancient Mesopotamian / Egyptian stepped temple',
    description: 'Monolithic smooth sandstone structure with cut sandstone inlays, chiseled hieroglyphic pilasters, and orange terracotta accents.',
    dimensions: { width: 15, height: 12, depth: 15 },
    badgeColor: 'border-yellow-500/30 text-yellow-300',
    sceneAnalysis: {
      structureType: 'desert_temple',
      style: 'Ancient Desert',
      estimatedDimensions: { width: 15, height: 12, depth: 15 },
      cameraPerspective: 'ground_front',
      confidence: {
        overall: 0.93,
        front: 0.95,
        roof: 0.92,
        sides: 0.91,
        rear: 0.74,
        materials: 0.94,
      },
      paletteRecommendation: {
        walls: 'sandstone',
        foundation: 'smooth_sandstone',
        trim: 'orange_terracotta',
        roof: 'sandstone',
        windows: 'glass_pane',
        doors: 'dark_oak_door',
        details: 'chiseled_sandstone',
      },
      floors: [
        { level: 1, height: 4, wallMaterial: 'sandstone', floorMaterial: 'smooth_sandstone' },
        { level: 2, height: 4, wallMaterial: 'sandstone', floorMaterial: 'orange_terracotta' },
      ],
      roof: {
        shape: 'flat',
        pitch: 0,
        overhang: 1,
        primaryMaterial: 'sandstone',
        trimMaterial: 'orange_terracotta',
      },
      openings: [
        { type: 'door', wall: 'front', floorLevel: 1, xOffsetRatio: 0, widthRatio: 0.2, heightRatio: 0.5 },
      ],
      columns: [
        { position: 'corners', material: 'chiseled_sandstone' },
      ],
      decorativeFeatures: ['Stepped parapet battlements', 'Terracotta geometric frieze', 'Recessed portal'],
    },
  },
  {
    id: 'nordic_cottage',
    name: 'Nordic Timber A-Frame Cottage',
    category: 'Rustic & Wilderness',
    style: 'Scandinavian steep-pitched stave timber dwelling',
    description: 'Heavy spruce logs with cobblestone chimney, steep sloping roof with mossy details, and elevated foundation.',
    dimensions: { width: 11, height: 13, depth: 11 },
    badgeColor: 'border-emerald-500/30 text-emerald-300',
    sceneAnalysis: {
      structureType: 'nordic_cottage',
      style: 'Scandinavian Rustic',
      estimatedDimensions: { width: 11, height: 13, depth: 11 },
      cameraPerspective: 'three_quarter_elevated',
      confidence: {
        overall: 0.95,
        front: 0.97,
        roof: 0.96,
        sides: 0.93,
        rear: 0.81,
        materials: 0.96,
      },
      paletteRecommendation: {
        walls: 'spruce_planks',
        foundation: 'cobblestone',
        trim: 'spruce_log',
        roof: 'dark_oak_stairs',
        windows: 'glass_pane',
        doors: 'spruce_door',
        details: 'lantern',
      },
      floors: [
        { level: 1, height: 4, wallMaterial: 'spruce_planks', floorMaterial: 'spruce_planks' },
      ],
      roof: {
        shape: 'gable',
        pitch: 1.4,
        overhang: 1,
        primaryMaterial: 'dark_oak_stairs',
        trimMaterial: 'spruce_log',
      },
      openings: [
        { type: 'door', wall: 'front', floorLevel: 1, xOffsetRatio: 0, widthRatio: 0.18, heightRatio: 0.5 },
        { type: 'window', wall: 'front', floorLevel: 1, xOffsetRatio: -0.3, widthRatio: 0.15, heightRatio: 0.4 },
        { type: 'window', wall: 'front', floorLevel: 1, xOffsetRatio: 0.3, widthRatio: 0.15, heightRatio: 0.4 },
      ],
      columns: [
        { position: 'corners', material: 'spruce_log' },
      ],
      decorativeFeatures: ['Exterior cobblestone chimney', 'Hanging porch lanterns', 'Crossed roof gables'],
    },
  },
];

export function getPresetById(id: string): PresetBuilding | undefined {
  return PRESET_BUILDINGS.find((p) => p.id === id);
}

export function generatePresetBuild(presetId: string, scale: number = 1.0, version: '1.20' | '1.21' = '1.21'): MinecraftBuild {
  if (presetId === 'glass_garden_conservatory') {
    const referenceBuilding = analyzeReferenceArchitecture({ name: 'Glass Garden Conservatory' }, [], {
      buildScale: 'medium',
      referenceMode: 'architecture_environment',
      accuracy: 'high_detail',
      inference: 'conservative',
      minecraftVersion: version,
    });
    return buildMinecraftFromProxy(referenceBuilding, version, scale, true, true);
  }

  const preset = getPresetById(presetId) || PRESET_BUILDINGS[0];
  return voxelizeSceneAnalysis(preset.sceneAnalysis, preset.name, scale, version);
}
