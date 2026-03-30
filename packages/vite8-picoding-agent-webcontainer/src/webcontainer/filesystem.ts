import type { WebContainer, FileSystemTree } from "@webcontainer/api";

// Load all demo project files as raw strings at build time.
// The demo/ directory is excluded from TypeScript compilation (tsconfig include: ["src"])
// and is not built as JS — only inlined as strings here via ?raw.
const demoFiles = import.meta.glob(["../../demo/**/*", "../../demo/.*", "../../demo/.pi/**/*"], {
  query: "?raw",
  eager: true,
  import: "default",
}) as Record<string, string>;

function buildFileSystemTree(files: Record<string, string>): FileSystemTree {
  const tree: FileSystemTree = {};

  for (const [path, contents] of Object.entries(files)) {
    const parts = path.split("/");
    let current = tree;

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!current[part]) {
        current[part] = { directory: {} };
      }
      current = (current[part] as { directory: FileSystemTree }).directory;
    }

    const fileName = parts[parts.length - 1];
    current[fileName] = { file: { contents } };
  }

  return tree;
}

export async function createProjectDir(webcontainer: WebContainer): Promise<void> {
  const files: Record<string, string> = {};

  for (const [globPath, content] of Object.entries(demoFiles)) {
    const path = globPath.replace(/^\.\.\/\.\.\/demo\//, "");
    files[path] = content;
  }

  await webcontainer.mount(buildFileSystemTree(files));
}

async function readAllFiles(
  webcontainer: WebContainer,
  absDir: string = "/",
): Promise<Record<string, string>> {
  const result: Record<string, string> = {};
  const entries = await webcontainer.fs.readdir(absDir, { withFileTypes: true });

  for (const entry of entries) {
    const absPath = absDir === "/" ? `/${entry.name}` : `${absDir}/${entry.name}`;
    const relPath = absPath.replace(/^\//, "");

    if (entry.isFile()) {
      result[relPath] = await webcontainer.fs.readFile(absPath, "utf-8");
    } else if (entry.isDirectory() && entry.name !== "node_modules" && entry.name !== "pi-agent" && entry.name !== "dist" && entry.name !== ".pi") {
      Object.assign(result, await readAllFiles(webcontainer, absPath));
    }
  }

  return result;
}

export async function listAllFiles(
  webcontainer: WebContainer,
  absDir: string = "/",
): Promise<string[]> {
  const result: string[] = [];
  const entries = await webcontainer.fs.readdir(absDir, { withFileTypes: true });

  for (const entry of entries) {
    const absPath = absDir === "/" ? `/${entry.name}` : `${absDir}/${entry.name}`;
    const relPath = absPath.replace(/^\//, "");

    if (entry.isFile() && !entry.name.startsWith(".")) {
      result.push(relPath);
    } else if (entry.isDirectory() && entry.name !== "node_modules" && entry.name !== "pi-agent" && entry.name !== "dist" && entry.name !== ".pi") {
      result.push(...(await listAllFiles(webcontainer, absPath)));
    }
  }

  return result;
}

export async function saveFile(
  webcontainer: WebContainer,
  path: string,
  content: string,
): Promise<void> {
  await webcontainer.fs.writeFile("/" + path, content);
  if (import.meta.env.DEV) {
    await fetch("/__dev/sync-file", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path, content }),
    }).catch(() => {});
  }
}

export async function createNewFile(webcontainer: WebContainer, path: string): Promise<void> {
  const parts = path.split("/");
  for (let depth = 1; depth < parts.length; depth++) {
    const dirPath = "/" + parts.slice(0, depth).join("/");
    await webcontainer.fs.mkdir(dirPath, { recursive: true }).catch(() => {});
  }
  await webcontainer.fs.writeFile("/" + path, "");
}

// In dev mode: poll the WebContainer filesystem every 2 seconds and POST any
// changed files to the Vite dev server's /__dev/sync-file endpoint, which
// writes them back to demo/ on disk.
//
// Returns a dispose function to stop polling.
export function startProjectSync(webcontainer: WebContainer): () => void {
  if (!import.meta.env.DEV) return () => {};

  let stopped = false;
  let lastSnapshot: Record<string, string> = {};

  // Seed the initial snapshot so we only react to actual changes
  readAllFiles(webcontainer).then((files) => {
    lastSnapshot = files;
  });

  const poll = async () => {
    if (stopped) return;

    try {
      const current = await readAllFiles(webcontainer);

      for (const [path, content] of Object.entries(current)) {
        if (lastSnapshot[path] !== content) {
          await fetch("/__dev/sync-file", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ path, content }),
          });
          lastSnapshot[path] = content;
        }
      }
    } catch {
      // Silently ignore — sync failures are non-fatal
    }

    if (!stopped) setTimeout(poll, 2000);
  };

  setTimeout(poll, 2000);

  return () => {
    stopped = true;
  };
}
