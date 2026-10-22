import { Component, ElementRef, effect, inject, viewChild } from '@angular/core';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { PromptStore } from '../services/prompt-store';
import { FormatOutput } from '../pipes/format-output';

@Component({
  selector: 'app-canvas-view',
  imports: [ReactiveFormsModule, MatIconModule, FormatOutput],
  template: `
    <main class="w-full max-w-3xl mx-auto px-4 py-4 sm:py-6 pb-40">
      @if (store.templates().length === 0) {
        <!-- Zero Template Empty State -->
        <div class="mt-8 rounded-2xl bg-[#14161C] border border-white/10 p-6 sm:p-8 text-center flex flex-col items-center">
          <div class="w-14 h-14 rounded-2xl bg-[#E0218A]/10 border border-[#E0218A]/30 flex items-center justify-center text-[#E0218A] mb-4">
            <mat-icon class="text-3xl">auto_stories</mat-icon>
          </div>
          <h2 class="font-display font-bold text-xl text-[#F5FFFA] mb-2">
            No Prompt Templates Yet
          </h2>
          <p class="text-sm text-[#8C94A8] max-w-md mb-6 leading-relaxed">
            Palmos is 100% template-agnostic. Create your first custom prompt template with a system prompt and {{ '{{QUERY}}' }} insertion placeholder to start executing.
          </p>
          <div class="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              (click)="store.openEdit()"
              class="min-h-[44px] px-6 py-2.5 rounded-xl bg-[#E0218A] hover:bg-[#FF2A9D] text-white font-medium text-sm flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-[#E0218A]/25"
            >
              <mat-icon class="text-xl">add</mat-icon>
              <span>Create First Prompt</span>
            </button>
            <button
              type="button"
              (click)="store.openManage()"
              class="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#1A1C23] hover:bg-[#22252F] text-[#F5FFFA] border border-white/10 font-medium text-sm flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              <mat-icon class="text-xl">tune</mat-icon>
              <span>Manage Prompts / Import</span>
            </button>
          </div>
        </div>
      } @else {
        <!-- Single Continuous Document Canvas -->
        <article class="relative min-h-[70vh] rounded-2xl bg-[#14161C]/50 border border-white/5 p-4 sm:p-7 shadow-sm backdrop-blur-sm">
          
          <!-- Upper Section: Clean text input area for pasting user text -->
          <section class="relative" aria-label="Input Area">
            <div class="flex items-center justify-between mb-2 text-xs text-[#8C94A8] gap-2 flex-wrap">
              <div class="flex items-center gap-2 min-w-0">
                <span class="font-mono text-[11px] tracking-wider uppercase text-[#20B2AA]">Input Query</span>
                @if (store.activeTemplate(); as tpl) {
                  <span class="text-white/20">|</span>
                  <span class="truncate max-w-[180px] sm:max-w-xs text-white/60">#{{ tpl.title }}</span>
                }
              </div>

              <!-- Input Actions (Clear Input button) -->
              <div class="flex items-center gap-2">
                @if (inputControl.value) {
                  <span class="font-mono text-[11px] text-[#8C94A8] hidden xs:inline">
                    {{ inputControl.value.length }} chars
                  </span>
                  <button
                    type="button"
                    (click)="clearInput()"
                    class="min-h-[36px] px-3 py-1 rounded-xl bg-[#1A1C23] hover:bg-[#22252F] text-[#8C94A8] hover:text-[#FF4D6D] border border-white/10 text-xs font-medium flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer shadow-xs"
                    title="Clear Input Text"
                    aria-label="Clear Input"
                  >
                    <mat-icon class="text-sm text-[#FF4D6D]">backspace</mat-icon>
                    <span>Clear Input</span>
                  </button>
                }
              </div>
            </div>

            <textarea
              #inputArea
              [formControl]="inputControl"
              (input)="onInputChange()"
              [placeholder]="activePlaceholder()"
              rows="6"
              class="w-full bg-transparent text-[#F5FFFA] placeholder-[#8C94A8]/45 font-sans text-base sm:text-lg leading-relaxed resize-none focus:outline-none focus:ring-0 border-0 p-0 selection:bg-[#E0218A]/30 selection:text-[#F5FFFA]"
              aria-label="User query input text"
            ></textarea>
          </section>

          <!-- Divider line (<hr>): Appears after execution -->
          @if (store.hasExecuted()) {
            <div class="my-6 relative flex items-center justify-between gap-2">
              <hr class="w-full border-0 border-t border-white/10 absolute left-0 right-0 top-1/2 -translate-y-1/2 z-0" />
              
              <div class="relative z-10 mx-auto px-3 py-1 bg-[#14161C] border border-white/10 rounded-full flex items-center gap-2 text-xs shadow-md">
                @if (store.isGenerating()) {
                  <span class="w-2 h-2 rounded-full bg-[#3EB991] animate-ping"></span>
                  <span class="text-[#3EB991] font-medium text-[11px]">Streaming...</span>
                  
                  <!-- In-line Stop & Redo while generating -->
                  <button
                    type="button"
                    (click)="store.cancelExecution()"
                    class="min-h-[30px] px-2 py-0.5 rounded-lg bg-[#FF4D6D]/15 hover:bg-[#FF4D6D]/30 text-[#FF4D6D] text-[11px] font-semibold flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
                    title="Stop generation"
                  >
                    <mat-icon class="text-xs !w-3.5 !h-3.5">stop</mat-icon>
                    <span>Stop</span>
                  </button>

                  <button
                    type="button"
                    (click)="store.redoExecution()"
                    class="min-h-[30px] px-2.5 py-0.5 rounded-lg bg-[#E0218A]/20 hover:bg-[#E0218A]/35 text-[#E0218A] hover:text-white border border-[#E0218A]/30 text-[11px] font-semibold flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
                    title="Redo generation immediately"
                  >
                    <mat-icon class="text-xs !w-3.5 !h-3.5">replay</mat-icon>
                    <span>Redo</span>
                  </button>
                } @else {
                  <span class="w-1.5 h-1.5 rounded-full bg-[#20B2AA]"></span>
                  <span class="font-mono uppercase tracking-wider text-[#20B2AA] text-[11px]">AI Output</span>

                  @if (store.outputText()) {
                    <button
                      type="button"
                      (click)="copyOutput()"
                      class="min-h-[30px] px-2 py-0.5 rounded-lg text-white/70 hover:text-white hover:bg-white/5 flex items-center gap-1 transition-all cursor-pointer"
                      title="Copy response"
                    >
                      <mat-icon class="text-xs !w-3.5 !h-3.5">content_copy</mat-icon>
                      <span class="text-[11px]">Copy</span>
                    </button>

                    <button
                      type="button"
                      (click)="store.redoExecution()"
                      class="min-h-[30px] px-2 py-0.5 rounded-lg text-[#20B2AA] hover:text-white hover:bg-[#20B2AA]/15 flex items-center gap-1 transition-all cursor-pointer"
                      title="Redo / Regenerate Output"
                    >
                      <mat-icon class="text-xs !w-3.5 !h-3.5">replay</mat-icon>
                      <span class="text-[11px]">Redo</span>
                    </button>
                  }

                  <!-- Dedicated Clear Output Button -->
                  <button
                    type="button"
                    (click)="store.clearOutput()"
                    class="min-h-[30px] px-2 py-0.5 rounded-lg text-[#FF4D6D]/80 hover:text-[#FF4D6D] hover:bg-[#FF4D6D]/10 flex items-center gap-1 transition-all cursor-pointer"
                    title="Clear Output"
                    aria-label="Clear Output"
                  >
                    <mat-icon class="text-xs !w-3.5 !h-3.5">delete_outline</mat-icon>
                    <span class="text-[11px]">Clear Output</span>
                  </button>
                }
              </div>
            </div>
          }

          <!-- Lower Section: AI output streams directly below the divider line on the same screen -->
          @if (store.hasExecuted()) {
            <section class="relative min-h-[140px] pt-1" aria-label="Output Stream">
              @if (store.executionError(); as err) {
                <div class="rounded-xl bg-[#FF4D6D]/10 border border-[#FF4D6D]/30 p-4 text-[#FF4D6D] text-sm flex items-start gap-3 my-2">
                  <mat-icon class="text-xl shrink-0">error_outline</mat-icon>
                  <div class="flex-1">
                    <p class="font-semibold mb-1">Execution Error</p>
                    <p class="text-xs opacity-90 leading-relaxed">{{ err }}</p>
                    <button
                      type="button"
                      (click)="store.executePrompt(false)"
                      class="mt-3 px-3 py-1.5 rounded-lg bg-[#FF4D6D] text-white text-xs font-medium flex items-center gap-1 active:scale-95 transition-all shadow-sm cursor-pointer"
                    >
                      <mat-icon class="text-sm">replay</mat-icon>
                      <span>Try Again</span>
                    </button>
                  </div>
                </div>
              }

              @if (store.outputText(); as output) {
                <!-- While generating: render directly with fast streaming rendering so tokens appear instantly -->
                @if (store.isGenerating()) {
                  <div class="font-sans text-sm sm:text-base leading-relaxed text-[#F5FFFA] whitespace-pre-wrap break-words selection:bg-[#E0218A]/30">
                    {{ output }}<span class="inline-block w-2 h-4 ml-1.5 bg-[#3EB991] animate-pulse align-middle rounded-xs"></span>
                  </div>
                } @else {
                  <!-- Once complete: render fully formatted with syntax containers and headings -->
                  <div
                    class="prose prose-invert max-w-none text-[#F5FFFA] leading-relaxed text-sm sm:text-base font-sans break-words selection:bg-[#E0218A]/30"
                    [innerHTML]="output | formatOutput"
                  ></div>
                }
              } @else if (store.isGenerating()) {
                <div class="flex items-center gap-2 text-sm text-[#8C94A8] py-4">
                  <span class="inline-block w-2.5 h-4 bg-[#3EB991] animate-pulse rounded-xs"></span>
                  <span>Synthesizing response with {{ activeModelName() }}...</span>
                </div>
              } @else {
                <div class="text-xs text-[#8C94A8] italic py-2">
                  No output generated yet. Tap play to run this prompt.
                </div>
              }
            </section>
          }

        </article>
      }
    </main>
  `,
})
export class CanvasView {
  protected readonly store = inject(PromptStore);
  readonly inputArea = viewChild<ElementRef<HTMLTextAreaElement>>('inputArea');
  readonly inputControl = new FormControl<string>('');

  protected readonly activePlaceholder = () => {
    const tpl = this.store.activeTemplate();
    return tpl && tpl.placeholderText ? tpl.placeholderText : 'Tap play to generate or paste input text here...';
  };

  protected readonly activeModelName = () => {
    const s = this.store.engineSettings();
    switch (s.activeProvider) {
      case 'gemini':
        return `Gemini (${s.geminiModel})`;
      case 'ollama':
        return `Ollama (${s.ollamaModel})`;
      case 'openai':
        return `OpenAI (${s.openaiModel})`;
      case 'anthropic':
        return `Anthropic (${s.anthropicModel})`;
      default:
        return 'Gemini 3.1 Flash Lite';
    }
  };

  constructor() {
    this.inputControl.setValue(this.store.inputText());

    // Sync inputControl if store.inputText is cleared or updated externally
    effect(() => {
      const text = this.store.inputText();
      if (this.inputControl.value !== text) {
        this.inputControl.setValue(text, { emitEvent: false });
        setTimeout(() => this.autoResizeTextarea(), 0);
      }
    });

    // Focus input area when Pink Edit button triggers it
    effect(() => {
      if (this.store.focusInputTrigger() > 0) {
        this.focusInputTextarea();
      }
    });
  }

  focusInputTextarea(): void {
    const el = this.inputArea()?.nativeElement;
    if (el) {
      el.focus();
      const len = el.value.length;
      el.setSelectionRange(len, len);
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  onInputChange(): void {
    const val = this.inputControl.value ?? '';
    this.store.setInputText(val);
    this.autoResizeTextarea();
  }

  clearInput(): void {
    this.inputControl.setValue('');
    this.store.setInputText('');
    this.autoResizeTextarea();
  }

  copyOutput(): void {
    const text = this.store.outputText();
    if (!text) return;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      this.store.showToast('Output copied to clipboard');
    }
  }

  private autoResizeTextarea(): void {
    const el = this.inputArea()?.nativeElement;
    if (el) {
      el.style.height = 'auto';
      el.style.height = `${Math.max(140, el.scrollHeight)}px`;
    }
  }
}
