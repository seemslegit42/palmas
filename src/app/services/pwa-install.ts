import { Injectable, inject, signal, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

@Injectable({
  providedIn: 'root',
})
export class PwaInstallService {
  private readonly platformId = inject(PLATFORM_ID);
  private deferredPrompt: BeforeInstallPromptEvent | null = null;

  readonly isInstallable = signal<boolean>(false);
  readonly isInstalled = signal<boolean>(false);
  readonly isIOS = signal<boolean>(false);
  readonly showIOSModal = signal<boolean>(false);

  constructor() {
    if (!isPlatformBrowser(this.platformId)) return;

    // Detect standalone mode
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    this.isInstalled.set(isStandalone);

    // Detect iOS devices
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent) && !(window as unknown as { MSStream?: unknown }).MSStream;
    this.isIOS.set(isIOSDevice);

    window.addEventListener('beforeinstallprompt', (e: Event) => {
      e.preventDefault();
      this.deferredPrompt = e as BeforeInstallPromptEvent;
      this.isInstallable.set(true);
    });

    window.addEventListener('appinstalled', () => {
      this.isInstalled.set(true);
      this.isInstallable.set(false);
      this.deferredPrompt = null;
    });
  }

  async install(): Promise<boolean> {
    if (this.isIOS()) {
      this.showIOSModal.set(true);
      return false;
    }

    if (!this.deferredPrompt) {
      // If prompt is not available, show guide
      this.showIOSModal.set(true);
      return false;
    }

    await this.deferredPrompt.prompt();
    const choice = await this.deferredPrompt.userChoice;
    if (choice.outcome === 'accepted') {
      this.isInstalled.set(true);
      this.isInstallable.set(false);
      this.deferredPrompt = null;
      return true;
    }
    return false;
  }

  openGuide(): void {
    this.showIOSModal.set(true);
  }

  closeGuide(): void {
    this.showIOSModal.set(false);
  }
}
