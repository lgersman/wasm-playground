import { Wasmer, Directory } from '@wasmer/sdk';
import type { Terminal } from '@xterm/xterm';

export interface ShellBridge {
  write(data: string): void;
  resize(cols: number, rows: number): void;
  dispose(): void;
}

export async function startShell(
  term: Terminal,
  projectDir: Directory,
  onExit?: (code: number) => void,
  onProgress?: (message: string) => void,
): Promise<ShellBridge> {
  onProgress?.('Fetching bash...');
  const pkg = await Wasmer.fromRegistry('sharrattj/bash');
  const cmd = pkg.entrypoint ?? Object.values(pkg.commands)[0];
  if (!cmd) throw new Error('No shell command found in sharrattj/bash');

  onProgress?.('Starting shell...');
  const instance = await cmd.run({
    uses: ['sharrattj/coreutils', 'wasmer/winterjs'],
    mount: { '/project': projectDir },
    cwd: '/project',
    env: {
      TERM: 'xterm-256color',
      HOME: '/root',
      PATH: '/bin:/usr/bin:/usr/local/bin:/usr/local/node/bin',
    },
  });

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const writer = instance.stdin?.getWriter();

  const pipeStream = async (stream: ReadableStream) => {
    const reader = stream.getReader();
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        term.write(decoder.decode(value).replace(/\n/g, '\r\n'));
      }
    } finally {
      reader.releaseLock();
    }
  };

  pipeStream(instance.stdout);
  pipeStream(instance.stderr);

  instance.wait().then(({ code }) => onExit?.(code));

  return {
    write(data: string) {
      writer?.write(encoder.encode(data));
    },
    resize(_cols: number, _rows: number) {
      // Terminal resize via WASIX not yet exposed in @wasmer/sdk 0.8
    },
    dispose() {
      writer?.close().catch(() => {});
    },
  };
}
