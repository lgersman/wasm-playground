---
# wasm-playground-a8w7
title: Copy ghostty-web-demo to xterm-web-demo
status: completed
type: task
priority: normal
created_at: 2026-03-29T15:25:15Z
updated_at: 2026-03-29T15:26:20Z
---

Copy packages/ghostty-web-demo to packages/xterm-web-demo and replace ghostty-web dependency with @xterm/xterm + @xterm/addon-fit

## Summary of Changes\n\n- Copied packages/ghostty-web-demo → packages/xterm-web-demo\n- Renamed package to @wasm-playground/xterm-web-demo\n- Replaced ghostty-web dep with @xterm/xterm ^5 + @xterm/addon-fit ^0.10\n- Created XtermTerminal.tsx with static imports (replacing dynamic ghostty-web import)\n- Updated App.tsx to use XtermTerminal\n- Removed GhosttyTerminal.tsx copy\n- Ran vp install successfully (+5 -3 packages)
