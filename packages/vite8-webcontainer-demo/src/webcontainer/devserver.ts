import type { WebContainer } from "@webcontainer/api";
import { getCached, setCached, hashString } from "./cache.ts";

export async function installDependencies(webcontainer: WebContainer): Promise<void> {
  const packageJson = await webcontainer.fs.readFile("/package.json", "utf-8");
  const cacheKey = `node_modules:${await hashString(packageJson)}`;

  const cached = await getCached(cacheKey);
  if (cached) {
    await webcontainer.fs.mkdir("/node_modules");
    await webcontainer.mount(cached, { mountPoint: "/node_modules" });
    return;
  }

  const process = await webcontainer.spawn("npm", ["install"]);
  process.output.pipeTo(new WritableStream({ write() {} }));
  const exitCode = await process.exit;
  if (exitCode !== 0) throw new Error(`npm install failed (exit code ${exitCode})`);

  const snapshot = await webcontainer.export("node_modules", { format: "binary" });
  await setCached(cacheKey, snapshot as Uint8Array);
}

// Registers the server-ready listener so the preview iframe updates automatically
// when the user starts the dev server manually from the terminal (npm run dev).
export function watchDevServer(webcontainer: WebContainer, onReady: (url: string) => void): void {
  webcontainer.on("server-ready", (_port, url) => onReady(url));
}
