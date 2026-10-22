import { Component, inject, signal, effect } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormControl } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { PromptStore } from '../services/prompt-store';
import { LLMProvider, ModelOption, EngineSettings } from '../models/prompt-template';

@Component({
  selector: 'app-settings-view',
  imports: [ReactiveFormsModule, MatIconModule],
  template: `
    <main class="w-full max-w-2xl mx-auto px-4 py-4 sm:py-6 pb-28">
      
      <!-- Top Title & Provider Selector Tabs -->
      <section class="mb-6">
        <div class="flex items-center justify-between mb-3">
          <div>
            <h2 class="font-display font-bold text-lg text-[#F5FFFA]">
              LLM Engine Settings
            </h2>
            <p class="text-xs text-[#8C94A8]">
              Configure model providers, custom API keys, and local Ollama endpoints.
            </p>
          </div>
          <span class="px-2.5 py-1 rounded-full text-xs font-mono font-semibold uppercase bg-[#20B2AA]/15 text-[#20B2AA] border border-[#20B2AA]/30">
            Active: {{ settingsForm.controls.activeProvider.value }}
          </span>
        </div>

        <!-- Provider Tab Bar -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 rounded-xl bg-[#14161C] border border-white/10" role="tablist">
          <button
            type="button"
            role="tab"
            (click)="selectProvider('gemini')"
            class="min-h-[44px] px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            [class.bg-[#22252F]]="settingsForm.controls.activeProvider.value === 'gemini'"
            [class.text-[#F5FFFA]]="settingsForm.controls.activeProvider.value === 'gemini'"
            [class.text-[#8C94A8]]="settingsForm.controls.activeProvider.value !== 'gemini'"
            [class.shadow-xs]="settingsForm.controls.activeProvider.value === 'gemini'"
          >
            <mat-icon class="text-base text-[#20B2AA]">auto_awesome</mat-icon>
            <span>Gemini</span>
          </button>

          <button
            type="button"
            role="tab"
            (click)="selectProvider('ollama')"
            class="min-h-[44px] px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            [class.bg-[#22252F]]="settingsForm.controls.activeProvider.value === 'ollama'"
            [class.text-[#F5FFFA]]="settingsForm.controls.activeProvider.value === 'ollama'"
            [class.text-[#8C94A8]]="settingsForm.controls.activeProvider.value !== 'ollama'"
            [class.shadow-xs]="settingsForm.controls.activeProvider.value === 'ollama'"
          >
            <mat-icon class="text-base text-[#E0218A]">memory</mat-icon>
            <span>Ollama</span>
          </button>

          <button
            type="button"
            role="tab"
            (click)="selectProvider('openai')"
            class="min-h-[44px] px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            [class.bg-[#22252F]]="settingsForm.controls.activeProvider.value === 'openai'"
            [class.text-[#F5FFFA]]="settingsForm.controls.activeProvider.value === 'openai'"
            [class.text-[#8C94A8]]="settingsForm.controls.activeProvider.value !== 'openai'"
            [class.shadow-xs]="settingsForm.controls.activeProvider.value === 'openai'"
          >
            <mat-icon class="text-base text-[#3EB991]">hub</mat-icon>
            <span>OpenAI</span>
          </button>

          <button
            type="button"
            role="tab"
            (click)="selectProvider('anthropic')"
            class="min-h-[44px] px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            [class.bg-[#22252F]]="settingsForm.controls.activeProvider.value === 'anthropic'"
            [class.text-[#F5FFFA]]="settingsForm.controls.activeProvider.value === 'anthropic'"
            [class.text-[#8C94A8]]="settingsForm.controls.activeProvider.value !== 'anthropic'"
            [class.shadow-xs]="settingsForm.controls.activeProvider.value === 'anthropic'"
          >
            <mat-icon class="text-base text-[#FFB703]">psychology</mat-icon>
            <span>Anthropic</span>
          </button>
        </div>
      </section>

      <!-- Provider Form Configuration -->
      <form [formGroup]="settingsForm" (ngSubmit)="onSave()" class="space-y-4">
        
        <!-- 1. GEMINI PANEL -->
        @if (settingsForm.controls.activeProvider.value === 'gemini') {
          <div class="rounded-2xl bg-[#14161C] border border-white/10 p-4 sm:p-5 space-y-4">
            <div class="flex items-start justify-between">
              <div>
                <h3 class="font-display font-semibold text-sm text-[#F5FFFA]">
                  Google Gemini Configuration
                </h3>
                <p class="text-xs text-[#8C94A8]">
                  Powered by Google Gen AI SDK. Server environment key active by default.
                </p>
              </div>
              <span class="inline-flex items-center gap-1 text-[11px] text-[#3EB991] px-2 py-0.5 rounded bg-[#3EB991]/10">
                <mat-icon class="text-xs !w-3 !h-3">verified</mat-icon>
                Cloud Ready
              </span>
            </div>

            <!-- Gemini Model Dropdown -->
            <div>
              <div class="flex items-center justify-between mb-1.5">
                <label for="gemini-model-select" class="block text-xs font-medium text-[#8C94A8]">
                  Select Gemini Model
                </label>
                <button
                  type="button"
                  (click)="fetchModelsForCurrentProvider()"
                  class="text-xs text-[#20B2AA] hover:underline flex items-center gap-0.5"
                >
                  <mat-icon class="text-xs !w-3 !h-3">refresh</mat-icon>
                  <span>Reload Models</span>
                </button>
              </div>
              <select
                id="gemini-model-select"
                formControlName="geminiModel"
                class="w-full h-11 px-3 rounded-xl bg-[#08090C] border border-white/10 text-sm text-[#F5FFFA] focus:outline-none focus:border-[#20B2AA]"
              >
                @for (m of modelsList(); track m.id) {
                  <option [value]="m.id">{{ m.name }} {{ m.details ? '— ' + m.details : '' }}</option>
                }
              </select>
            </div>

            <!-- Optional Custom Gemini Key Override -->
            <div>
              <label for="gemini-key-input" class="block text-xs font-medium text-[#8C94A8] mb-1.5">
                Custom Gemini API Key (Optional Override)
              </label>
              <div class="relative">
                <input
                  id="gemini-key-input"
                  [type]="showKey() ? 'text' : 'password'"
                  formControlName="geminiApiKey"
                  placeholder="Uses server GEMINI_API_KEY by default"
                  class="w-full h-11 pl-3 pr-10 rounded-xl bg-[#08090C] border border-white/10 text-xs font-mono text-[#F5FFFA] placeholder-[#8C94A8]/40 focus:outline-none focus:border-[#20B2AA]"
                />
                <button
                  type="button"
                  (click)="toggleKeyVisibility()"
                  class="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8C94A8] hover:text-white p-1"
                >
                  <mat-icon class="text-base">{{ showKey() ? 'visibility_off' : 'visibility' }}</mat-icon>
                </button>
              </div>
            </div>
          </div>
        }

        <!-- 2. OLLAMA PANEL -->
        @if (settingsForm.controls.activeProvider.value === 'ollama') {
          <div class="rounded-2xl bg-[#14161C] border border-white/10 p-4 sm:p-5 space-y-4">
            <div class="flex items-start justify-between">
              <div>
                <h3 class="font-display font-semibold text-sm text-[#F5FFFA]">
                  Local Ollama Configuration
                </h3>
                <p class="text-xs text-[#8C94A8]">
                  Connect to local or remote Ollama instance with live model autodiscovery.
                </p>
              </div>
              <span class="inline-flex items-center gap-1 text-[11px] text-[#E0218A] px-2 py-0.5 rounded bg-[#E0218A]/10">
                <mat-icon class="text-xs !w-3 !h-3">local_shipping</mat-icon>
                Self-Hosted
              </span>
            </div>

            <!-- Ollama Endpoint -->
            <div>
              <label for="ollama-endpoint-input" class="block text-xs font-medium text-[#8C94A8] mb-1.5">
                Ollama Endpoint URL
              </label>
              <div class="flex items-center gap-2">
                <input
                  id="ollama-endpoint-input"
                  type="text"
                  formControlName="ollamaEndpoint"
                  placeholder="http://localhost:11434"
                  class="flex-1 h-11 px-3 rounded-xl bg-[#08090C] border border-white/10 text-xs font-mono text-[#F5FFFA] placeholder-[#8C94A8]/40 focus:outline-none focus:border-[#20B2AA]"
                />
                <button
                  type="button"
                  (click)="fetchModelsForCurrentProvider()"
                  [disabled]="isFetchingModels()"
                  class="min-h-[44px] px-4 rounded-xl bg-[#E0218A] hover:bg-[#FF2A9D] text-xs font-semibold text-white flex items-center gap-1.5 transition-all shadow-sm active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  <mat-icon class="text-sm" [class.animate-spin]="isFetchingModels()">
                    {{ isFetchingModels() ? 'refresh' : 'sync' }}
                  </mat-icon>
                  <span>Fetch Models</span>
                </button>
              </div>
            </div>

            <!-- Ollama Model Dropdown (Auto-populated) -->
            <div>
              <div class="flex items-center justify-between mb-1.5">
                <label for="ollama-model-select" class="block text-xs font-medium text-[#8C94A8]">
                  Choose Model (Auto-populated from Ollama)
                </label>
                <span class="text-[11px] text-[#20B2AA] font-mono">
                  {{ modelsList().length }} model(s) available
                </span>
              </div>

              @if (modelsList().length > 0) {
                <select
                  id="ollama-model-select"
                  formControlName="ollamaModel"
                  class="w-full h-11 px-3 rounded-xl bg-[#08090C] border border-white/10 text-sm text-[#F5FFFA] focus:outline-none focus:border-[#20B2AA]"
                >
                  @for (m of modelsList(); track m.id) {
                    <option [value]="m.id">
                      {{ m.name }} {{ m.details ? '— ' + m.details : '' }}
                    </option>
                  }
                </select>
              } @else {
                <input
                  id="ollama-model-select"
                  type="text"
                  formControlName="ollamaModel"
                  placeholder="e.g. llama3:latest, mistral, qwen2.5"
                  class="w-full h-11 px-3 rounded-xl bg-[#08090C] border border-white/10 text-xs font-mono text-[#F5FFFA] focus:outline-none focus:border-[#20B2AA]"
                />
              }
            </div>

            @if (fetchError()) {
              <div class="p-3 rounded-xl bg-[#FF4D6D]/10 border border-[#FF4D6D]/30 text-xs text-[#FF4D6D] flex items-center gap-2">
                <mat-icon class="text-base shrink-0">info</mat-icon>
                <span>{{ fetchError() }}</span>
              </div>
            }
          </div>
        }

        <!-- 3. OPENAI PANEL -->
        @if (settingsForm.controls.activeProvider.value === 'openai') {
          <div class="rounded-2xl bg-[#14161C] border border-white/10 p-4 sm:p-5 space-y-4">
            <div class="flex items-start justify-between">
              <div>
                <h3 class="font-display font-semibold text-sm text-[#F5FFFA]">
                  OpenAI Compatible Configuration
                </h3>
                <p class="text-xs text-[#8C94A8]">
                  Standard OpenAI API or any compatible proxy (Groq, Together, DeepSeek, LocalAI).
                </p>
              </div>
              <span class="inline-flex items-center gap-1 text-[11px] text-[#3EB991] px-2 py-0.5 rounded bg-[#3EB991]/10">
                <mat-icon class="text-xs !w-3 !h-3">language</mat-icon>
                API v1
              </span>
            </div>

            <!-- Base URL -->
            <div>
              <label for="openai-endpoint-input" class="block text-xs font-medium text-[#8C94A8] mb-1.5">
                Base URL Endpoint
              </label>
              <input
                id="openai-endpoint-input"
                type="text"
                formControlName="openaiEndpoint"
                placeholder="https://api.openai.com/v1"
                class="w-full h-11 px-3 rounded-xl bg-[#08090C] border border-white/10 text-xs font-mono text-[#F5FFFA] placeholder-[#8C94A8]/40 focus:outline-none focus:border-[#20B2AA]"
              />
            </div>

            <!-- OpenAI API Key -->
            <div>
              <label for="openai-key-input" class="block text-xs font-medium text-[#8C94A8] mb-1.5">
                OpenAI API Key
              </label>
              <div class="relative">
                <input
                  id="openai-key-input"
                  [type]="showKey() ? 'text' : 'password'"
                  formControlName="openaiApiKey"
                  placeholder="sk-..."
                  class="w-full h-11 pl-3 pr-10 rounded-xl bg-[#08090C] border border-white/10 text-xs font-mono text-[#F5FFFA] placeholder-[#8C94A8]/40 focus:outline-none focus:border-[#20B2AA]"
                />
                <button
                  type="button"
                  (click)="toggleKeyVisibility()"
                  class="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8C94A8] hover:text-white p-1"
                >
                  <mat-icon class="text-base">{{ showKey() ? 'visibility_off' : 'visibility' }}</mat-icon>
                </button>
              </div>
            </div>

            <!-- Model Selection Dropdown -->
            <div>
              <div class="flex items-center justify-between mb-1.5">
                <label for="openai-model-select" class="block text-xs font-medium text-[#8C94A8]">
                  Select Model
                </label>
                <button
                  type="button"
                  (click)="fetchModelsForCurrentProvider()"
                  class="text-xs text-[#20B2AA] hover:underline flex items-center gap-0.5"
                >
                  <mat-icon class="text-xs !w-3 !h-3">sync</mat-icon>
                  <span>Fetch From Endpoint</span>
                </button>
              </div>
              <select
                id="openai-model-select"
                formControlName="openaiModel"
                class="w-full h-11 px-3 rounded-xl bg-[#08090C] border border-white/10 text-sm text-[#F5FFFA] focus:outline-none focus:border-[#20B2AA]"
              >
                @for (m of modelsList(); track m.id) {
                  <option [value]="m.id">{{ m.name }}</option>
                }
              </select>
            </div>
          </div>
        }

        <!-- 4. ANTHROPIC PANEL -->
        @if (settingsForm.controls.activeProvider.value === 'anthropic') {
          <div class="rounded-2xl bg-[#14161C] border border-white/10 p-4 sm:p-5 space-y-4">
            <div class="flex items-start justify-between">
              <div>
                <h3 class="font-display font-semibold text-sm text-[#F5FFFA]">
                  Anthropic Claude Configuration
                </h3>
                <p class="text-xs text-[#8C94A8]">
                  Connect to Anthropic Messages API with Claude 3.7 & 3.5 series models.
                </p>
              </div>
              <span class="inline-flex items-center gap-1 text-[11px] text-[#FFB703] px-2 py-0.5 rounded bg-[#FFB703]/10">
                <mat-icon class="text-xs !w-3 !h-3">psychology</mat-icon>
                Claude
              </span>
            </div>

            <!-- Base URL -->
            <div>
              <label for="anthropic-endpoint-input" class="block text-xs font-medium text-[#8C94A8] mb-1.5">
                Anthropic Base URL
              </label>
              <input
                id="anthropic-endpoint-input"
                type="text"
                formControlName="anthropicEndpoint"
                placeholder="https://api.anthropic.com/v1"
                class="w-full h-11 px-3 rounded-xl bg-[#08090C] border border-white/10 text-xs font-mono text-[#F5FFFA] placeholder-[#8C94A8]/40 focus:outline-none focus:border-[#20B2AA]"
              />
            </div>

            <!-- Anthropic API Key -->
            <div>
              <label for="anthropic-key-input" class="block text-xs font-medium text-[#8C94A8] mb-1.5">
                Anthropic API Key
              </label>
              <div class="relative">
                <input
                  id="anthropic-key-input"
                  [type]="showKey() ? 'text' : 'password'"
                  formControlName="anthropicApiKey"
                  placeholder="sk-ant-..."
                  class="w-full h-11 pl-3 pr-10 rounded-xl bg-[#08090C] border border-white/10 text-xs font-mono text-[#F5FFFA] placeholder-[#8C94A8]/40 focus:outline-none focus:border-[#20B2AA]"
                />
                <button
                  type="button"
                  (click)="toggleKeyVisibility()"
                  class="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8C94A8] hover:text-white p-1"
                >
                  <mat-icon class="text-base">{{ showKey() ? 'visibility_off' : 'visibility' }}</mat-icon>
                </button>
              </div>
            </div>

            <!-- Model Selection Dropdown -->
            <div>
              <label for="anthropic-model-select" class="block text-xs font-medium text-[#8C94A8] mb-1.5">
                Select Claude Model
              </label>
              <select
                id="anthropic-model-select"
                formControlName="anthropicModel"
                class="w-full h-11 px-3 rounded-xl bg-[#08090C] border border-white/10 text-sm text-[#F5FFFA] focus:outline-none focus:border-[#20B2AA]"
              >
                @for (m of modelsList(); track m.id) {
                  <option [value]="m.id">{{ m.name }}</option>
                }
              </select>
            </div>
          </div>
        }

        <!-- Bottom Action Bar -->
        <div class="flex items-center justify-between pt-4">
          <button
            type="button"
            (click)="store.openCanvas()"
            class="min-h-[44px] px-5 py-2 rounded-xl bg-[#14161C] hover:bg-[#1A1C23] text-xs font-medium text-[#8C94A8] hover:text-white transition-colors"
          >
            Back to Canvas
          </button>

          <button
            type="submit"
            class="min-h-[44px] px-7 py-2.5 rounded-xl bg-[#20B2AA] hover:bg-[#25c4bb] text-white font-semibold text-sm flex items-center gap-2 active:scale-95 transition-all shadow-lg shadow-[#20B2AA]/20 cursor-pointer"
          >
            <mat-icon class="text-base">check</mat-icon>
            <span>Save & Apply Settings</span>
          </button>
        </div>

      </form>
    </main>
  `,
})
export class SettingsView {
  protected readonly store = inject(PromptStore);
  readonly showKey = signal<boolean>(false);
  readonly isFetchingModels = signal<boolean>(false);
  readonly fetchError = signal<string | null>(null);
  readonly modelsList = signal<ModelOption[]>([]);

  readonly settingsForm = new FormGroup({
    activeProvider: new FormControl<LLMProvider>('gemini', { nonNullable: true }),
    geminiModel: new FormControl<string>('gemini-3.1-flash-lite', { nonNullable: true }),
    geminiApiKey: new FormControl<string>('', { nonNullable: true }),
    ollamaEndpoint: new FormControl<string>('http://localhost:11434', { nonNullable: true }),
    ollamaModel: new FormControl<string>('llama3:latest', { nonNullable: true }),
    openaiEndpoint: new FormControl<string>('https://api.openai.com/v1', { nonNullable: true }),
    openaiApiKey: new FormControl<string>('', { nonNullable: true }),
    openaiModel: new FormControl<string>('gpt-4o', { nonNullable: true }),
    anthropicEndpoint: new FormControl<string>('https://api.anthropic.com/v1', { nonNullable: true }),
    anthropicApiKey: new FormControl<string>('', { nonNullable: true }),
    anthropicModel: new FormControl<string>('claude-3-7-sonnet-20250219', { nonNullable: true }),
  });

  constructor() {
    effect(() => {
      const current = this.store.engineSettings();
      this.settingsForm.patchValue(current);
    });

    // Fetch initial models for active provider
    this.fetchModelsForCurrentProvider();
  }

  selectProvider(provider: LLMProvider): void {
    this.settingsForm.controls.activeProvider.setValue(provider);
    this.fetchModelsForCurrentProvider();
  }

  toggleKeyVisibility(): void {
    this.showKey.update((v) => !v);
  }

  async fetchModelsForCurrentProvider(): Promise<void> {
    const provider = this.settingsForm.controls.activeProvider.value;
    this.isFetchingModels.set(true);
    this.fetchError.set(null);

    let endpoint = '';
    let apiKey = '';

    if (provider === 'ollama') {
      endpoint = this.settingsForm.controls.ollamaEndpoint.value;
    } else if (provider === 'openai') {
      endpoint = this.settingsForm.controls.openaiEndpoint.value;
      apiKey = this.settingsForm.controls.openaiApiKey.value;
    } else if (provider === 'anthropic') {
      endpoint = this.settingsForm.controls.anthropicEndpoint.value;
      apiKey = this.settingsForm.controls.anthropicApiKey.value;
    }

    try {
      const models = await this.store.fetchAvailableModels(provider, endpoint, apiKey);
      this.modelsList.set(models);

      // Auto-select first model if current choice is not in list
      if (models.length > 0) {
        if (provider === 'ollama') {
          const curr = this.settingsForm.controls.ollamaModel.value;
          if (!models.some((m) => m.id === curr)) {
            this.settingsForm.controls.ollamaModel.setValue(models[0].id);
          }
        } else if (provider === 'openai') {
          const curr = this.settingsForm.controls.openaiModel.value;
          if (!models.some((m) => m.id === curr)) {
            this.settingsForm.controls.openaiModel.setValue(models[0].id);
          }
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not fetch models';
      this.fetchError.set(msg);
    } finally {
      this.isFetchingModels.set(false);
    }
  }

  onSave(): void {
    const raw = this.settingsForm.getRawValue() as EngineSettings;
    this.store.updateEngineSettings(raw);
    this.store.openCanvas();
  }
}
