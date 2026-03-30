# wasm-playground

## Project Overview

<!-- Describe the project here -->

## Architecture

<!-- Describe the architecture here -->

## Development Guidelines

<!-- Add project-specific guidelines and conventions here -->

## Agent Infrastructure

This project uses a structured agent infrastructure in `.agents/`:

| Location           | Purpose                                         | Claude Code mapping           |
| ------------------ | ----------------------------------------------- | ----------------------------- |
| `.agents/commands/` | Custom slash commands (`.md` files)             | `.claude/commands/` (symlink) |
| `.agents/skills/`   | Reusable agent skills (subdirs with `SKILL.md`) | `.claude/skills/` (symlink)   |
| `.agents/docs/`     | Project docs loaded as agent context            | Imported via `@` in this file |

## Searching Agent Documentation

Before reading doc files manually, always search first using the qmd CLI:

```bash
vp exec qmd search "<topic>"   # keyword search
vp exec qmd query "<topic>"    # hybrid search (best results)
```

## Docs

@.agents/docs/overview.md
@.agents/docs/tools/vp.md
@.agents/docs/tools/chrome-devtools-mcp.md
@.agents/docs/tools/qmd.md
@.agents/docs/tools/beans.md
