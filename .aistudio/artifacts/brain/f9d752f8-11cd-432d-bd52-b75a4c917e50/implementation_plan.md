# Implementation Plan: Palmos PWA Integration and Streaming Fix

## Objective
Enhance "Palmos" (formerly Pocket Prompts) with PWA installability under the new name, separate input/output clearing buttons, and fix the streaming response rendering performance so users can see tokens as they generate.

## 1. PWA Integration ("Palmos")
- **Rename Project:** Update `metadata.json`, `index.html` title, and all references to "Palmos".
- **Install Dependency:** `npm install -D vite-plugin-pwa`.
- **Configure `vite.config.ts`:**
    - Add `VitePWA` plugin to configure manifest and service worker.
    - Set `id: '/'`, `name: 'Palmos'`, `short_name: 'Palmos'`.
- **Manifest & Icons:** Create `src/manifest.webmanifest` and update `public/` assets.
- **Install Prompt:** Add `PWAInstallButton` component to `NavHeader` and `CanvasView`.

## 2. Streaming Performance & Real-Time Visibility Fix
- **Improve Rendering:** The `formatOutput` pipe currently runs on every character update, blocking incremental rendering.
- **Optimization:** Update `CanvasView` to display raw text immediately during streaming (`isGenerating() === true`), and apply the formatted output view only after generation completes. This ensures instant real-time feedback and allows users to abort instantly if needed.

## 3. Clear Functionality (Separate Buttons)
- **CanvasView:** Update UI to include two distinct clear buttons:
    - **Clear Input Button:** Placed in the input query section header.
    - **Clear Output Button:** Placed in the AI output section header.

## 4. UI/UX
- Ensure all additions follow the existing Verdigris VIP v2.4 (Magenta Augmented) design system.

## Verification
- Run `npm run lint` and `compile_applet`.
- Verify installability in dev-server environment.
- Verify streaming displays incremental text in real-time.
