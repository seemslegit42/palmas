import { Injectable, computed, inject, signal } from '@angular/core';
import { PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { PromptTemplate, AppView, EngineSettings, ModelOption, LLMProvider } from '../models/prompt-template';

const STORAGE_KEY = 'pocket_prompts_templates';
const ACTIVE_ID_KEY = 'pocket_prompts_active_id';
const API_ENDPOINT_KEY = 'pocket_prompts_api_endpoint';
const ENGINE_SETTINGS_KEY = 'pocket_prompts_engine_settings';

const DEFAULT_SETTINGS: EngineSettings = {
  activeProvider: 'gemini',
  geminiModel: 'gemini-3.1-flash-lite',
  geminiApiKey: '',
  ollamaEndpoint: 'http://localhost:11434',
  ollamaModel: 'llama3:latest',
  openaiEndpoint: 'https://api.openai.com/v1',
  openaiApiKey: '',
  openaiModel: 'gpt-4o',
  anthropicEndpoint: 'https://api.anthropic.com/v1',
  anthropicApiKey: '',
  anthropicModel: 'claude-3-7-sonnet-20250219',
};

@Injectable({
  providedIn: 'root',
})
export class PromptStore {
  private readonly platformId = inject(PLATFORM_ID);
  private abortController: AbortController | null = null;

  // State Signals
  readonly templates = signal<PromptTemplate[]>([]);
  readonly activeTemplateId = signal<string | null>(null);
  readonly currentView = signal<AppView>('canvas');
  readonly editingTemplateId = signal<string | null>(null);
  readonly apiEndpoint = signal<string>('/api/prompt/execute');
  readonly engineSettings = signal<EngineSettings>(DEFAULT_SETTINGS);

  // Document Canvas Signals
  readonly inputText = signal<string>('');
  readonly outputText = signal<string>('');
  readonly isGenerating = signal<boolean>(false);
  readonly hasExecuted = signal<boolean>(false);
  readonly executionError = signal<string | null>(null);
  readonly toastMessage = signal<string | null>(null);
  readonly focusInputTrigger = signal<number>(0);

  // Computed
  readonly activeTemplate = computed(() => {
    const list = this.templates();
    const id = this.activeTemplateId();
    if (!id) return list[0] ?? null;
    return list.find((t) => t.id === id) ?? list[0] ?? null;
  });

  readonly editingTemplate = computed(() => {
    const editId = this.editingTemplateId();
    if (!editId) return null;
    return this.templates().find((t) => t.id === editId) ?? null;
  });

  constructor() {
    this.loadFromStorage();
  }

  private isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  private loadFromStorage(): void {
    if (!this.isBrowser()) return;

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.templates.set(parsed);
        }
      }

      if (this.templates().length === 0) {
        const defaults: PromptTemplate[] = [
          {
            id: 'tpl_git_commit',
            title: 'Git Commit',
            color: '#20B2AA',
            systemPrompt: 'Generate a conventional commit message (feat, fix, refactor, docs) with a concise title and bullet points for the following changes:\n\n{{QUERY}}',
            placeholderText: 'Paste git diff or summary of code changes here...',
            followUpPrompt: 'Make the commit message more concise and professional.',
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
          {
            id: 'tpl_code_review',
            title: 'Code Review',
            color: '#E0218A',
            systemPrompt: 'Perform a rigorous code review on the following snippet. Identify potential bugs, security vulnerabilities, performance bottlenecks, and adherence to clean code best practices:\n\n{{QUERY}}',
            placeholderText: 'Paste code snippet or function here...',
            followUpPrompt: 'Provide refactored code with explanations.',
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
          {
            id: 'tpl_user_stories',
            title: 'User Stories',
            color: '#3EB991',
            systemPrompt: 'Convert the following product feature request into structured User Stories using standard format (As a ..., I want ..., So that ...) with Acceptance Criteria:\n\n{{QUERY}}',
            placeholderText: 'Describe feature idea or requirements...',
            followUpPrompt: 'Add edge cases and negative test scenarios.',
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
        ];
        this.templates.set(defaults);
        this.activeTemplateId.set(defaults[0].id);
        this.persistTemplates();
      }

      const activeId = localStorage.getItem(ACTIVE_ID_KEY);
      if (activeId && this.templates().some((t) => t.id === activeId)) {
        this.activeTemplateId.set(activeId);
      } else if (this.templates().length > 0 && !this.activeTemplateId()) {
        this.activeTemplateId.set(this.templates()[0].id);
      }

      const endpoint = localStorage.getItem(API_ENDPOINT_KEY);
      if (endpoint && endpoint.trim()) {
        this.apiEndpoint.set(endpoint.trim());
      }

      const rawSettings = localStorage.getItem(ENGINE_SETTINGS_KEY);
      if (rawSettings) {
        try {
          const parsedSettings = JSON.parse(rawSettings);
          // Ensure gemini-3.1-flash-lite is the default
          if (!parsedSettings.geminiModel || parsedSettings.geminiModel === 'gemini-3.8-flash') {
            parsedSettings.geminiModel = 'gemini-3.1-flash-lite';
          }
          this.engineSettings.set({ ...DEFAULT_SETTINGS, ...parsedSettings });
        } catch {
          // Keep defaults
        }
      }
    } catch (e) {
      console.error('Failed to parse localStorage templates:', e);
    }
  }

  updateEngineSettings(settings: EngineSettings): void {
    this.engineSettings.set(settings);
    if (this.isBrowser()) {
      try {
        localStorage.setItem(ENGINE_SETTINGS_KEY, JSON.stringify(settings));
      } catch (e) {
        console.error('Failed to persist engine settings:', e);
      }
    }
    this.showToast(`Provider set to ${settings.activeProvider.toUpperCase()}`);
  }

  async fetchAvailableModels(provider: LLMProvider, endpoint?: string, apiKey?: string): Promise<ModelOption[]> {
    try {
      const params = new URLSearchParams();
      params.set('provider', provider);
      if (endpoint) params.set('endpoint', endpoint);
      if (apiKey) params.set('apiKey', apiKey);

      const res = await fetch(`/api/models?${params.toString()}`);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        if (errData.models && Array.isArray(errData.models)) {
          return errData.models;
        }
        throw new Error(errData.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      return Array.isArray(data.models) ? data.models : [];
    } catch (err: unknown) {
      console.warn('Failed to fetch models dynamically:', err);
      return [];
    }
  }

  setApiEndpoint(endpoint: string): void {
    const val = endpoint.trim() || '/api/prompt/execute';
    this.apiEndpoint.set(val);
    if (this.isBrowser()) {
      localStorage.setItem(API_ENDPOINT_KEY, val);
    }
    this.showToast('API Endpoint updated');
  }

  private persistTemplates(): void {
    if (!this.isBrowser()) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.templates()));
      const active = this.activeTemplateId();
      if (active) {
        localStorage.setItem(ACTIVE_ID_KEY, active);
      } else {
        localStorage.removeItem(ACTIVE_ID_KEY);
      }
    } catch (e) {
      console.error('Failed to persist templates to localStorage:', e);
    }
  }

  showToast(message: string): void {
    this.toastMessage.set(message);
    setTimeout(() => {
      if (this.toastMessage() === message) {
        this.toastMessage.set(null);
      }
    }, 2800);
  }

  // Navigation
  openCanvas(): void {
    this.currentView.set('canvas');
  }

  openManage(): void {
    this.currentView.set('manage');
  }

  openSettings(): void {
    this.currentView.set('settings');
  }

  openEdit(templateId?: string): void {
    this.editingTemplateId.set(templateId ?? null);
    this.currentView.set('edit');
  }

  setActiveTemplate(id: string): void {
    this.activeTemplateId.set(id);
    this.persistTemplates();
    this.openCanvas();
  }

  // Template CRUD
  saveTemplate(data: Omit<PromptTemplate, 'id'> & { id?: string }): PromptTemplate {
    const isNew = !data.id;
    const now = Date.now();
    const template: PromptTemplate = {
      id: data.id ?? `tpl_${now}_${Math.random().toString(36).substring(2, 7)}`,
      title: data.title.trim() || 'Untitled Prompt',
      color: data.color || '#20B2AA',
      systemPrompt: data.systemPrompt || '',
      placeholderText: data.placeholderText || 'Tap play to generate...',
      followUpPrompt: data.followUpPrompt || '',
      createdAt: (data as PromptTemplate).createdAt || now,
      updatedAt: now,
    };

    this.templates.update((current) => {
      const existingIdx = current.findIndex((t) => t.id === template.id);
      if (existingIdx >= 0) {
        const next = [...current];
        next[existingIdx] = template;
        return next;
      }
      return [template, ...current];
    });

    this.activeTemplateId.set(template.id);
    this.persistTemplates();
    this.showToast(isNew ? `Created "${template.title}"` : `Updated "${template.title}"`);
    this.openCanvas();
    return template;
  }

  duplicateTemplate(id: string): PromptTemplate | null {
    const target = this.templates().find((t) => t.id === id);
    if (!target) return null;

    const copy: PromptTemplate = {
      ...target,
      id: `tpl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      title: `${target.title} (Copy)`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.templates.update((current) => [copy, ...current]);
    this.persistTemplates();
    this.showToast(`Duplicated "${target.title}"`);
    return copy;
  }

  deleteTemplate(id: string): void {
    const target = this.templates().find((t) => t.id === id);
    this.templates.update((current) => current.filter((t) => t.id !== id));

    if (this.activeTemplateId() === id) {
      const remaining = this.templates();
      this.activeTemplateId.set(remaining.length > 0 ? remaining[0].id : null);
    }

    this.persistTemplates();
    this.showToast(target ? `Deleted "${target.title}"` : 'Prompt deleted');
    if (this.currentView() === 'edit') {
      this.openManage();
    }
  }

  // Document Canvas Actions
  setInputText(text: string): void {
    this.inputText.set(text);
  }

  focusCanvasInput(): void {
    this.focusInputTrigger.update((v) => v + 1);
  }

  cancelExecution(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    this.isGenerating.set(false);
  }

  clearInput(): void {
    this.inputText.set('');
    this.focusCanvasInput();
    this.showToast('Input cleared');
  }

  clearOutput(): void {
    this.cancelExecution();
    this.outputText.set('');
    this.hasExecuted.set(false);
    this.executionError.set(null);
    this.showToast('Output cleared');
  }

  redoExecution(): void {
    this.cancelExecution();
    this.outputText.set('');
    this.hasExecuted.set(true);
    this.executePrompt(false);
  }

  resetCanvas(): void {
    this.cancelExecution();
    this.inputText.set('');
    this.outputText.set('');
    this.hasExecuted.set(false);
    this.executionError.set(null);
    this.showToast('Fresh canvas opened');
  }

  // Execution Engine
  async executePrompt(isRetry = false): Promise<void> {
    const template = this.activeTemplate();
    if (!template) {
      this.executionError.set('No prompt template selected. Please choose or create a template.');
      return;
    }

    // If already generating, cancel first
    this.cancelExecution();

    this.executionError.set(null);
    this.isGenerating.set(true);
    this.hasExecuted.set(true); // Divider <hr> appears on canvas
    this.outputText.set(''); // Clear output for stream

    this.abortController = new AbortController();

    try {
      const settings = this.engineSettings();
      let providerEndpoint = '';
      let providerModel = '';
      let providerApiKey = '';

      switch (settings.activeProvider) {
        case 'ollama':
          providerEndpoint = settings.ollamaEndpoint;
          providerModel = settings.ollamaModel;
          break;
        case 'openai':
          providerEndpoint = settings.openaiEndpoint;
          providerModel = settings.openaiModel;
          providerApiKey = settings.openaiApiKey;
          break;
        case 'anthropic':
          providerEndpoint = settings.anthropicEndpoint;
          providerModel = settings.anthropicModel;
          providerApiKey = settings.anthropicApiKey;
          break;
        case 'gemini':
        default:
          providerModel = settings.geminiModel;
          providerApiKey = settings.geminiApiKey;
          break;
      }

      const endpoint = this.apiEndpoint() || '/api/prompt/execute';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider: settings.activeProvider,
          endpoint: providerEndpoint,
          model: providerModel,
          apiKey: providerApiKey,
          systemPrompt: template.systemPrompt,
          userInput: this.inputText(),
          followUpPrompt: template.followUpPrompt,
          isRetry,
        }),
        signal: this.abortController.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || `HTTP error ${response.status}`);
      }

      if (!response.body) {
        throw new Error('Readable stream not supported by browser response.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;

          const dataPayload = trimmed.replace(/^data:\s*/, '');
          if (dataPayload === '[DONE]') {
            continue;
          }

          try {
            const parsed = JSON.parse(dataPayload);
            if (parsed.error) {
              this.executionError.set(parsed.error);
            } else if (parsed.text) {
              this.outputText.update((prev) => prev + parsed.text);
            }
          } catch {
            // Ignore non-JSON ping lines
          }
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        // User deliberately cancelled execution
        this.showToast('Execution stopped');
      } else {
        console.error('Execution stream error:', err);
        const msg = err instanceof Error ? err.message : 'Prompt execution encountered an error.';
        this.executionError.set(msg);
      }
    } finally {
      this.isGenerating.set(false);
      this.abortController = null;
    }
  }

  // Backup and Export
  exportTemplates(): string {
    return JSON.stringify(this.templates(), null, 2);
  }

  importTemplates(jsonStr: string): boolean {
    try {
      const parsed = JSON.parse(jsonStr);
      if (!Array.isArray(parsed)) return false;

      const validList: PromptTemplate[] = parsed
        .filter((item) => item && typeof item === 'object' && typeof item.title === 'string')
        .map((item) => ({
          id: item.id || `tpl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          title: item.title,
          color: item.color || '#20B2AA',
          systemPrompt: item.systemPrompt || '',
          placeholderText: item.placeholderText || 'Tap play to generate...',
          followUpPrompt: item.followUpPrompt || '',
          createdAt: item.createdAt || Date.now(),
          updatedAt: Date.now(),
        }));

      if (validList.length === 0) return false;

      this.templates.set(validList);
      this.activeTemplateId.set(validList[0].id);
      this.persistTemplates();
      this.showToast(`Imported ${validList.length} prompt template(s)`);
      return true;
    } catch (err) {
      console.error('Failed to import templates:', err);
      return false;
    }
  }
}
