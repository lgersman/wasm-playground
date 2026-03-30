# Beans — Agentic Issue Tracker

Beans is a file-based issue tracker that stores tasks alongside your code in `.beans/`. Always use beans (not TodoWrite) to manage all work and tasks.

> **IMPORTANT**: Never call `beans` as a standalone command. The `beans` binary is not on `$PATH`. You MUST always invoke it as `vp exec bin/beans <args>`. Any usage guide showing bare `beans` commands (e.g. from `beans prime`) must be read as `vp exec bin/beans` instead.

## Setup

The `beans` CLI is installed at `vp exec bin/beans` by the postinstall script.

```bash
vp exec bin/beans --help
vp exec bin/beans prime        # Load full usage guide into context
```

## Core Workflow

**Before starting any task:**
1. Check for an existing bean: `vp exec bin/beans list --json -S "topic"`
2. If none exists, create one: `vp exec bin/beans create --json "Title" -t task -s in-progress`
3. Keep todo items current as you work (`- [ ]` → `- [x]`)
4. Mark completed only when no unchecked items remain: `vp exec bin/beans update <id> -s completed`

**When committing:** include both code changes AND the bean file(s).

## Common Commands

```bash
# List
vp exec bin/beans list --json                        # All beans
vp exec bin/beans list --json --ready                # Not blocked, not done
vp exec bin/beans list --json -t bug -s todo         # Filter by type/status
vp exec bin/beans list --json -S "keyword"           # Full-text search

# View
vp exec bin/beans show --json <id>                   # Single bean
vp exec bin/beans show --json <id1> <id2>            # Multiple beans

# Create (always specify -t type)
vp exec bin/beans create --json "Title" -t task -d "Description" -s todo

# Update
vp exec bin/beans update --json <id> -s in-progress
vp exec bin/beans update --json <id> --body-append "## Notes\n\nSome notes"
vp exec bin/beans update --json <id> --body-replace-old "- [ ] X" --body-replace-new "- [x] X"

# Archive (only when user requests)
vp exec bin/beans archive
```

## Issue Types

| Type | Purpose |
|---|---|
| `milestone` | Target release or checkpoint |
| `epic` | Thematic container for related work |
| `feature` | User-facing capability or enhancement |
| `bug` | Something broken that needs fixing |
| `task` | Concrete piece of work (chore, sub-task) |

## Statuses

`todo` · `in-progress` · `draft` · `completed` · `scrapped`

## Priorities

`critical` · `high` · `normal` · `low` · `deferred`

## Relationships

```bash
vp exec bin/beans update <id> --parent <other-id>        # Set parent (hierarchy)
vp exec bin/beans update <id> --blocking <other-id>      # This blocks another
vp exec bin/beans update <id> --blocked-by <other-id>    # This is blocked by another
```

## GraphQL Queries

```bash
# Advanced queries
vp exec bin/beans query --json '{ beans(filter: { excludeStatus: ["completed","scrapped"], isBlocked: false }) { id title status type } }'
vp exec bin/beans query --json '{ bean(id: "<id>") { title body parent { title } children { id title status } } }'
vp exec bin/beans query --schema    # View full schema
```

## After Finishing Work

- Add a `## Summary of Changes` section when completing a bean
- Add a `## Reasons for Scrapping` section when scrapping a bean
- Offer to create follow-up beans for deferred work
