import { writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { defineConfig, type Plugin } from "vite-plus";
import react from "@vitejs/plugin-react";

const demoDir = resolve(import.meta.dirname, "demo");

// Dev-only plugin: receives POST /__dev/sync-file requests from the browser
// and writes changed webcontainer filesystem files back to demo/ on disk.
function demoSyncPlugin(): Plugin {
  return {
    name: "demo-sync",
    apply: "serve",
    configureServer(server) {
      server.watcher.unwatch(demoDir);
      server.middlewares.use("/__dev/sync-file", (req, res) => {
        if (req.method !== "POST") {
          res.writeHead(405).end();
          return;
        }

        let body = "";
        req.on("data", (chunk: Buffer) => {
          body += chunk.toString();
        });
        req.on("end", () => {
          try {
            const { path, content } = JSON.parse(body) as {
              path: string;
              content: string;
            };

            // Prevent path traversal outside demo/
            const filePath = resolve(demoDir, path);
            if (!filePath.startsWith(demoDir + "/")) {
              res.writeHead(400).end(JSON.stringify({ error: "Invalid path" }));
              return;
            }

            mkdirSync(dirname(filePath), { recursive: true });
            writeFileSync(filePath, content, "utf-8");

            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ ok: true }));
          } catch (err) {
            res.writeHead(500).end(JSON.stringify({ error: String(err) }));
          }
        });
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), demoSyncPlugin()],
  server: {
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
    },
  },
});
