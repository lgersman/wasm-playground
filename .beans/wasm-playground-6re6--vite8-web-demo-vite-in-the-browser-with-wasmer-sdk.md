---
# wasm-playground-6re6
title: 'vite8-web-demo: Vite in the browser with wasmer SDK + xterm terminal'
status: in-progress
type: feature
priority: normal
created_at: 2026-03-29T15:45:24Z
updated_at: 2026-03-29T17:45:45Z
---

New package: packages/vite8-web-demo — a fully in-browser Vite 6 dev environment powered by wasmer SDK, memfs, wasmer/node, and wasmer/sh. The xterm terminal connects directly to a wasmer shell (no backend/WebSocket/node-pty needed). The user can run 'vite' in the terminal and the compiled app appears in the preview panel via wasmer virtual networking.

## Goal

Give users a self-contained, zero-backend Vite dev experience in the browser:
- Open the page → get a real shell in the terminal panel
- Type `vite` → Vite dev server starts inside the wasmer WASM runtime
- The compiled/served app appears live in the preview panel above

---

## Architecture

### Layer Stack

```
┌─────────────────────────────────────────────────────┐
│                   Browser Tab                       │
│                                                     │
│  ┌──────────────┐   iframe   ┌──────────────────┐  │
│  │ Preview Panel│ ◄────────  │ Virtual HTTP Port │  │
│  └──────────────┘            └──────────────────┘  │
│                                      ▲              │
│                               Virtual Network       │
│                               (@wasmer/sdk)         │
│                                      │              │
│  ┌──────────────────────────────────────────────┐  │
│  │            wasmer WASM Runtime               │  │
│  │                                              │  │
│  │  wasmer/node (Node.js WASI) running Vite     │  │
│  │         │ stdin/stdout/stderr                │  │
│  │  wasmer/sh (shell)  ◄──── user commands      │  │
│  │         │                                    │  │
│  │  memfs (virtual filesystem)                  │  │
│  │    /project/  ← pre-seeded Vite app          │  │
│  └──────────────────────────────────────────────┘  │
│                      ▲ stdio                        │
│  ┌───────────────────┴──────────────────────────┐  │
│  │             xterm.js Terminal                │  │
│  └──────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

### Key Components

| Component | Package | Role |
|---|---|---|
| Shell | `wasmer/sh` (registry) | POSIX shell compiled to WASM/WASIX, loaded at runtime |
| Node.js runtime | `wasmer/node` (registry) | Runs Vite and npm inside WASM |
| Filesystem | `@wasmer/sdk` `Directory` | In-memory virtual FS, pre-seeded with a Vite project at `/project` |
| Virtual networking | `@wasmer/sdk` | Routes HTTP from vite devserver to preview iframe |
| Terminal | `@xterm/xterm` + `@xterm/addon-fit` | Unchanged from xterm-web-demo |
| UI layout | `react-resizable-panels` | Unchanged from xterm-web-demo |

---

## Implementation Plan

### Phase 1 — Scaffold new package

- [x] Copy `packages/xterm-web-demo` → `packages/vite8-web-demo`
- [x] Update `package.json`: rename, remove `ws`, `node-pty`, add `@wasmer/sdk`
- [x] Delete `vite-plugin-pty.ts` (no backend needed)
- [x] Update `vite.config.ts`: remove ptyPlugin, add COOP/COEP headers, exclude `@wasmer/sdk` from optimizeDeps
- [x] Update `index.html` title
- [x] Add `allowImportingTsExtensions` to tsconfig.json

### Phase 2 — Wasmer shell + xterm wiring

- [x] Create `src/wasmer/runtime.ts`: singleton `initWasmer()` wrapping `@wasmer/sdk` `init()`
- [x] Create `src/wasmer/terminal-bridge.ts`: loads `wasmer/sh` from registry, pipes stdout/stderr → xterm, xterm onData → stdin
- [x] Update `XtermTerminal.tsx`: removed WebSocket logic, replaced with wasmer bridge + loading progress messages
- [x] Verify basic shell commands work (`ls`, `echo`, `cd`)

### Phase 3 — Virtual filesystem

- [x] Create `src/wasmer/filesystem.ts`: `@wasmer/sdk` `Directory` pre-seeded with minimal Vite+React scaffold at `/project`
- [x] Mount directory into wasmer WASI environment via `SpawnOptions.mount`
- [x] Shell opens in `/project` working directory via `SpawnOptions.cwd`

### Phase 4 — Node.js + Vite in WASM

- [ ] Integrate wasmer/node (Node.js WASI) into the runtime
- [ ] no nodejs wasix package available
- [ ] Verify `node --version` works in the shell
- [ ] Pre-install Vite dependencies into the memfs (bundle them or use a WASM-compatible package manager)
- [ ] Verify `vite` command starts from the shell

### Phase 5 — Preview panel via virtual networking

- [ ] Enable `@wasmer/sdk` virtual networking in the runtime
- [ ] Intercept the vite dev server HTTP port (default: 5173)
- [ ] Implement `src/components/Preview.tsx`: render an `<iframe>` proxied through the wasmer virtual network
- [ ] Wire URL changes (HMR updates) to iframe refresh or src update

### Phase 6 — Polish

- [x] Loading state while wasmer initialises (progress bar / spinner)
- [ ] Check if vite can be pre installed using a wasmer snapshot mechanism 
- [ ] Error handling: show stderr in terminal if wasmer fails to start
- [ ] Graceful restart: `Ctrl+C` in terminal kills vite, shell returns to prompt

---

## Open Questions / Risks

- **wasmer/node**: Package exists but appears private/restricted — GraphQL API returns a backend error on privacy check rather than package data. Use specifier `wasmer/node` (no version suffix) in `uses`.
- **Package pre-installation strategy**: `npm install` inside WASM may be slow or unsupported. Pre-bundling node_modules into memfs at build time is likely needed.
- **Virtual networking API**: The exact `@wasmer/sdk` API for intercepting HTTP and routing to an iframe needs research. Wasmer may expose a ServiceWorker-based approach.
- **WASM bundle size**: Including Node.js WASM + shell + pre-installed node_modules will be large. Consider lazy loading and progress feedback.
- **SharedArrayBuffer requirement**: `@wasmer/sdk` requires `SharedArrayBuffer`, which needs specific HTTP headers (`Cross-Origin-Opener-Policy: same-origin`, `Cross-Origin-Embedder-Policy: require-corp`). Vite config must set these headers.

---

## Required HTTP Headers (COOP/COEP)

The Vite dev server must serve these headers for SharedArrayBuffer:
```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```
Add to `vite.config.ts` server.headers.

## Implementation Notes

- `memfs` was not needed — `@wasmer/sdk`'s `Directory` class covers the virtual FS role natively
- Terminal resize via WASIX not yet exposed in `@wasmer/sdk` 0.8; `bridge.resize()` is a no-op stub
- `wasmer/sh` entrypoint is used; falls back to first available command if no entrypoint declared
- TypeScript passes clean (`tsc --noEmit`) as of 2026-03-29

### Fix (2026-03-29): wasmer/sh → sharrattj/bash
wasmer/sh does not exist in the registry. Correct package is sharrattj/bash. Shell now boots successfully.

### Note (2026-03-29): wasmer/node specifier
Use `wasmer/node` (no `@latest` suffix). The package is private/restricted — GraphQL introspection fails with a backend error, but the package resolves correctly at runtime.
