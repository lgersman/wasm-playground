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

// Spawns pi directly via node — no shell wrapper, so no prompt or command echo.
export async function startAgentShell(
  term: Terminal,
  webcontainer: WebContainer,
  env: Record<string, string>,
  onExit?: (code: number) => void,
  onProgress?: (message: string) => void,
): Promise<ShellBridge> {
  onProgress?.("Starting agent...");

  const piProcess = await webcontainer.spawn(
    "node",
    ["./pi-agent/node_modules/@mariozechner/pi-coding-agent/dist/cli.js"],
    {
      terminal: { cols: term.cols, rows: term.rows },
      env,
    },
  );

  const writer = piProcess.input.getWriter();

  piProcess.output.pipeTo(
    new WritableStream({
      write(data) {
        term.write(data);
      },
    }),
  );

  piProcess.exit.then((code) => onExit?.(code));

  return {
    write(data: string) {
      writer.write(data);
    },
    resize(cols: number, rows: number) {
      piProcess.resize({ cols, rows });
    },
    dispose() {
      writer.close().catch(() => {});
    },
  };
}
