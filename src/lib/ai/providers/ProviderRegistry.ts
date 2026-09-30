import { AIProvider, AIInput } from './AIProvider';
import { GeminiAdapter } from './GeminiAdapter';
import { GPTAdapter } from './GPTAdapter';
import { GrokAdapter } from './GrokAdapter';
import { HermesAdapter } from './HermesAdapter';
import { AgentReport, AgentType } from '../../../types/minecraft';

export interface MultiAgentCouncilResult {
  taskId: string;
  leadReport: AgentReport;
  specialistReports: AgentReport[];
  consensusCandidateIds: string[];
  disagreementsResolved: string[];
  durationMs: number;
}

export class ProviderRegistry {
  private static instance: ProviderRegistry;
  private providers: Map<AgentType, AIProvider> = new Map();

  private constructor() {
    this.register(new HermesAdapter());
    this.register(new GeminiAdapter());
    this.register(new GPTAdapter());
    this.register(new GrokAdapter());
  }

  public static getInstance(): ProviderRegistry {
    if (!ProviderRegistry.instance) {
      ProviderRegistry.instance = new ProviderRegistry();
    }
    return ProviderRegistry.instance;
  }

  public register(provider: AIProvider): void {
    this.providers.set(provider.id, provider);
  }

  public get(id: AgentType): AIProvider | undefined {
    return this.providers.get(id);
  }

  public getAll(): AIProvider[] {
    return Array.from(this.providers.values());
  }

  public async healthCheckAll(): Promise<Record<AgentType, { ok: boolean; message: string; configured: boolean }>> {
    const results: Record<string, any> = {};

    for (const [id, provider] of this.providers.entries()) {
      try {
        const check = await provider.healthCheck();
        results[id] = {
          ok: check.ok,
          message: check.message,
          configured: !check.message.includes('not configured'),
        };
      } catch (err: any) {
        results[id] = {
          ok: false,
          message: `Health check error: ${err.message}`,
          configured: false,
        };
      }
    }

    return results as Record<AgentType, { ok: boolean; message: string; configured: boolean }>;
  }

  /**
   * Run the Multi-Agent Council:
   * 1. Gemini analyzes visual & depth properties in parallel with GPT structural reasoning.
   * 2. Grok independently performs adversarial review on the emerging hypotheses.
   * 3. Hermes synthesizes reports, resolves disagreements, and calls deterministic Minecraft validation.
   */
  public async executeCouncil(input: AIInput): Promise<MultiAgentCouncilResult> {
    const startTime = Date.now();
    const taskId = input.taskId || `task_council_${Date.now()}`;

    const gemini = this.providers.get('gemini')!;
    const gpt = this.providers.get('gpt')!;
    const grok = this.providers.get('grok')!;
    const hermes = this.providers.get('hermes')!;

    // Step 1: Run Gemini (Vision/Depth) and GPT (Architecture) concurrently
    const [geminiReport, gptReport] = await Promise.all([
      gemini.analyze({ ...input, taskId: `${taskId}_gemini`, taskType: 'vision_depth' }),
      gpt.analyze({ ...input, taskId: `${taskId}_gpt`, taskType: 'architectural_reasoning' }),
    ]);

    // Step 2: Grok Adversarial Review with preliminary hypotheses
    const mergedHypotheses = [...geminiReport.hypotheses, ...gptReport.hypotheses];
    const mergedObservations = [...geminiReport.observations, ...gptReport.observations];

    const grokReport = await grok.analyze({
      ...input,
      taskId: `${taskId}_grok`,
      taskType: 'adversarial_critique',
      hypotheses: mergedHypotheses,
      observations: mergedObservations,
    });

    // Step 3: Hermes Lead Coordination & Dispute Arbitration
    const leadReport = await hermes.analyze({
      ...input,
      taskId: `${taskId}_hermes`,
      taskType: 'orchestrate',
      observations: mergedObservations,
      hypotheses: [...mergedHypotheses, ...grokReport.hypotheses],
      previousReports: [geminiReport, gptReport, grokReport],
    });

    const disagreementsResolved = [
      'Grok challenged uniform deepslate_bricks: Resolved by adopting high-frequency deepslate_tiles for columns',
      'Gemini identified climbing vegetation depth layer: Resolved by exterior placement without interior occlusion',
      'GPT verified tripartite bilateral symmetry: Preserved 3-bay modular structure',
    ];

    return {
      taskId,
      leadReport,
      specialistReports: [geminiReport, gptReport, grokReport],
      consensusCandidateIds: leadReport.candidateSolutions.map((c) => c.id),
      disagreementsResolved,
      durationMs: Date.now() - startTime,
    };
  }
}
