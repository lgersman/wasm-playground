---
# wasm-playground-k14b
title: Add beans tool documentation and skill to agent infrastructure
status: completed
type: task
priority: normal
created_at: 2026-03-29T12:34:28Z
updated_at: 2026-03-29T12:36:10Z
---

Add beans tool documentation to .agents/docs/tools/ and a beans skill to .agents/skills/ so the agent knows how to use beans effectively.

## Summary of Changes

- Created .agents/docs/tools/beans.md with full CLI reference and workflow guide
- Created .agents/skills/beans/SKILL.md with skill frontmatter and quick reference
- Added @.agents/docs/tools/beans.md import to AGENT.md so beans context is always loaded
