import { useEffect, useRef, useState } from "react";
import type { WebContainer } from "@webcontainer/api";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";
import "./XtermTerminal.css";
import LoadingOverlay from "./LoadingOverlay.tsx";
import { startShell } from "../webcontainer/terminal-bridge.ts";

interface Props {
  webcontainer: WebContainer | null;
}

export default function XtermTerminal({ webcontainer }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loadingMessage, setLoadingMessage] = useState<string | null>("Initializing...");

  useEffect(() => {
    if (!containerRef.current) return;

    let aborted = false;
    let term: Terminal | null = null;
    let ro: ResizeObserver | null = null;
    let shellDispose: (() => void) | null = null;

    (async () => {
      if (aborted || !containerRef.current) return;

      await document.fonts.load("14px JetBrainsMonoNerdFont");

      if (aborted || !containerRef.current) return;

      containerRef.current.innerHTML = "";
      term = new Terminal({
        fontSize: 14,
        fontFamily: "JetBrainsMonoNerdFont, monospace",
        cursorBlink: true,
        theme: {
          background: "#1e2127",
          foreground: "#abb2bf",
          cursor: "#528bff",
          cursorAccent: "#1e2127",
          selectionBackground: "#3e4451",
          black: "#3f4451",
          red: "#e06c75",
          green: "#98c379",
          yellow: "#e5c07b",
          blue: "#61afef",
          magenta: "#c678dd",
          cyan: "#56b6c2",
          white: "#abb2bf",
          brightBlack: "#4f5666",
          brightRed: "#be5046",
          brightGreen: "#98c379",
          brightYellow: "#d19a66",
          brightBlue: "#4dc4ff",
          brightMagenta: "#ff79c6",
          brightCyan: "#4dbdcb",
          brightWhite: "#ffffff",
        },
      });
      term.open(containerRef.current);

      if (aborted) {
        term.dispose();
        return;
      }

      const fitAddon = new FitAddon();
      term.loadAddon(fitAddon);
      fitAddon.fit();
      ro = new ResizeObserver(() => fitAddon.fit());
      ro.observe(containerRef.current!);

      if (!webcontainer) return;

      try {
        const bridge = await startShell(
          term,
          webcontainer,
          (code) => {
            term?.write(`\r\nShell exited with code ${code}\r\n`);
          },
          (msg) => {
            if (!aborted) setLoadingMessage(msg);
          },
        );
        shellDispose = () => bridge.dispose();

        if (aborted) {
          bridge.dispose();
          term.dispose();
          return;
        }

        setLoadingMessage(null);

        term.onData((data: string) => bridge.write(data));
        term.onResize(({ cols, rows }: { cols: number; rows: number }) =>
          bridge.resize(cols, rows),
        );
      } catch (err) {
        setLoadingMessage(null);
        term?.write(`\r\nError: ${String(err)}\r\n`);
      }
    })();

    return () => {
      aborted = true;
      ro?.disconnect();
      shellDispose?.();
      term?.dispose();
    };
  }, [webcontainer]);

  return (
    <div style={{ position: "relative", height: "100%", width: "100%" }}>
      <div ref={containerRef} style={{ height: "100%", width: "100%", background: "#1e2127" }} />
      {loadingMessage && <LoadingOverlay message={loadingMessage} />}
    </div>
  );
}
