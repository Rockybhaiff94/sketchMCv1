import {
  ReferenceBuilding,
  Neutral3DModel,
  DepthModel,
  ArchitecturalComponent,
  SurfaceRegion,
  Opening3D,
  MaterialRegion3D,
  DepthLayer,
  CameraEstimate,
  SymmetryInfo,
  ArchitecturalModule,
  DepthOcclusionItem,
} from '../../types/minecraft';

export function buildNeutral3DModel(
  building: ReferenceBuilding,
  scale: number = 1.0
): { neutralModel: Neutral3DModel; depthModel: DepthModel } {
  const widthMeters = (building.overallWidth || 28) * scale;
  const heightMeters = (building.overallHeight || 18) * scale;
  const depthMeters = (building.estimatedDepth || 22) * scale;

  const halfWidth = widthMeters / 2;
  const halfDepth = depthMeters / 2;

  // 1. Continuous Depth Layers
  const depthLayers: DepthLayer[] = [
    {
      index: 0,
      depthMeters: 1.2 * scale,
      description: 'Foreground Layer: Exterior landscaping, paths, approach elements',
      regionIds: ['foreground_curbed_flower_beds', 'foreground_climbing_vegetation', 'ground_approach_path'],
      isForeground: true,
      isInterior: false,
    },
    {
      index: 1,
      depthMeters: 2.2 * scale,
      description: 'Primary Structural Layer: Vertical piers, foundation, structural frame',
      regionIds: ['facade_structural_columns', 'foundation_skirting', 'facade_arch_entrance'],
      isForeground: false,
      isInterior: false,
    },
    {
      index: 2,
      depthMeters: 2.8 * scale,
      description: 'Glazing & Opening Layer: Inset window bays, door openings, window grids',
      regionIds: ['facade_left_window_bay', 'facade_right_window_bay', 'door_portal_infill'],
      isForeground: false,
      isInterior: false,
    },
    {
      index: 3,
      depthMeters: 5.5 * scale,
      description: 'Roof & Interior Volume: Roof structure, interior space, transverse elements',
      regionIds: ['facade_glass_central_vault', 'interior_hall', 'canopy_ribs'],
      isForeground: false,
      isInterior: true,
    },
    {
      index: 4,
      depthMeters: depthMeters,
      description: 'Rear Structural Plane: Back wall, rear features, perimeter boundary',
      regionIds: ['rear_wall_plane', 'perimeter_boundary'],
      isForeground: false,
      isInterior: false,
    },
  ];

  // 2. Continuous Architectural Components
  const components: ArchitecturalComponent[] = [];

  // A. Foundation Skirting
  components.push({
    id: 'comp_foundation',
    type: 'slab_floor',
    name: 'Foundation Skirting Platform',
    bounds: {
      min: { x: -halfWidth, y: 0, z: -halfDepth },
      max: { x: halfWidth, y: 1.2 * scale, z: halfDepth },
    },
    orientation: 'y',
    thickness: 1.2 * scale,
    materialRegionId: 'mat_dark_masonry',
    depthLayerIndex: 1,
    provenance: 'observed',
  });

  // B. Structural Columns / Pilasters
  for (const col of building.columns || []) {
    components.push({
      id: `comp_col_${col.x}_${col.z}`,
      type: 'column_shaft',
      name: `Pilaster Pier at (${col.x}, ${col.z})`,
      bounds: {
        min: { x: (col.x - 0.5) * scale, y: col.minY * scale, z: (col.z - 0.5) * scale },
        max: { x: (col.x + 0.5) * scale, y: col.maxY * scale, z: (col.z + 0.5) * scale },
      },
      orientation: 'y',
      thickness: col.thickness * scale,
      materialRegionId: 'mat_dark_masonry',
      depthLayerIndex: 1,
      provenance: 'observed',
    });
  }

  // C. Front Facade Bays
  for (const bay of building.facadeBays || []) {
    const isCentral = bay.bayIndex === 1;
    const bayMinX = bay.xMinRatio * widthMeters;
    const bayMaxX = bay.xMaxRatio * widthMeters;
    const bayWidth = bayMaxX - bayMinX;
    const bayHeight = (building.overallHeight || 18) * 0.45 * scale;
    components.push({
      id: `comp_bay_${bay.bayIndex}`,
      type: isCentral ? 'arch_curved' : 'wall_plane',
      name: isCentral ? 'Central Arched Entrance Bay' : `Glazed Window Bay ${bay.bayIndex + 1}`,
      bounds: {
        min: { x: bayMinX, y: 1.2 * scale, z: -halfDepth + 0.6 * scale },
        max: { x: bayMaxX, y: (1.2 + bayHeight), z: -halfDepth + 0.6 * scale },
      },
      orientation: 'z',
      thickness: 0.3 * scale,
      curvatureRadius: isCentral ? (bayWidth / 2) : undefined,
      materialRegionId: isCentral ? 'mat_copper_portal' : 'mat_clear_glazing',
      depthLayerIndex: 2,
      provenance: 'observed',
    });
  }

  // D. Curved Roof Canopy Vault
  components.push({
    id: 'comp_roof_vault',
    type: 'roof_vault',
    name: 'Curved Stained Glass Canopy Vault',
    bounds: {
      min: { x: -halfWidth, y: 8.0 * scale, z: -halfDepth },
      max: { x: halfWidth, y: (8.0 + (building.roof?.heightBlocks || 7)) * scale, z: halfDepth },
    },
    orientation: 'z',
    thickness: 0.5 * scale,
    curvatureRadius: (widthMeters / 2) * 1.1,
    materialRegionId: 'mat_pink_stained_vault',
    depthLayerIndex: 3,
    provenance: 'observed',
  });

  // E. Exterior Climbing Foliage
  if (building.vegetation?.hasClimbingLeaves) {
    components.push({
      id: 'comp_climbing_foliage',
      type: 'vegetation_cluster',
      name: 'Exterior Climbing Trellis Foliage',
      bounds: {
        min: { x: -halfWidth, y: 1.2 * scale, z: -halfDepth - 0.4 * scale },
        max: { x: -halfWidth * 0.4, y: 9.0 * scale, z: -halfDepth },
      },
      orientation: 'z',
      thickness: 0.4 * scale,
      materialRegionId: 'mat_living_foliage',
      depthLayerIndex: 0,
      provenance: 'observed',
    });
  }

  // F. Curbed Flower Beds
  components.push({
    id: 'comp_curbed_flower_beds',
    type: 'slab_floor',
    name: 'Stone-Bordered Raised Flower Beds',
    bounds: {
      min: { x: -halfWidth, y: 0, z: -halfDepth - 3.0 * scale },
      max: { x: halfWidth, y: 0.6 * scale, z: -halfDepth },
    },
    orientation: 'y',
    thickness: 0.6 * scale,
    materialRegionId: 'mat_living_foliage',
    depthLayerIndex: 0,
    provenance: 'observed',
  });

  // G. Ground Approach Path Ribbon
  if (building.terrain?.hasCentralPath) {
    const pw = (building.terrain.pathWidth || 4) * scale;
    components.push({
      id: 'comp_path_ribbon',
      type: 'path_ribbon',
      name: 'Paved Approach Path Ribbon',
      bounds: {
        min: { x: -pw / 2, y: 0, z: -halfDepth - 10 * scale },
        max: { x: pw / 2, y: 0.1 * scale, z: -halfDepth },
      },
      orientation: 'y',
      thickness: 0.1 * scale,
      materialRegionId: 'mat_paved_stone',
      depthLayerIndex: 0,
      provenance: 'observed',
    });
  }

  // 3. Openings with Depth Inset
  const openings: Opening3D[] = [
    {
      id: 'open_central_entrance',
      type: 'door',
      hostComponentId: 'comp_bay_1',
      center: { x: 0, y: 3.5 * scale, z: -halfDepth + 0.6 * scale },
      width: 4.0 * scale,
      height: 5.5 * scale,
      hasFrame: true,
      depthInset: 0.4 * scale,
    },
    {
      id: 'open_left_window',
      type: 'window',
      hostComponentId: 'comp_bay_0',
      center: { x: -halfWidth * 0.55, y: 4.5 * scale, z: -halfDepth + 0.6 * scale },
      width: 6.5 * scale,
      height: 6.0 * scale,
      hasFrame: true,
      depthInset: 0.5 * scale,
    },
    {
      id: 'open_right_window',
      type: 'window',
      hostComponentId: 'comp_bay_2',
      center: { x: halfWidth * 0.55, y: 4.5 * scale, z: -halfDepth + 0.6 * scale },
      width: 6.5 * scale,
      height: 6.0 * scale,
      hasFrame: true,
      depthInset: 0.5 * scale,
    },
  ];

  // 4. Continuous Material Regions
  const materials: MaterialRegion3D[] = [
    {
      id: 'mat_dark_masonry',
      name: 'Dark Masonry / Deepslate Piers',
      apparentColor: '#343438',
      surfaceRoughness: 0.75,
      transparency: 0,
      subsurfaceType: 'masonry',
      candidateMinecraftIds: [
        'minecraft:deepslate_tiles',
        'minecraft:deepslate_bricks',
        'minecraft:deepslate_brick_stairs',
        'minecraft:deepslate_brick_slab',
        'minecraft:polished_blackstone_bricks',
      ],
    },
    {
      id: 'mat_pink_stained_vault',
      name: 'Rose Stained Glass Canopy',
      apparentColor: '#d4889c',
      surfaceRoughness: 0.1,
      transparency: 0.7,
      subsurfaceType: 'stained_glass',
      candidateMinecraftIds: ['minecraft:pink_stained_glass', 'minecraft:tinted_glass'],
    },
    {
      id: 'mat_clear_glazing',
      name: 'Cyan / Transparent Glazing Panes',
      apparentColor: '#e0f0f8',
      surfaceRoughness: 0.05,
      transparency: 0.85,
      subsurfaceType: 'clear_glass',
      candidateMinecraftIds: ['minecraft:light_blue_stained_glass_pane', 'minecraft:glass_pane'],
    },
    {
      id: 'mat_copper_portal',
      name: 'Oxidized Copper Portal Framework',
      apparentColor: '#529074',
      surfaceRoughness: 0.6,
      transparency: 0.1,
      subsurfaceType: 'iron_frame',
      candidateMinecraftIds: ['minecraft:copper_door', 'minecraft:oxidized_copper', 'minecraft:oxidized_cut_copper_stairs'],
    },
    {
      id: 'mat_living_foliage',
      name: 'Lush Organic Foliage & Blossoms',
      apparentColor: '#4e7837',
      surfaceRoughness: 0.9,
      transparency: 0.35,
      subsurfaceType: 'living_foliage',
      candidateMinecraftIds: ['minecraft:oak_leaves', 'minecraft:vine', 'minecraft:moss_block', 'minecraft:peony', 'minecraft:lilac'],
    },
    {
      id: 'mat_paved_stone',
      name: 'Weathered Paved Stone Cobble',
      apparentColor: '#707074',
      surfaceRoughness: 0.8,
      transparency: 0,
      subsurfaceType: 'paved_stone',
      candidateMinecraftIds: ['minecraft:cobblestone', 'minecraft:stone_bricks', 'minecraft:stone_brick_slab', 'minecraft:gravel'],
    },
  ];

  // 5. Continuous Surfaces
  const surfaces: SurfaceRegion[] = [
    {
      id: 'surf_facade_plane',
      componentId: 'comp_bay_1',
      normal: { x: 0, y: 0, z: -1 },
      areaMetersSq: widthMeters * 8.0 * scale,
      roughness: 0.3,
      colorHex: '#343438',
    },
    {
      id: 'surf_vault_curve',
      componentId: 'comp_roof_vault',
      normal: { x: 0, y: 1, z: 0 },
      areaMetersSq: widthMeters * depthMeters * 1.3,
      roughness: 0.1,
      colorHex: '#d4889c',
    },
  ];

  // 6. Camera Estimate (Front 3/4 perspective matching reference)
  const camera: CameraEstimate = {
    position: { x: 0, y: 5.5 * scale, z: -halfDepth - 22 * scale },
    target: { x: 0, y: (heightMeters * 0.45), z: 0 },
    fov: 48,
    pitchDegrees: 4.5,
    yawDegrees: 0,
    projectionType: 'perspective',
    estimatedHorizonRatio: 0.42,
  };

  // 7. Bilateral Symmetry Information
  const symmetry: SymmetryInfo[] = [
    {
      plane: 'yz',
      centerCoordinate: 0,
      confidence: 0.98,
      matchedComponentsCount: components.length,
    },
  ];

  // 8. Architectural Modules (Window Bay repetition)
  const modules: ArchitecturalModule[] = [
    {
      id: 'mod_glazed_window_bay',
      name: 'Fluted Bay Window Module with Arch Lintel',
      moduleType: 'window_bay',
      dimension: { x: 7.0 * scale, y: 7.0 * scale, z: 1.0 * scale },
      instancePositions: [
        { x: -halfWidth * 0.55, y: 1.2 * scale, z: -halfDepth + 0.6 * scale },
        { x: halfWidth * 0.55, y: 1.2 * scale, z: -halfDepth + 0.6 * scale },
      ],
      repeatCount: 2,
    },
  ];

  const neutralModel: Neutral3DModel = {
    dimensions: { x: widthMeters, y: heightMeters, z: depthMeters },
    components,
    surfaces,
    openings,
    materials,
    depthLayers,
    camera,
    symmetry,
    modules,
  };

  // 9. Depth and Occlusion Model
  const occlusionMap: DepthOcclusionItem[] = [
    {
      foregroundRegionId: 'foreground_climbing_vegetation',
      backgroundRegionId: 'facade_left_window_bay',
      overlapRatio: 0.35,
      distanceSeparationMeters: 1.2 * scale,
    },
    {
      foregroundRegionId: 'facade_structural_columns',
      backgroundRegionId: 'facade_left_window_bay',
      overlapRatio: 0.15,
      distanceSeparationMeters: 0.5 * scale,
    },
    {
      foregroundRegionId: 'foreground_curbed_flower_beds',
      backgroundRegionId: 'foundation_skirting',
      overlapRatio: 0.45,
      distanceSeparationMeters: 2.0 * scale,
    },
  ];

  const depthModel: DepthModel = {
    layers: depthLayers,
    occlusionMap,
    focalPlaneDepth: 2.5 * scale,
    maxEstimatedDepth: depthMeters,
  };

  return { neutralModel, depthModel };
}
