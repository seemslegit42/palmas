import { Component, ElementRef, effect, inject, signal, viewChild, computed } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { PromptStore } from '../services/prompt-store';

const PRESET_COLORS = [
  '#20B2AA', // Roman Aqua / Verdigris
  '#3EB991', // Emerald Tertiary
  '#E0218A', // Aetheric Magenta
  '#6A0DAD', // Imperial Purple
  '#00B4D8', // Cyan Wave
  '#FFB703', // Warm Amber
  '#FF4D6D', // Coral Rose
  '#8B5CF6', // Violet
  '#38BDF8', // Sky Blue
  '#10B981', // Jade Green
];

@Component({
  selector: 'app-edit-view',
  imports: [ReactiveFormsModule, MatIconModule],
  template: `
    <main class="w-full max-w-xl mx-auto px-4 py-4 sm:py-6 pb-28">
      <form [formGroup]="editForm" (ngSubmit)="onSubmit()" class="space-y-4">
        
        <!-- Live Badge Preview -->
        <div class="rounded-xl bg-[#14161C] border border-white/10 p-3.5 flex items-center justify-between">
          <div class="flex items-center gap-2 min-w-0">
            <span class="text-xs text-[#8C94A8] uppercase tracking-wider font-mono">Preview:</span>
            <span
              class="inline-flex items-center gap-1 px-3 py-1 rounded-full font-mono font-bold text-xs sm:text-sm border truncate max-w-[280px]"
              [style.backgroundColor]="editForm.controls.color.value + '22'"
              [style.borderColor]="editForm.controls.color.value + '66'"
              [style.color]="editForm.controls.color.value"
            >
              <span>#</span>
              <span class="truncate">{{ editForm.controls.title.value || 'Untitled' }}</span>
            </span>
          </div>

          <span
            class="text-[11px] px-2 py-0.5 rounded-full font-medium"
            [class.bg-[#3EB991]/15]="hasQueryMarker()"
            [class.text-[#3EB991]]="hasQueryMarker()"
            [class.bg-[#FFB703]/15]="!hasQueryMarker()"
            [class.text-[#FFB703]]="!hasQueryMarker()"
          >
            {{ hasQueryMarker() ? '{{QUERY}} active' : 'No {{QUERY}} (auto-append)' }}
          </span>
        </div>

        <!-- Field 1: Title -->
        <div class="rounded-xl bg-[#14161C] border border-white/10 p-3 sm:p-4 focus-within:border-[#20B2AA] focus-within:ring-1 focus-within:ring-[#20B2AA] transition-all">
          <div class="flex items-center justify-between mb-1.5">
            <label for="prompt-title" class="block text-[11px] font-medium uppercase tracking-wider text-[#8C94A8]">
              Title <span class="text-[#FF4D6D]">*</span>
            </label>
            <span class="text-[10px] text-[#8C94A8] font-mono">
              {{ editForm.controls.title.value.length }}/60
            </span>
          </div>
          <input
            id="prompt-title"
            type="text"
            maxlength="60"
            formControlName="title"
            placeholder="e.g. git commit, User Stories, Code Review"
            class="w-full bg-transparent text-base sm:text-lg font-display font-semibold text-[#F5FFFA] placeholder-[#8C94A8]/40 focus:outline-none"
          />
        </div>

        <!-- Field 2: Prompt (systemPrompt) -->
        <div class="rounded-xl bg-[#14161C] border border-white/10 p-3 sm:p-4 focus-within:border-[#20B2AA] focus-within:ring-1 focus-within:ring-[#20B2AA] transition-all">
          <div class="flex items-center justify-between mb-1.5">
            <label for="prompt-system" class="block text-[11px] font-medium uppercase tracking-wider text-[#8C94A8]">
              System Prompt Instructions
            </label>
            <span class="text-[10px] text-[#8C94A8] font-mono">
              {{ promptCharCount() }} chars
            </span>
          </div>
          <textarea
            #promptTextarea
            id="prompt-system"
            formControlName="systemPrompt"
            rows="6"
            placeholder="Enter system prompt instructions. Use {{ '{{QUERY}}' }} where user input belongs..."
            class="w-full bg-transparent text-sm sm:text-base text-[#F5FFFA] placeholder-[#8C94A8]/40 focus:outline-none resize-y leading-relaxed font-sans"
          ></textarea>
        </div>

        <!-- Query Insertion Point Row (Matching Ability Reference) -->
        <div class="rounded-xl bg-[#14161C] border border-white/10 p-3 sm:p-4 flex items-center justify-between gap-3">
          <div>
            <span class="text-sm font-medium text-[#F5FFFA] block">
              Query insertion point
            </span>
            <span class="text-xs text-[#8C94A8] block">
              Inserts the <code class="px-1 py-0.5 rounded bg-[#08090C] text-[#20B2AA] font-mono text-[11px]">{{ '{{QUERY}}' }}</code> marker
            </span>
          </div>

          <button
            type="button"
            (click)="insertQueryAtCursor()"
            class="min-h-[44px] px-4 py-2 rounded-xl bg-[#22252F] hover:bg-[#2D303C] text-[#F5FFFA] text-xs font-semibold flex items-center gap-1.5 active:scale-95 transition-all border border-white/10 shrink-0"
          >
            <mat-icon class="text-base text-[#20B2AA]">post_add</mat-icon>
            <span>Set at cursor</span>
          </button>
        </div>

        <!-- Color Row -->
        <div class="rounded-xl bg-[#14161C] border border-white/10 p-3 sm:p-4 space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-sm font-medium text-[#F5FFFA]">Tag Color</span>
            
            <!-- Colored hashtag preview badge -->
            <div
              class="w-9 h-9 rounded-lg flex items-center justify-center font-mono font-bold text-base text-white shadow-xs border transition-colors"
              [style.backgroundColor]="editForm.controls.color.value"
              [style.borderColor]="editForm.controls.color.value"
            >
              #
            </div>
          </div>

          <!-- Color palette swatches -->
          <div class="flex items-center gap-2 flex-wrap pt-1">
            @for (hex of presetColors; track hex) {
              <button
                type="button"
                (click)="editForm.controls.color.setValue(hex)"
                class="min-h-[44px] min-w-[44px] w-9 h-9 rounded-lg transition-transform flex items-center justify-center border cursor-pointer"
                [style.backgroundColor]="hex"
                [style.borderColor]="editForm.controls.color.value === hex ? '#FFFFFF' : 'transparent'"
                [class.scale-110]="editForm.controls.color.value === hex"
                [class.ring-2]="editForm.controls.color.value === hex"
                [class.ring-white]="editForm.controls.color.value === hex"
                [attr.aria-label]="'Select color ' + hex"
              >
                @if (editForm.controls.color.value === hex) {
                  <mat-icon class="text-sm text-white drop-shadow">check</mat-icon>
                }
              </button>
            }

            <!-- Native Color Picker & Hex Input -->
            <div class="flex items-center gap-1 ml-auto">
              <input
                type="color"
                [value]="editForm.controls.color.value"
                (input)="onColorPickerInput($event)"
                class="w-9 h-9 p-0.5 rounded-lg bg-[#08090C] border border-white/10 cursor-pointer"
                title="Choose custom color"
              />
              <span class="text-xs text-[#8C94A8] font-mono">#</span>
              <input
                type="text"
                [value]="editForm.controls.color.value.replace('#', '')"
                (input)="onCustomHexInput($event)"
                maxlength="7"
                class="w-20 h-9 px-2 rounded-lg bg-[#08090C] border border-white/10 text-xs font-mono text-[#F5FFFA] uppercase focus:outline-none focus:border-[#20B2AA]"
                aria-label="Custom Hex Color"
              />
            </div>
          </div>
        </div>

        <!-- Field 3: Retry / Follow-Up Prompt -->
        <div class="rounded-xl bg-[#14161C] border border-white/10 p-3 sm:p-4 focus-within:border-[#20B2AA] focus-within:ring-1 focus-within:ring-[#20B2AA] transition-all">
          <label for="prompt-followup" class="block text-[11px] font-medium uppercase tracking-wider text-[#8C94A8] mb-1.5">
            Follow-Up Prompt (For Retries)
          </label>
          <textarea
            id="prompt-followup"
            formControlName="followUpPrompt"
            rows="3"
            placeholder="e.g. Please provide an alternative variation with more concise detail..."
            class="w-full bg-transparent text-sm text-[#F5FFFA] placeholder-[#8C94A8]/40 focus:outline-none resize-y leading-relaxed font-sans"
          ></textarea>
        </div>

        <!-- Field 4: Canvas Placeholder Text Hint -->
        <div class="rounded-xl bg-[#14161C] border border-white/10 p-3 sm:p-4 focus-within:border-[#20B2AA] focus-within:ring-1 focus-within:ring-[#20B2AA] transition-all">
          <label for="prompt-placeholder" class="block text-[11px] font-medium uppercase tracking-wider text-[#8C94A8] mb-1.5">
            Input Field Placeholder or Hint
          </label>
          <input
            id="prompt-placeholder"
            type="text"
            formControlName="placeholderText"
            placeholder="e.g. Paste git diff or paste your requirements here..."
            class="w-full bg-transparent text-sm text-[#F5FFFA] placeholder-[#8C94A8]/40 focus:outline-none"
          />
        </div>

        <!-- Bottom Action Buttons: Delete & Save -->
        <div class="flex items-center justify-end gap-3 pt-4">
          @if (store.editingTemplateId()) {
            <button
              type="button"
              (click)="confirmDelete.set(true)"
              class="min-h-[44px] min-w-[100px] px-6 py-2.5 rounded-xl bg-[#FF4D6D]/15 hover:bg-[#FF4D6D]/25 text-[#FF4D6D] border border-[#FF4D6D]/30 font-medium text-sm flex items-center justify-center gap-1.5 active:scale-95 transition-all"
            >
              <mat-icon class="text-base">delete</mat-icon>
              <span>Delete</span>
            </button>
          }

          <button
            type="submit"
            [disabled]="!editForm.controls.title.value.trim()"
            class="min-h-[44px] min-w-[120px] px-7 py-2.5 rounded-xl bg-[#20B2AA] hover:bg-[#25c4bb] text-white font-medium text-sm flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-[#20B2AA]/20 disabled:opacity-40 disabled:pointer-events-none"
          >
            <mat-icon class="text-base">save</mat-icon>
            <span>Save</span>
          </button>
        </div>

      </form>

      <!-- Delete Confirmation Modal -->
      @if (confirmDelete()) {
        <div
          role="dialog"
          aria-modal="true"
          class="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          (click)="confirmDelete.set(false)"
          (keydown.escape)="confirmDelete.set(false)"
          tabindex="0"
        >
          <div
            class="w-full max-w-sm bg-[#14161C] border border-white/10 rounded-2xl p-6 shadow-2xl"
            (click)="$event.stopPropagation()"
            (keydown.escape)="confirmDelete.set(false)"
            tabindex="0"
          >
            <div class="w-12 h-12 rounded-full bg-[#FF4D6D]/15 text-[#FF4D6D] flex items-center justify-center mb-4 mx-auto">
              <mat-icon class="text-2xl">warning</mat-icon>
            </div>
            <h3 class="font-display font-bold text-base text-[#F5FFFA] text-center mb-2">
              Delete Prompt Template?
            </h3>
            <p class="text-xs text-[#8C94A8] text-center mb-6 leading-relaxed">
              Are you sure you want to delete "{{ editForm.controls.title.value }}"? This template will be permanently removed.
            </p>
            <div class="flex items-center gap-3">
              <button
                type="button"
                (click)="confirmDelete.set(false)"
                class="flex-1 min-h-[44px] rounded-xl bg-[#1A1C23] hover:bg-[#22252F] text-xs font-semibold text-[#F5FFFA] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                (click)="executeDelete()"
                class="flex-1 min-h-[44px] rounded-xl bg-[#FF4D6D] hover:bg-[#ff3358] text-xs font-semibold text-white transition-colors shadow-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      }
    </main>
  `,
})
export class EditView {
  protected readonly store = inject(PromptStore);
  readonly promptTextarea = viewChild<ElementRef<HTMLTextAreaElement>>('promptTextarea');
  readonly presetColors = PRESET_COLORS;
  readonly confirmDelete = signal<boolean>(false);

  readonly editForm = new FormGroup({
    title: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    systemPrompt: new FormControl<string>('', { nonNullable: true }),
    color: new FormControl<string>('#20B2AA', { nonNullable: true }),
    placeholderText: new FormControl<string>('', { nonNullable: true }),
    followUpPrompt: new FormControl<string>('', { nonNullable: true }),
  });

  readonly hasQueryMarker = computed(() => {
    const text = this.editForm.controls.systemPrompt.value;
    return text.includes('{{QUERY}}');
  });

  readonly promptCharCount = computed(() => {
    return this.editForm.controls.systemPrompt.value.length;
  });

  constructor() {
    effect(() => {
      const existing = this.store.editingTemplate();
      if (existing) {
        this.editForm.patchValue({
          title: existing.title,
          systemPrompt: existing.systemPrompt,
          color: existing.color || '#20B2AA',
          placeholderText: existing.placeholderText || '',
          followUpPrompt: existing.followUpPrompt || '',
        });
      } else {
        this.editForm.reset({
          title: '',
          systemPrompt: '',
          color: '#20B2AA',
          placeholderText: '',
          followUpPrompt: '',
        });
      }
    });
  }

  insertQueryAtCursor(): void {
    const el = this.promptTextarea()?.nativeElement;
    const marker = '{{QUERY}}';
    if (!el) {
      const current = this.editForm.controls.systemPrompt.value;
      this.editForm.controls.systemPrompt.setValue(current ? `${current} ${marker}` : marker);
      return;
    }

    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? el.value.length;
    const current = this.editForm.controls.systemPrompt.value;
    const nextVal = current.substring(0, start) + marker + current.substring(end);

    this.editForm.controls.systemPrompt.setValue(nextVal);

    // Set cursor position after the inserted marker
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + marker.length, start + marker.length);
    }, 0);
  }

  onColorPickerInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.value) {
      this.editForm.controls.color.setValue(input.value);
    }
  }

  onCustomHexInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let val = input.value.trim();
    if (!val.startsWith('#')) {
      val = `#${val}`;
    }
    if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
      this.editForm.controls.color.setValue(val);
    }
  }

  onSubmit(): void {
    const raw = this.editForm.getRawValue();
    if (!raw.title.trim()) return;

    this.store.saveTemplate({
      id: this.store.editingTemplateId() ?? undefined,
      title: raw.title,
      systemPrompt: raw.systemPrompt,
      color: raw.color,
      placeholderText: raw.placeholderText,
      followUpPrompt: raw.followUpPrompt,
    });
  }

  executeDelete(): void {
    this.confirmDelete.set(false);
    const id = this.store.editingTemplateId();
    if (id) {
      this.store.deleteTemplate(id);
    }
  }
}
