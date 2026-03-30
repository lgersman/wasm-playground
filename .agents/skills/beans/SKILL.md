---
name: beans
description: Manage project tasks and issues with the beans CLI. Use when creating, listing, updating, or completing beans (tasks/bugs/features).
license: Apache-2.0
compatibility: Requires beans CLI at bin/beans. Installed via postinstall script from github.com/hmans/beans.
metadata:
  author: hmans
  version: "0.4.2"
allowed-tools: Bash(vp exec bin/beans *)
---

# Beans — Issue Tracker Skill

Manages project tasks using the `beans` CLI at `vp exec bin/beans`.

## Status

!`vp exec bin/beans --version 2>/dev/null || echo "Not available: run 'vp install' first"`

## Rules

- **Always use beans instead of TodoWrite** for all work tracking.
- Check for an existing bean before creating a new one.
- Always specify `-t <type>` when creating beans.
- Include bean files in commits alongside code changes.
- On completion, add `## Summary of Changes` to the bean body.

## Quick Reference

```bash
# Prime (load full usage guide into context)
vp exec bin/beans prime

# Find work
vp exec bin/beans list --json --ready
vp exec bin/beans list --json -S "keyword"

# Start work
vp exec bin/beans create --json "Title" -t task -s in-progress
vp exec bin/beans show --json <id>

# Track progress (check off todos)
vp exec bin/beans update <id> --body-replace-old "- [ ] X" --body-replace-new "- [x] X"

# Complete work
vp exec bin/beans update <id> -s completed --body-append "## Summary of Changes\n\n..."
```

## Types

`milestone` · `epic` · `feature` · `bug` · `task`

## Statuses

`todo` · `in-progress` · `draft` · `completed` · `scrapped`

## Priorities

`critical` · `high` · `normal` · `low` · `deferred`
