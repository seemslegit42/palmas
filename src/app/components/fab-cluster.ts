import { Component, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { PromptStore } from '../services/prompt-store';

@Component({
  selector: 'app-fab-cluster',
  imports: [MatIconModule],
  template: `
    <aside
      class="fixed bottom-6 right-4 sm:right-6 z-20 flex flex-col items-end gap-3"
      aria-label="Prompt Canvas Actions"
    >
      <!-- Paste Button -->
      <button
        type="button"
        (click)="onPasteClick()"
        class="group relative min-h-[48px] min-w-[48px] h-12 w-12 rounded-full bg-[#1A1C23] hover:bg-[#22252F] text-[#20B2AA] border border-[#20B2AA]/30 flex items-center justify-center shadow-lg shadow-black/40 active:scale-90 transition-all cursor-pointer hover:border-[#20B2AA]"
        aria-label="Paste from clipboard"
        title="Paste into Input"
      >
        <mat-icon class="text-2xl transition-transform group-hover:scale-110">content_paste</mat-icon>
        <span
          class="pointer-events-none absolute right-14 whitespace-nowrap rounded-lg bg-[#14161C]/90 px-2 py-1 text-[11px] font-medium text-[#F5FFFA] border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
        >
          Paste Input
        </span>
      </button>

      <!-- Play (Execute) / Stop (Cancel) Button -->
      <button
        type="button"
        (click)="onPlayOrStopClick()"
        [disabled]="!store.activeTemplate()"
        class="group relative min-h-[56px] min-w-[56px] h-14 w-14 rounded-full flex items-center justify-center shadow-xl active:scale-90 transition-all disabled:opacity-40 disabled:pointer-events-none ring-4 cursor-pointer"
        [class.bg-[#3EB991]]="!store.isGenerating()"
        [class.hover:bg-[#46cf9e]]="!store.isGenerating()"
        [class.ring-[#3EB991]/20]="!store.isGenerating()"
        [class.shadow-[#3EB991]/35]="!store.isGenerating()"
        [class.bg-[#FF4D6D]]="store.isGenerating()"
        [class.hover:bg-[#ff3358]]="store.isGenerating()"
        [class.ring-[#FF4D6D]/30]="store.isGenerating()"
        [class.shadow-[#FF4D6D]/40]="store.isGenerating()"
        [attr.aria-label]="store.isGenerating() ? 'Stop Generation' : 'Execute Active Prompt'"
        [attr.title]="store.isGenerating() ? 'Stop Generation' : 'Execute Prompt'"
      >
        @if (store.isGenerating()) {
          <mat-icon class="text-2xl text-white">stop</mat-icon>
        } @else {
          <mat-icon class="text-3xl ml-0.5 text-white transition-transform group-hover:scale-110">play_arrow</mat-icon>
        }
        <span
          class="pointer-events-none absolute right-16 whitespace-nowrap rounded-lg bg-[#14161C]/90 px-2 py-1 text-[11px] font-medium text-[#F5FFFA] border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
        >
          {{ store.isGenerating() ? 'Stop Execution' : 'Execute Prompt' }}
        </span>
      </button>
    </aside>
  `,
})
export class FabCluster {
  protected readonly store = inject(PromptStore);

  async onPasteClick(): Promise<void> {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text && text.trim().length > 0) {
          const current = this.store.inputText();
          const next = current.trim() ? `${current}\n${text}` : text;
          this.store.setInputText(next);
          this.store.focusCanvasInput();
          this.store.showToast('Pasted from clipboard');
        } else {
          this.store.showToast('Clipboard is empty');
          this.store.focusCanvasInput();
        }
      } else {
        this.store.showToast('Paste directly into the text area');
        this.store.focusCanvasInput();
      }
    } catch {
      this.store.showToast('Tap the input box to paste');
      this.store.focusCanvasInput();
    }
  }

  onPlayOrStopClick(): void {
    if (this.store.isGenerating()) {
      this.store.cancelExecution();
      return;
    }

    if (!this.store.activeTemplate()) {
      this.store.showToast('Please select or create a prompt first.');
      this.store.openEdit();
      return;
    }

    this.store.executePrompt(false);
  }
}
