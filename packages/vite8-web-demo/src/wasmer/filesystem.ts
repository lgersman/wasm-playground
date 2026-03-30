import { Directory } from '@wasmer/sdk';

// Load all demo project files as raw strings at build time.
// The demo/ directory is excluded from TypeScript compilation (tsconfig include: ["src"])
// and is not built as JS — only inlined as strings here via ?raw.
const demoFiles = import.meta.glob('../../demo/**/*', {
  query: '?raw',
  eager: true,
  import: 'default',
}) as Record<string, string>;

export async function createProjectDir(): Promise<Directory> {
  const dir = new Directory();

  for (const [globPath, content] of Object.entries(demoFiles)) {
    // Strip the '../../demo/' prefix to get the path relative to the project root
    const path = globPath.replace(/^\.\.\/\.\.\/demo\//, '');

    // Ensure all parent directories exist before writing the file
    const parts = path.split('/');
    for (let depth = 1; depth < parts.length; depth++) {
      const dirPath = parts.slice(0, depth).join('/');
      await dir.createDir(dirPath).catch(() => {
        // Ignore — directory already exists
      });
    }

    await dir.writeFile(path, content);
  }

  return dir;
}

// Recursively read all files from a wasmer Directory into a flat map of path → content.
async function readAllFiles(
  dir: Directory,
  prefix: string,
): Promise<Record<string, string>> {
  const result: Record<string, string> = {};
  const entries = await dir.readDir(prefix || '.');

  for (const entry of entries) {
    const path = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.type === 'file') {
      result[path] = await dir.readTextFile(path);
    } else if (entry.type === 'dir') {
      Object.assign(result, await readAllFiles(dir, path));
    }
  }

  return result;
}

export async function listAllFiles(dir: Directory, prefix: string = ''): Promise<string[]> {
  const result: string[] = [];
  const entries = await dir.readDir(prefix || '.');
  for (const entry of entries) {
    const path = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.type === 'file') {
      result.push(path);
    } else if (entry.type === 'dir') {
      result.push(...(await listAllFiles(dir, path)));
    }
  }
  return result;
}

export async function saveFile(dir: Directory, path: string, content: string): Promise<void> {
  await dir.writeFile(path, content);
  if (import.meta.env.DEV) {
    await fetch('/__dev/sync-file', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path, content }),
    }).catch(() => {});
  }
}

export async function createNewFile(dir: Directory, path: string): Promise<void> {
  const parts = path.split('/');
  for (let depth = 1; depth < parts.length; depth++) {
    const dirPath = parts.slice(0, depth).join('/');
    await dir.createDir(dirPath).catch(() => {});
  }
  await dir.writeFile(path, '');
}

// In dev mode: poll the wasmer Directory every 2 seconds and POST any changed
// files to the Vite dev server's /__dev/sync-file endpoint, which writes them
// back to demo/ on disk.
//
// Returns a dispose function to stop polling.
export function startProjectSync(dir: Directory): () => void {
  if (!import.meta.env.DEV) return () => {};

  let stopped = false;
  let lastSnapshot: Record<string, string> = {};

  // Seed the initial snapshot so we only react to actual changes
  readAllFiles(dir, '').then((files) => {
    lastSnapshot = files;
  });

  const poll = async () => {
    if (stopped) return;

    try {
      const current = await readAllFiles(dir, '');

      for (const [path, content] of Object.entries(current)) {
        if (lastSnapshot[path] !== content) {
          await fetch('/__dev/sync-file', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
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
