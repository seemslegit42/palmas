# Palmos

Mobile-first, state-driven prompt execution engine with continuous document canvas, dynamic prompt library, progressive web app (PWA) support, and real-time AI streaming.

## Features

- **Progressive Web App (PWA):** Installable on iOS, Android, and Desktop with offline caching and native app feel.
- **Continuous Document Canvas:** Single-screen document canvas with real-time unbuffered token streaming, separate Clear Input and Clear Output buttons, and 1-tap Redo.
- **Prompt Library:** Create, edit, duplicate, and manage custom prompt templates with color-coded tagging and JSON backup/restore.
- **Multi-Provider Support:** Seamlessly switch between Google Gemini, OpenAI-compatible APIs (including Groq, DeepSeek, LocalAI), Anthropic Claude, and local Ollama instances.
- **Dynamic Variable Injection:** Use `{{QUERY}}` markers for precise template injection with cursor placement tools.
- **Offline-First Persistence:** Templates and settings persist locally via `localStorage`.
- **Unbuffered Streaming Execution:** Real-time AI response streaming using Server-Sent Events (SSE) with proxy buffer bypass.

## Prerequisites

- Node.js (v20+)
- npm (v10+)

## Setup

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Environment Setup:**
   Copy `.env.example` to `.env` and configure your necessary API keys for backend-only secret management.

3. **Run Development Server:**
   ```bash
   npm run dev
   ```

## Built With

- **Angular 21+** (Standalone Components, Signals, Zoneless)
- **Tailwind CSS 4+** (Artistic Patterns)
- **Node.js / Express** (SSR & API Proxying)
- **@google/genai** (Gemini SDK)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
