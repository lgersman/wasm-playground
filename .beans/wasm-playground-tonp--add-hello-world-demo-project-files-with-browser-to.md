---
# wasm-playground-tonp
title: Add hello world demo project files with browser-to-disk sync
status: completed
type: task
priority: normal
created_at: 2026-03-29T16:12:57Z
updated_at: 2026-03-29T16:15:14Z
parent: wasm-playground-6re6
---

Create actual demo project files in packages/vite8-web-demo/demo/ (excluded from build), load them into wasmer memfs via import.meta.glob, and sync browser filesystem changes back to disk via a Vite dev plugin
