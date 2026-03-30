#!/usr/bin/env bash
set -euo pipefail

# Install beans CLI into bin/
echo "installing beans CLI..."
BEANS_VERSION=$(curl -fsSL "https://api.github.com/repos/hmans/beans/releases/latest" | grep '"tag_name"' | cut -d'"' -f4 | sed 's/^v//')
OS=$(uname -s)
ARCH=$(uname -m)
case "$ARCH" in x86_64) ARCH=x86_64 ;; aarch64|arm64) ARCH=arm64 ;; i386|i686) ARCH=i386 ;; esac
ARCHIVE="beans_${OS}_${ARCH}.tar.gz"
mkdir -p bin
curl -fsSL "https://github.com/hmans/beans/releases/download/v${BEANS_VERSION}/${ARCHIVE}" | tar -xz -C bin beans
chmod +x bin/beans
echo "beans v${BEANS_VERSION} installed to bin/beans"

for link in .claude/commands .claude/skills; do
  target=".agents/$(basename "$link")"
  [ -L "$link" ] && rm "$link"
  [ -e "$link" ] && { echo "error: '$link' exists and is not a symlink — remove it manually" >&2; exit 1; }
  ln -s "../$target" "$link"
  echo "linked $link -> $target"
done

# Build qmd index and embeddings for agent documentation
echo "indexing agent docs with qmd..."
vp exec qmd collection add "$(pwd)/.agents/docs" --name agent-docs 2>&1 \
  | grep -v "already exists" || true
vp exec qmd update && vp exec qmd embed && echo "qmd: agent-docs index ready" \
  || echo "warning: qmd update/embed failed — run 'vp exec qmd update && vp exec qmd embed' manually"
