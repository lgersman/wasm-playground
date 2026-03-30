# qmd — Agent Documentation Search

This project uses [@tobilu/qmd](https://github.com/tobi/qmd) to index and search the agent documentation in `.agents/docs/`. Always use `qmd` to find relevant documentation before exploring files manually.

> **Use the `/qmd` skill** for search tasks — it provides detailed query syntax guidance and handles the full search workflow. Invoke it with `/qmd` in Claude Code.

## Finding Documentation

Use the `/qmd` skill, or run directly:

```bash
vp exec qmd search "<topic>"     # fast BM25 keyword search
vp exec qmd vsearch "<topic>"    # semantic vector search
vp exec qmd query "<topic>"      # hybrid search (best results)
```

## Keeping the Index Current

The index is updated automatically via Claude Code hooks whenever files in `.agents/docs/` change. To manually re-index:

```bash
vp exec qmd update    # re-scan and index documents
vp exec qmd embed     # regenerate vector embeddings
vp exec qmd status    # check index health
```
