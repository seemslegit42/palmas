import { Component, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { PromptStore } from '../services/prompt-store';
import { PwaInstallButton } from './pwa-install-button';

@Component({
  selector: 'app-nav-header',
  imports: [MatIconModule, PwaInstallButton],
  template: `
    <header class="sticky top-0 z-30 h-14 bg-[#0E1015]/90 backdrop-blur-md border-b border-white/10 px-3 sm:px-4 flex items-center justify-between transition-colors">
      @switch (store.currentView()) {
        @case ('canvas') {
          <!-- Canvas View Header -->
          <div class="flex items-center gap-2">
            <button
              type="button"
              (click)="store.openManage()"
              class="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-[#8C94A8] hover:text-[#F5FFFA] hover:bg-[#1A1C23] active:scale-95 transition-all cursor-pointer"
              aria-label="Manage Prompts"
              title="Manage Prompts"
            >
              <mat-icon class="text-xl">menu</mat-icon>
            </button>
            <span class="font-display font-bold text-sm tracking-tight text-[#F5FFFA] hidden xs:inline">
              Palmos
            </span>
          </div>

          <!-- Active hashtag badge: Tapping opens Edit screen -->
          <div class="flex-1 flex justify-center px-2 min-w-0">
            @if (store.activeTemplate(); as template) {
              <button
                type="button"
                (click)="store.openEdit(template.id)"
                class="min-h-[40px] px-3.5 py-1.5 rounded-full flex items-center gap-1.5 text-xs sm:text-sm font-semibold max-w-[200px] sm:max-w-xs truncate transition-all active:scale-95 border shadow-sm group hover:brightness-110 cursor-pointer"
                [style.backgroundColor]="template.color + '1F'"
                [style.borderColor]="template.color + '55'"
                [style.color]="template.color"
                title="Tap to edit this prompt"
              >
                <span class="font-bold text-sm opacity-90">#</span>
                <span class="truncate">{{ template.title }}</span>
                <mat-icon class="text-xs !w-3.5 !h-3.5 text-current opacity-70 group-hover:opacity-100 transition-opacity">edit</mat-icon>
              </button>
            } @else {
              <button
                type="button"
                (click)="store.openEdit()"
                class="min-h-[38px] px-3 py-1.5 rounded-full bg-[#1A1C23] border border-white/10 text-xs text-[#8C94A8] hover:text-[#F5FFFA] flex items-center gap-1 active:scale-95 transition-all cursor-pointer"
              >
                <mat-icon class="text-sm">add</mat-icon>
                <span>No active prompt (Create +)</span>
              </button>
            }
          </div>

          <!-- Right side actions: PWA Install, Settings & New Prompt -->
          <div class="flex items-center gap-1">
            <app-pwa-install-button />

            <button
              type="button"
              (click)="store.openSettings()"
              class="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-[#8C94A8] hover:text-[#F5FFFA] hover:bg-[#1A1C23] active:scale-95 transition-all cursor-pointer"
              aria-label="Engine Settings"
              title="Settings & Model Provider"
            >
              <mat-icon class="text-xl">settings</mat-icon>
            </button>

            <button
              type="button"
              (click)="store.openEdit()"
              class="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-[#E0218A] hover:bg-[#E0218A]/10 active:scale-95 transition-all cursor-pointer"
              aria-label="New Prompt"
              title="New Prompt Template"
            >
              <mat-icon class="text-xl">add</mat-icon>
            </button>
          </div>
        }

        @case ('manage') {
          <!-- Manage Prompts View Header -->
          <div class="flex items-center gap-2">
            <button
              type="button"
              (click)="store.openCanvas()"
              class="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-[#8C94A8] hover:text-[#F5FFFA] hover:bg-[#1A1C23] active:scale-95 transition-all cursor-pointer"
              aria-label="Back to Canvas"
            >
              <mat-icon class="text-xl">arrow_back</mat-icon>
            </button>
            <h1 class="font-display font-bold text-base sm:text-lg text-[#F5FFFA] tracking-tight">
              Manage Prompts
            </h1>
          </div>

          <div class="flex items-center gap-1">
            <app-pwa-install-button />

            <button
              type="button"
              (click)="store.openSettings()"
              class="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-[#8C94A8] hover:text-[#F5FFFA] hover:bg-[#1A1C23] active:scale-95 transition-all cursor-pointer"
              aria-label="Engine Settings"
              title="Settings"
            >
              <mat-icon class="text-xl">settings</mat-icon>
            </button>

            <button
              type="button"
              (click)="store.openEdit()"
              class="min-h-[44px] px-3.5 py-1.5 rounded-xl bg-[#E0218A] text-white hover:bg-[#FF2A9D] font-medium text-xs sm:text-sm flex items-center gap-1.5 active:scale-95 transition-all shadow-md shadow-[#E0218A]/20 cursor-pointer"
              aria-label="Create New Prompt"
            >
              <mat-icon class="text-base">add</mat-icon>
              <span class="hidden xs:inline">New Prompt</span>
            </button>
          </div>
        }

        @case ('edit') {
          <!-- Edit Prompt View Header -->
          <div class="flex items-center gap-2">
            <button
              type="button"
              (click)="store.editingTemplate() ? store.openCanvas() : store.openManage()"
              class="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-[#8C94A8] hover:text-[#F5FFFA] hover:bg-[#1A1C23] active:scale-95 transition-all cursor-pointer"
              aria-label="Back"
            >
              <mat-icon class="text-xl">arrow_back</mat-icon>
            </button>
            <h1 class="font-display font-bold text-base sm:text-lg text-[#F5FFFA] tracking-tight">
              {{ store.editingTemplate() ? 'Edit prompt' : 'New prompt' }}
            </h1>
          </div>

          <div class="flex items-center gap-1">
            <button
              type="button"
              (click)="store.openCanvas()"
              class="min-h-[44px] px-3 py-1 text-xs text-[#8C94A8] hover:text-[#F5FFFA] flex items-center gap-1 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
          </div>
        }

        @case ('settings') {
          <!-- Settings View Header -->
          <div class="flex items-center gap-2">
            <button
              type="button"
              (click)="store.openCanvas()"
              class="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-[#8C94A8] hover:text-[#F5FFFA] hover:bg-[#1A1C23] active:scale-95 transition-all cursor-pointer"
              aria-label="Back to Canvas"
            >
              <mat-icon class="text-xl">arrow_back</mat-icon>
            </button>
            <h1 class="font-display font-bold text-base sm:text-lg text-[#F5FFFA] tracking-tight">
              Settings
            </h1>
          </div>

          <div class="flex items-center gap-1">
            <button
              type="button"
              (click)="store.openCanvas()"
              class="min-h-[44px] px-3 py-1 text-xs text-[#20B2AA] hover:text-white flex items-center gap-1 rounded-lg cursor-pointer font-medium"
            >
              Done
            </button>
          </div>
        }
      }
    </header>
  `,
})
export class NavHeader {
  protected readonly store = inject(PromptStore);
}
