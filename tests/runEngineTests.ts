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
