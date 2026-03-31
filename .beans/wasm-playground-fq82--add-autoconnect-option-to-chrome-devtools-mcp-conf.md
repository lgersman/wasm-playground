---
# wasm-playground-fq82
title: Add autoconnect option to chrome-devtools MCP configuration
status: todo
type: task
created_at: 2026-03-31T05:49:12Z
updated_at: 2026-03-31T05:49:12Z
---

Configure the chrome-devtools MCP server in .mcp.json to use the --autoconnect flag, which automatically discovers and connects to running Chrome instances instead of requiring manual connection setup.

## Benefits
- Simplifies workflow by eliminating manual browser connection steps
- Automatically finds Chrome instances launched with remote debugging
- Reduces friction when starting browser automation tasks

## Implementation
- [ ] Update .mcp.json to add --autoconnect flag to chrome-devtools args
- [ ] Test automatic connection to running Chrome instances
- [ ] Update .agents/docs/tools/chrome-devtools-mcp.md documentation with autoconnect usage
- [ ] Verify compatibility with existing workflows

## References
- chrome-devtools-mcp supports --autoconnect flag for automatic discovery
