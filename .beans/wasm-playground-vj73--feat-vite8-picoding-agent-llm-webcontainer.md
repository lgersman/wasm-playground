---
# wasm-playground-vj73
title: feat-vite8-picoding-agent-llm-webcontainer
status: in-progress
type: feature
priority: normal
created_at: 2026-04-01T05:15:08Z
updated_at: 2026-04-01T08:11:17Z
---

Create a new sub-package 'packages/vite8-picoding-agent-llm-webcontainer' that mirrors vite8-picoding-agent-webcontainer but uses browser-based LLM inference via transformers.js v4 instead of the Anthropic API in the pi agent.

## Notes

- Reference package: `packages/vite8-picoding-agent-webcontainer`
- LLM inference must run entirely in the browser (no server-side API calls)
- Use transformers.js v4 (HuggingFace) for on-device model inference
- Models must NOT be downloaded eagerly at startup — load only when the user selects/activates a model
- Supported models: Llama 3.2 3B, Phi-3.5-mini 3.8B, Qwen 2.5/3.5 1.5B or 3B

## Revised Architecture

The initial implementation replaced the pi agent terminal with a browser-native chat UI — that was wrong. The correct approach keeps the pi agent running in the WebContainer terminal and connects it to transformers.js inference via a service worker bridge.

The pi agent (Node.js inside WebContainer) has no access to browser APIs. Its only external communication channel is HTTP. The bridge is:

```
pi agent (WebContainer Node.js)
  → POST /__llm/generate   (custom pi provider extension)
  → service worker (sw.ts) intercepts
  → MessageChannel to main thread
  → transformers.js runs inference on main thread
  → SSE tokens stream back through the chain
```

The LLM runs on the **main thread** (not a Web Worker) to keep the bridge simple — only one MessageChannel hop needed. WebGPU inference is async so the UI stays responsive; WASM/CPU inference may cause jank but is acceptable.

## Tasks

- [ ] Register service worker (`src/sw.ts`) that co-exists with WebContainer's service worker
- [ ] Add `/__llm/generate` route handler in service worker with SSE streaming via MessageChannel to main thread
- [ ] Move transformers.js inference to main thread (`src/llm.ts`), wire to service worker bridge
- [ ] Create custom pi provider extension in `src/webcontainer/pi-llm-extension/`
- [ ] Restore `AgentTerminal.tsx`, install extension into WebContainer, pass `LLM_BASE_URL` env var
- [ ] Remove `AgentPanel.tsx` and `src/workers/llm.worker.ts`
- [ ] Verify end-to-end: pi agent terminal uses local LLM inference via service worker
