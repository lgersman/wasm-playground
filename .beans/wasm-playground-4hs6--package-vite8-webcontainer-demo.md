---
# wasm-playground-4hs6
title: package vite8-webcontainer-demo
status: completed
type: feature
priority: normal
created_at: 2026-03-29T17:49:27Z
updated_at: 2026-03-29T17:59:31Z
---

Copy packages/vite8-web-demo to packages/vite8-webcontainer-demo and refactor to use webcontainer instead of @wasmer/sdk.

## Tasks

- [x] Copy packages/vite8-web-demo to packages/vite8-webcontainer-demo
- [x] Refactor the new package to use webcontainer instead of @wasmer/sdk

## Summary of Changes

- Created `packages/vite8-webcontainer-demo` as a copy of `packages/vite8-web-demo`
- Replaced `@wasmer/sdk` with `@webcontainer/api` in `package.json`
- Added `src/webcontainer/` module (replacing `src/wasmer/`):
  - `runtime.ts`: singleton `WebContainer.boot()` instead of wasmer `init()`
  - `filesystem.ts`: uses `webcontainer.mount()` (FileSystemTree) for initial setup and `webcontainer.fs` API for file operations
  - `terminal-bridge.ts`: uses `webcontainer.spawn('jsh')` instead of `Wasmer.fromRegistry('sharrattj/bash')`
- Updated `App.tsx`, `EditorPanel.tsx`, `XtermTerminal.tsx` to use `WebContainer` type instead of `Directory`
- Removed `@wasmer/sdk` from `vite.config.ts` `optimizeDeps.exclude`; kept COOP/COEP headers required by both runtimes
