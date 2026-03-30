import { useEffect, useRef } from 'react';

export default function GhosttyTerminal() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    let aborted = false;
    let term: { dispose(): void } | null = null;
    let ws: WebSocket | null = null;

    (async () => {
      const { Terminal, FitAddon } = await import('ghostty-web');

      if (aborted || !containerRef.current) return;

      await document.fonts.load('14px JetBrainsMonoNerdFont');

      if (aborted || !containerRef.current) return;

      containerRef.current.innerHTML = '';
      term = new Terminal({ fontSize: 14, fontFamily: 'JetBrainsMonoNerdFont, monospace' }) as any;
      await (term as any).open(containerRef.current);

      if (aborted) { term.dispose(); return; }

      const fitAddon = new FitAddon();
      (term as any).loadAddon(fitAddon);
      fitAddon.fit();
      fitAddon.observeResize();

      const proto = location.protocol === 'https:' ? 'wss' : 'ws';
      ws = new WebSocket(`${proto}://${location.host}/ws/pty`);
      ws.binaryType = 'arraybuffer';

      ws.onopen = () => {
        const { cols, rows } = (term as any);
        ws!.send(JSON.stringify({ type: 'resize', cols, rows }));
      };

      ws.onmessage = (e) => {
        const data = e.data instanceof ArrayBuffer
          ? new TextDecoder().decode(e.data)
          : e.data;
        (term as any).write(data);
      };

      (term as any).onData((data: string) => {
        ws?.send(JSON.stringify({ type: 'input', data }));
      });

      (term as any).onResize(({ cols, rows }: { cols: number; rows: number }) => {
        ws?.send(JSON.stringify({ type: 'resize', cols, rows }));
      });
    })();

    return () => {
      aborted = true;
      term?.dispose();
      ws?.close();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{ height: '100%', width: '100%', background: 'rgb(29, 31, 33)' }}
    />
  );
}
