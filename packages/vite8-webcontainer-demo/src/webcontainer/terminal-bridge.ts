import type { WebContainer } from "@webcontainer/api";
import type { Terminal } from "@xterm/xterm";

export interface ShellBridge {
  write(data: string): void;
  resize(cols: number, rows: number): void;
  dispose(): void;
}

export async function startShell(
  term: Terminal,
  webcontainer: WebContainer,
  onExit?: (code: number) => void,
  onProgress?: (message: string) => void,
): Promise<ShellBridge> {
  onProgress?.("Starting shell...");

  const shellProcess = await webcontainer.spawn("jsh", {
    terminal: {
      cols: term.cols,
      rows: term.rows,
    },
  });

  const writer = shellProcess.input.getWriter();

  shellProcess.output.pipeTo(
    new WritableStream({
      write(data) {
        term.write(data);
      },
    }),
  );

  shellProcess.exit.then((code) => onExit?.(code));

  return {
    write(data: string) {
      writer.write(data);
    },
    resize(cols: number, rows: number) {
      shellProcess.resize({ cols, rows });
    },
    dispose() {
      writer.close().catch(() => {});
    },
  };
}
