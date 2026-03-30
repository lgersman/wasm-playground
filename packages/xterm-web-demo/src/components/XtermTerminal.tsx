import { useEffect, useRef } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import './XtermTerminal.css';

export default function XtermTerminal() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    let aborted = false;
    let term: Terminal | null = null;
    let ws: WebSocket | null = null;
    let ro: ResizeObserver | null = null;

    (async () => {
      if (aborted || !containerRef.current) return;

      await document.fonts.load('14px JetBrainsMonoNerdFont');

      if (aborted || !containerRef.current) return;

      containerRef.current.innerHTML = '';
      term = new Terminal({
        fontSize: 14,
        fontFamily: 'JetBrainsMonoNerdFont, monospace',
        cursorBlink: true,
        theme: {
          background:      '#1e2127',
          foreground:      '#abb2bf',
          cursor:          '#528bff',
          cursorAccent:    '#1e2127',
          selectionBackground: '#3e4451',
          black:           '#3f4451',
          red:             '#e06c75',
          green:           '#98c379',
          yellow:          '#e5c07b',
          blue:            '#61afef',
          magenta:         '#c678dd',
          cyan:            '#56b6c2',
          white:           '#abb2bf',
          brightBlack:     '#4f5666',
          brightRed:       '#be5046',
          brightGreen:     '#98c379',
          brightYellow:    '#d19a66',
          brightBlue:      '#4dc4ff',
          brightMagenta:   '#ff79c6',
          brightCyan:      '#4dbdcb',
          brightWhite:     '#ffffff',
        },
      });
      term.open(containerRef.current);

      if (aborted) { term.dispose(); return; }

      const fitAddon = new FitAddon();
      term.loadAddon(fitAddon);
      fitAddon.fit();
      ro = new ResizeObserver(() => fitAddon.fit());
      ro.observe(containerRef.current!);

      const proto = location.protocol === 'https:' ? 'wss' : 'ws';
      ws = new WebSocket(`${proto}://${location.host}/ws/pty`);
      ws.binaryType = 'arraybuffer';

      ws.onopen = () => {
        const { cols, rows } = term!;
        ws!.send(JSON.stringify({ type: 'resize', cols, rows }));
      };

      ws.onmessage = (e) => {
        const data = e.data instanceof ArrayBuffer
          ? new TextDecoder().decode(e.data)
          : e.data;
        term!.write(data);
      };

      term.onData((data: string) => {
        ws?.send(JSON.stringify({ type: 'input', data }));
      });

      term.onResize(({ cols, rows }: { cols: number; rows: number }) => {
        ws?.send(JSON.stringify({ type: 'resize', cols, rows }));
      });
    })();

    return () => {
      aborted = true;
      ro?.disconnect();
      term?.dispose();
      ws?.close();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{ height: '100%', width: '100%', background: '#1e2127' }}
    />
  );
}
