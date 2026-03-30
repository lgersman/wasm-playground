---
# wasm-playground-ept8
title: Plan ghostty-web-demo sub-package
status: completed
type: feature
priority: normal
created_at: 2026-03-29T13:44:35Z
updated_at: 2026-03-29T14:06:15Z
---

New React sub-package with shadcn resizable layout: top preview panel + bottom ghostty-web terminal with FitAddon

## Plan

### Package Location & Naming
- Path: `packages/ghostty-web-demo/`
- Package name: `@wasm-playground/ghostty-web-demo`
- Follows monorepo convention from `packages/hello-world/`

### File Structure
```
packages/ghostty-web-demo/
├── package.json
├── tsconfig.json
├── index.html
└── src/
    ├── main.tsx
    ├── App.tsx              # ResizablePanelGroup root
    └── components/
        ├── ui/
        │   └── resizable.tsx    # react-resizable-panels wrappers (plain CSS)
        ├── Preview.tsx          # empty preview placeholder
        └── GhosttyTerminal.tsx  # ghostty-web + FitAddon integration
```

### Dependencies
**Runtime:**
- `react@^19`, `react-dom@^19`
- `ghostty-web` — WASM terminal, xterm.js API-compatible
- `react-resizable-panels` — resizable panel primitives

**Dev:**
- `@types/react`, `@types/react-dom`, `typescript`

### Key Design Decisions

#### 1. Layout Direction
Use `direction="vertical"` — stacked top/bottom panels.

#### 2. FitAddon: use ghostty-web built-in
Use `FitAddon` exported directly from `ghostty-web` — no `@xterm/addon-fit` dependency needed.

#### 3. WASM Initialization
`ghostty-web` requires `await init()` before instantiating `Terminal`. The `GhosttyTerminal` component handles this with a loading state via `useEffect`.

#### 4. WASM asset serving
The `ghostty-vt.wasm` file is bundled inside `ghostty-web`. Vite handles WASM via `?init` import syntax (Vite 4+) or `assetsInclude`. May require vite config entry.

### Component Sketches

**App.tsx:**
```tsx
export default function App() {
  return (
    <ResizablePanelGroup direction="vertical" style={{ height: '100vh', width: '100vw' }}>
      <ResizablePanel defaultSize={40} minSize={20}>
        <Preview />
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel defaultSize={60} minSize={20}>
        <GhosttyTerminal />
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}
```

**GhosttyTerminal.tsx:**
```tsx
// useEffect:
// 1. import { init, Terminal } from 'ghostty-web'
// 2. await init()  — idempotent, safe to call multiple times
// 3. const term = new Terminal({ fontSize: 14 })
// 4. term.open(containerRef.current)
// 5. const fitAddon = new FitAddon() // FitAddon imported from 'ghostty-web'
// 6. term.loadAddon(fitAddon)
// 7. fitAddon.fit()
// 8. ResizeObserver on container → fitAddon.fit()
// 9. return () => term.dispose()

```

**Preview.tsx:**
```tsx
export default function Preview() {
  return (
    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      Preview
    </div>
  )
}
```

## Tasks
- [x] Scaffold package.json, tsconfig.json, index.html, src/main.tsx
- [x] Create ui/resizable.tsx wrappers over react-resizable-panels (plain CSS)
- [x] Create Preview component
- [x] Create GhosttyTerminal component with ghostty-web + FitAddon
- [x] Wire up App.tsx with ResizablePanelGroup
- [x] Verify vp dev works, test layout and terminal rendering

## Summary of Changes

Scaffolded `packages/ghostty-web-demo/` as a new React sub-package following the hello-world monorepo pattern. Implemented:
- `package.json` with `ghostty-web` and `react-resizable-panels` dependencies
- `tsconfig.json` mirroring hello-world
- `index.html` with full-height body reset
- `src/main.tsx` and `src/App.tsx` with vertical `ResizablePanelGroup` (40/60 split)
- `src/components/ui/resizable.tsx` — plain CSS wrappers over `react-resizable-panels`
- `src/components/Preview.tsx` — centered placeholder panel
- `src/components/GhosttyTerminal.tsx` — async `ghostty-web` init with `FitAddon` and `ResizeObserver`

`vp dev packages/ghostty-web-demo` starts successfully on http://localhost:5173.
