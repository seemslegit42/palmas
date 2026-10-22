export interface PromptTemplate {
  id: string;
  title: string;              // e.g., "git commit", "User Stories"
  color: string;              // Tag badge hex color (e.g., "#20B2AA", "#E0218A")
  systemPrompt: string;       // System prompt instructions containing {{QUERY}}
  placeholderText: string;    // Canvas hint (e.g., "Tap play to generate")
  followUpPrompt: string;     // Optional instructions for retries
  createdAt?: number;
  updatedAt?: number;
}

export type LLMProvider = 'gemini' | 'ollama' | 'openai' | 'anthropic';

export interface EngineSettings {
  activeProvider: LLMProvider;
  geminiModel: string;
  geminiApiKey: string;
  ollamaEndpoint: string;
  ollamaModel: string;
  openaiEndpoint: string;
  openaiApiKey: string;
  openaiModel: string;
  anthropicEndpoint: string;
  anthropicApiKey: string;
  anthropicModel: string;
}

export interface ModelOption {
  id: string;
  name: string;
  details?: string;
}

export type AppView = 'canvas' | 'manage' | 'edit' | 'settings';
