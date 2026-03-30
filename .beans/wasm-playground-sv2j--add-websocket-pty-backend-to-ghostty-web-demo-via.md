---
# wasm-playground-sv2j
title: Add WebSocket PTY backend to ghostty-web-demo via Vite plugin
status: completed
type: feature
priority: normal
created_at: 2026-03-29T14:24:24Z
updated_at: 2026-03-29T14:32:05Z
---

Integrate a node-pty + WebSocket PTY server into the Vite dev server via a custom plugin, so the ghostty-web terminal in the browser connects to a real shell without a standalone server.
