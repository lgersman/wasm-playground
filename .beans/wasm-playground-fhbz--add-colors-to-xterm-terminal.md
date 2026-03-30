---
# wasm-playground-fhbz
title: Add colors to xterm terminal
status: completed
type: feature
priority: normal
created_at: 2026-03-29T16:17:17Z
updated_at: 2026-03-29T17:28:28Z
---

Add color support/theming to the xterm.js terminal in vite8-web-demo

## Summary of Changes\n\nAdded a full One Dark-inspired ANSI color theme to both  and  packages:\n\n- Replaced minimal  with a complete theme object defining all 16 ANSI colors (normal + bright), foreground, cursor, cursorAccent, and selectionBackground\n- Updated the container background color to match the new theme ()\n- Updated scrollbar colors in  in both packages to match the new palette
