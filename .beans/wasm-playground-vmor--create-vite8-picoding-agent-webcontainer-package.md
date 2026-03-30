---
# wasm-playground-vmor
title: Create vite8-picoding-agent-webcontainer package
status: todo
type: feature
priority: normal
created_at: 2026-03-30T13:54:52Z
updated_at: 2026-03-30T15:03:26Z
---

Create a new sub-package 'vite8-picoding-agent-webcontainer' based on vite8-webcontainer-demo.

The new package adds a horizontal resizable split layout:
- Left panel: a new WebContainer instance configured like the terminal panel in vite8-webcontainer-demo (XtermTerminal)
- Right panel: the full existing vite8-webcontainer-demo app (editor + preview + terminal in vertical/horizontal split)

Steps:
- [ ] Copy packages/vite8-webcontainer-demo to packages/vite8-picoding-agent-webcontainer
- [ ] Rename package in package.json to @wasm-playground/vite8-picoding-agent-webcontainer
- [ ] Modify App.tsx to wrap everything in a horizontal ResizablePanelGroup
- [ ] Left panel: new WebContainer + XtermTerminal (agent terminal)
- [ ] Right panel: the existing editor + preview + terminal layout from vite8-webcontainer-demo

## Agent Terminal Details

- [ ] Pre-install npm package `@mariozechner/pi-coding-agent` in the agent WebContainer on startup
- [ ] Add a Vite middleware (vite-plus) that exposes `ANTHROPIC_API_KEY` as an environment variable to the agent WebContainer:
  - First try to read from the host environment variable `ANTHROPIC_API_KEY`
  - If not set, fall back to executing `~/.claude/anthropic_key.sh` and using its stdout as the value
- [ ] Agent terminal automatically runs `pi` (from `@mariozechner/pi-coding-agent`) on startup after the WebContainer boots

## File Sync (Agent → Editor)

- [ ] Watch the agent WebContainer filesystem for changes using the WebContainer `fs.watch` API
- [ ] On file add/change/remove events, refresh the file tree in the right panel
- [ ] If the currently open file in the editor was modified by the agent, reload its content in the CodeMirror editor
