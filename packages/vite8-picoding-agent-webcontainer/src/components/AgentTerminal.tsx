import { useEffect, useRef, useState } from "react";
import type { WebContainer } from "@webcontainer/api";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";
import "./XtermTerminal.css";
import LoadingOverlay from "./LoadingOverlay.tsx";
import { startAgentShell } from "../webcontainer/terminal-bridge.ts";
import { installPiAgent } from "../webcontainer/devserver.ts";

interface Props {
  webcontainer: WebContainer | null;
}

async function fetchAnthropicApiKey(): Promise<string> {
  try {
    const res = await fetch("/__agent/anthropic-key");
    if (res.ok) {
      const { key } = (await res.json()) as { key: string };
      return key ?? "";
    }
  } catch {
    // Silently ignore — key stays empty
  }
  return "";
}

const TERMINAL_THEME = {
  background: "#1a1e24",
  foreground: "#abb2bf",
  cursor: "#528bff",
  cursorAccent: "#1a1e24",
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
};

export default function AgentTerminal({ webcontainer }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loadingMessage, setLoadingMessage] = useState<string | null>("Waiting for WebContainer...");

  useEffect(() => {
    if (!webcontainer || !containerRef.current) return;

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
        theme: TERMINAL_THEME,
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

      // Install @mariozechner/pi-coding-agent into /pi-agent, cached in IndexedDB
      setLoadingMessage("Installing pi agent...");
      await installPiAgent(webcontainer, (data) => term?.write(data));
      if (aborted) {
        term.dispose();
        return;
      }

      // Fetch the Anthropic API key from the Vite middleware
      setLoadingMessage("Fetching API key...");
      const apiKey = await fetchAnthropicApiKey();
      if (aborted) {
        term.dispose();
        return;
      }

      setLoadingMessage("Starting agent...");
      try {
        const bridge = await startAgentShell(
          term,
          webcontainer,
          { ANTHROPIC_API_KEY: apiKey, PI_OFFLINE: "1" },
          (code) => {
            term?.write(`\r\nAgent shell exited with code ${code}\r\n`);
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
    })().catch(console.error);

    return () => {
      aborted = true;
      ro?.disconnect();
      shellDispose?.();
      term?.dispose();
    };
  }, [webcontainer]);

  return (
    <div
      style={{
        position: "relative",
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        background: "#1a1e24",
      }}
    >
      <div ref={containerRef} style={{ flex: 1, overflow: "hidden" }} />
      {loadingMessage && <LoadingOverlay message={loadingMessage} />}
    </div>
  );
}
