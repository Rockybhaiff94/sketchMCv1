import { MinecraftBlock, ShapeType, BlockCategory, BlockMaterial } from '../types/minecraft.ts';

export const MINECRAFT_BLOCKS: MinecraftBlock[] = [
  // ==========================================
  // --- Stone & Masonry ---
  // ==========================================
  {
    id: 'minecraft:stone',
    name: 'Stone',
    category: 'stone',
    subCategory: 'natural_stone',
    material: 'stone',
    shapeType: 'full_cube',
    colorHex: '#7D7D7D',
    roughness: 0.8,
    supportsRotation: false,
    sinceVersion: '1.20',
  },
  {
    id: 'minecraft:smooth_stone',
    name: 'Smooth Stone',
    category: 'stone',
    subCategory: 'natural_stone',
    material: 'stone',
    shapeType: 'full_cube',
    colorHex: '#9E9E9E',
    roughness: 0.65,
    supportsRotation: false,
    sinceVersion: '1.20',
  },
  {
    id: 'minecraft:smooth_stone_slab',
    name: 'Smooth Stone Slab',
    category: 'stone',
    subCategory: 'slabs',
    material: 'stone',
    shapeType: 'slab',
    colorHex: '#9E9E9E',
    roughness: 0.65,
    supportsRotation: false,
    defaultState: { type: 'bottom', waterlogged: 'false' },
    properties: {
      type: ['bottom', 'top', 'double'],
      waterlogged: ['true', 'false'],
    },
    sinceVersion: '1.20',
  },
  {
    id: 'minecraft:cobblestone',
    name: 'Cobblestone',
    category: 'stone',
    subCategory: 'cobblestone',
    material: 'stone',
    shapeType: 'full_cube',
    colorHex: '#646464',
    roughness: 0.9,
    supportsRotation: false,
    sinceVersion: '1.20',
  },
  {
    id: 'minecraft:cobblestone_stairs',
    name: 'Cobblestone Stairs',
    category: 'stone',
    subCategory: 'stairs',
    material: 'stone',
    shapeType: 'stairs',
    colorHex: '#646464',
    roughness: 0.9,
    supportsRotation: true,
    allowedRotations: ['north', 'south', 'east', 'west'],
    defaultState: { facing: 'north', half: 'bottom', shape: 'straight', waterlogged: 'false' },
    properties: {
      facing: ['north', 'south', 'east', 'west'],
      half: ['top', 'bottom'],
      shape: ['straight', 'inner_left', 'inner_right', 'outer_left', 'outer_right'],
      waterlogged: ['true', 'false'],
    },
    sinceVersion: '1.20',
  },
  {
    id: 'minecraft:cobblestone_slab',
    name: 'Cobblestone Slab',
    category: 'stone',
    subCategory: 'slabs',
    material: 'stone',
    shapeType: 'slab',
    colorHex: '#646464',
    roughness: 0.9,
    supportsRotation: false,
    defaultState: { type: 'bottom', waterlogged: 'false' },
    properties: {
      type: ['bottom', 'top', 'double'],
      waterlogged: ['true', 'false'],
    },
    sinceVersion: '1.20',
  },
  {
    id: 'minecraft:cobblestone_wall',
    name: 'Cobblestone Wall',
    category: 'stone',
    subCategory: 'walls',
    material: 'stone',
    shapeType: 'wall',
    colorHex: '#646464',
    roughness: 0.9,
    supportsRotation: false,
    sinceVersion: '1.20',
  },
  {
    id: 'minecraft:stone_bricks',
    name: 'Stone Bricks',
    category: 'stone',
    subCategory: 'bricks',
    material: 'stone',
    shapeType: 'full_cube',
    colorHex: '#7B7B7B',
    roughness: 0.85,
    supportsRotation: false,
    sinceVersion: '1.20',
  },
  {
    id: 'minecraft:stone_brick_stairs',
    name: 'Stone Brick Stairs',
    category: 'stone',
    subCategory: 'stairs',
    material: 'stone',
    shapeType: 'stairs',
    colorHex: '#7B7B7B',
    roughness: 0.85,
    supportsRotation: true,
    allowedRotations: ['north', 'south', 'east', 'west'],
    defaultState: { facing: 'north', half: 'bottom', shape: 'straight', waterlogged: 'false' },
    properties: {
      facing: ['north', 'south', 'east', 'west'],
      half: ['top', 'bottom'],
      shape: ['straight', 'inner_left', 'inner_right', 'outer_left', 'outer_right'],
      waterlogged: ['true', 'false'],
    },
    sinceVersion: '1.20',
  },
  {
    id: 'minecraft:stone_brick_slab',
    name: 'Stone Brick Slab',
    category: 'stone',
    subCategory: 'slabs',
    material: 'stone',
    shapeType: 'slab',
    colorHex: '#7B7B7B',
    roughness: 0.85,
    supportsRotation: false,
    defaultState: { type: 'bottom', waterlogged: 'false' },
    properties: {
      type: ['bottom', 'top', 'double'],
      waterlogged: ['true', 'false'],
    },
    sinceVersion: '1.20',
  },
  {
    id: 'minecraft:stone_brick_wall',
    name: 'Stone Brick Wall',
    category: 'stone',
    subCategory: 'walls',
    material: 'stone',
    shapeType: 'wall',
    colorHex: '#7B7B7B',
    roughness: 0.85,
    supportsRotation: false,
    sinceVersion: '1.20',
  },
  {
    id: 'minecraft:mossy_stone_bricks',
    name: 'Mossy Stone Bricks',
    category: 'stone',
    subCategory: 'bricks',
    material: 'stone',
    shapeType: 'full_cube',
    colorHex: '#6d7560',
    roughness: 0.85,
    supportsRotation: false,
    sinceVersion: '1.20',
  },
  {
    id: 'minecraft:chiseled_stone_bricks',
    name: 'Chiseled Stone Bricks',
    category: 'stone',
    subCategory: 'decorative_stone',
    material: 'stone',
    shapeType: 'full_cube',
    colorHex: '#757575',
    roughness: 0.8,
    supportsRotation: false,
    sinceVersion: '1.20',
  },

  // --- Deepslate Family ---
  {
    id: 'minecraft:deepslate',
    name: 'Deepslate',
    category: 'stone',
    subCategory: 'deepslate',
    material: 'deepslate',
    shapeType: 'full_cube',
    colorHex: '#3A3A40',
    roughness: 0.9,
    supportsRotation: false,
    sinceVersion: '1.20',
  },
  {
    id: 'minecraft:cobbled_deepslate',
    name: 'Cobbled Deepslate',
    category: 'stone',
    subCategory: 'deepslate',
    material: 'deepslate',
    shapeType: 'full_cube',
    colorHex: '#343438',
    roughness: 0.95,
    supportsRotation: false,
    sinceVersion: '1.20',
  },
  {
    id: 'minecraft:polished_deepslate',
    name: 'Polished Deepslate',
    category: 'stone',
    subCategory: 'deepslate',
    material: 'deepslate',
    shapeType: 'full_cube',
    colorHex: '#48484E',
    roughness: 0.7,
    supportsRotation: false,
    sinceVersion: '1.20',
  },
  {
    id: 'minecraft:deepslate_tiles',
    name: 'Deepslate Tiles',
    category: 'stone',
    subCategory: 'deepslate',
    material: 'deepslate',
    shapeType: 'full_cube',
    colorHex: '#303034',
    roughness: 0.8,
    supportsRotation: false,
    sinceVersion: '1.20',
  },
  {
    id: 'minecraft:deepslate_tile_stairs',
    name: 'Deepslate Tile Stairs',
    category: 'stone',
    subCategory: 'stairs',
    material: 'deepslate',
    shapeType: 'stairs',
    colorHex: '#303034',
    roughness: 0.8,
    supportsRotation: true,
    allowedRotations: ['north', 'south', 'east', 'west'],
    defaultState: { facing: 'north', half: 'bottom', shape: 'straight', waterlogged: 'false' },
    properties: {
      facing: ['north', 'south', 'east', 'west'],
      half: ['top', 'bottom'],
      shape: ['straight', 'inner_left', 'inner_right', 'outer_left', 'outer_right'],
      waterlogged: ['true', 'false'],
    },
    sinceVersion: '1.20',
  },
  {
    id: 'minecraft:deepslate_tile_slab',
    name: 'Deepslate Tile Slab',
    category: 'stone',
    subCategory: 'slabs',
    material: 'deepslate',
    shapeType: 'slab',
    colorHex: '#303034',
    roughness: 0.8,
    supportsRotation: false,
    defaultState: { type: 'bottom', waterlogged: 'false' },
    properties: {
      type: ['bottom', 'top', 'double'],
      waterlogged: ['true', 'false'],
    },
    sinceVersion: '1.20',
  },
  {
    id: 'minecraft:deepslate_bricks',
    name: 'Deepslate Bricks',
    category: 'stone',
    subCategory: 'deepslate',
    material: 'deepslate',
    shapeType: 'full_cube',
    colorHex: '#35353A',
    roughness: 0.85,
    supportsRotation: false,
    sinceVersion: '1.20',
  },
  {
    id: 'minecraft:deepslate_brick_stairs',
    name: 'Deepslate Brick Stairs',
    category: 'stone',
    subCategory: 'stairs',
    material: 'deepslate',
    shapeType: 'stairs',
    colorHex: '#35353A',
    roughness: 0.85,
    supportsRotation: true,
    allowedRotations: ['north', 'south', 'east', 'west'],
    defaultState: { facing: 'north', half: 'bottom', shape: 'straight', waterlogged: 'false' },
    properties: {
      facing: ['north', 'south', 'east', 'west'],
      half: ['top', 'bottom'],
      shape: ['straight', 'inner_left', 'inner_right', 'outer_left', 'outer_right'],
      waterlogged: ['true', 'false'],
    },
    sinceVersion: '1.20',
  },
  {
    id: 'minecraft:deepslate_brick_slab',
    name: 'Deepslate Brick Slab',
    category: 'stone',
    subCategory: 'slabs',
    material: 'deepslate',
    shapeType: 'slab',
    colorHex: '#35353A',
    roughness: 0.85,
    supportsRotation: false,
    defaultState: { type: 'bottom', waterlogged: 'false' },
    properties: {
      type: ['bottom', 'top', 'double'],
      waterlogged: ['true', 'false'],
    },
    sinceVersion: '1.20',
  },
  {
    id: 'minecraft:deepslate_tile_wall',
    name: 'Deepslate Tile Wall',
    category: 'stone',
    subCategory: 'walls',
    material: 'deepslate',
    shapeType: 'wall',
    colorHex: '#303034',
    roughness: 0.8,
    supportsRotation: false,
    defaultState: { up: 'true', north: 'none', south: 'none', east: 'none', west: 'none', waterlogged: 'false' },
    properties: {
      up: ['true', 'false'],
      north: ['none', 'low', 'tall'],
      south: ['none', 'low', 'tall'],
      east: ['none', 'low', 'tall'],
      west: ['none', 'low', 'tall'],
      waterlogged: ['true', 'false'],
    },
    sinceVersion: '1.20',
  },
  {
    id: 'minecraft:deepslate_brick_wall',
    name: 'Deepslate Brick Wall',
    category: 'stone',
    subCategory: 'walls',
    material: 'deepslate',
    shapeType: 'wall',
    colorHex: '#35353A',
    roughness: 0.85,
    supportsRotation: false,
    defaultState: { up: 'true', north: 'none', south: 'none', east: 'none', west: 'none', waterlogged: 'false' },
    properties: {
      up: ['true', 'false'],
      north: ['none', 'low', 'tall'],
      south: ['none', 'low', 'tall'],
      east: ['none', 'low', 'tall'],
      west: ['none', 'low', 'tall'],
      waterlogged: ['true', 'false'],
    },
    sinceVersion: '1.20',
  },

  // --- Quartz & White Architectural Framing ---
  {
    id: 'minecraft:quartz_block',
    name: 'Block of Quartz',
    category: 'building',
    subCategory: 'quartz',
    material: 'quartz',
    shapeType: 'full_cube',
    colorHex: '#EAE6E1',
    roughness: 0.4,
    supportsRotation: false,
    sinceVersion: '1.20',
  },
  {
    id: 'minecraft:smooth_quartz',
    name: 'Smooth Quartz Block',
    category: 'building',
    subCategory: 'quartz',
    material: 'quartz',
    shapeType: 'full_cube',
    colorHex: '#F0ECE8',
    roughness: 0.35,
    supportsRotation: false,
    sinceVersion: '1.20',
  },
  {
    id: 'minecraft:smooth_quartz_stairs',
    name: 'Smooth Quartz Stairs',
    category: 'building',
    subCategory: 'stairs',
    material: 'quartz',
    shapeType: 'stairs',
    colorHex: '#F0ECE8',
    roughness: 0.35,
    supportsRotation: true,
    allowedRotations: ['north', 'south', 'east', 'west'],
    defaultState: { facing: 'north', half: 'bottom', shape: 'straight', waterlogged: 'false' },
    properties: {
      facing: ['north', 'south', 'east', 'west'],
      half: ['top', 'bottom'],
      shape: ['straight', 'inner_left', 'inner_right', 'outer_left', 'outer_right'],
      waterlogged: ['true', 'false'],
    },
    sinceVersion: '1.20',
  },
  {
    id: 'minecraft:smooth_quartz_slab',
    name: 'Smooth Quartz Slab',
    category: 'building',
    subCategory: 'slabs',
    material: 'quartz',
    shapeType: 'slab',
    colorHex: '#F0ECE8',
    roughness: 0.35,
    supportsRotation: false,
    defaultState: { type: 'bottom', waterlogged: 'false' },
    properties: {
      type: ['bottom', 'top', 'double'],
      waterlogged: ['true', 'false'],
    },
    sinceVersion: '1.20',
  },
  {
    id: 'minecraft:quartz_pillar',
    name: 'Quartz Pillar',
    category: 'building',
    subCategory: 'pillars',
    material: 'quartz',
    shapeType: 'log',
    colorHex: '#EFEAE3',
    roughness: 0.4,
    supportsRotation: true,
    defaultState: { axis: 'y' },
    properties: { axis: ['x', 'y', 'z'] },
    sinceVersion: '1.20',
  },

  // --- Sandstone Family ---
  {
    id: 'minecraft:sandstone',
    name: 'Sandstone',
    category: 'stone',
    subCategory: 'sandstone',
    material: 'sandstone',
    shapeType: 'full_cube',
    colorHex: '#D6C898',
    roughness: 0.85,
    supportsRotation: false,
    sinceVersion: '1.20',
  },
  {
    id: 'minecraft:smooth_sandstone',
    name: 'Smooth Sandstone',
    category: 'stone',
    subCategory: 'sandstone',
    material: 'sandstone',
    shapeType: 'full_cube',
    colorHex: '#DDD1A4',
    roughness: 0.7,
    supportsRotation: false,
    sinceVersion: '1.20',
  },
  {
    id: 'minecraft:sandstone_stairs',
    name: 'Sandstone Stairs',
    category: 'stone',
    subCategory: 'stairs',
    material: 'sandstone',
    shapeType: 'stairs',
    colorHex: '#D6C898',
    roughness: 0.85,
    supportsRotation: true,
    allowedRotations: ['north', 'south', 'east', 'west'],
    defaultState: { facing: 'north', half: 'bottom', shape: 'straight', waterlogged: 'false' },
    properties: {
      facing: ['north', 'south', 'east', 'west'],
      half: ['top', 'bottom'],
      shape: ['straight', 'inner_left', 'inner_right', 'outer_left', 'outer_right'],
      waterlogged: ['true', 'false'],
    },
    sinceVersion: '1.20',
  },
  {
    id: 'minecraft:sandstone_slab',
    name: 'Sandstone Slab',
    category: 'stone',
    subCategory: 'slabs',
    material: 'sandstone',
    shapeType: 'slab',
    colorHex: '#D6C898',
    roughness: 0.85,
    supportsRotation: false,
    defaultState: { type: 'bottom', waterlogged: 'false' },
    properties: {
      type: ['bottom', 'top', 'double'],
      waterlogged: ['true', 'false'],
    },
    sinceVersion: '1.20',
  },

  // --- Bricks ---
  {
    id: 'minecraft:bricks',
    name: 'Bricks',
    category: 'building',
    subCategory: 'bricks',
    material: 'brick',
    shapeType: 'full_cube',
    colorHex: '#995946',
    roughness: 0.85,
    supportsRotation: false,
    sinceVersion: '1.20',
  },
  {
    id: 'minecraft:brick_stairs',
    name: 'Brick Stairs',
    category: 'building',
    subCategory: 'stairs',
    material: 'brick',
    shapeType: 'stairs',
    colorHex: '#995946',
    roughness: 0.85,
    supportsRotation: true,
    allowedRotations: ['north', 'south', 'east', 'west'],
    defaultState: { facing: 'north', half: 'bottom', shape: 'straight', waterlogged: 'false' },
    properties: {
      facing: ['north', 'south', 'east', 'west'],
      half: ['top', 'bottom'],
      shape: ['straight', 'inner_left', 'inner_right', 'outer_left', 'outer_right'],
      waterlogged: ['true', 'false'],
    },
    sinceVersion: '1.20',
  },
  {
    id: 'minecraft:mud_bricks',
    name: 'Mud Bricks',
    category: 'building',
    subCategory: 'bricks',
    material: 'brick',
    shapeType: 'full_cube',
    colorHex: '#89674f',
    roughness: 0.9,
    supportsRotation: false,
    sinceVersion: '1.20',
  },
  {
    id: 'minecraft:mud_brick_stairs',
    name: 'Mud Brick Stairs',
    category: 'building',
    subCategory: 'stairs',
    material: 'brick',
    shapeType: 'stairs',
    colorHex: '#89674f',
    roughness: 0.9,
    supportsRotation: true,
    allowedRotations: ['north', 'south', 'east', 'west'],
    defaultState: { facing: 'north', half: 'bottom', shape: 'straight', waterlogged: 'false' },
    properties: {
      facing: ['north', 'south', 'east', 'west'],
      half: ['top', 'bottom'],
      shape: ['straight', 'inner_left', 'inner_right', 'outer_left', 'outer_right'],
      waterlogged: ['true', 'false'],
    },
    sinceVersion: '1.20',
  },
  {
    id: 'minecraft:mud_brick_slab',
    name: 'Mud Brick Slab',
    category: 'building',
    subCategory: 'slabs',
    material: 'brick',
    shapeType: 'slab',
    colorHex: '#89674f',
    roughness: 0.9,
    supportsRotation: false,
    defaultState: { type: 'bottom', waterlogged: 'false' },
    properties: {
      type: ['bottom', 'top', 'double'],
      waterlogged: ['true', 'false'],
    },
    sinceVersion: '1.20',
  },

  // --- 1.21 Tuff & Copper Elements ---
  {
    id: 'minecraft:tuff',
    name: 'Tuff',
    category: 'stone',
    subCategory: 'tuff',
    material: 'stone',
    shapeType: 'full_cube',
    colorHex: '#696A62',
    roughness: 0.9,
    supportsRotation: false,
    sinceVersion: '1.21',
  },
  {
    id: 'minecraft:tuff_bricks',
    name: 'Tuff Bricks',
    category: 'stone',
    subCategory: 'bricks',
    material: 'stone',
    shapeType: 'full_cube',
    colorHex: '#5A5B53',
    roughness: 0.85,
    supportsRotation: false,
    sinceVersion: '1.21',
  },
  {
    id: 'minecraft:tuff_brick_stairs',
    name: 'Tuff Brick Stairs',
    category: 'stone',
    subCategory: 'stairs',
    material: 'stone',
    shapeType: 'stairs',
    colorHex: '#5A5B53',
    roughness: 0.85,
    supportsRotation: true,
    allowedRotations: ['north', 'south', 'east', 'west'],
    defaultState: { facing: 'north', half: 'bottom', shape: 'straight', waterlogged: 'false' },
    properties: {
      facing: ['north', 'south', 'east', 'west'],
      half: ['top', 'bottom'],
      shape: ['straight', 'inner_left', 'inner_right', 'outer_left', 'outer_right'],
      waterlogged: ['true', 'false'],
    },
    sinceVersion: '1.21',
  },
  {
    id: 'minecraft:cut_copper',
    name: 'Cut Copper',
    category: 'building',
    subCategory: 'copper',
    material: 'metal',
    shapeType: 'full_cube',
    colorHex: '#bf6c53',
    roughness: 0.5,
    metalness: 0.4,
    supportsRotation: false,
    sinceVersion: '1.20',
  },
  {
    id: 'minecraft:copper_grate',
    name: 'Copper Grate',
    category: 'functional',
    subCategory: 'copper',
    material: 'metal',
    shapeType: 'full_cube',
    colorHex: '#995642',
    roughness: 0.6,
    metalness: 0.5,
    transparent: true,
    supportsRotation: false,
    sinceVersion: '1.21',
  },
  {
    id: 'minecraft:copper_door',
    name: 'Copper Door',
    category: 'building',
    subCategory: 'copper',
    material: 'metal',
    shapeType: 'door',
    colorHex: '#bf6c53',
    roughness: 0.5,
    metalness: 0.4,
    supportsRotation: true,
    defaultState: { facing: 'north', half: 'lower', open: 'false' },
    properties: {
      facing: ['north', 'south', 'east', 'west'],
      half: ['upper', 'lower'],
      open: ['true', 'false'],
    },
    sinceVersion: '1.21',
  },
  {
    id: 'minecraft:oxidized_copper_door',
    name: 'Oxidized Copper Door',
    category: 'building',
    subCategory: 'copper',
    material: 'metal',
    shapeType: 'door',
    colorHex: '#52A38D',
    roughness: 0.6,
    metalness: 0.2,
    supportsRotation: true,
    defaultState: { facing: 'north', half: 'lower', open: 'false' },
    properties: {
      facing: ['north', 'south', 'east', 'west'],
      half: ['upper', 'lower'],
      open: ['true', 'false'],
    },
    sinceVersion: '1.21',
  },

  // ==========================================
  // --- Wood & Planks ---
  // ==========================================

  // --- Oak ---
  {
    id: 'minecraft:oak_planks',
    name: 'Oak Planks',
    category: 'wood',
    subCategory: 'planks',
    material: 'wood',
    shapeType: 'full_cube',
    colorHex: '#A2824E',
    roughness: 0.8,
    supportsRotation: false,
    sinceVersion: '1.20',
  },
  {
    id: 'minecraft:oak_stairs',
    name: 'Oak Stairs',
    category: 'wood',
    subCategory: 'stairs',
    material: 'wood',
    shapeType: 'stairs',
    colorHex: '#A2824E',
    roughness: 0.8,
    supportsRotation: true,
    allowedRotations: ['north', 'south', 'east', 'west'],
    defaultState: { facing: 'north', half: 'bottom', shape: 'straight', waterlogged: 'false' },
    properties: {
      facing: ['north', 'south', 'east', 'west'],
      half: ['top', 'bottom'],
      shape: ['straight', 'inner_left', 'inner_right', 'outer_left', 'outer_right'],
      waterlogged: ['true', 'false'],
    },
    sinceVersion: '1.20',
  },
  {
    id: 'minecraft:oak_slab',
    name: 'Oak Slab',
    category: 'wood',
    subCategory: 'slabs',
    material: 'wood',
    shapeType: 'slab',
    colorHex: '#A2824E',
    roughness: 0.8,
    supportsRotation: false,
    defaultState: { type: 'bottom', waterlogged: 'false' },
    properties: {
      type: ['bottom', 'top', 'double'],
      waterlogged: ['true', 'false'],
    },
    sinceVersion: '1.20',
  },
  {
    id: 'minecraft:oak_log',
    name: 'Oak Log',
    category: 'wood',
    subCategory: 'logs',
    material: 'wood',
    shapeType: 'log',
    colorHex: '#6D5432',
    roughness: 0.85,
    supportsRotation: true,
    defaultState: { axis: 'y' },
    properties: { axis: ['x', 'y', 'z'] },
    sinceVersion: '1.20',
  },
  {
    id: 'minecraft:oak_fence',
    name: 'Oak Fence',
    category: 'wood',
    subCategory: 'fences',
    material: 'wood',
    shapeType: 'fence',
    colorHex: '#A2824E',
    roughness: 0.8,
    supportsRotation: false,
    sinceVersion: '1.20',
  },
  {
    id: 'minecraft:oak_door',
    name: 'Oak Door',
    category: 'wood',
    subCategory: 'doors',
    material: 'wood',
    shapeType: 'door',
    colorHex: '#A2824E',
    roughness: 0.8,
    supportsRotation: true,
    defaultState: { facing: 'north', half: 'lower', open: 'false' },
    properties: {
      facing: ['north', 'south', 'east', 'west'],
      half: ['upper', 'lower'],
      open: ['true', 'false'],
    },
    sinceVersion: '1.20',
  },
  {
    id: 'minecraft:oak_trapdoor',
    name: 'Oak Trapdoor',
    category: 'wood',
    subCategory: 'trapdoors',
    material: 'wood',
    shapeType: 'trapdoor',
    colorHex: '#A2824E',
    roughness: 0.8,
    supportsRotation: true,
    defaultState: { facing: 'north', half: 'bottom', open: 'false' },
    properties: {
      facing: ['north', 'south', 'east', 'west'],
      half: ['top', 'bottom'],
      open: ['true', 'false'],
    },
    sinceVersion: '1.20',
  },

  // --- Spruce ---
  {
    id: 'minecraft:spruce_planks',
    name: 'Spruce Planks',
    category: 'wood',
    subCategory: 'planks',
    material: 'wood',
    shapeType: 'full_cube',
    colorHex: '#664C30',
    roughness: 0.8,
    supportsRotation: false,
    sinceVersion: '1.20',
  },
  {
    id: 'minecraft:spruce_stairs',
    name: 'Spruce Stairs',
    category: 'wood',
    subCategory: 'stairs',
    material: 'wood',
    shapeType: 'stairs',
    colorHex: '#664C30',
    roughness: 0.8,
    supportsRotation: true,
    allowedRotations: ['north', 'south', 'east', 'west'],
    defaultState: { facing: 'north', half: 'bottom', shape: 'straight', waterlogged: 'false' },
    properties: {
      facing: ['north', 'south', 'east', 'west'],
      half: ['top', 'bottom'],
      shape: ['straight', 'inner_left', 'inner_right', 'outer_left', 'outer_right'],
      waterlogged: ['true', 'false'],
    },
    sinceVersion: '1.20',
  },
  {
    id: 'minecraft:spruce_slab',
    name: 'Spruce Slab',
    category: 'wood',
    subCategory: 'slabs',
    material: 'wood',
    shapeType: 'slab',
    colorHex: '#664C30',
    roughness: 0.8,
    supportsRotation: false,
    defaultState: { type: 'bottom', waterlogged: 'false' },
    properties: {
      type: ['bottom', 'top', 'double'],
      waterlogged: ['true', 'false'],
    },
    sinceVersion: '1.20',
  },
  {
    id: 'minecraft:spruce_log',
    name: 'Spruce Log',
    category: 'wood',
    subCategory: 'logs',
    material: 'wood',
    shapeType: 'log',
    colorHex: '#3B2713',
    roughness: 0.85,
    supportsRotation: true,
    defaultState: { axis: 'y' },
    properties: { axis: ['x', 'y', 'z'] },
    sinceVersion: '1.20',
  },
  {
    id: 'minecraft:spruce_fence',
    name: 'Spruce Fence',
    category: 'wood',
    subCategory: 'fences',
    material: 'wood',
    shapeType: 'fence',
    colorHex: '#664C30',
    roughness: 0.8,
    supportsRotation: false,
    sinceVersion: '1.20',
  },

  // --- Dark Oak ---
  {
    id: 'minecraft:dark_oak_planks',
    name: 'Dark Oak Planks',
    category: 'wood',
    subCategory: 'planks',
    material: 'wood',
    shapeType: 'full_cube',
    colorHex: '#422A15',
    roughness: 0.8,
    supportsRotation: false,
    sinceVersion: '1.20',
  },
  {
    id: 'minecraft:dark_oak_stairs',
    name: 'Dark Oak Stairs',
    category: 'wood',
    subCategory: 'stairs',
    material: 'wood',
    shapeType: 'stairs',
    colorHex: '#422A15',
    roughness: 0.8,
    supportsRotation: true,
    allowedRotations: ['north', 'south', 'east', 'west'],
    defaultState: { facing: 'north', half: 'bottom', shape: 'straight', waterlogged: 'false' },
    properties: {
      facing: ['north', 'south', 'east', 'west'],
      half: ['top', 'bottom'],
      shape: ['straight', 'inner_left', 'inner_right', 'outer_left', 'outer_right'],
      waterlogged: ['true', 'false'],
    },
    sinceVersion: '1.20',
  },
  {
    id: 'minecraft:dark_oak_slab',
    name: 'Dark Oak Slab',
    category: 'wood',
    subCategory: 'slabs',
    material: 'wood',
    shapeType: 'slab',
    colorHex: '#422A15',
    roughness: 0.8,
    supportsRotation: false,
    defaultState: { type: 'bottom', waterlogged: 'false' },
    properties: {
      type: ['bottom', 'top', 'double'],
      waterlogged: ['true', 'false'],
    },
    sinceVersion: '1.20',
  },
  {
    id: 'minecraft:dark_oak_log',
    name: 'Dark Oak Log',
    category: 'wood',
    subCategory: 'logs',
    material: 'wood',
    shapeType: 'log',
    colorHex: '#302213',
    roughness: 0.85,
    supportsRotation: true,
    defaultState: { axis: 'y' },
    properties: { axis: ['x', 'y', 'z'] },
    sinceVersion: '1.20',
  },

  // --- Cherry Wood ---
  {
    id: 'minecraft:cherry_planks',
    name: 'Cherry Planks',
    category: 'wood',
    subCategory: 'planks',
    material: 'wood',
    shapeType: 'full_cube',
    colorHex: '#E39999',
    roughness: 0.75,
    supportsRotation: false,
    sinceVersion: '1.20',
  },
  {
    id: 'minecraft:cherry_stairs',
    name: 'Cherry Stairs',
    category: 'wood',
    subCategory: 'stairs',
    material: 'wood',
    shapeType: 'stairs',
    colorHex: '#E39999',
    roughness: 0.75,
    supportsRotation: true,
    allowedRotations: ['north', 'south', 'east', 'west'],
    defaultState: { facing: 'north', half: 'bottom', shape: 'straight', waterlogged: 'false' },
    properties: {
      facing: ['north', 'south', 'east', 'west'],
      half: ['top', 'bottom'],
      shape: ['straight', 'inner_left', 'inner_right', 'outer_left', 'outer_right'],
      waterlogged: ['true', 'false'],
    },
    sinceVersion: '1.20',
  },

  // ==========================================
  // --- Glass & Windows ---
  // ==========================================
  {
    id: 'minecraft:glass',
    name: 'Glass',
    category: 'glass',
    subCategory: 'blocks',
    material: 'glass',
    shapeType: 'full_cube',
    colorHex: '#C0D8E0',
    roughness: 0.1,
    transparent: true,
    opacity: 0.35,
    supportsRotation: false,
    sinceVersion: '1.20',
  },
  {
    id: 'minecraft:glass_pane',
    name: 'Glass Pane',
    category: 'glass',
    subCategory: 'panes',
    material: 'glass',
    shapeType: 'pane',
    colorHex: '#C0D8E0',
    roughness: 0.1,
    transparent: true,
    opacity: 0.4,
    supportsRotation: false,
    sinceVersion: '1.20',
  },
  {
    id: 'minecraft:white_stained_glass',
    name: 'White Stained Glass',
    category: 'glass',
    subCategory: 'blocks',
    material: 'glass',
    shapeType: 'full_cube',
    colorHex: '#FFFFFF',
    roughness: 0.15,
    transparent: true,
    opacity: 0.5,
    supportsRotation: false,
    sinceVersion: '1.20',
  },
  {
    id: 'minecraft:white_stained_glass_pane',
    name: 'White Stained Glass Pane',
    category: 'glass',
    subCategory: 'panes',
    material: 'glass',
    shapeType: 'pane',
    colorHex: '#FFFFFF',
    roughness: 0.15,
    transparent: true,
    opacity: 0.5,
    supportsRotation: false,
    sinceVersion: '1.20',
  },
  {
    id: 'minecraft:pink_stained_glass',
    name: 'Pink Stained Glass',
    category: 'glass',
    subCategory: 'blocks',
    material: 'glass',
    shapeType: 'full_cube',
    colorHex: '#ED9FB8',
    roughness: 0.15,
    transparent: true,
    opacity: 0.45,
    supportsRotation: false,
    sinceVersion: '1.20',
  },
  {
    id: 'minecraft:pink_stained_glass_pane',
    name: 'Pink Stained Glass Pane',
    category: 'glass',
    subCategory: 'panes',
    material: 'glass',
    shapeType: 'pane',
    colorHex: '#ED9FB8',
    roughness: 0.15,
    transparent: true,
    opacity: 0.45,
    supportsRotation: false,
    sinceVersion: '1.20',
  },
  {
    id: 'minecraft:light_blue_stained_glass',
    name: 'Light Blue Stained Glass',
    category: 'glass',
    subCategory: 'blocks',
    material: 'glass',
    shapeType: 'full_cube',
    colorHex: '#66A6D8',
    roughness: 0.15,
    transparent: true,
    opacity: 0.45,
    supportsRotation: false,
    sinceVersion: '1.20',
  },
  {
    id: 'minecraft:light_blue_stained_glass_pane',
    name: 'Light Blue Stained Glass Pane',
    category: 'glass',
    subCategory: 'panes',
    material: 'glass',
    shapeType: 'pane',
    colorHex: '#66A6D8',
    roughness: 0.15,
    transparent: true,
    opacity: 0.45,
    supportsRotation: false,
    sinceVersion: '1.20',
  },
  {
    id: 'minecraft:tinted_glass',
    name: 'Tinted Glass',
    category: 'glass',
    subCategory: 'blocks',
    material: 'glass',
    shapeType: 'full_cube',
    colorHex: '#25212A',
    roughness: 0.2,
    transparent: true,
    opacity: 0.65,
    supportsRotation: false,
    sinceVersion: '1.20',
  },

  // ==========================================
  // --- Concrete Series ---
  // ==========================================
  {
    id: 'minecraft:white_concrete',
    name: 'White Concrete',
    category: 'concrete',
    subCategory: 'concrete',
    material: 'concrete',
    shapeType: 'full_cube',
    colorHex: '#CFD5D6',
    roughness: 0.6,
    supportsRotation: false,
    sinceVersion: '1.20',
  },
  {
    id: 'minecraft:light_gray_concrete',
    name: 'Light Gray Concrete',
    category: 'concrete',
    subCategory: 'concrete',
    material: 'concrete',
    shapeType: 'full_cube',
    colorHex: '#7D7D73',
    roughness: 0.6,
    supportsRotation: false,
    sinceVersion: '1.20',
  },
  {
    id: 'minecraft:gray_concrete',
    name: 'Gray Concrete',
    category: 'concrete',
    subCategory: 'concrete',
    material: 'concrete',
    shapeType: 'full_cube',
    colorHex: '#36393D',
    roughness: 0.6,
    supportsRotation: false,
    sinceVersion: '1.20',
  },
  {
    id: 'minecraft:black_concrete',
    name: 'Black Concrete',
    category: 'concrete',
    subCategory: 'concrete',
    material: 'concrete',
    shapeType: 'full_cube',
    colorHex: '#080A0F',
    roughness: 0.6,
    supportsRotation: false,
    sinceVersion: '1.20',
  },
  {
    id: 'minecraft:cyan_concrete',
    name: 'Cyan Concrete',
    category: 'concrete',
    subCategory: 'concrete',
    material: 'concrete',
    shapeType: 'full_cube',
    colorHex: '#157788',
    roughness: 0.6,
    supportsRotation: false,
    sinceVersion: '1.20',
  },
  {
    id: 'minecraft:light_blue_concrete',
    name: 'Light Blue Concrete',
    category: 'concrete',
    subCategory: 'concrete',
    material: 'concrete',
    shapeType: 'full_cube',
    colorHex: '#2489C7',
    roughness: 0.6,
    supportsRotation: false,
    sinceVersion: '1.20',
  },

  // ==========================================
  // --- Nature, Vegetation, Landscaping ---
  // ==========================================
  {
    id: 'minecraft:grass_block',
    name: 'Grass Block',
    category: 'nature',
    subCategory: 'ground',
    material: 'foliage',
    shapeType: 'full_cube',
    colorHex: '#5B8731',
    roughness: 0.9,
    supportsRotation: false,
    sinceVersion: '1.20',
  },
  {
    id: 'minecraft:dirt',
    name: 'Dirt',
    category: 'nature',
    subCategory: 'ground',
    material: 'foliage',
    shapeType: 'full_cube',
    colorHex: '#866043',
    roughness: 0.95,
    supportsRotation: false,
    sinceVersion: '1.20',
  },
  {
    id: 'minecraft:moss_block',
    name: 'Moss Block',
    category: 'nature',
    subCategory: 'ground',
    material: 'foliage',
    shapeType: 'full_cube',
    colorHex: '#596E2D',
    roughness: 0.9,
    supportsRotation: false,
    sinceVersion: '1.20',
  },
  {
    id: 'minecraft:oak_leaves',
    name: 'Oak Leaves',
    category: 'plants',
    subCategory: 'leaves',
    material: 'foliage',
    shapeType: 'full_cube',
    colorHex: '#3A5F1C',
    roughness: 0.95,
    supportsRotation: false,
    defaultState: { persistent: 'false', distance: '7' },
    properties: {
      persistent: ['true', 'false'],
      distance: ['1', '2', '3', '4', '5', '6', '7'],
    },
    sinceVersion: '1.20',
  },
  {
    id: 'minecraft:vine',
    name: 'Vines',
    category: 'plants',
    subCategory: 'foliage',
    material: 'foliage',
    shapeType: 'plant',
    colorHex: '#254A18',
    roughness: 0.9,
    supportsRotation: false,
    defaultState: { north: 'false', south: 'false', east: 'false', west: 'false', up: 'false' },
    properties: {
      north: ['true', 'false'],
      south: ['true', 'false'],
      east: ['true', 'false'],
      west: ['true', 'false'],
      up: ['true', 'false'],
    },
    sinceVersion: '1.20',
  },
  {
    id: 'minecraft:cherry_leaves',
    name: 'Cherry Leaves',
    category: 'plants',
    subCategory: 'leaves',
    material: 'foliage',
    shapeType: 'full_cube',
    colorHex: '#EE94AC',
    roughness: 0.9,
    supportsRotation: false,
    sinceVersion: '1.20',
  },
  {
    id: 'minecraft:flowering_azalea_leaves',
    name: 'Flowering Azalea Leaves',
    category: 'plants',
    subCategory: 'leaves',
    material: 'foliage',
    shapeType: 'full_cube',
    colorHex: '#698835',
    roughness: 0.9,
    supportsRotation: false,
    sinceVersion: '1.20',
  },
  {
    id: 'minecraft:spruce_leaves',
    name: 'Spruce Leaves',
    category: 'plants',
    subCategory: 'leaves',
    material: 'foliage',
    shapeType: 'full_cube',
    colorHex: '#2E5339',
    roughness: 0.95,
    supportsRotation: false,
    sinceVersion: '1.20',
  },
  {
    id: 'minecraft:birch_leaves',
    name: 'Birch Leaves',
    category: 'plants',
    subCategory: 'leaves',
    material: 'foliage',
    shapeType: 'full_cube',
    colorHex: '#5A7E39',
    roughness: 0.95,
    supportsRotation: false,
    sinceVersion: '1.20',
  },
  {
    id: 'minecraft:dark_oak_leaves',
    name: 'Dark Oak Leaves',
    category: 'plants',
    subCategory: 'leaves',
    material: 'foliage',
    shapeType: 'full_cube',
    colorHex: '#254A18',
    roughness: 0.95,
    supportsRotation: false,
    sinceVersion: '1.20',
  },
  {
    id: 'minecraft:short_grass',
    name: 'Short Grass',
    category: 'plants',
    subCategory: 'flowers',
    material: 'foliage',
    shapeType: 'plant',
    colorHex: '#5B8731',
    roughness: 0.85,
    supportsRotation: false,
    sinceVersion: '1.20',
  },
  {
    id: 'minecraft:poppy',
    name: 'Poppy',
    category: 'plants',
    subCategory: 'flowers',
    material: 'foliage',
    shapeType: 'plant',
    colorHex: '#D12222',
    roughness: 0.8,
    supportsRotation: false,
    sinceVersion: '1.20',
  },
  {
    id: 'minecraft:dandelion',
    name: 'Dandelion',
    category: 'plants',
    subCategory: 'flowers',
    material: 'foliage',
    shapeType: 'plant',
    colorHex: '#FFDF00',
    roughness: 0.8,
    supportsRotation: false,
    sinceVersion: '1.20',
  },
  {
    id: 'minecraft:blue_orchid',
    name: 'Blue Orchid',
    category: 'plants',
    subCategory: 'flowers',
    material: 'foliage',
    shapeType: 'plant',
    colorHex: '#258ECC',
    roughness: 0.8,
    supportsRotation: false,
    sinceVersion: '1.20',
  },
  {
    id: 'minecraft:peony',
    name: 'Peony',
    category: 'plants',
    subCategory: 'flowers',
    material: 'foliage',
    shapeType: 'plant',
    colorHex: '#E598AC',
    roughness: 0.8,
    supportsRotation: false,
    sinceVersion: '1.20',
  },
  {
    id: 'minecraft:lilac',
    name: 'Lilac',
    category: 'plants',
    subCategory: 'flowers',
    material: 'foliage',
    shapeType: 'plant',
    colorHex: '#B27DB5',
    roughness: 0.8,
    supportsRotation: false,
    sinceVersion: '1.20',
  },
  {
    id: 'minecraft:pink_tulip',
    name: 'Pink Tulip',
    category: 'plants',
    subCategory: 'flowers',
    material: 'foliage',
    shapeType: 'plant',
    colorHex: '#EDA8C4',
    roughness: 0.8,
    supportsRotation: false,
    sinceVersion: '1.20',
  },
  {
    id: 'minecraft:allium',
    name: 'Allium',
    category: 'plants',
    subCategory: 'flowers',
    material: 'foliage',
    shapeType: 'plant',
    colorHex: '#A260A8',
    roughness: 0.8,
    supportsRotation: false,
    sinceVersion: '1.20',
  },

  // ==========================================
  // --- Lighting & Functional ---
  // ==========================================
  {
    id: 'minecraft:lantern',
    name: 'Lantern',
    category: 'lighting',
    subCategory: 'lighting',
    material: 'metal',
    shapeType: 'lantern',
    colorHex: '#F6A838',
    roughness: 0.4,
    metalness: 0.6,
    supportsRotation: false,
    defaultState: { hanging: 'false', waterlogged: 'false' },
    properties: {
      hanging: ['true', 'false'],
      waterlogged: ['true', 'false'],
    },
    sinceVersion: '1.20',
  },
  {
    id: 'minecraft:sea_lantern',
    name: 'Sea Lantern',
    category: 'lighting',
    subCategory: 'lighting',
    material: 'glass',
    shapeType: 'full_cube',
    colorHex: '#A2C5BF',
    roughness: 0.2,
    supportsRotation: false,
    sinceVersion: '1.20',
  },
  {
    id: 'minecraft:glowstone',
    name: 'Glowstone',
    category: 'lighting',
    subCategory: 'lighting',
    material: 'stone',
    shapeType: 'full_cube',
    colorHex: '#A78142',
    roughness: 0.8,
    supportsRotation: false,
    sinceVersion: '1.20',
  },
  {
    id: 'minecraft:chain',
    name: 'Chain',
    category: 'decoration',
    subCategory: 'iron',
    material: 'metal',
    shapeType: 'pane',
    colorHex: '#353942',
    roughness: 0.6,
    metalness: 0.8,
    supportsRotation: true,
    defaultState: { axis: 'y' },
    properties: { axis: ['x', 'y', 'z'] },
    sinceVersion: '1.20',
  },
  {
    id: 'minecraft:iron_bars',
    name: 'Iron Bars',
    category: 'decoration',
    subCategory: 'iron',
    material: 'metal',
    shapeType: 'pane',
    colorHex: '#878787',
    roughness: 0.5,
    metalness: 0.8,
    supportsRotation: false,
    sinceVersion: '1.20',
  },
  {
    id: 'minecraft:chest',
    name: 'Chest',
    category: 'functional',
    subCategory: 'storage',
    material: 'wood',
    shapeType: 'full_cube',
    colorHex: '#A06E28',
    roughness: 0.7,
    supportsRotation: true,
    allowedRotations: ['north', 'south', 'east', 'west'],
    defaultState: { facing: 'north' },
    properties: { facing: ['north', 'south', 'east', 'west'] },
    sinceVersion: '1.20',
  },
  {
    id: 'minecraft:crafting_table',
    name: 'Crafting Table',
    category: 'functional',
    subCategory: 'crafting',
    material: 'wood',
    shapeType: 'full_cube',
    colorHex: '#7C5332',
    roughness: 0.8,
    supportsRotation: false,
    sinceVersion: '1.20',
  },
  {
    id: 'minecraft:bookshelf',
    name: 'Bookshelf',
    category: 'decoration',
    subCategory: 'library',
    material: 'wood',
    shapeType: 'full_cube',
    colorHex: '#7D5F3A',
    roughness: 0.8,
    supportsRotation: false,
    sinceVersion: '1.20',
  },
  // ==========================================
  // --- Wool & Textiles (Organic & Sculptures) ---
  // ==========================================
  {
    id: 'minecraft:white_wool',
    name: 'White Wool',
    category: 'wool',
    subCategory: 'wool',
    material: 'wool',
    shapeType: 'full_cube',
    colorHex: '#E9ECEC',
    roughness: 0.95,
    supportsRotation: false,
    sinceVersion: '1.20',
  },
  {
    id: 'minecraft:brown_wool',
    name: 'Brown Wool',
    category: 'wool',
    subCategory: 'wool',
    material: 'wool',
    shapeType: 'full_cube',
    colorHex: '#724828',
    roughness: 0.95,
    supportsRotation: false,
    sinceVersion: '1.20',
  },
  {
    id: 'minecraft:gray_wool',
    name: 'Gray Wool',
    category: 'wool',
    subCategory: 'wool',
    material: 'wool',
    shapeType: 'full_cube',
    colorHex: '#42454A',
    roughness: 0.95,
    supportsRotation: false,
    sinceVersion: '1.20',
  },
  {
    id: 'minecraft:black_wool',
    name: 'Black Wool',
    category: 'wool',
    subCategory: 'wool',
    material: 'wool',
    shapeType: 'full_cube',
    colorHex: '#15151A',
    roughness: 0.95,
    supportsRotation: false,
    sinceVersion: '1.20',
  },
  {
    id: 'minecraft:calcite',
    name: 'Calcite',
    category: 'stone',
    subCategory: 'natural_stone',
    material: 'stone',
    shapeType: 'full_cube',
    colorHex: '#DFDFDE',
    roughness: 0.8,
    supportsRotation: false,
    sinceVersion: '1.20',
  },
  {
    id: 'minecraft:cherry_log',
    name: 'Cherry Log',
    category: 'wood',
    subCategory: 'logs',
    material: 'wood',
    shapeType: 'log',
    colorHex: '#352125',
    roughness: 0.8,
    supportsRotation: true,
    defaultState: { axis: 'y' },
    properties: { axis: ['x', 'y', 'z'] },
    sinceVersion: '1.20',
  },
  {
    id: 'minecraft:iron_block',
    name: 'Block of Iron',
    category: 'building',
    subCategory: 'metals',
    material: 'metal',
    shapeType: 'full_cube',
    colorHex: '#DCDCDC',
    roughness: 0.4,
    metalness: 0.8,
    supportsRotation: false,
    sinceVersion: '1.20',
  },
  {
    id: 'minecraft:blackstone',
    name: 'Blackstone',
    category: 'stone',
    subCategory: 'nether_stone',
    material: 'stone',
    shapeType: 'full_cube',
    colorHex: '#27221C',
    roughness: 0.85,
    supportsRotation: false,
    sinceVersion: '1.20',
  },
  {
    id: 'minecraft:polished_blackstone',
    name: 'Polished Blackstone',
    category: 'stone',
    subCategory: 'polished_stone',
    material: 'stone',
    shapeType: 'full_cube',
    colorHex: '#312C36',
    roughness: 0.7,
    supportsRotation: false,
    sinceVersion: '1.20',
  },
  {
    id: 'minecraft:blackstone_bricks',
    name: 'Blackstone Bricks',
    category: 'stone',
    subCategory: 'nether_stone',
    material: 'stone',
    shapeType: 'full_cube',
    colorHex: '#27221C',
    roughness: 0.85,
    supportsRotation: false,
    sinceVersion: '1.20',
  },
  {
    id: 'minecraft:sand',
    name: 'Sand',
    category: 'nature',
    subCategory: 'desert',
    material: 'sandstone',
    shapeType: 'full_cube',
    colorHex: '#DBD3A0',
    roughness: 0.95,
    supportsRotation: false,
    sinceVersion: '1.20',
  },
  {
    id: 'minecraft:pink_wool',
    name: 'Pink Wool',
    category: 'wool',
    subCategory: 'colored_wool',
    material: 'wool',
    shapeType: 'full_cube',
    colorHex: '#F38BAA',
    roughness: 0.9,
    supportsRotation: false,
    sinceVersion: '1.20',
  },
  {
    id: 'minecraft:torch',
    name: 'Torch',
    category: 'lighting',
    subCategory: 'torch',
    material: 'wood',
    shapeType: 'torch',
    colorHex: '#FFAA33',
    roughness: 0.5,
    supportsRotation: false,
    transparent: true,
    sinceVersion: '1.20',
  },
  {
    id: 'minecraft:oak_door',
    name: 'Oak Door',
    category: 'functional',
    subCategory: 'doors',
    material: 'wood',
    shapeType: 'door',
    colorHex: '#A06E28',
    roughness: 0.8,
    supportsRotation: true,
    allowedRotations: ['north', 'south', 'east', 'west'],
    defaultState: { facing: 'north', half: 'lower', hinge: 'left', open: 'false', powered: 'false' },
    properties: {
      facing: ['north', 'south', 'east', 'west'],
      half: ['lower', 'upper'],
      hinge: ['left', 'right'],
      open: ['true', 'false'],
      powered: ['true', 'false'],
    },
    transparent: true,
    sinceVersion: '1.20',
  },
  {
    id: 'minecraft:redstone_block',
    name: 'Block of Redstone',
    category: 'redstone',
    subCategory: 'power',
    material: 'metal',
    shapeType: 'full_cube',
    colorHex: '#E50000',
    roughness: 0.7,
    metalness: 0.1,
    supportsRotation: false,
    sinceVersion: '1.20',
  },
];

// Version Snapshot & Immutability Pinning Metadata
export const MINECRAFT_VERSION = '1.21.4';
export const REGISTRY_SNAPSHOT_ID = 'snapshot-java-1.21.4-v1';
export const ASSET_MANIFEST_HASH = 'sha256-4b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c';

// Canonical Aliases for Common Generic Names
const CANONICAL_ALIASES: Record<string, string> = {
  'minecraft:leaves': 'minecraft:oak_leaves',
  'leaves': 'minecraft:oak_leaves',
  'minecraft:fence': 'minecraft:oak_fence',
  'fence': 'minecraft:oak_fence',
  'minecraft:wall': 'minecraft:cobblestone_wall',
  'wall': 'minecraft:cobblestone_wall',
  'minecraft:door': 'minecraft:oak_door',
  'door': 'minecraft:oak_door',
  'minecraft:trapdoor': 'minecraft:oak_trapdoor',
  'trapdoor': 'minecraft:oak_trapdoor',
  'minecraft:redstone': 'minecraft:redstone_block',
  'redstone': 'minecraft:redstone_block',
};

// Fast lookup map by block ID
const BLOCK_MAP = new Map<string, MinecraftBlock>();
for (const b of MINECRAFT_BLOCKS) {
  BLOCK_MAP.set(b.id, b);
}

export function getMinecraftBlock(id: string): MinecraftBlock | undefined {
  if (!id) return undefined;
  const direct = BLOCK_MAP.get(id);
  if (direct) return direct;

  const namespaced = id.startsWith('minecraft:') ? id : `minecraft:${id}`;
  const nsMatch = BLOCK_MAP.get(namespaced);
  if (nsMatch) return nsMatch;

  const aliasedId = CANONICAL_ALIASES[id] || CANONICAL_ALIASES[namespaced];
  if (aliasedId) {
    return BLOCK_MAP.get(aliasedId);
  }

  return undefined;
}

export function isValidBlockId(id: string): boolean {
  return getMinecraftBlock(id) !== undefined;
}

export function isValidBlockState(id: string, state?: Record<string, string>): boolean {
  const block = getMinecraftBlock(id);
  if (!block) return false;
  if (!state || Object.keys(state).length === 0) return true;
  if (!block.properties) return true;

  for (const [key, value] of Object.entries(state)) {
    const allowed = block.properties[key];
    if (allowed && !allowed.includes(value)) {
      return false;
    }
  }
  return true;
}

/**
 * Filter registry blocks available in target Minecraft version
 */
export function getBlocksForVersion(version: '1.20' | '1.21' = '1.21'): MinecraftBlock[] {
  if (version === '1.21') {
    return MINECRAFT_BLOCKS;
  }
  return MINECRAFT_BLOCKS.filter((b) => b.sinceVersion !== '1.21');
}

/**
 * Alias for AI Block Solver querying valid Minecraft blocks for a version
 */
export function getValidBlocks(version: '1.20' | '1.21' = '1.21'): MinecraftBlock[] {
  return getBlocksForVersion(version);
}

/**
 * Resolves the canonical Minecraft model identifier for a block and state
 */
export function resolveBlockModel(blockId: string, state?: Record<string, string>): string {
  const def = getMinecraftBlock(blockId);
  const cleanId = (def?.id || blockId).replace('minecraft:', '');
  const shape = def?.shapeType || 'full_cube';

  if (shape === 'stairs') {
    return `minecraft:block/${cleanId}`;
  }
  if (shape === 'slab') {
    const type = state?.type || 'bottom';
    if (type === 'top') return `minecraft:block/${cleanId}_top`;
    if (type === 'double') return `minecraft:block/${cleanId.replace('_slab', '')}`;
    return `minecraft:block/${cleanId}`;
  }
  if (shape === 'door') {
    const half = state?.half || 'lower';
    return `minecraft:block/${cleanId}_${half}`;
  }
  if (shape === 'pane') {
    return `minecraft:block/${cleanId}_post`;
  }
  if (cleanId === 'grass_block') {
    return 'minecraft:block/grass_block';
  }
  if (cleanId.includes('log')) {
    const axis = state?.axis || 'y';
    return axis === 'y' ? `minecraft:block/${cleanId}` : `minecraft:block/${cleanId}_horizontal`;
  }
  return `minecraft:block/${cleanId}`;
}

/**
 * Resolves the canonical Minecraft texture identifier(s) for a block and state
 */
export function resolveBlockTexture(blockId: string, state?: Record<string, string>): string {
  const def = getMinecraftBlock(blockId);
  const cleanId = (def?.id || blockId).replace('minecraft:', '');

  if (cleanId.includes('stairs')) {
    const base = cleanId.replace('_stairs', '');
    return `minecraft:block/${base}`;
  }
  if (cleanId.includes('slab')) {
    const base = cleanId.replace('_slab', '');
    return `minecraft:block/${base}`;
  }
  if (cleanId === 'grass_block') {
    return 'minecraft:block/grass_block_top, minecraft:block/grass_block_side, minecraft:block/dirt';
  }
  if (cleanId.includes('log')) {
    return `minecraft:block/${cleanId} (side), minecraft:block/${cleanId}_top (end)`;
  }
  if (cleanId === 'cobblestone_wall') {
    return 'minecraft:block/cobblestone';
  }
  if (cleanId === 'oak_fence') {
    return 'minecraft:block/oak_planks';
  }
  if (cleanId === 'iron_bars') {
    return 'minecraft:block/iron_bars';
  }
  if (cleanId === 'glass_pane') {
    return 'minecraft:block/glass';
  }
  return `minecraft:block/${cleanId}`;
}

/**
 * Version Substitution Rules (Substitutes 1.21 blocks when building in 1.20)
 */
export function substituteBlockForVersion(
  blockId: string,
  targetVersion: '1.20' | '1.21'
): { substituted: boolean; blockId: string; reason?: string } {
  if (targetVersion === '1.21') {
    return { substituted: false, blockId };
  }

  const substitutions: Record<string, { replacement: string; reason: string }> = {
    'minecraft:tuff': { replacement: 'minecraft:deepslate', reason: 'Tuff building block substituted for 1.20' },
    'minecraft:tuff_bricks': { replacement: 'minecraft:deepslate_tiles', reason: 'Tuff Bricks introduced in 1.21' },
    'minecraft:tuff_brick_stairs': { replacement: 'minecraft:deepslate_tile_stairs', reason: 'Tuff Brick Stairs introduced in 1.21' },
    'minecraft:copper_grate': { replacement: 'minecraft:iron_bars', reason: 'Copper Grate introduced in 1.21' },
    'minecraft:copper_door': { replacement: 'minecraft:oak_door', reason: 'Copper Door introduced in 1.21' },
    'minecraft:oxidized_copper_door': { replacement: 'minecraft:dark_oak_door', reason: 'Oxidized Copper Door introduced in 1.21' },
  };

  const match = substitutions[blockId];
  if (match) {
    return { substituted: true, blockId: match.replacement, reason: match.reason };
  }

  return { substituted: false, blockId };
}

export function getBlocksByCategory(category: BlockCategory, version: '1.20' | '1.21' = '1.21'): MinecraftBlock[] {
  return getBlocksForVersion(version).filter((b) => b.category === category);
}

export function getStairBlockForMaterial(material: string): string {
  const mat = material.toLowerCase();
  if (mat.includes('quartz') || mat.includes('white')) return 'minecraft:smooth_quartz_stairs';
  if (mat.includes('spruce')) return 'minecraft:spruce_stairs';
  if (mat.includes('dark_oak')) return 'minecraft:dark_oak_stairs';
  if (mat.includes('cherry')) return 'minecraft:cherry_stairs';
  if (mat.includes('oak')) return 'minecraft:oak_stairs';
  if (mat.includes('deepslate')) return 'minecraft:deepslate_tile_stairs';
  if (mat.includes('tuff')) return 'minecraft:tuff_brick_stairs';
  if (mat.includes('brick') && !mat.includes('stone')) return 'minecraft:brick_stairs';
  if (mat.includes('sandstone')) return 'minecraft:sandstone_stairs';
  if (mat.includes('cobble')) return 'minecraft:cobblestone_stairs';
  return 'minecraft:stone_brick_stairs';
}

export function getSlabBlockForMaterial(material: string): string {
  const mat = material.toLowerCase();
  if (mat.includes('quartz') || mat.includes('white')) return 'minecraft:smooth_quartz_slab';
  if (mat.includes('spruce')) return 'minecraft:spruce_slab';
  if (mat.includes('dark_oak')) return 'minecraft:dark_oak_slab';
  if (mat.includes('oak')) return 'minecraft:oak_slab';
  if (mat.includes('deepslate')) return 'minecraft:deepslate_tile_slab';
  if (mat.includes('sandstone')) return 'minecraft:sandstone_slab';
  if (mat.includes('cobble')) return 'minecraft:cobblestone_slab';
  return 'minecraft:stone_brick_slab';
}

export function getFullBlockForMaterial(material: string): string {
  const mat = material.toLowerCase();
  if (mat.includes('quartz') || mat.includes('white')) return 'minecraft:smooth_quartz';
  if (mat.includes('concrete')) return 'minecraft:white_concrete';
  if (mat.includes('spruce')) return 'minecraft:spruce_planks';
  if (mat.includes('dark_oak')) return 'minecraft:dark_oak_planks';
  if (mat.includes('cherry')) return 'minecraft:cherry_planks';
  if (mat.includes('oak')) return 'minecraft:oak_planks';
  if (mat.includes('deepslate')) return 'minecraft:deepslate_tiles';
  if (mat.includes('tuff')) return 'minecraft:tuff_bricks';
  if (mat.includes('copper')) return 'minecraft:cut_copper';
  if (mat.includes('sandstone')) return 'minecraft:sandstone';
  if (mat.includes('cobble')) return 'minecraft:cobblestone';
  if (mat.includes('brick') && !mat.includes('stone')) return 'minecraft:bricks';
  return 'minecraft:stone_bricks';
}
