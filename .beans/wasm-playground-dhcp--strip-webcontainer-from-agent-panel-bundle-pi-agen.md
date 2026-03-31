---
# wasm-playground-dhcp
title: Strip WebContainer from agent panel — bundle pi agent with Vite
status: draft
type: feature
priority: normal
created_at: 2026-03-31T05:48:41Z
updated_at: 2026-03-31T05:50:17Z
blocking:
    - wasm-playground-vmor
---

Strip out the separate WebContainer used to run the pi agent in the left panel. Instead, bundle the pi agent as a Vite module running directly in the browser, backed by the project's existing WebContainer for tool execution (bash, fs). The agent only needs a terminal (xterm) for I/O — no separate Node process or WebContainer instance is required.

## Background

Currently `packages/vite8-picoding-agent-webcontainer` runs **two** WebContainer instances:
- **Left panel (agent)**: a full WebContainer just to `npm install @mariozechner/pi-coding-agent` and spawn `node dist/cli.js`
- **Right panel (project)**: the actual demo project with Vite dev server, editor, preview

The left-panel WebContainer exists solely to execute the pi agent as a Node process. This is wasteful — it adds a full boot/install cycle and a second container just to get a shell process running the agent.

## Hypothesis

The pi agent ships a **programmatic SDK** (`dist/index.js`) that exports:
- `createAgentSession` — core session factory
- `createCodingTools`, `createBashTool`, `createReadTool`, `createWriteTool`, etc. — tool factories

These tools ultimately need:
- **File system** (read/write/edit/find/grep/ls) → the right-panel WebContainer already provides `webcontainer.fs`
- **Bash** → the right-panel WebContainer can spawn processes
- **Anthropic API** → `@anthropic-ai/sdk` has full browser support

If we can import the SDK directly in Vite and wire its tools to the **existing** right-panel WebContainer, the agent runs as in-browser JavaScript — no second WebContainer, no Node process, no install step.

## Feasibility Research Tasks

- [ ] Try importing `@mariozechner/pi-coding-agent` in a Vite browser build — identify which deps cause Node.js resolution errors
- [ ] Check if `@mariozechner/pi-tui` (interactive TUI mode) is tree-shaken out when using only the SDK entry (`createAgentSession` path), or whether it drags in Node.js-only deps
- [ ] Audit problem deps: `proper-lockfile`, `extract-zip`, `@mariozechner/jiti`, `@silvia-odwyer/photon-node` — are they reachable from the SDK surface or only from the CLI (`dist/cli.js`)?
- [ ] Check if `@mariozechner/pi-agent-core` has a `browser` export condition or any environment guards

## Plan (if feasibility confirmed)

### Phase 1 — Vite bundlability

- [ ] Add `@mariozechner/pi-coding-agent` as a direct dependency of the package (not installed inside WebContainer)
- [ ] Stub / alias Node-only modules that can't be bundled (`proper-lockfile` → no-op, `extract-zip` → no-op, etc.) using Vite `resolve.alias`
- [ ] Confirm `vp build` succeeds without errors

### Phase 2 — Browser-compatible tool backends

- [ ] Implement a `createWebContainerTools(wc: WebContainer)` adapter that wraps the right-panel WebContainer:
  - `readTool` → `wc.fs.readFile`
  - `writeTool` → `wc.fs.writeFile`
  - `editTool` → read + patch + write via `wc.fs`
  - `lsTool` / `findTool` / `grepTool` → `wc.fs.readdir` + recursive walk
  - `bashTool` → `wc.spawn('jsh', ['-c', cmd])` or a persistent shell process piped through a queue
- [ ] Wire tools into `createAgentSession({ tools: [...] })`

### Phase 3 — Terminal I/O

- [ ] Replace `AgentTerminal`'s WebContainer spawn with direct SDK usage
- [ ] Hook `AgentSession` output (streamed text from Claude + tool output) into xterm `term.write()`
- [ ] Hook xterm `term.onData()` into the session's stdin (user messages / interrupts)
- [ ] Handle session lifecycle: start, stop, exit codes

### Phase 4 — Remove second WebContainer

- [ ] Remove the agent's `getWebContainer()` call from `App.tsx` / `AgentTerminal.tsx`
- [ ] Remove `installPiAgent` step (no longer needed)
- [ ] Remove `startAgentShell` / `terminal-bridge` wiring for the agent panel
- [ ] Pass the right-panel's `webcontainer` reference into the new `AgentTerminal` props

## Expected Gains

- Faster startup: no second WebContainer boot + `npm install` (~10–30s saved)
- Simpler code: one WebContainer instance, cleaner component tree
- Vite-bundled: pi agent code is tree-shaken, type-checked, and versioned alongside the app
- Enables future: agent could run in a Web Worker for true parallelism
