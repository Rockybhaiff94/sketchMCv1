import {
  AgentType,
  AgentReport,
  ReferenceImageItem,
  Neutral3DModel,
  DepthModel,
  MinecraftBuild,
  RenderResult,
  CandidateSolution,
  ConstructionPattern,
  Observation,
  Hypothesis,
} from '../../../types/minecraft';

export interface AIInput {
  taskId: string;
  taskType: 'vision_depth' | 'architectural_reasoning' | 'adversarial_critique' | 'orchestrate' | 'render_comparison';
  referenceImages: ReferenceImageItem[];
  neutralModel?: Neutral3DModel;
  depthModel?: DepthModel;
  currentBuild?: MinecraftBuild;
  renderResults?: RenderResult[];
  candidateSolutions?: CandidateSolution[];
  schematicKnowledge?: ConstructionPattern[];
  observations?: Observation[];
  hypotheses?: Hypothesis[];
  previousReports?: AgentReport[];
  userDirectives?: string;
  context?: Record<string, any>;
}

export interface AICapabilities {
  supportsVision: boolean;
  supportsStructuredOutput: boolean;
  supportsToolCalling: boolean;
  maxTokens: number;
  modelName: string;
  specialization: 'lead_orchestrator' | 'architecture_reasoning' | 'vision_depth' | 'adversarial_critic';
}

export interface AIProvider {
  id: AgentType;
  name: string;
  role: string;
  specialization: string;
  capabilities(): AICapabilities;
  healthCheck(): Promise<{ ok: boolean; message: string }>;
  analyze(input: AIInput): Promise<AgentReport>;
}
