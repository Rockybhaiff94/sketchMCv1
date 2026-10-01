/**
 * Reconstruction Identity & Context Management.
 * Provides unique IDs, image hashing, stale-result rejection,
 * cache keys, and immutable reconstruction history.
 */

// ponytail: SHA-256 via SubtleCrypto. Falls back to simple hash for non-browser.
async function sha256(data: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const buf = new TextEncoder().encode(data);
    const hash = await crypto.subtle.digest('SHA-256', buf);
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
  }
  // ponytail: djb2 fallback for SSR/Node without SubtleCrypto
  let h = 5381;
  for (let i = 0; i < data.length; i++) h = ((h << 5) + h + data.charCodeAt(i)) >>> 0;
  return h.toString(16).padStart(8, '0');
}

export interface ReconstructionIdentity {
  reconstructionId: string;
  imageHash: string;
  buildId: string;
  renderId: string;
  schematicId: string;
  pipelineVersion: string;
  minecraftVersion: string;
  timestamp: number;
}

export interface CacheKey {
  imageHash: string;
  minecraftVersion: string;
  scale: number;
  mode: string;
  quality: string;
  pipelineVersion: string;
}

export interface ReconstructionHistoryEntry {
  identity: ReconstructionIdentity;
  sourceImageThumbnail?: string; // small data URL for UI
  sourceImageName: string;
  buildName: string;
  blockCount: number;
  status: 'COMPLETED' | 'APPROXIMATE' | 'NEEDS_ITERATION' | 'FAILED';
  createdAt: string;
}

const PIPELINE_VERSION = '2.0.0';

let _currentReconstructionId: string | null = null;
let _reconstructionHistory: ReconstructionHistoryEntry[] = [];
let _cacheStore = new Map<string, any>();

export function getCurrentReconstructionId(): string | null {
  return _currentReconstructionId;
}

export function setCurrentReconstructionId(id: string): void {
  _currentReconstructionId = id;
}

/**
 * Check if an async result is still current.
 * Returns false if a newer reconstruction has been started.
 */
export function isResultStale(reconstructionId: string): boolean {
  return _currentReconstructionId !== null && _currentReconstructionId !== reconstructionId;
}

/**
 * Compute content hash of an image data URL.
 */
export async function computeImageHash(dataUrl: string): Promise<string> {
  // Hash the actual base64 content, not the data URI prefix
  const content = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
  // ponytail: hash first 64KB + length for speed on large images
  const sample = content.slice(0, 65536) + '|' + content.length;
  return sha256(sample);
}

/**
 * Create a new reconstruction identity for an image upload.
 */
export async function createReconstructionIdentity(
  imageDataUrl: string,
  minecraftVersion: string,
): Promise<ReconstructionIdentity> {
  const now = Date.now();
  const imageHash = await computeImageHash(imageDataUrl);
  const id = `recon_${now}_${imageHash.slice(0, 8)}`;

  return {
    reconstructionId: id,
    imageHash,
    buildId: `build_${now}`,
    renderId: `render_${now}`,
    schematicId: `schem_${now}`,
    pipelineVersion: PIPELINE_VERSION,
    minecraftVersion,
    timestamp: now,
  };
}

/**
 * Build a deterministic cache key.
 */
export function buildCacheKey(params: CacheKey): string {
  return `vf:${params.imageHash}:${params.minecraftVersion}:${params.scale}:${params.mode}:${params.quality}:${params.pipelineVersion}`;
}

/**
 * Check cache for a matching reconstruction.
 */
export function getCachedResult(key: string): any | null {
  return _cacheStore.get(key) ?? null;
}

/**
 * Store a reconstruction result in cache.
 */
export function setCachedResult(key: string, result: any): void {
  _cacheStore.set(key, result);
}

/**
 * Add an entry to reconstruction history. Never replaces existing entries.
 */
export function addToHistory(entry: ReconstructionHistoryEntry): void {
  _reconstructionHistory.push(entry);
}

/**
 * Get immutable reconstruction history.
 */
export function getReconstructionHistory(): readonly ReconstructionHistoryEntry[] {
  return _reconstructionHistory;
}

/**
 * Get pipeline version string.
 */
export function getPipelineVersion(): string {
  return PIPELINE_VERSION;
}
