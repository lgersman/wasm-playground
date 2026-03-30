import type { Plugin } from 'vite';
import { WebSocketServer } from 'ws';
import * as pty from '@homebridge/node-pty-prebuilt-multiarch';

export default function ptyPlugin(): Plugin {
  return {
    name: 'vite-plugin-pty',
    configureServer(server) {
      const wss = new WebSocketServer({ noServer: true });

      server.httpServer?.on('upgrade', (req, socket, head) => {
        if (req.url !== '/ws/pty') return;

        wss.handleUpgrade(req, socket, head, (ws) => {
          const shell = pty.spawn(process.env.SHELL ?? 'bash', [], {
            name: 'xterm-256color',
            cols: 80,
            rows: 24,
            cwd: process.env.HOME,
            env: process.env as Record<string, string>,
          });

          shell.onData((data) => {
            if (ws.readyState === ws.OPEN) ws.send(data);
          });

          ws.on('message', (msg) => {
            const data = JSON.parse(msg.toString());
            if (data.type === 'input') shell.write(data.data);
            else if (data.type === 'resize') shell.resize(data.cols, data.rows);
          });

          ws.on('close', () => shell.kill());
        });
      });
    },
  };
}
