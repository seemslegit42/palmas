import { Component, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { PwaInstallService } from '../services/pwa-install';

@Component({
  selector: 'app-pwa-install-button',
  imports: [MatIconModule],
  template: `
    @if (!pwa.isInstalled()) {
      <button
        type="button"
        (click)="pwa.install()"
        class="min-h-[38px] px-2.5 sm:px-3 py-1.5 rounded-xl bg-[#20B2AA]/15 hover:bg-[#20B2AA]/25 text-[#20B2AA] border border-[#20B2AA]/30 text-xs font-semibold flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer shadow-xs"
        title="Install Palmos app on your device"
        aria-label="Install Palmos App"
      >
        <mat-icon class="text-base !w-4 !h-4">get_app</mat-icon>
        <span class="hidden sm:inline">Install App</span>
      </button>

      <!-- Install Guide Modal for iOS / Safari / Manual install -->
      @if (pwa.showIOSModal()) {
        <div
          role="dialog"
          aria-modal="true"
          class="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          (click)="pwa.closeGuide()"
          (keydown.escape)="pwa.closeGuide()"
          tabindex="0"
        >
          <div
            class="w-full max-w-sm bg-[#14161C] border border-white/10 rounded-2xl p-6 shadow-2xl"
            (click)="$event.stopPropagation()"
            (keydown.escape)="pwa.closeGuide()"
            tabindex="0"
          >
            <div class="w-12 h-12 rounded-2xl bg-[#20B2AA]/15 text-[#20B2AA] flex items-center justify-center mb-4 mx-auto border border-[#20B2AA]/30">
              <mat-icon class="text-2xl">install_mobile</mat-icon>
            </div>
            <h3 class="font-display font-bold text-base text-[#F5FFFA] text-center mb-1">
              Install Palmos on Your Device
            </h3>
            <p class="text-xs text-[#8C94A8] text-center mb-5 leading-relaxed">
              Run Palmos full-screen like a native app with offline support.
            </p>

            <div class="space-y-3 mb-6 bg-[#0E1015] p-3.5 rounded-xl border border-white/5 text-xs text-[#F5FFFA]">
              <div class="flex items-start gap-2.5">
                <span class="w-5 h-5 rounded-full bg-[#20B2AA]/20 text-[#20B2AA] font-bold text-[11px] flex items-center justify-center shrink-0">1</span>
                <div>
                  <span class="font-medium">On iPhone / iPad:</span>
                  <p class="text-[11px] text-[#8C94A8] mt-0.5">Tap the <strong class="text-white">Share</strong> button in the Safari toolbar, then select <strong class="text-[#20B2AA]">Add to Home Screen</strong>.</p>
                </div>
              </div>
              <div class="flex items-start gap-2.5">
                <span class="w-5 h-5 rounded-full bg-[#E0218A]/20 text-[#E0218A] font-bold text-[11px] flex items-center justify-center shrink-0">2</span>
                <div>
                  <span class="font-medium">On Android / Chrome:</span>
                  <p class="text-[11px] text-[#8C94A8] mt-0.5">Tap the <strong class="text-white">⋮ menu</strong> or install icon in the address bar, then choose <strong class="text-[#20B2AA]">Install app</strong>.</p>
                </div>
              </div>
            </div>

            <button
              type="button"
              (click)="pwa.closeGuide()"
              class="w-full min-h-[44px] rounded-xl bg-[#20B2AA] hover:bg-[#25c4bb] text-xs font-semibold text-white transition-colors shadow-sm cursor-pointer"
            >
              Got It
            </button>
          </div>
        </div>
      }
    }
  `,
})
export class PwaInstallButton {
  protected readonly pwa = inject(PwaInstallService);
}
