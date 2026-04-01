---
# wasm-playground-vj73
title: feat-vite8-picoding-agent-llm-webcontainer
status: todo
type: feature
priority: normal
created_at: 2026-04-01T05:15:08Z
updated_at: 2026-04-01T05:22:54Z
---

Create a new sub-package 'packages/vite8-picoding-agent-llm-webcontainer' that mirrors vite8-picoding-agent-webcontainer but uses browser-based LLM inference via transformers.js v4 instead of the Anthropic API in the pi agent.

## Tasks

- [ ] Create new sub-package `packages/vite8-picoding-agent-llm-webcontainer`
- [ ] Copy `packages/vite8-picoding-agent-webcontainer` into it
- [ ] Add transformers.js v4 dependency for browser-based LLM inference
- [ ] Replace Anthropic API usage in the pi agent with transformers.js inference
- [ ] Make the following models selectable in the pi agent UI:
  - Llama 3.2 (3B)
  - Phi-3.5-mini (3.8B)
  - Qwen 2.5 / 3.5 (1.5B or 3B)
- [ ] Implement lazy / on-demand model downloads (models are only fetched when selected/first used)
- [ ] Verify the new package provides the same functionality as the original

## Notes

- Reference package: `packages/vite8-picoding-agent-webcontainer`
- LLM inference must run entirely in the browser (no server-side API calls)
- Use transformers.js v4 (HuggingFace) for on-device model inference
- Models must NOT be downloaded eagerly at startup — load only when the user selects/activates a model
- Supported models: Llama 3.2 3B, Phi-3.5-mini 3.8B, Qwen 2.5/3.5 1.5B or 3B
