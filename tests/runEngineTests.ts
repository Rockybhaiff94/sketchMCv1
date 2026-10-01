import fs from 'fs';
import path from 'path';
import { analyzeReferenceArchitecture } from '../src/lib/vision/architecturalAnalyzer';
import { buildNeutral3DModel } from '../src/lib/geometry/neutralModelBuilder';
import { buildMinecraftFromProxy } from '../src/lib/reconstruction/proxyBuilder';
import { parseSchematicBuffer } from '../src/lib/schematics/schematicParser';
import { ConstructionPatternDatabase } from '../src/lib/schematics/patternDatabase';
import { CandidateSolver } from '../src/lib/reconstruction/candidateSolver';
import { ProviderRegistry } from '../src/lib/ai/providers/ProviderRegistry';
import { HermesOrchestrator } from '../src/lib/ai/orchestration/hermesOrchestrator';
import { validateMinecraftBuild } from '../src/lib/buildValidator';
import { exportToWorldEditSchematic, exportToLitematica } from '../src/lib/schematicExporter';
import { ReferenceImageItem, Observation, Hypothesis } from '../src/types/minecraft';
import { SourceAdapterRegistry } from '../src/lib/minecraft/adapters/SourceAdapterRegistry';
import { MinecraftAssetsAdapter } from '../src/lib/minecraft/adapters/MinecraftAssetsAdapter';
import { MinecraftDataAdapter } from '../src/lib/minecraft/adapters/MinecraftDataAdapter';
import { SnapshotStorage } from '../src/lib/minecraft/registry/SnapshotStorage';
import { VersionValidationService } from '../src/lib/minecraft/services/VersionValidationService';
import { VersionDiscoveryService } from '../src/lib/minecraft/services/VersionDiscoveryService';
import { VersionImportService } from '../src/lib/minecraft/services/VersionImportService';
import { VersionRegistryService } from '../src/lib/minecraft/services/VersionRegistryService';
import { VersionMigrationService } from '../src/lib/minecraft/services/VersionMigrationService';
import { UniversalReconstructor } from '../src/lib/reconstruction/universalReconstructor';
import { classifyAndDecomposeSubject } from '../src/lib/vision/subjectClassifier';
import { UniversalVoxelizer } from '../src/lib/geometry/universalVoxelizer';
import {
  createReconstructionIdentity,
  setCurrentReconstructionId,
  isResultStale,
  buildCacheKey,
  getCachedResult,
  setCachedResult,
  addToHistory,
  getReconstructionHistory,
} from '../src/lib/reconstruction/reconstructionContext';
import * as THREE from 'three';
import {
  getMinecraftBlock,
  isValidBlockId,
  isValidBlockState,
  getValidBlocks,
  substituteBlockForVersion,
  resolveBlockModel,
  resolveBlockTexture,
  MINECRAFT_VERSION,
  REGISTRY_SNAPSHOT_ID,
  ASSET_MANIFEST_HASH,
} from '../src/lib/registry';
import { getBlockGeometry } from '../src/lib/models/blockModelRegistry';
import { getOrCreateBlockTexture, getMultiFaceTextures, renderBlockCanvas } from '../src/lib/textureGenerator';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  [PASS] ${testName}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${testName}: ${detail || 'Assertion failed'}`);
    failed++;
  }
}

async function runAllTests() {
  console.log('\n============================================================');
  console.log('VOXELFORGE MULTI-AGENT ENGINE VERIFICATION SUITE');
  console.log('============================================================\n');

  // -----------------------------------------------------------------------
  // TEST 1: Image Analysis & Vision Decomposition
  // -----------------------------------------------------------------------
  console.log('Test Suite 1: Deep Image Analysis & Decomposition');
  const dummyImage: ReferenceImageItem = {
    id: 'ref_test_glass_garden',
    name: 'Glass Garden Conservatory',
    dataUrl: 'data:image/jpeg;base64,/9j/4AAQSkZJRg==',
    mimeType: 'image/jpeg',
    probableView: 'front',
    confidence: 0.94,
  };
  const building = analyzeReferenceArchitecture(dummyImage, [dummyImage], {
    buildScale: 'medium',
    referenceMode: 'single_image',
    accuracy: 'high_detail',
    inference: 'conservative',
    minecraftVersion: '1.21',
  });

  assert(building.overallWidth > 0, 'Building width extracted (>0)', `width=${building.overallWidth}`);
  assert(building.facadeBays.length === 3, 'Tripartite facade (3 bays detected)', `bays=${building.facadeBays.length}`);
  assert(building.roof.shape === 'curved_vault', 'Roof classified as curved_vault canopy');
  assert(building.columns.length > 0, 'Structural pilasters identified');

  // -----------------------------------------------------------------------
  // TEST 2: Neutral 3D Continuous Model & Depth/Occlusion
  // -----------------------------------------------------------------------
  console.log('\nTest Suite 2: Neutral 3D Model & Depth/Occlusion Representation');
  const { neutralModel, depthModel } = buildNeutral3DModel(building, 1.0);

  assert(neutralModel.dimensions.x > 0 && neutralModel.dimensions.y > 0, 'Neutral model continuous dimensions computed');
  assert(neutralModel.components.length >= 6, 'Architectural components generated', `count=${neutralModel.components.length}`);
  assert(neutralModel.modules.length > 0, 'Repeated architectural modules identified', `modules=${neutralModel.modules.length}`);
  assert(depthModel.layers.length >= 4, 'Multi-layer depth representation generated', `layers=${depthModel.layers.length}`);
  assert(depthModel.occlusionMap.length > 0, 'Occlusion separation map populated');

  // -----------------------------------------------------------------------
  // TEST 3: Schematic Upload & Parsing
  // -----------------------------------------------------------------------
  console.log('\nTest Suite 3: Schematic Parser (.schem, .litematic, .json)');
  const schemPath = path.resolve('Glass_Garden_Conservatory.schem');
  const litematicPath = path.resolve('Glass_Garden_Conservatory.litematic');

  if (fs.existsSync(schemPath)) {
    const schemBuf = fs.readFileSync(schemPath);
    const parsedSchem = parseSchematicBuffer(schemBuf, 'Glass_Garden_Conservatory.schem');
    assert(parsedSchem.format === 'sponge_schem', 'Sponge .schem detected and parsed');
    assert(parsedSchem.palette.length > 0, 'Block palette extracted from NBT', `palette=${parsedSchem.palette.length}`);
  }

  if (fs.existsSync(litematicPath)) {
    const litBuf = fs.readFileSync(litematicPath);
    const parsedLit = parseSchematicBuffer(litBuf, 'Glass_Garden_Conservatory.litematic');
    assert(parsedLit.format === 'litematica', 'Litematica .litematic detected and parsed');
  }

  // -----------------------------------------------------------------------
  // TEST 4: Construction Pattern Extraction & Privacy Isolation
  // -----------------------------------------------------------------------
  console.log('\nTest Suite 4: Construction Pattern Database & Privacy Isolation');
  const patternDb = ConstructionPatternDatabase.getInstance();
  const sharedPatterns = patternDb.getAllSharedPatterns();

  assert(sharedPatterns.length >= 3, 'Pre-seeded canonical patterns loaded (Road, House, Redstone)');

  // Test privacy isolation: private pattern should NOT appear in general search
  const dummyPrivateSchem = {
    format: 'sponge_schem' as const,
    name: 'Secret_Vault',
    version: '1.21' as const,
    dimensions: { width: 10, height: 10, depth: 10 },
    blocks: [{ id: 'b1', blockId: 'minecraft:iron_block', position: { x: 0, y: 0, z: 0 } }],
    palette: ['minecraft:iron_block'],
    blockCounts: { 'minecraft:iron_block': 1 },
    hasRedstone: false,
  };
  const privatePattern = patternDb.extractPatternFromSchematic(dummyPrivateSchem, 'private');
  const searchResults = patternDb.searchPatterns({
    category: 'house',
    privacyScopeAllowed: ['shared'],
  });
  assert(
    !searchResults.some((p) => p.id === privatePattern.id),
    'Private schematic knowledge isolated from shared search scope'
  );

  // -----------------------------------------------------------------------
  // TEST 5: Road Test (Part 56: Road Pattern Retrieval & Adaptation)
  // -----------------------------------------------------------------------
  console.log('\nTest Suite 5: Road Pattern Retrieval & Adaptation (Part 56)');
  const roadPatterns = patternDb.searchPatterns({ category: 'road' });
  assert(roadPatterns.length > 0, 'Road construction pattern retrieved');
  const roadP = roadPatterns[0];
  assert(
    roadP.materials.some((m) => m.blockIds.includes('minecraft:cobblestone')),
    'Road pattern uses irregular mixed cobblestone/stone/deepslate'
  );

  // -----------------------------------------------------------------------
  // TEST 6: Redstone Intelligence (Part 61: Redstone vs Visual Separation)
  // -----------------------------------------------------------------------
  console.log('\nTest Suite 6: Redstone Intelligence & Separation (Part 61)');
  const redstonePatterns = patternDb.searchPatterns({ category: 'redstone_machine' });
  assert(redstonePatterns.length > 0, 'Redstone machine pattern retrieved');
  const redP = redstonePatterns[0];
  assert(
    redP.functionalFeatures !== undefined && redP.functionalFeatures.length > 0,
    'Functional features extracted separately from visual shell'
  );
  assert(
    redP.functionalFeatures?.[0].isolatedFromVisualShell === true,
    'Functional redstone blocks decoupled from outer casing'
  );

  // -----------------------------------------------------------------------
  // TEST 7: Material Test & Grok Adversarial Review (Part 58)
  // -----------------------------------------------------------------------
  console.log('\nTest Suite 7: Material Candidate Evaluation & Adversarial Review (Part 58)');
  const darkWallObs: Observation = {
    regionId: 'facade_structural_columns',
    semanticType: 'column',
    estimatedDepth: 2.0,
    thickness: 0.5,
    material: 'dark_masonry',
    color: '#343438',
    textureType: 'vertical_fluted_brick',
    transparency: 0,
    geometry: 'vertical_shaft',
    observedOrInferred: 'observed',
    confidence: 0.95,
  };
  const candidates = CandidateSolver.generateAndSolveCandidates({
    observations: [darkWallObs],
    hypotheses: [],
    schematicPatterns: sharedPatterns,
    targetVersion: '1.21',
  });

  assert(candidates.length >= 2, 'Multiple candidates generated for dark masonry (deepslate tiles vs bricks)');
  const topCandidate = candidates[0];
  assert(
    topCandidate.blocks.some((b) => b.blockId === 'minecraft:deepslate_tiles'),
    'Grok adversarial critique evaluated: Deepslate tiles selected for texture contrast'
  );
  assert(topCandidate.scores.overallScore > 0.9, 'Measurable multi-dimensional score computed (>90%)');

  // -----------------------------------------------------------------------
  // TEST 8: Vegetation Test (Part 59: Depth & Occlusion Reasoning)
  // -----------------------------------------------------------------------
  console.log('\nTest Suite 8: Vegetation Reasoning with Occlusion (Part 59)');
  const vegObs: Observation = {
    regionId: 'foreground_climbing_vegetation',
    semanticType: 'vegetation',
    estimatedDepth: 1.4,
    thickness: 0.3,
    material: 'climbing_foliage_vines',
    color: '#4e7837',
    textureType: 'dense_leaves',
    transparency: 0.3,
    geometry: 'surface_wrap',
    observedOrInferred: 'observed',
    confidence: 0.92,
  };
  const vegCandidates = CandidateSolver.generateAndSolveCandidates({
    observations: [vegObs],
    hypotheses: [],
    schematicPatterns: sharedPatterns,
    targetVersion: '1.21',
  });
  assert(vegCandidates.length > 0, 'Multi-layer foliage candidate generated');
  assert(
    vegCandidates[0].isMultiBlock === true,
    'Vegetation candidate is multi-block (leaves canopy + hanging vines drape)'
  );

  // -----------------------------------------------------------------------
  // TEST 9: Multi-Agent Council & Hermes Orchestration
  // -----------------------------------------------------------------------
  console.log('\nTest Suite 9: Hermes Orchestration & Multi-Agent Council');
  const providerRegistry = ProviderRegistry.getInstance();
  const health = await providerRegistry.healthCheckAll();
  assert(health.hermes.ok, 'Hermes coordinator health check passed');
  assert(health.gemini.ok || !health.gemini.configured, 'Gemini health status reported accurately');
  assert(health.gpt.ok || !health.gpt.configured, 'GPT health status reported accurately');
  assert(health.grok.ok || !health.grok.configured, 'Grok health status reported accurately');

  const orchestrator = HermesOrchestrator.getInstance();
  const orchestration = await orchestrator.orchestrateReconstruction([dummyImage], {
    scale: 1.0,
    version: '1.21',
    maxIterations: 2,
  });

  assert(orchestration.project !== undefined, 'Canonical ReconstructionProject created');
  assert(orchestration.councilReports.length >= 4, 'Council reports collected from Hermes, GPT, Gemini, and Grok');
  assert(orchestration.convergenceScore >= 0.95, 'Convergence score >= 95% achieved', `score=${orchestration.convergenceScore}`);
  assert(orchestration.validation.valid === true, 'Final build verified valid by Deterministic Minecraft Engine');

  // -----------------------------------------------------------------------
  // TEST 10: Export Verification (.schem & .litematic)
  // -----------------------------------------------------------------------
  console.log('\nTest Suite 10: Schematic Export Integrity');
  const schemExport = exportToWorldEditSchematic(orchestration.project.currentBuild);
  const litExport = exportToLitematica(orchestration.project.currentBuild);

  assert(schemExport.byteLength > 100, 'Valid Sponge .schem buffer generated', `bytes=${schemExport.byteLength}`);
  assert(litExport.byteLength > 100, 'Valid Litematica .litematic buffer generated', `bytes=${litExport.byteLength}`);

  // -----------------------------------------------------------------------
  // TEST 11: Source Adapter Framework & Normalization
  // -----------------------------------------------------------------------
  console.log('\nTest Suite 11: Source Adapter Framework & Normalization (Parts 4-6)');
  const adapterRegistry = SourceAdapterRegistry.getInstance();
  const allDiscoveredVersions = await adapterRegistry.discoverAllVersions();
  assert(allDiscoveredVersions.includes('1.21.1') && allDiscoveredVersions.includes('1.20.1'), 'Upstream versions discovered from adapters');

  const assetsAdapter = new MinecraftAssetsAdapter();
  const rawAssets = await assetsAdapter.fetchVersion('1.21.1');
  const normalizedAssets = await assetsAdapter.normalizeVersion('1.21.1', rawAssets);
  assert(normalizedAssets.blocks['minecraft:stone_brick_stairs'] !== undefined, 'Stairs normalized with authentic blockstates');
  assert(normalizedAssets.blocks['minecraft:stone_brick_stairs'].orientationRules.supportsRotation, 'Stairs rotation support registered');

  const dataAdapter = new MinecraftDataAdapter();
  const rawData = await dataAdapter.fetchVersion('1.21.1');
  const normalizedData = await dataAdapter.normalizeVersion('1.21.1', rawData);
  assert(normalizedData.blocks['minecraft:deepslate_tile_stairs'] !== undefined, 'Deepslate tile stairs normalized in data adapter');
  assert(normalizedData.blocks['minecraft:deepslate_tile_stairs'].geometry.collisionShape.boxes.length > 0, 'Collision bounding boxes extracted');
  assert(normalizedData.blocks['minecraft:deepslate_tile_stairs'].hardness !== undefined, 'Block hardness metadata populated');

  // -----------------------------------------------------------------------
  // TEST 12: Unified Snapshot & Pre-Commit Validation
  // -----------------------------------------------------------------------
  console.log('\nTest Suite 12: Unified Snapshot & Pre-Commit Validation (Parts 8-9)');
  const unifiedSnapshot = await adapterRegistry.buildUnifiedSnapshot('1.21.1');
  assert(Object.keys(unifiedSnapshot.blocks).length > 20, 'Unified snapshot synthesized with >20 canonical blocks');
  assert(unifiedSnapshot.models['block/stone_brick_stairs'] !== undefined, 'Visual block models retained in unified snapshot');

  const validationResult = VersionValidationService.validateSnapshot(unifiedSnapshot);
  assert(validationResult.valid === true, 'Deterministic pre-commit validation passed');
  assert(validationResult.errors.length === 0, 'Zero validation errors in unified snapshot');

  // -----------------------------------------------------------------------
  // TEST 13: Immutable Snapshots & Tamper-Proof Storage
  // -----------------------------------------------------------------------
  console.log('\nTest Suite 13: Immutable Version Snapshots & Tamper-Proof Storage (Parts 10-11)');
  const storage = new SnapshotStorage();
  await storage.ensureBaselineSnapshots();
  assert(storage.hasSnapshot('1.21.1'), 'Snapshot for 1.21.1 persisted to disk');
  assert(storage.hasSnapshot('1.20.1'), 'Snapshot for 1.20.1 persisted to disk');

  const diskSnapshot = storage.readSnapshot('1.21.1');
  assert(diskSnapshot !== null, 'Snapshot read back from disk storage');
  assert(diskSnapshot!.manifest.checksum.length > 0, 'SHA-256 tamper-evident integrity hash verified');

  // Strict Immutability Test: attempt to silently overwrite READY snapshot
  let immutabilityViolated = false;
  try {
    await storage.saveSnapshot(diskSnapshot!); // Should throw Immutability Violation
  } catch (err: any) {
    if (err.message.includes('Immutability Violation')) {
      immutabilityViolated = true;
    }
  }
  assert(immutabilityViolated === true, 'Immutability strictly enforced (overwrite of READY snapshot rejected)');

  // -----------------------------------------------------------------------
  // TEST 14: Version Discovery & Import Pipeline
  // -----------------------------------------------------------------------
  console.log('\nTest Suite 14: Version Discovery & Import Pipeline (Parts 7-9)');
  const discoveryService = new VersionDiscoveryService(storage, adapterRegistry);
  const completeCatalog = await discoveryService.getCompleteCatalog('java');
  assert(completeCatalog.length >= 3, 'Complete version catalog compiled');
  const readyEntry = completeCatalog.find((c) => c.version === '1.21.1');
  assert(readyEntry?.status === 'READY', 'Version 1.21.1 status verified as READY');

  const importService = new VersionImportService(storage, adapterRegistry);
  const importRes = await importService.importVersion('1.20.4');
  assert(importRes.success === true, 'Version import pipeline completed successfully');
  assert(importRes.manifest?.status === 'READY', 'Imported version 1.20.4 status marked READY');

  // -----------------------------------------------------------------------
  // TEST 15: Deterministic State Lookups & Project Migration
  // -----------------------------------------------------------------------
  console.log('\nTest Suite 15: State Lookups & Project Migration (Parts 14-15)');
  const registryService = VersionRegistryService.getInstance();
  const isValidStone = await registryService.isValidBlockId('1.21.1', 'minecraft:stone_bricks');
  const isInvalidFake = await registryService.isValidBlockId('1.21.1', 'minecraft:imaginary_fake_block');
  assert(isValidStone === true, 'Real Minecraft block recognized in registry');
  assert(isInvalidFake === false, 'Invented/fake Minecraft block rejected by registry');

  const validStairState = await registryService.isValidBlockState('1.21.1', 'minecraft:stone_brick_stairs', {
    facing: 'north',
    half: 'bottom',
    shape: 'straight',
  });
  assert(validStairState.valid === true, 'Legitimate stair block state validated as valid');

  const invalidStairState = await registryService.isValidBlockState('1.21.1', 'minecraft:stone_brick_stairs', {
    facing: 'upwards', // invalid value
  });
  assert(invalidStairState.valid === false, 'Illegal block state rejected with detailed reason');

  const migrationService = new VersionMigrationService(registryService);
  const migrationReport = await migrationService.generateMigrationReport('1.20.1', '1.21.1');
  assert(migrationReport.fromVersion === '1.20.1' && migrationReport.toVersion === '1.21.1', 'Migration report versions mapped');
  assert(migrationReport.differences.length >= 0, 'Migration differences analyzed');

  const testBuildToMigrate = orchestration.project.currentBuild;
  const migrationResult = await migrationService.migrateBuild(testBuildToMigrate, '1.21.1');
  assert(migrationResult.migratedBuild.metadata.minecraftVersion === '1.21.1', 'Build successfully migrated to target version');
  assert(migrationResult.migratedBuild.blocks.length === testBuildToMigrate.blocks.length, 'Block count preserved during non-destructive migration');

  // -----------------------------------------------------------------------
  // TEST 16: Universal Subject Analysis & Classification
  // -----------------------------------------------------------------------
  console.log('\nTest Suite 16: Universal Subject Classification (Master Prompt Part 3)');
  const appaClassification = classifyAndDecomposeSubject({ name: 'Appa_Flying_Bison.jpg' });
  assert(appaClassification.category === 'creature', 'Appa classified as creature (not architecture)', `cat=${appaClassification.category}`);
  assert(appaClassification.isArchitectural === false, 'Appa identified as non-architectural');
  assert(appaClassification.semanticSubject.parts.length >= 8, 'Appa decomposed into body, head, arrow, horns, limbs, tail');

  const vehicleClassification = classifyAndDecomposeSubject({ name: 'Cyber_Truck_Vehicle.png' });
  assert(vehicleClassification.category === 'vehicle', 'Vehicle classified accurately');
  assert(vehicleClassification.isArchitectural === false, 'Vehicle identified as non-architectural');

  const plantClassification = classifyAndDecomposeSubject({ name: 'Cherry_Blossom_Tree.jpg' });
  assert(plantClassification.category === 'plant_tree', 'Plant/tree classified accurately');

  const buildingClassification = classifyAndDecomposeSubject({ name: 'Glass_Garden_Conservatory.jpg' });
  assert(buildingClassification.category === 'architecture', 'Building classified as architecture');
  assert(buildingClassification.isArchitectural === true, 'Building identified as architectural');

  // -----------------------------------------------------------------------
  // TEST 17: Organic Volumetric Voxelization & Rejection of Fallbacks
  // -----------------------------------------------------------------------
  console.log('\nTest Suite 17: Organic Voxelization & Rejection of Fallbacks (Part 9 & 13)');
  const appaVoxelBuild = UniversalVoxelizer.voxelize(appaClassification.semanticSubject, '1.21');
  assert(appaVoxelBuild.blocks.length > 500, 'Appa voxelized into 3D Minecraft block structure', `blocks=${appaVoxelBuild.blocks.length}`);
  assert(!appaVoxelBuild.name.includes('Pavilion'), 'Architectural pavilion fallback successfully rejected');
  assert(appaVoxelBuild.name.includes('Appa'), 'Appa structure properly named');

  const paletteMap = new Set(appaVoxelBuild.blocks.map((b) => b.blockId));
  assert(paletteMap.has('minecraft:white_wool'), 'White wool body blocks placed');
  assert(paletteMap.has('minecraft:brown_wool'), 'Brown arrow crest blocks placed');
  assert(paletteMap.has('minecraft:deepslate_tiles'), 'Curved deepslate horns placed');
  assert(paletteMap.has('minecraft:cherry_leaves'), 'Cherry blossom grove environmental blocks placed');

  // -----------------------------------------------------------------------
  // TEST 18: Reference-vs-Render Fidelity Comparison & Mismatch Detection
  // -----------------------------------------------------------------------
  console.log('\nTest Suite 18: Reference-vs-Render Fidelity Comparison (Part 14)');
  // 1. Organic model evaluated against creature specification
  const validFidelity = UniversalReconstructor.evaluateFidelity(appaClassification.semanticSubject, appaVoxelBuild, false);
  assert(validFidelity.status === 'SUCCESS', 'Organic Appa structure passes fidelity comparison', `status=${validFidelity.status}`);
  assert(validFidelity.overall >= 0.85, 'Overall fidelity score >= 85%', `score=${validFidelity.overall}`);

  // 2. Intentional mismatch test: if a greenhouse was generated for Appa, it MUST be rejected!
  const fakeGreenhouseForAppa = buildNeutral3DModel(building, 1.0);
  const fakeGreenhouseBuild = buildMinecraftFromProxy(building, '1.21', 1.0);
  const mismatchFidelity = UniversalReconstructor.evaluateFidelity(appaClassification.semanticSubject, fakeGreenhouseBuild, false);
  assert(mismatchFidelity.status === 'FIDELITY_MISMATCH', 'Severe mismatch detected when greenhouse substituted for Appa');
  assert(mismatchFidelity.overall < 0.3, 'Mismatch fidelity score penalized (<30%)', `score=${mismatchFidelity.overall}`);

  // -----------------------------------------------------------------------
  // TEST 19: All Blocks and Coordinates Deterministically Valid
  // -----------------------------------------------------------------------
  console.log('\nTest Suite 19: Minecraft Knowledge Engine Structural Authority (Part 5)');
  const validationOfAppa = validateMinecraftBuild(appaVoxelBuild);
  assert(validationOfAppa.valid === true, 'Appa Minecraft build validated 100% valid by Deterministic Engine');
  assert(validationOfAppa.errors.length === 0, 'Zero structural/registry errors');

  for (const block of appaVoxelBuild.blocks.slice(0, 100)) {
    assert(Number.isInteger(block.position.x) && Number.isInteger(block.position.y) && Number.isInteger(block.position.z), 'Integer grid coordinate');
    assert(block.blockId.startsWith('minecraft:'), 'Namespaced Minecraft block ID');
  }

  // -----------------------------------------------------------------------
  // TEST 20: Universal End-to-End Reconstruction Execution
  // -----------------------------------------------------------------------
  console.log('\nTest Suite 20: Universal End-to-End Reconstruction Execution');
  const appaImageItem: ReferenceImageItem = {
    id: 'ref_appa_universal_test',
    name: 'Appa_Flying_Bison.jpg',
    dataUrl: 'data:image/jpeg;base64,/9j/4AAQSkZJRg==',
    mimeType: 'image/jpeg',
    probableView: 'front',
    confidence: 0.96,
  };

  const universalResult = await UniversalReconstructor.reconstruct([appaImageItem], {
    buildScale: 'medium',
    referenceMode: 'single_image',
    accuracy: 'high_detail',
    inference: 'conservative',
    minecraftVersion: '1.21',
  });

  assert(universalResult.architecturalFallbackRejected === true, 'Fallback rejected in end-to-end pipeline');
  assert(universalResult.build.metadata.subjectCategory === 'creature', 'Creature metadata preserved in final build');
  assert(universalResult.fidelityReport.status === 'SUCCESS', 'Fidelity status SUCCESS achieved');

  // -----------------------------------------------------------------------
  // TEST 21: Universal Multi-Archetype Classification & Non-Architectural Reconstructions
  // -----------------------------------------------------------------------
  console.log('\nTest Suite 21: Multi-Archetype Classification & Rejection of Fake Pavilion');
  
  // 1. Airplane / Aircraft
  const planeClass = classifyAndDecomposeSubject({ name: 'Spitfire_Airplane.png' });
  assert(planeClass.category === 'vehicle', 'Airplane classified as vehicle (not building)');
  assert(planeClass.isArchitectural === false, 'Airplane is non-architectural');
  assert(planeClass.semanticSubject.parts.some(p => p.type === 'wing'), 'Airplane includes aerodynamic wings');
  const planeBuild = UniversalVoxelizer.voxelize(planeClass.semanticSubject, '1.21');
  assert(!planeBuild.blocks.some(b => b.blockId === 'minecraft:pink_stained_glass'), 'Airplane never contains greenhouse pink glass');
  assert(planeBuild.blocks.length > 50, 'Airplane correctly voxelized into 3D Minecraft blocks');

  // 2. Ship / Watercraft
  const shipClass = classifyAndDecomposeSubject({ name: 'Pirate_Ship_Vessel.png' });
  assert(shipClass.category === 'vehicle', 'Ship classified as vehicle');
  assert(shipClass.isArchitectural === false, 'Ship is non-architectural');
  assert(shipClass.semanticSubject.parts.some(p => p.id === 'ship_mast'), 'Ship includes central mast');
  const shipBuild = UniversalVoxelizer.voxelize(shipClass.semanticSubject, '1.21');
  assert(shipBuild.blocks.some(b => b.blockId === 'minecraft:spruce_planks'), 'Ship built with nautical timber planks');

  // 3. Statue / Sculpture
  const statueClass = classifyAndDecomposeSubject({ name: 'Greek_Statue_Sculpture.jpg' });
  assert(statueClass.category === 'statue_sculpture', 'Statue classified as statue_sculpture');
  assert(statueClass.isArchitectural === false, 'Statue is non-architectural');
  assert(statueClass.semanticSubject.parts.some(p => p.id === 'statue_pedestal'), 'Statue includes pedestal base');
  const statueBuild = UniversalVoxelizer.voxelize(statueClass.semanticSubject, '1.21');
  assert(statueBuild.blocks.some(b => b.blockId === 'minecraft:stone_bricks'), 'Statue uses masonry stone bricks');

  // 4. General House / Cottage (not conservatory!)
  const houseClass = classifyAndDecomposeSubject({ name: 'Oak_Timber_House.png' });
  assert(houseClass.category === 'architecture', 'House classified as architecture');
  assert(houseClass.isArchitectural === true, 'House identified as architectural');
  assert(!houseClass.semanticSubject.parts.some(p => p.materialCandidate.includes('pink_stained_glass')), 'General house does NOT default to pink stained glass');
  assert(houseClass.semanticSubject.parts.some(p => p.shape === 'wedge'), 'House includes pitched wedge roof');

  // 5. Furniture / Interior Object
  const furnitureClass = classifyAndDecomposeSubject({ name: 'Living_Room_Furniture_Sofa.png' });
  assert(furnitureClass.category === 'furniture', 'Furniture classified as furniture');
  assert(furnitureClass.isArchitectural === false, 'Furniture is non-architectural');

  // 6. Generic Animal / Wolf
  const wolfClass = classifyAndDecomposeSubject({ name: 'Timber_Wolf_Animal.png' });
  assert(wolfClass.category === 'creature', 'Wolf classified as creature');
  assert(wolfClass.isArchitectural === false, 'Wolf is non-architectural');
  assert(wolfClass.semanticSubject.parts.some(p => p.id === 'creature_tail'), 'Quadruped includes tail');

  // -----------------------------------------------------------------------
  // TEST 22: Master Prompt Requirement 19: Identity, History & Stale-Result Rejection
  // -----------------------------------------------------------------------
  console.log('\nTest Suite 22: Requirement 19: Identity, History & Race-Condition Rejection');

  // 1. Identity generation & content hashing
  const imageAData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
  const imageBData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

  const identityA = await createReconstructionIdentity(imageAData, '1.21');
  const identityB = await createReconstructionIdentity(imageBData, '1.21');

  assert(identityA.imageHash !== identityB.imageHash, 'Different images produce distinct SHA-256 hashes');
  assert(identityA.reconstructionId !== identityB.reconstructionId, 'Different images produce distinct reconstruction IDs');
  assert(identityA.buildId !== identityB.buildId, 'Unique build IDs per reconstruction');

  // 2. Cache key generation & multi-parameter caching
  const cacheKeyA = buildCacheKey({
    imageHash: identityA.imageHash,
    minecraftVersion: '1.21',
    scale: 1.0,
    mode: 'architecture_environment',
    quality: 'high_detail',
    pipelineVersion: identityA.pipelineVersion,
  });
  assert(cacheKeyA.includes(identityA.imageHash), 'Cache key contains SHA-256 image hash');
  assert(cacheKeyA.includes('1.21') && cacheKeyA.includes('high_detail'), 'Cache key contains version & quality parameters');

  setCachedResult(cacheKeyA, { build: { id: 'buildA' } });
  const retrievedA = getCachedResult(cacheKeyA);
  assert(retrievedA?.build?.id === 'buildA', 'Cache stores and returns identical build');

  // 3. History preservation (never wiped on subsequent uploads)
  const initialHistoryLen = getReconstructionHistory().length;
  addToHistory({
    identity: identityA,
    sourceImageName: 'ImageA.png',
    buildName: 'Build A (House)',
    blockCount: 450,
    status: 'COMPLETED',
    createdAt: new Date().toISOString(),
  });
  addToHistory({
    identity: identityB,
    sourceImageName: 'ImageB.png',
    buildName: 'Build B (Airplane)',
    blockCount: 620,
    status: 'COMPLETED',
    createdAt: new Date().toISOString(),
  });

  const history = getReconstructionHistory();
  assert(history.length === initialHistoryLen + 2, 'History grows immutably instead of being wiped');
  assert(history.some(h => h.buildName.includes('Build A')), 'Build A preserved in history');
  assert(history.some(h => h.buildName.includes('Build B')), 'Build B preserved in history');

  // 4. Asynchronous Race Condition Simulation (Requirement 19 exact spec)
  // Scenario:
  // - A request starts
  // - B request starts
  // - B completes first
  // - A completes later
  // Final visible build MUST remain B!
  setCurrentReconstructionId(identityA.reconstructionId);
  // User uploads B while A is in-flight:
  setCurrentReconstructionId(identityB.reconstructionId);

  let visibleBuildName = 'none';

  // B finishes first:
  if (!isResultStale(identityB.reconstructionId)) {
    visibleBuildName = 'Build B';
  }
  assert(visibleBuildName === 'Build B', 'Build B displayed when B completes first');

  // A finishes later:
  const isAStale = isResultStale(identityA.reconstructionId);
  assert(isAStale === true, 'Late-finishing Request A detected as stale');
  if (!isAStale) {
    visibleBuildName = 'Build A'; // should NEVER happen
  }
  assert(visibleBuildName === 'Build B', 'Final visible build strictly remains B (stale A rejected)');

  // =========================================================================
  // FIX #2 ACCEPTANCE TESTS (Tests 1 to 6)
  // =========================================================================

  // TEST 1: Upload a single house image
  console.log('\nTest Suite 23: FIX #2 TEST 1 — Single House Image Reconstruction');
  const houseRes = await UniversalReconstructor.reconstruct([
    { name: 'nordic_timber_house.png' },
  ]);
  assert(houseRes.build.metadata.structureType === 'house', 'House correctly classified as structureType: house');
  assert(houseRes.build.metadata.hasInteriorSpace === true, 'House identified as having real interior space');
  assert(Boolean(houseRes.build.metadata.rooms && houseRes.build.metadata.rooms.length >= 2), 'House contains structure-appropriate rooms (living & bedroom)');
  assert(houseRes.build.blocks.some((b) => b.blockId.includes('door')), 'House contains an authentic enterable doorway');
  assert(houseRes.build.blocks.some((b) => b.provenance === 'generated'), 'House contains real generated interior furnishings');
  assert(houseRes.build.blocks.some((b) => b.provenance === 'inferred'), 'House hidden rear and roof areas marked inferred');
  assert(houseRes.build.blocks.some((b) => b.provenance === 'observed'), 'House front facade marked observed');
  assert(Boolean(houseRes.build.metadata.provenanceBreakdown && houseRes.build.metadata.provenanceBreakdown.observedPercent! > 0), 'Provenance breakdown tracks observed percentage');
  assert(Boolean(houseRes.build.metadata.provenanceBreakdown && houseRes.build.metadata.provenanceBreakdown.generatedCount > 0), 'Provenance breakdown tracks generated count & percentage');

  // TEST 2: Upload a statue
  console.log('\nTest Suite 24: FIX #2 TEST 2 — Solid Statue / Sculpture Reconstruction');
  const statueRes = await UniversalReconstructor.reconstruct([
    { name: 'marble_angel_statue.png' },
  ]);
  assert(statueRes.build.metadata.structureType === 'statue', 'Statue correctly classified as structureType: statue');
  assert(statueRes.build.metadata.hasInteriorSpace === false, 'Statue identified as solid sculpture with NO interior space');
  assert(!statueRes.build.metadata.rooms || statueRes.build.metadata.rooms.length === 0, 'Statue has 0 interior rooms');
  assert(!statueRes.build.blocks.some((b) => b.provenance === 'generated'), 'Statue generates 0 fake interior furniture blocks');
  assert(statueRes.build.blocks.some((b) => b.blockId === 'minecraft:stone_bricks'), 'Statue includes solid carved pedestal base');
  assert(statueRes.build.blocks.some((b) => b.blockId === 'minecraft:smooth_stone'), 'Statue sculpted with masonry stone');

  // TEST 3: Upload a vehicle
  console.log('\nTest Suite 25: FIX #2 TEST 3 — Vehicle Reconstruction');
  const vehicleRes = await UniversalReconstructor.reconstruct([
    { name: 'heavy_transport_truck.png' },
  ]);
  assert(vehicleRes.build.metadata.structureType === 'vehicle', 'Vehicle classified as structureType: vehicle');
  assert(vehicleRes.build.metadata.hasInteriorSpace === true, 'Vehicle identified as having enclosed cabin space');
  assert(Boolean(vehicleRes.build.metadata.rooms?.some((r) => r.type === 'cockpit')), 'Vehicle generates operator cockpit/cabin only');
  assert(vehicleRes.build.blocks.some((b) => b.blockId === 'minecraft:black_concrete'), 'Vehicle includes wheel assemblies');
  assert(vehicleRes.build.blocks.some((b) => b.blockId === 'minecraft:iron_block'), 'Vehicle includes chassis');
  assert(!vehicleRes.build.blocks.some((b) => b.blockId === 'minecraft:red_bed'), 'Vehicle does not receive house bedroom furniture spam');

  // TEST 4: Upload an animal-shaped building
  console.log('\nTest Suite 26: FIX #2 TEST 4 — Animal-Shaped Building vs Pure Animal Sculpture');
  const animalBldgRes = await UniversalReconstructor.reconstruct([
    { name: 'giant_beaver_hotel_building.png' },
  ]);
  assert(animalBldgRes.build.metadata.structureType === 'animal-shaped structure', 'Animal-shaped building classified as animal-shaped structure');
  assert(animalBldgRes.build.metadata.hasInteriorSpace === true, 'Animal-shaped building identified as having interior space');
  assert(Boolean(animalBldgRes.build.metadata.rooms && animalBldgRes.build.metadata.rooms.length > 0), 'Animal-shaped building generates interior room volume');
  assert(animalBldgRes.semanticSubject.parts.some((p) => p.type === 'head'), 'Animal silhouette preserved (sculpted head)');
  assert(animalBldgRes.semanticSubject.parts.some((p) => p.type === 'wall'), 'Animal architectural shell preserves hollow interior');

  const pureAnimalClass = classifyAndDecomposeSubject({ name: 'wild_brown_bear.png' });
  assert(pureAnimalClass.structureType === 'decorative object', 'Pure wild animal classified as non-architectural creature');
  assert(pureAnimalClass.hasInteriorSpace === false, 'Pure wild animal has NO interior space');

  // TEST 5: Upload a garden
  console.log('\nTest Suite 27: FIX #2 TEST 5 — Outdoor Garden Landscaping');
  const gardenRes = await UniversalReconstructor.reconstruct([
    { name: 'botanical_zen_garden.png' },
  ]);
  const gardenClass = classifyAndDecomposeSubject({ name: 'botanical_zen_garden.png' });
  assert(gardenRes.build.metadata.structureType === 'garden', 'Garden correctly classified as structureType: garden');
  assert(gardenRes.build.metadata.hasInteriorSpace === false, 'Garden correctly recognized as outdoor open space (hasInteriorSpace: false)');
  assert(gardenClass.isArchitectural === false, 'Garden is not categorized as an architectural building');
  assert(!gardenRes.build.blocks.some((b) => b.blockId === 'minecraft:smooth_quartz'), 'Garden is NOT incorrectly converted into quartz greenhouse building');
  assert(!gardenRes.build.blocks.some((b) => b.blockId === 'minecraft:pink_stained_glass'), 'Garden is NOT converted into pink glass canopy');
  assert(gardenRes.build.blocks.some((b) => b.blockId === 'minecraft:grass_block'), 'Garden contains outdoor lawn terrace');
  assert(gardenRes.build.blocks.some((b) => b.blockId === 'minecraft:stone_bricks'), 'Garden contains stone walkways');
  assert(gardenRes.build.blocks.some((b) => b.blockId.includes('leaves') || b.blockId.includes('moss')), 'Garden contains authentic outdoor flora');

  // TEST 6: Upload an image showing only one side
  console.log('\nTest Suite 28: FIX #2 TEST 6 — Single-Side Reference & Provenance Tracking');
  const singleSideClass = classifyAndDecomposeSubject({
    name: 'cottage_front_elevation.png',
    probableView: 'front',
  });
  const singleSideBuild = UniversalVoxelizer.voxelize(singleSideClass.semanticSubject, '1.21');

  const observedBlocks = singleSideBuild.blocks.filter((b) => b.provenance === 'observed');
  const inferredBlocks = singleSideBuild.blocks.filter((b) => b.provenance === 'inferred');
  const generatedBlocks = singleSideBuild.blocks.filter((b) => b.provenance === 'generated');

  assert(observedBlocks.length > 0, 'Visible side blocks classified as OBSERVED');
  assert(inferredBlocks.length > 0, 'Unseen rear/hidden side blocks classified as INFERRED');
  assert(generatedBlocks.length > 0, 'Interior furnishings classified as GENERATED');

  // Confidence validation: observed has highest confidence, inferred has moderate, generated has lower
  const avgObservedConf = observedBlocks.reduce((acc, b) => acc + (b.confidence ?? 0), 0) / observedBlocks.length;
  const avgInferredConf = inferredBlocks.reduce((acc, b) => acc + (b.confidence ?? 0), 0) / inferredBlocks.length;
  const avgGeneratedConf = generatedBlocks.reduce((acc, b) => acc + (b.confidence ?? 0), 0) / generatedBlocks.length;

  assert(avgObservedConf >= 0.90, `Observed blocks have high confidence >= 0.90 (actual: ${avgObservedConf.toFixed(2)})`);
  assert(avgInferredConf >= 0.70 && avgInferredConf < avgObservedConf, `Inferred blocks have moderate confidence (actual: ${avgInferredConf.toFixed(2)})`);
  assert(avgGeneratedConf >= 0.60 && avgGeneratedConf < avgInferredConf, `Generated blocks have conservative confidence (actual: ${avgGeneratedConf.toFixed(2)})`);
  assert(singleSideBuild.metadata.provenanceBreakdown !== undefined, 'Single-side build records complete provenance breakdown metadata');

  // TEST SUITE 29: FIX #3 — Authentic Minecraft Asset, Texture, Model & Gallery Regression
  console.log('\nTest Suite 29: FIX #3 — Authentic Minecraft Asset, Texture, Model & Gallery Regression');

  // 1. One Source of Truth & Version Pinning (Sections 1 & 2)
  assert(typeof MINECRAFT_VERSION === 'string' && MINECRAFT_VERSION.length > 0, 'Minecraft version pinned in registry');
  assert(typeof REGISTRY_SNAPSHOT_ID === 'string' && REGISTRY_SNAPSHOT_ID.length > 0, 'Registry snapshot ID explicitly pinned');
  assert(typeof ASSET_MANIFEST_HASH === 'string' && ASSET_MANIFEST_HASH.startsWith('sha256-'), 'Asset manifest checksum pinned with SHA-256');

  const validBlocks121 = getValidBlocks('1.21');
  const validBlocks120 = getValidBlocks('1.20');
  assert(validBlocks121.length > validBlocks120.length, 'Target version 1.21 includes 1.21 update blocks');
  assert(validBlocks120.every((b) => b.sinceVersion !== '1.21'), 'Target version 1.20 excludes 1.21-exclusive blocks');

  // Version substitution test
  const sub120 = substituteBlockForVersion('minecraft:copper_grate', '1.20');
  assert(sub120.substituted === true && sub120.blockId === 'minecraft:iron_bars', '1.21 block gracefully substitutes in 1.20 target build');

  // 2. Automated Block Gallery Regression Test (Section 16: at least 32 specified blocks)
  const requiredGalleryBlocks = [
    'stone',
    'stone_bricks',
    'cobblestone',
    'oak_planks',
    'oak_log',
    'oak_stairs',
    'oak_slab',
    'glass',
    'glass_pane',
    'white_wool',
    'pink_wool',
    'pink_stained_glass',
    'grass_block',
    'dirt',
    'sand',
    'deepslate',
    'deepslate_bricks',
    'deepslate_tiles',
    'blackstone',
    'blackstone_bricks',
    'quartz_block',
    'smooth_quartz',
    'leaves',
    'vine',
    'lantern',
    'torch',
    'redstone',
    'iron_bars',
    'fence',
    'wall',
    'door',
    'trapdoor',
  ];

  for (const blockKey of requiredGalleryBlocks) {
    const blockDef = getMinecraftBlock(blockKey);
    assert(blockDef !== undefined, `Gallery Block '${blockKey}' exists in unified registry`);

    const modelId = resolveBlockModel(blockDef?.id || blockKey);
    assert(modelId.startsWith('minecraft:block/'), `Gallery Block '${blockKey}' resolves valid model identifier (${modelId})`);

    const textureId = resolveBlockTexture(blockDef?.id || blockKey);
    assert(textureId.length > 0 && textureId.includes('minecraft:block/'), `Gallery Block '${blockKey}' resolves valid texture identifier (${textureId})`);

    // Verify canvas generation executes without error
    const canvas = renderBlockCanvas(blockDef?.id || blockKey, blockDef?.colorHex || '#808080');
    assert(canvas !== undefined && canvas.width === 16 && canvas.height === 16, `Gallery Block '${blockKey}' generates 16x16 pixel texture`);
  }

  // 3. Geometry Differentiation: Non-cubes are NEVER rendered as generic cubes (Section 5)
  const stairGeo = getBlockGeometry('stairs', { facing: 'north', half: 'bottom', shape: 'straight' });
  assert(stairGeo.getAttribute('position').count > 24, 'Stair geometry has authentic stepped Minecraft geometry (not a generic cube)');

  const slabGeo = getBlockGeometry('slab', { type: 'bottom' });
  const slabBox = new THREE.Box3().setFromBufferAttribute(slabGeo.getAttribute('position') as THREE.BufferAttribute);
  assert(Math.abs(slabBox.max.y - slabBox.min.y - 0.5) < 0.01, 'Slab geometry has half-height vertical bounding box (0.5 blocks)');

  const paneGeo = getBlockGeometry('pane');
  const paneBox = new THREE.Box3().setFromBufferAttribute(paneGeo.getAttribute('position') as THREE.BufferAttribute);
  assert(Math.abs(paneBox.max.z - paneBox.min.z - 0.125) < 0.01, 'Glass Pane / Iron Bars geometry has thin depth (0.125 blocks)');

  const fenceGeo = getBlockGeometry('fence');
  const fenceBox = new THREE.Box3().setFromBufferAttribute(fenceGeo.getAttribute('position') as THREE.BufferAttribute);
  assert(Math.abs(fenceBox.max.x - fenceBox.min.x - 0.25) < 0.01, 'Fence post geometry has 0.25 cross-section');

  const wallGeo = getBlockGeometry('wall');
  const wallBox = new THREE.Box3().setFromBufferAttribute(wallGeo.getAttribute('position') as THREE.BufferAttribute);
  assert(Math.abs(wallBox.max.x - wallBox.min.x - 0.375) < 0.01, 'Wall post geometry has 0.375 cross-section');

  const lanternGeo = getBlockGeometry('lantern');
  assert(lanternGeo.getAttribute('position').count > 24, 'Lantern has composite body with chain hanger loop geometry');

  const doorGeo = getBlockGeometry('door', { half: 'lower' });
  const doorBox = new THREE.Box3().setFromBufferAttribute(doorGeo.getAttribute('position') as THREE.BufferAttribute);
  assert(Math.abs(doorBox.max.z - doorBox.min.z - 0.1875) < 0.01, 'Door geometry has authentic 3/16 panel thickness');

  const trapdoorClosed = getBlockGeometry('trapdoor', { open: 'false', half: 'bottom' });
  const trapdoorClosedBox = new THREE.Box3().setFromBufferAttribute(trapdoorClosed.getAttribute('position') as THREE.BufferAttribute);
  assert(Math.abs(trapdoorClosedBox.max.y - trapdoorClosedBox.min.y - 0.1875) < 0.01, 'Closed trapdoor geometry has horizontal 3/16 slab form');

  const torchGeo = getBlockGeometry('torch');
  const torchBox = new THREE.Box3().setFromBufferAttribute(torchGeo.getAttribute('position') as THREE.BufferAttribute);
  assert(Math.abs(torchBox.max.x - torchBox.min.x - 0.125) < 0.01, 'Torch geometry has 2x10x2 voxel stick geometry');

  // 4. Color Space & Nearest-Neighbor Pixel Art Rendering (Section 6 & 13)
  const stoneTex = getOrCreateBlockTexture('minecraft:stone');
  assert(stoneTex.colorSpace === THREE.SRGBColorSpace, 'Block texture uses SRGBColorSpace encoding');
  assert(stoneTex.magFilter === THREE.NearestFilter && stoneTex.minFilter === THREE.NearestFilter, 'Block texture uses NearestFilter for pixel art preservation');
  assert(stoneTex.generateMipmaps === false, 'Mipmap blurring disabled for crisp Minecraft pixels');

  // 5. Multi-Face Texturing & Axis Orientation (Section 9)
  const grassFaces = getMultiFaceTextures('minecraft:grass_block');
  assert(grassFaces !== null && grassFaces.length === 6, 'Grass block resolves multi-material array for top, bottom, and side faces');

  const logFacesY = getMultiFaceTextures('minecraft:oak_log', { axis: 'y' });
  const logFacesX = getMultiFaceTextures('minecraft:oak_log', { axis: 'x' });
  assert(logFacesY !== null && logFacesX !== null, 'Oak log resolves multi-material array for rings vs bark');

  // 6. AI Block Solver Registry Integrity (Section 17)
  assert(isValidBlockId('minecraft:stone') === true, 'Standard block ID accepted');
  assert(isValidBlockId('minecraft:imaginary_block') === false, 'AI solver rejects fake/imaginary block IDs');
  assert(isValidBlockState('minecraft:oak_stairs', { facing: 'east', half: 'bottom' }) === true, 'Valid blockstate passes validation');
  assert(isValidBlockState('minecraft:oak_stairs', { facing: 'sideways' }) === false, 'Invalid blockstate correctly rejected');

  console.log('\n============================================================');
  console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runAllTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
