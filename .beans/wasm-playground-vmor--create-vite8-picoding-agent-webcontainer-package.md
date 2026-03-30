---
# wasm-playground-vmor
title: Create vite8-picoding-agent-webcontainer package
status: completed
type: feature
priority: normal
created_at: 2026-03-30T13:54:52Z
updated_at: 2026-03-30T17:28:43Z
---

Create a new sub-package 'vite8-picoding-agent-webcontainer' based on vite8-webcontainer-demo.

The new package adds a horizontal resizable split layout:
- Left panel: a new WebContainer instance configured like the terminal panel in vite8-webcontainer-demo (XtermTerminal)
- Right panel: the full existing vite8-webcontainer-demo app (editor + preview + terminal in vertical/horizontal split)

Steps:
- [x] Copy packages/vite8-webcontainer-demo to packages/vite8-picoding-agent-webcontainer
- [x] Rename package in package.json to @wasm-playground/vite8-picoding-agent-webcontainer
- [x] Modify App.tsx to wrap everything in a horizontal ResizablePanelGroup
- [x] Left panel: new WebContainer + XtermTerminal (agent terminal) connected to the webcontainer, with the pi agent started automatically after boot
- [x] Right panel: the existing editor + preview + terminal layout from vite8-webcontainer-demo

## Agent Terminal Details

- [x] Pre-install npm package `@mariozechner/pi-coding-agent` in the agent WebContainer on startup
- [x] Add a Vite middleware (vite-plus) that exposes `ANTHROPIC_API_KEY` as an environment variable to the agent WebContainer:
  - First try to read from the host environment variable `ANTHROPIC_API_KEY`
  - If not set, fall back to executing `~/.claude/anthropic_key.sh` and using its stdout as the value
- [x] Agent terminal automatically runs `pi` (from `@mariozechner/pi-coding-agent`) on startup after the WebContainer boots

## File Sync (Agent → Editor)

- [x] Watch the agent WebContainer filesystem for changes using the WebContainer `fs.watch` API
- [x] On file add/change/remove events, refresh the file tree in the right panel
- [x] If the currently open file in the editor was modified by the agent, reload its content in the CodeMirror editor

## Summary of Changes

Created `packages/vite8-picoding-agent-webcontainer` based on `vite8-webcontainer-demo`.

- **App.tsx**: New horizontal split layout — left panel (30%) is the `AgentTerminal`, right panel (70%) is the existing editor + preview + terminal stack
- **AgentTerminal.tsx**: New component that pre-installs `@mariozechner/pi-coding-agent` globally in the WebContainer, fetches the Anthropic API key from the Vite middleware, starts `jsh` with `ANTHROPIC_API_KEY` in env, and auto-runs `pi` after boot
- **vite.config.ts**: Added `anthropicKeyPlugin` — serves `GET /__agent/anthropic-key` by reading `ANTHROPIC_API_KEY` from host env or falling back to `~/.claude/anthropic_key.sh`
- **EditorPanel.tsx**: Added `fileChangeCounter` and `changedFilePath` props; uses `fs.watch` events from `App` to refresh file tree and reload the currently open file if the agent modified it
- **terminal-bridge.ts**: Added `startAgentShell` function that accepts an `env` map and auto-writes `pi\n` to the shell after 300ms
