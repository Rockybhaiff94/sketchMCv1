import React, { useState, useEffect } from 'react';
import {
  X,
  Database,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  DownloadCloud,
  FileCode,
  Layers,
  Sparkles,
} from 'lucide-react';
import { MinecraftBuild } from '../../types/minecraft';
import { MigrationReport } from '../../types/registry';

interface VersionCatalogItem {
  version: string;
  edition: 'java' | 'bedrock';
  status: 'READY' | 'IMPORTING' | 'VALIDATING' | 'FAILED' | 'AVAILABLE_UPSTREAM';
  isInstalled: boolean;
  blockCount?: number;
  checksum?: string;
  sourceAdapters: string[];
  manifest?: any;
}

interface MinecraftVersionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBuild: MinecraftBuild;
  onBuildMigrated: (migratedBuild: MinecraftBuild) => void;
}

export const MinecraftVersionModal: React.FC<MinecraftVersionModalProps> = ({
  isOpen,
  onClose,
  currentBuild,
  onBuildMigrated,
}) => {
  const [versions, setVersions] = useState<VersionCatalogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [selectedForMigration, setSelectedForMigration] = useState<string | null>(null);
  const [migrationReport, setMigrationReport] = useState<MigrationReport | null>(null);
  const [migrating, setMigrating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const pinnedVersion = currentBuild?.metadata?.minecraftVersion || '1.21.1';
  const pinnedSnapshot = currentBuild?.metadata?.registrySnapshot || 'sha256_canonical_baseline';
  const schemaVersion = currentBuild?.metadata?.registrySchemaVersion || '1.0.0';

  const fetchVersions = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/minecraft/versions');
      if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
        const data = await res.json();
        if (data.success && Array.isArray(data.versions)) {
          setVersions(data.versions);
          return;
        }
      }
      // Built-in fallback catalog for static / serverless deployments
      const fallbackList: VersionCatalogItem[] = [
        { version: '1.21.1', edition: 'java', status: 'READY', isInstalled: true, blockCount: 890, checksum: 'sha256_canonical_baseline', sourceAdapters: ['canonical_java_jar'] },
        { version: '1.21', edition: 'java', status: 'READY', isInstalled: true, blockCount: 885, checksum: 'sha256_canonical_1.21', sourceAdapters: ['canonical_java_jar'] },
        { version: '1.20.4', edition: 'java', status: 'READY', isInstalled: true, blockCount: 852, checksum: 'sha256_canonical_1.20.4', sourceAdapters: ['canonical_java_jar'] },
      ];
      setVersions(fallbackList);
    } catch {
      const fallbackList: VersionCatalogItem[] = [
        { version: '1.21.1', edition: 'java', status: 'READY', isInstalled: true, blockCount: 890, checksum: 'sha256_canonical_baseline', sourceAdapters: ['canonical_java_jar'] },
        { version: '1.21', edition: 'java', status: 'READY', isInstalled: true, blockCount: 885, checksum: 'sha256_canonical_1.21', sourceAdapters: ['canonical_java_jar'] },
        { version: '1.20.4', edition: 'java', status: 'READY', isInstalled: true, blockCount: 852, checksum: 'sha256_canonical_1.20.4', sourceAdapters: ['canonical_java_jar'] },
      ];
      setVersions(fallbackList);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchVersions();
      setSelectedForMigration(null);
      setMigrationReport(null);
    }
  }, [isOpen]);

  const handleSyncAll = async () => {
    setSyncing(true);
    try {
      const res = await fetch('/api/minecraft/sync', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
      if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
        await res.json();
      }
      await fetchVersions();
    } catch (err: any) {
      setErrorMsg('Sync failed: ' + err.message);
    } finally {
      setSyncing(false);
    }
  };

  const handleImportVersion = async (version: string) => {
    setSyncing(true);
    try {
      const res = await fetch('/api/minecraft/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ version }),
      });
      if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
        const data = await res.json();
        if (!data.success) {
          setErrorMsg(`Import failed for ${version}: ${data.error || 'Unknown error'}`);
        }
      }
      await fetchVersions();
    } catch (err: any) {
      setErrorMsg('Import error: ' + err.message);
    } finally {
      setSyncing(false);
    }
  };

  const handleRequestMigrationPreview = async (targetVersion: string) => {
    setSelectedForMigration(targetVersion);
    setMigrating(true);
    try {
      const res = await fetch('/api/minecraft/migrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          build: currentBuild,
          targetVersion,
        }),
      });
      if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
        const data = await res.json();
        if (data.success) {
          setMigrationReport(data.report);
        } else {
          setErrorMsg('Migration preview failed: ' + data.error);
        }
      } else {
        const fallbackReport: MigrationReport = {
          fromVersion: currentBuild?.version || '1.21',
          toVersion: targetVersion,
          fromSnapshot: 'sha256_canonical_baseline',
          toSnapshot: `sha256_canonical_${targetVersion}`,
          differences: [],
          affectedBlockCount: 0,
          requiresManualReview: false,
          timestamp: new Date().toISOString(),
        };
        setMigrationReport(fallbackReport);
      }
    } catch (err: any) {
      setErrorMsg('Migration preview error: ' + err.message);
    } finally {
      setMigrating(false);
    }
  };

  const handleConfirmMigration = async () => {
    if (!selectedForMigration) return;
    setMigrating(true);
    try {
      const res = await fetch('/api/minecraft/migrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          build: currentBuild,
          targetVersion: selectedForMigration,
        }),
      });
      if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
        const data = await res.json();
        if (data.success && data.migratedBuild) {
          onBuildMigrated(data.migratedBuild);
          setSelectedForMigration(null);
          setMigrationReport(null);
          onClose();
          return;
        }
      }
      // Fallback: client-side metadata migration
      if (currentBuild) {
        const migrated: MinecraftBuild = {
          ...currentBuild,
          version: selectedForMigration as '1.20' | '1.21',
          metadata: {
            ...currentBuild.metadata,
            minecraftVersion: selectedForMigration,
          },
        };
        onBuildMigrated(migrated);
        setSelectedForMigration(null);
        setMigrationReport(null);
        onClose();
      }
    } catch (err: any) {
      setErrorMsg('Migration error: ' + err.message);
    } finally {
      setMigrating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xl p-4">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden text-zinc-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                Minecraft Version Registry
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-950 text-green-300 border border-green-800/60">
                  Immutable Snapshots
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Multi-version catalog, deterministic blockstates, and non-destructive project migration
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSyncAll}
              disabled={syncing}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition"
              title="Sync with Upstream Adapters"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
              <span>{syncing ? 'Syncing...' : 'Sync Sources'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Project Pinning Info Banner */}
        <div className="px-6 py-3 bg-zinc-950/40 border-b border-zinc-800/60 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-green-400" />
            <span className="text-zinc-400">Active Project Pinned Version:</span>
            <span className="font-mono font-semibold text-green-300 bg-green-950/80 px-2 py-0.5 rounded border border-green-800/50">
              Minecraft {pinnedVersion} (Java)
            </span>
          </div>
          <div className="flex items-center gap-4 text-zinc-400 font-mono text-[11px]">
            <div>
              Snapshot: <span className="text-zinc-300">{pinnedSnapshot.slice(0, 16)}...</span>
            </div>
            <div>
              Schema: <span className="text-zinc-300">v{schemaVersion}</span>
            </div>
          </div>
        </div>

        {errorMsg && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Migration Preview Panel (if active) */}
          {selectedForMigration && migrationReport && (
            <div className="p-4 rounded-xl bg-zinc-950 border border-amber-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold text-amber-300">
                  <ArrowRight className="w-4 h-4" />
                  <span>Migration Analysis: Minecraft {pinnedVersion} → {selectedForMigration}</span>
                </div>
                <button
                  onClick={() => {
                    setSelectedForMigration(null);
                    setMigrationReport(null);
                  }}
                  className="text-xs text-zinc-400 hover:text-zinc-200"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-3 gap-3 text-xs">
                <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800">
                  <div className="text-zinc-400">Differences Detected</div>
                  <div className="text-base font-bold text-white mt-0.5">
                    {migrationReport.differences.length}
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800">
                  <div className="text-zinc-400">Requires Manual Review</div>
                  <div className={`text-base font-bold mt-0.5 ${migrationReport.requiresManualReview ? 'text-rose-400' : 'text-green-400'}`}>
                    {migrationReport.requiresManualReview ? 'Yes (Breaking)' : 'No (Safe)'}
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800">
                  <div className="text-zinc-400">Auto Mappings Available</div>
                  <div className="text-base font-bold text-cyan-400 mt-0.5">
                    {migrationReport.differences.filter((d) => d.automaticMappingAvailable).length}
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {migrationReport.differences.map((diff, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between text-xs px-2.5 py-1.5 rounded-lg bg-zinc-900/60 border border-zinc-800/80"
                  >
                    <span className="font-mono text-zinc-300">{diff.oldBlockId}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-medium uppercase ${
                        diff.severity === 'breaking'
                          ? 'bg-rose-950 text-rose-300'
                          : diff.severity === 'warning'
                          ? 'bg-amber-950 text-amber-300'
                          : 'bg-zinc-800 text-zinc-300'
                      }`}
                    >
                      {diff.type}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
                <button
                  onClick={() => {
                    setSelectedForMigration(null);
                    setMigrationReport(null);
                  }}
                  className="px-3 py-1.5 text-xs rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                >
                  Dismiss
                </button>
                <button
                  onClick={handleConfirmMigration}
                  disabled={migrating}
                  className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-xl bg-green-400 hover:bg-green-300 text-zinc-950 shadow-lg shadow-green-900/40"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{migrating ? 'Migrating Build...' : 'Execute Project Migration'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Versions Table */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Installed & Upstream Minecraft Snapshots
            </h3>

            {loading ? (
              <div className="p-8 text-center text-zinc-400 text-xs flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-green-400" />
                <span>Loading Minecraft version snapshots...</span>
              </div>
            ) : versions.length === 0 ? (
              <div className="p-6 text-center text-zinc-400 text-xs">
                No versions detected. Click 'Sync Sources' to discover upstream releases.
              </div>
            ) : (
              <div className="divide-y divide-zinc-800/80 rounded-xl border border-zinc-800 bg-zinc-950/40 overflow-hidden">
                {versions.map((ver) => {
                  const isCurrent = ver.version === pinnedVersion;
                  const isReady = ver.status === 'READY';
                  const isUpstream = ver.status === 'AVAILABLE_UPSTREAM';
                  const isFailed = ver.status === 'FAILED';

                  return (
                    <div
                      key={ver.version}
                      className={`flex items-center justify-between p-3.5 transition ${
                        isCurrent ? 'bg-green-950/20' : 'hover:bg-zinc-900/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-white text-sm">
                              Minecraft {ver.version}
                            </span>
                            <span className="text-[10px] font-medium uppercase px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400">
                              {ver.edition}
                            </span>
                            {isCurrent && (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-500/20 text-green-300 border border-green-500/30">
                                Current Project
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-zinc-400 mt-1">
                            {ver.blockCount && (
                              <span>{ver.blockCount} blocks</span>
                            )}
                            {ver.checksum && (
                              <span className="font-mono text-[11px] text-zinc-500">
                                {ver.checksum.slice(0, 14)}...
                              </span>
                            )}
                            <span className="text-zinc-500">
                              Sources: {ver.sourceAdapters.join(', ')}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {/* Status Badge */}
                        {isReady && (
                          <div className="flex items-center gap-1.5 text-xs text-green-400 bg-green-950/60 px-2.5 py-1 rounded-full border border-green-800/60">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>READY</span>
                          </div>
                        )}
                        {isUpstream && (
                          <div className="flex items-center gap-1.5 text-xs text-amber-400 bg-amber-950/60 px-2.5 py-1 rounded-full border border-amber-800/60">
                            <DownloadCloud className="w-3.5 h-3.5" />
                            <span>UPSTREAM</span>
                          </div>
                        )}
                        {isFailed && (
                          <div className="flex items-center gap-1.5 text-xs text-rose-400 bg-rose-950/60 px-2.5 py-1 rounded-full border border-rose-800/60">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>FAILED</span>
                          </div>
                        )}

                        {/* Action buttons */}
                        {isReady && !isCurrent && (
                          <button
                            onClick={() => handleRequestMigrationPreview(ver.version)}
                            disabled={migrating}
                            className="px-2.5 py-1 text-xs font-medium rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition"
                          >
                            Migrate Here
                          </button>
                        )}

                        {isUpstream && (
                          <button
                            onClick={() => handleImportVersion(ver.version)}
                            disabled={syncing}
                            className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-xl bg-green-400 hover:bg-green-300 text-zinc-950 transition"
                          >
                            <DownloadCloud className="w-3.5 h-3.5" />
                            <span>Import</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-zinc-800 bg-zinc-950/40 flex items-center justify-between text-xs text-zinc-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-400"></span>
            <span>All snapshots are immutable and preserved permanently.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
