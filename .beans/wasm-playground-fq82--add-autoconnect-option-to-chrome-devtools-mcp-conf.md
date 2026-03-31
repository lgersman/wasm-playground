---
# wasm-playground-fq82
title: Add autoconnect option to chrome-devtools MCP configuration
status: completed
type: task
priority: normal
created_at: 2026-03-31T05:49:12Z
updated_at: 2026-03-31T06:34:20Z
---

Configure the chrome-devtools MCP server in .mcp.json to use the --autoconnect flag, which automatically discovers and connects to running Chrome instances instead of requiring manual connection setup.

## Benefits
- Simplifies workflow by eliminating manual browser connection steps
- Automatically finds Chrome instances launched with remote debugging
- Reduces friction when starting browser automation tasks

## Implementation
- [x] Update .mcp.json to add --autoconnect flag to chrome-devtools args
- [x] Test automatic connection to running Chrome instances
- [x] Update .agents/docs/tools/chrome-devtools-mcp.md documentation with autoconnect usage
- [x] Verify compatibility with existing workflows

## References
- chrome-devtools-mcp supports --autoconnect flag for automatic discovery

## Summary of Changes

- Added `--auto-connect` and `--no-usage-statistics` flags to `.mcp.json` chrome-devtools MCP server args
- Updated `.agents/docs/tools/chrome-devtools-mcp.md` configuration example and CLI options table to document `--auto-connect`
