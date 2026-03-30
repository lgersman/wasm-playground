# Toolchain

This project uses [vite-plus](https://viteplus.dev) (`vp`) as the unified toolchain. Always use `vp` instead of calling `node`, `npm`, `pnpm`, or `npx` directly.

## Node.js Version

The Node.js version is pinned in `package.json` under `engines.node`. To install or switch to it:

```bash
vp env install        # install the pinned version
vp env pin <version>  # update the pinned version (e.g. lts, 22, 22.1.0)
```

## Package Dependencies

```bash
vp install            # install all dependencies
vp add <pkg>          # add a runtime dependency
vp add -D <pkg>       # add a dev dependency
vp remove <pkg>       # remove a dependency
vp update             # update dependencies
```

## Running Sub-Projects

```bash
vp run <task>         # run a task defined in package.json scripts
vp dev                # start the development server
vp build              # build for production
vp test               # run tests
vp check              # run format, lint, and type checks
vp exec <bin>         # execute a binary from node_modules/.bin
vp dlx <pkg>          # execute a package binary without installing it
```
