---
# wasm-playground-zj4c
title: Add CodeMirror project editor to vite8-web-demo
status: completed
type: feature
priority: normal
created_at: 2026-03-29T16:22:28Z
updated_at: 2026-03-29T17:42:41Z
---

Add a CodeMirror-based file editor panel to vite8-web-demo for editing the demo project files in the browser.

## Layout

Overall layout (vertical split, resizable):
- **Top row** (horizontal split, resizable): Editor panel | Preview panel
- **Bottom row**: Terminal (full width)

The editor panel is itself a horizontal split:
- **Left**: file tree
- **Right**: CodeMirror editor with toolbar (undo / redo / save / new file / delete file)

All panels are always visible.

## File Tree

Shows all files of the wasmer virtual filesystem (`/project` mount). Clicking a file opens it in the editor.

## Sync

When saving in the editor:
1. Write the updated content to the wasmer `Directory` (so the running Vite/shell process sees the change)
2. Also POST to `/__dev/sync-file` to write back to `demo/` on disk

**Important**: the `/__dev/sync-file` Vite plugin must NOT trigger a Vite HMR reload when it writes files to `demo/`. Use `server.watcher.unwatch(demoDir)` or write via a path outside Vite's watched roots to suppress HMR.

## Language Support

CodeMirror language modes for: HTML, JS, TSX, CSS, JSON, TS.

## Toolbar Actions

- **Undo / Redo**: CodeMirror history commands
- **Save**: write to wasmer Directory + sync to disk
- **New**: prompt for filename, create empty file in wasmer Directory
- **Delete**: remove selected file from wasmer Directory (with confirmation)
