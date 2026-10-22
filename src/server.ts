import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import {join} from 'node:path';
import {GoogleGenAI} from '@google/genai';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

app.use(express.json());

/**
 * Model Fetching API endpoint (Auto-populates model list for chosen provider)
 */
app.get('/api/models', async (req, res) => {
  const provider = (req.query['provider'] as string) || 'gemini';
  const endpoint = (req.query['endpoint'] as string) || '';
  const apiKey = (req.query['apiKey'] as string) || '';

  try {
    if (provider === 'gemini') {
      res.json({
        models: [
          // Gemini 3 Stable (Text & Multimodal)
          { id: 'gemini-3.1-flash-lite', name: 'Gemini 3.1 Flash-Lite (Default)', details: 'Frontier performance at lowest cost' },
          { id: 'gemini-3.8-flash', name: 'Gemini 3.8 Flash', details: 'Most intelligent Flash model for complex agentic workflows' },
          { id: 'gemini-3.7-flash', name: 'Gemini 3.7 Flash', details: 'Complex coding and multi-step execution' },
          { id: 'gemini-3.6-flash', name: 'Gemini 3.6 Flash', details: 'Balanced speed & everyday reasoning' },
          { id: 'gemini-3.5-flash', name: 'Gemini 3.5 Flash', details: 'Foundational performance for routine workloads' },
          { id: 'gemini-3.5-flash-lite', name: 'Gemini 3.5 Flash-Lite', details: 'Fast, high-throughput execution' },
          // Gemini 3 Preview
          { id: 'gemini-3.1-pro-preview', name: 'Gemini 3.1 Pro (Preview)', details: 'Advanced intelligence, vibe coding & complex reasoning' },
          { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash (Preview)', details: 'Frontier-class performance preview' },
          // Gemini 2.5 Workhorses
          { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', details: 'Best price-performance for reasoning tasks' },
          { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash-Lite', details: 'Fastest budget-friendly model in 2.5 family' },
          { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', details: 'Deep reasoning and coding in 2.5 family' },
          // Latest Alias
          { id: 'gemini-flash-latest', name: 'Gemini Flash Latest', details: 'Auto-updating latest Flash alias' },
        ],
      });
      return;
    }

    if (provider === 'ollama') {
      const ollamaBase = (endpoint || 'http://localhost:11434').replace(/\/+$/, '');
      try {
        const ollamaRes = await fetch(`${ollamaBase}/api/tags`, {
          signal: AbortSignal.timeout(6000),
        });
        if (!ollamaRes.ok) {
          throw new Error(`Ollama responded with status ${ollamaRes.status}`);
        }
        const data = await ollamaRes.json();
        const models = Array.isArray(data.models)
          ? data.models.map((m: { name: string; details?: { parameter_size?: string; family?: string } }) => ({
              id: m.name,
              name: m.name,
              details: m.details?.parameter_size ? `${m.details.parameter_size} (${m.details.family || ''})` : 'Local Ollama Model',
            }))
          : [];
        res.json({ models });
        return;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Could not connect to Ollama';
        res.status(502).json({
          error: `Ollama connection failed: ${msg}. Make sure Ollama is running and accessible at ${ollamaBase}.`,
          models: [
            { id: 'llama3:latest', name: 'llama3:latest (Default)' },
            { id: 'mistral:latest', name: 'mistral:latest' },
            { id: 'qwen2.5:latest', name: 'qwen2.5:latest' },
          ],
        });
        return;
      }
    }

    if (provider === 'openai') {
      const openAiBase = (endpoint || 'https://api.openai.com/v1').replace(/\/+$/, '');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`;
      }

      try {
        const openAiRes = await fetch(`${openAiBase}/models`, {
          headers,
          signal: AbortSignal.timeout(6000),
        });

        if (openAiRes.ok) {
          const data = await openAiRes.json();
          if (Array.isArray(data.data)) {
            const chatModels = data.data
              .map((m: { id: string }) => ({ id: m.id, name: m.id }))
              .filter((m: { id: string }) => m.id.includes('gpt') || m.id.includes('o1') || m.id.includes('o3') || m.id.includes('chat'));
            res.json({ models: chatModels.length > 0 ? chatModels : data.data.slice(0, 30).map((m: { id: string }) => ({ id: m.id, name: m.id })) });
            return;
          }
        }
      } catch {
        // Fall back to standard OpenAI list
      }

      res.json({
        models: [
          { id: 'gpt-4o', name: 'GPT-4o (Flagship omni model)' },
          { id: 'gpt-4o-mini', name: 'GPT-4o-mini (Fast & affordable)' },
          { id: 'o3-mini', name: 'o3-mini (Reasoning)' },
          { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
        ],
      });
      return;
    }

    if (provider === 'anthropic') {
      res.json({
        models: [
          { id: 'claude-3-7-sonnet-20250219', name: 'Claude 3.7 Sonnet (Hybrid reasoning)' },
          { id: 'claude-3-5-sonnet-latest', name: 'Claude 3.5 Sonnet' },
          { id: 'claude-3-5-haiku-latest', name: 'Claude 3.5 Haiku (Fast)' },
          { id: 'claude-3-opus-latest', name: 'Claude 3 Opus' },
        ],
      });
      return;
    }

    res.json({ models: [] });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error fetching models';
    res.status(500).json({ error: msg, models: [] });
  }
});

/**
 * Universal Multi-Provider Prompt Execution API endpoint
 */
app.post('/api/prompt/execute', async (req, res) => {
  const {
    provider = 'gemini',
    endpoint = '',
    model = '',
    apiKey: userKey = '',
    systemPrompt = '',
    userInput = '',
    followUpPrompt = '',
    isRetry = false,
  } = req.body || {};

  // Construct final prompt with strict execution directive to prevent conversational chat/advice
  let rawContents = '';
  const trimmedSystem = systemPrompt ? systemPrompt.trim() : '';

  if (isRetry && followUpPrompt && followUpPrompt.trim().length > 0) {
    if (followUpPrompt.includes('{{QUERY}}')) {
      rawContents = followUpPrompt.replace(/\{\{QUERY\}\}/g, userInput);
    } else {
      const basePrompt = trimmedSystem
        ? (trimmedSystem.includes('{{QUERY}}')
            ? trimmedSystem.replace(/\{\{QUERY\}\}/g, userInput)
            : `${trimmedSystem}\n\n${userInput}`)
        : userInput;
      rawContents = `${basePrompt}\n\n[RETRY / FOLLOW-UP INSTRUCTIONS]:\n${followUpPrompt}`;
    }
  } else {
    if (trimmedSystem) {
      if (trimmedSystem.includes('{{QUERY}}')) {
        rawContents = trimmedSystem.replace(/\{\{QUERY\}\}/g, userInput);
      } else {
        rawContents = `${trimmedSystem}\n\n${userInput}`;
      }
    } else {
      rawContents = userInput;
    }
  }

  const strictDirective = "CRITICAL DIRECTIVE: Execute the prompt instructions directly and strictly. Do NOT provide conversational filler, chit-chat, advice, explanations, or meta-commentary. Output ONLY the direct result of the instruction.";
  const finalContents = `${strictDirective}\n\nTASK & INPUT:\n${rawContents}`;

  // Set SSE Headers with chunked transfer and immediate headers flush
  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
    'Transfer-Encoding': 'chunked',
  });
  // 1KB SSE comment padding bypasses Cloud Run / nginx / proxy buffering immediately
  res.write(': ' + ' '.repeat(1024) + '\n\n');
  res.flushHeaders?.();
  (res as unknown as { flush?: () => void }).flush?.();

  try {
    // 1. OLLAMA Execution
    if (provider === 'ollama') {
      const ollamaBase = (endpoint || 'http://localhost:11434').replace(/\/+$/, '');
      const chosenModel = model || 'llama3:latest';

      const ollamaResponse = await fetch(`${ollamaBase}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: chosenModel,
          prompt: finalContents,
          stream: true,
        }),
      });

      if (!ollamaResponse.ok) {
        throw new Error(`Ollama returned status ${ollamaResponse.status}: ${await ollamaResponse.text()}`);
      }

      if (!ollamaResponse.body) {
        throw new Error('No readable response body from Ollama.');
      }

      const reader = ollamaResponse.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const parsed = JSON.parse(line);
            if (parsed.response) {
              res.write(`data: ${JSON.stringify({ text: parsed.response })}\n\n`);
              (res as unknown as { flush?: () => void }).flush?.();
            }
          } catch {
            // Ignore malformed chunks
          }
        }
      }

      res.write('data: [DONE]\n\n');
      (res as unknown as { flush?: () => void }).flush?.();
      res.end();
      return;
    }

    // 2. OPENAI Compatible Execution
    if (provider === 'openai') {
      const openAiBase = (endpoint || 'https://api.openai.com/v1').replace(/\/+$/, '');
      const chosenModel = model || 'gpt-4o';
      const key = userKey || process.env['OPENAI_API_KEY'];

      if (!key) {
        throw new Error('OpenAI API Key is required. Please set it in Settings.');
      }

      const openAiRes = await fetch(`${openAiBase}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${key}`,
        },
        body: JSON.stringify({
          model: chosenModel,
          messages: [{ role: 'user', content: finalContents }],
          stream: true,
        }),
      });

      if (!openAiRes.ok) {
        const errJson = await openAiRes.json().catch(() => ({}));
        throw new Error(errJson?.error?.message || `OpenAI returned status ${openAiRes.status}`);
      }

      if (!openAiRes.body) {
        throw new Error('No readable response body from OpenAI.');
      }

      const reader = openAiRes.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;
          const payload = trimmed.replace(/^data:\s*/, '');
          if (payload === '[DONE]') continue;

          try {
            const parsed = JSON.parse(payload);
            const token = parsed.choices?.[0]?.delta?.content;
            if (token) {
              res.write(`data: ${JSON.stringify({ text: token })}\n\n`);
              (res as unknown as { flush?: () => void }).flush?.();
            }
          } catch {
            // Ignore
          }
        }
      }

      res.write('data: [DONE]\n\n');
      (res as unknown as { flush?: () => void }).flush?.();
      res.end();
      return;
    }

    // 3. ANTHROPIC Compatible Execution
    if (provider === 'anthropic') {
      const anthropicBase = (endpoint || 'https://api.anthropic.com/v1').replace(/\/+$/, '');
      const chosenModel = model || 'claude-3-7-sonnet-20250219';
      const key = userKey || process.env['ANTHROPIC_API_KEY'];

      if (!key) {
        throw new Error('Anthropic API Key is required. Please set it in Settings.');
      }

      const anthropicRes = await fetch(`${anthropicBase}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': key,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: chosenModel,
          max_tokens: 4096,
          messages: [{ role: 'user', content: finalContents }],
          stream: true,
        }),
      });

      if (!anthropicRes.ok) {
        const errJson = await anthropicRes.json().catch(() => ({}));
        throw new Error(errJson?.error?.message || `Anthropic returned status ${anthropicRes.status}`);
      }

      if (!anthropicRes.body) {
        throw new Error('No readable response body from Anthropic.');
      }

      const reader = anthropicRes.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;
          const payload = trimmed.replace(/^data:\s*/, '');

          try {
            const parsed = JSON.parse(payload);
            if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
              res.write(`data: ${JSON.stringify({ text: parsed.delta.text })}\n\n`);
              (res as unknown as { flush?: () => void }).flush?.();
            }
          } catch {
            // Ignore
          }
        }
      }

      res.write('data: [DONE]\n\n');
      (res as unknown as { flush?: () => void }).flush?.();
      res.end();
      return;
    }

    // 4. GEMINI Execution (Default)
    const apiKey = userKey || process.env['GEMINI_API_KEY'];
    if (!apiKey) {
      res.status(500).json({ error: 'Server configuration error: GEMINI_API_KEY is not set.' });
      return;
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const chosenModel = model || 'gemini-3.1-flash-lite';
    const responseStream = await ai.models.generateContentStream({
      model: chosenModel,
      contents: finalContents,
    });

    for await (const chunk of responseStream) {
      const chunkText = chunk.text;
      if (chunkText) {
        res.write(`data: ${JSON.stringify({ text: chunkText })}\n\n`);
        (res as unknown as { flush?: () => void }).flush?.();
      }
    }

    res.write('data: [DONE]\n\n');
    (res as unknown as { flush?: () => void }).flush?.();
    res.end();
  } catch (error: unknown) {
    console.error('Execution error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error executing prompt';
    res.write(`data: ${JSON.stringify({ error: errorMessage })}\n\n`);
    res.end();
  }
});

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
