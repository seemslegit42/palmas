import { Component, inject, signal, computed } from '@angular/core';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { PromptStore } from '../services/prompt-store';
import { PromptTemplate } from '../models/prompt-template';

@Component({
  selector: 'app-manage-view',
  imports: [ReactiveFormsModule, MatIconModule],
  template: `
    <main class="w-full max-w-2xl mx-auto px-4 py-4 sm:py-6 pb-28">
      <!-- Search & Quick Actions -->
      <section class="mb-4 sm:mb-6 flex items-center gap-2">
        <div class="relative flex-1">
          <mat-icon class="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8C94A8] text-lg">search</mat-icon>
          <input
            type="text"
            [formControl]="searchControl"
            placeholder="Search prompt templates..."
            class="w-full h-11 pl-10 pr-4 rounded-xl bg-[#14161C] border border-white/10 text-sm text-[#F5FFFA] placeholder-[#8C94A8] focus:outline-none focus:border-[#20B2AA] focus:ring-1 focus:ring-[#20B2AA] transition-all"
            aria-label="Search prompts"
          />
        </div>

        <!-- Export / Import trigger -->
        <button
          type="button"
          (click)="showImportExportModal.set(true)"
          class="min-h-[44px] min-w-[44px] h-11 px-3 rounded-xl bg-[#14161C] border border-white/10 text-[#8C94A8] hover:text-[#F5FFFA] hover:bg-[#1A1C23] flex items-center justify-center gap-1.5 active:scale-95 transition-all text-xs font-medium"
          title="Backup, Export, or Import prompts"
          aria-label="Backup or Import Prompts"
        >
          <mat-icon class="text-lg">import_export</mat-icon>
          <span class="hidden sm:inline">Backup</span>
        </button>
      </section>

      <!-- Prompt List -->
      @if (filteredTemplates().length === 0) {
        <div class="rounded-2xl bg-[#14161C] border border-white/10 p-8 text-center flex flex-col items-center">
          <mat-icon class="text-4xl text-[#8C94A8] mb-3">folder_open</mat-icon>
          <h2 class="font-display font-semibold text-base text-[#F5FFFA] mb-1">
            {{ searchControl.value ? 'No matching prompts found' : 'No prompt templates saved' }}
          </h2>
          <p class="text-xs text-[#8C94A8] max-w-xs mb-5">
            {{ searchControl.value ? 'Try adjusting your search query.' : 'Create a custom template to build your personal prompt engine.' }}
          </p>
          <button
            type="button"
            (click)="store.openEdit()"
            class="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#E0218A] hover:bg-[#FF2A9D] text-white font-medium text-xs sm:text-sm flex items-center gap-2 active:scale-95 transition-all shadow-md shadow-[#E0218A]/20"
          >
            <mat-icon class="text-lg">add</mat-icon>
            <span>Create New Prompt</span>
          </button>
        </div>
      } @else {
        <div class="space-y-3" role="list">
          @for (tpl of filteredTemplates(); track tpl.id) {
            <div
              role="listitem"
              (touchstart)="onTouchStart(tpl)"
              (touchend)="onTouchEnd()"
              (touchcancel)="onTouchCancel()"
              class="group relative rounded-2xl bg-[#14161C] hover:bg-[#1A1C23] border border-white/10 hover:border-white/20 p-4 transition-all shadow-xs flex items-start justify-between gap-3 select-none"
              [class.ring-1]="store.activeTemplateId() === tpl.id"
              [class.ring-[#20B2AA]]="store.activeTemplateId() === tpl.id"
            >
              <!-- Tap to activate & switch to canvas -->
              <button
                type="button"
                (click)="onSelectTemplate(tpl.id)"
                class="flex-1 min-w-0 pr-2 text-left cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#20B2AA] rounded-lg"
              >
                <div class="flex items-center gap-2 mb-1.5 flex-wrap">
                  <!-- Colored "#" badge -->
                  <span
                    class="inline-flex items-center justify-center px-2 py-0.5 rounded-md font-mono font-bold text-xs border"
                    [style.backgroundColor]="tpl.color + '22'"
                    [style.color]="tpl.color"
                    [style.borderColor]="tpl.color + '55'"
                  >
                    # {{ tpl.title }}
                  </span>

                  @if (store.activeTemplateId() === tpl.id) {
                    <span class="inline-flex items-center gap-1 text-[11px] font-medium text-[#20B2AA] px-1.5 py-0.5 rounded bg-[#20B2AA]/10">
                      <mat-icon class="text-xs !w-3 !h-3">check_circle</mat-icon>
                      Active
                    </span>
                  }

                  @if (tpl.followUpPrompt) {
                    <span class="text-[10px] text-[#8C94A8] flex items-center gap-0.5" title="Has retry/follow-up instructions">
                      <mat-icon class="text-xs !w-3 !h-3 text-[#20B2AA]">replay</mat-icon>
                      Retry enabled
                    </span>
                  }
                </div>

                <!-- Snippet of systemPrompt with highlighted {{QUERY}} -->
                @let parts = getSnippetParts(tpl.systemPrompt);
                <p class="text-xs text-[#8C94A8] line-clamp-2 leading-relaxed">
                  @if (parts.hasQuery) {
                    <span>{{ parts.before }}</span>
                    <span class="inline-block px-1.5 py-0.2 rounded bg-[#20B2AA]/20 text-[#20B2AA] font-mono text-[10px] font-bold border border-[#20B2AA]/30 mx-0.5">
                      {{ '{{QUERY}}' }}
                    </span>
                    <span>{{ parts.after }}</span>
                  } @else {
                    <span>{{ parts.before }}</span>
                  }
                </p>

                <!-- Query placeholder indicator -->
                @if (tpl.placeholderText) {
                  <p class="text-[11px] text-[#8C94A8]/60 mt-2 italic truncate">
                    Hint: "{{ tpl.placeholderText }}"
                  </p>
                }
              </button>

              <!-- Action Menu Button (Desktop & Touch fallback for tap-and-hold) -->
              <div class="relative shrink-0 flex items-center">
                <button
                  type="button"
                  (click)="openActionMenu(tpl, $event)"
                  class="min-h-[44px] min-w-[44px] rounded-xl text-[#8C94A8] hover:text-[#F5FFFA] hover:bg-[#22252F] flex items-center justify-center active:scale-95 transition-all"
                  aria-label="Prompt Options"
                >
                  <mat-icon class="text-xl">more_vert</mat-icon>
                </button>
              </div>
            </div>
          }
        </div>

        <p class="text-center text-xs text-[#8C94A8]/60 mt-6">
          Tip: Tap any item to activate, or tap and hold (or 3-dots) for options.
        </p>
      }

      <!-- Action Bottom Sheet / Context Modal -->
      @if (selectedForAction(); as target) {
        <div
          role="dialog"
          aria-modal="true"
          tabindex="0"
          class="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in"
          (click)="closeActionMenu()"
          (keydown.escape)="closeActionMenu()"
        >
          <div
            tabindex="0"
            role="document"
            class="w-full sm:max-w-md bg-[#14161C] border-t sm:border border-white/10 rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl"
            (click)="$event.stopPropagation()"
            (keydown.escape)="closeActionMenu()"
          >
            <!-- Drag handle on mobile -->
            <div class="w-10 h-1 bg-[#8C94A8]/30 rounded-full mx-auto mb-4 sm:hidden"></div>

            <div class="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
              <div class="flex items-center gap-2 truncate">
                <span
                  class="w-3 h-3 rounded-full shrink-0"
                  [style.backgroundColor]="target.color"
                ></span>
                <h3 class="font-display font-bold text-sm text-[#F5FFFA] truncate">
                  {{ target.title }}
                </h3>
              </div>
              <button
                type="button"
                (click)="closeActionMenu()"
                class="min-h-[36px] min-w-[36px] rounded-lg text-[#8C94A8] hover:text-white flex items-center justify-center"
              >
                <mat-icon class="text-lg">close</mat-icon>
              </button>
            </div>

            <!-- Action buttons -->
            <div class="space-y-1.5">
              <button
                type="button"
                (click)="onSelectTemplate(target.id); closeActionMenu()"
                class="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl text-left text-sm text-[#F5FFFA] hover:bg-[#1A1C23] flex items-center gap-3 transition-colors"
              >
                <mat-icon class="text-[#20B2AA]">play_circle</mat-icon>
                <span>Select & Open Canvas</span>
              </button>

              <button
                type="button"
                (click)="store.openEdit(target.id); closeActionMenu()"
                class="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl text-left text-sm text-[#F5FFFA] hover:bg-[#1A1C23] flex items-center gap-3 transition-colors"
              >
                <mat-icon class="text-[#8C94A8]">edit</mat-icon>
                <span>Edit Prompt</span>
              </button>

              <button
                type="button"
                (click)="duplicateTemplate(target.id)"
                class="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl text-left text-sm text-[#F5FFFA] hover:bg-[#1A1C23] flex items-center gap-3 transition-colors"
              >
                <mat-icon class="text-[#8C94A8]">content_copy</mat-icon>
                <span>Duplicate</span>
              </button>

              <button
                type="button"
                (click)="deleteTemplate(target.id)"
                class="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl text-left text-sm text-[#FF4D6D] hover:bg-[#FF4D6D]/10 flex items-center gap-3 transition-colors"
              >
                <mat-icon class="text-[#FF4D6D]">delete</mat-icon>
                <span>Delete Prompt</span>
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Backup / Export / Import Modal -->
      @if (showImportExportModal()) {
        <div
          role="dialog"
          aria-modal="true"
          tabindex="0"
          class="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          (click)="showImportExportModal.set(false)"
          (keydown.escape)="showImportExportModal.set(false)"
        >
          <div
            tabindex="0"
            role="document"
            class="w-full max-w-lg bg-[#14161C] border border-white/10 rounded-2xl p-6 shadow-2xl"
            (click)="$event.stopPropagation()"
            (keydown.escape)="showImportExportModal.set(false)"
          >
            <div class="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <h3 class="font-display font-bold text-base text-[#F5FFFA]">
                Backup & Restore Prompts
              </h3>
              <button
                type="button"
                (click)="showImportExportModal.set(false)"
                class="min-h-[36px] min-w-[36px] rounded-lg text-[#8C94A8] hover:text-white flex items-center justify-center"
              >
                <mat-icon class="text-lg">close</mat-icon>
              </button>
            </div>

            <p class="text-xs text-[#8C94A8] mb-4 leading-relaxed">
              Export your prompt library as JSON to back it up, or paste a JSON array of templates to import.
            </p>

            <textarea
              #backupArea
              rows="7"
              [value]="exportJsonString"
              placeholder="Paste prompt JSON here..."
              class="w-full bg-[#08090C] border border-white/10 rounded-xl p-3 font-mono text-xs text-[#F5FFFA] focus:outline-none focus:border-[#20B2AA] mb-4 resize-none"
            ></textarea>

            <div class="flex flex-wrap items-center justify-between gap-2 mb-6">
              <button
                type="button"
                (click)="copyExportJson(backupArea.value)"
                class="min-h-[44px] px-4 py-2 rounded-xl bg-[#1A1C23] hover:bg-[#22252F] text-xs font-medium text-[#F5FFFA] flex items-center gap-1.5 transition-all"
              >
                <mat-icon class="text-sm">content_copy</mat-icon>
                <span>Copy Current JSON</span>
              </button>

              <button
                type="button"
                (click)="onImportJson(backupArea.value)"
                class="min-h-[44px] px-5 py-2 rounded-xl bg-[#20B2AA] hover:bg-[#25c4bb] text-xs font-semibold text-white flex items-center gap-1.5 transition-all shadow-sm"
              >
                <mat-icon class="text-sm">file_download</mat-icon>
                <span>Import JSON</span>
              </button>
            </div>

            <!-- API Endpoint Setting -->
            <div class="pt-4 border-t border-white/10">
              <label for="api-endpoint-input" class="block text-xs font-medium text-[#F5FFFA] mb-1">
                API Endpoint Configuration
              </label>
              <p class="text-[11px] text-[#8C94A8] mb-2">
                Execution requests will stream from this endpoint. Default: <code class="text-[#20B2AA] font-mono">/api/prompt/execute</code>
              </p>
              <div class="flex items-center gap-2">
                <input
                  id="api-endpoint-input"
                  type="text"
                  #endpointInput
                  [value]="store.apiEndpoint()"
                  placeholder="/api/prompt/execute"
                  class="flex-1 h-10 px-3 rounded-xl bg-[#08090C] border border-white/10 text-xs font-mono text-[#F5FFFA] focus:outline-none focus:border-[#20B2AA]"
                />
                <button
                  type="button"
                  (click)="store.setApiEndpoint(endpointInput.value)"
                  class="min-h-[40px] px-4 rounded-xl bg-[#1A1C23] hover:bg-[#22252F] text-xs font-semibold text-[#F5FFFA] transition-colors"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      }
    </main>
  `,
})
export class ManageView {
  protected readonly store = inject(PromptStore);
  readonly searchControl = new FormControl<string>('');
  readonly selectedForAction = signal<PromptTemplate | null>(null);
  readonly showImportExportModal = signal<boolean>(false);

  private touchTimer: ReturnType<typeof setTimeout> | null = null;

  readonly filteredTemplates = computed(() => {
    const list = this.store.templates();
    const query = (this.searchControl.value ?? '').toLowerCase().trim();
    if (!query) return list;
    return list.filter(
      (t) =>
        t.title.toLowerCase().includes(query) ||
        t.systemPrompt.toLowerCase().includes(query)
    );
  });

  get exportJsonString(): string {
    return this.store.exportTemplates();
  }

  getSnippetParts(text: string): { before: string; hasQuery: boolean; after: string } {
    if (!text) return { before: '(No system prompt instructions)', hasQuery: false, after: '' };
    const idx = text.indexOf('{{QUERY}}');
    if (idx === -1) return { before: text, hasQuery: false, after: '' };
    return {
      before: text.slice(0, idx),
      hasQuery: true,
      after: text.slice(idx + 9),
    };
  }

  onSelectTemplate(id: string): void {
    this.store.setActiveTemplate(id);
  }

  openActionMenu(tpl: PromptTemplate, event: Event): void {
    event.stopPropagation();
    this.selectedForAction.set(tpl);
  }

  closeActionMenu(): void {
    this.selectedForAction.set(null);
  }

  duplicateTemplate(id: string): void {
    this.store.duplicateTemplate(id);
    this.closeActionMenu();
  }

  deleteTemplate(id: string): void {
    this.store.deleteTemplate(id);
    this.closeActionMenu();
  }

  // Touch & hold gesture
  onTouchStart(tpl: PromptTemplate): void {
    this.touchTimer = setTimeout(() => {
      this.selectedForAction.set(tpl);
    }, 600);
  }

  onTouchEnd(): void {
    if (this.touchTimer) {
      clearTimeout(this.touchTimer);
      this.touchTimer = null;
    }
  }

  onTouchCancel(): void {
    if (this.touchTimer) {
      clearTimeout(this.touchTimer);
      this.touchTimer = null;
    }
  }

  copyExportJson(text: string): void {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      this.store.showToast('JSON copied to clipboard');
    }
  }

  onImportJson(text: string): void {
    if (!text.trim()) {
      this.store.showToast('Please provide valid JSON');
      return;
    }
    const success = this.store.importTemplates(text);
    if (success) {
      this.showImportExportModal.set(false);
    } else {
      this.store.showToast('Invalid JSON format for templates');
    }
  }
}

