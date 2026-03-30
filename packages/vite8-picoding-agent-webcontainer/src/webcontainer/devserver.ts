import type { WebContainer } from "@webcontainer/api";
import { getCached, setCached, hashString } from "./cache.ts";

// Package manifest used as the cache key — bump version here to force a reinstall.
const PI_AGENT_PACKAGE_JSON = JSON.stringify(
  { name: "pi-agent", version: "0.0.1", private: true, dependencies: { "@mariozechner/pi-coding-agent": "latest" } },
  null,
  2,
);

export async function installPiAgent(
  webcontainer: WebContainer,
  onOutput?: (data: string) => void,
): Promise<void> {
  const cacheKey = `pi-agent:${await hashString(PI_AGENT_PACKAGE_JSON)}`;

  const cached = await getCached(cacheKey);
  if (cached) {
    await webcontainer.fs.mkdir("/pi-agent/node_modules", { recursive: true }).catch(() => {});
    await webcontainer.mount(cached, { mountPoint: "/pi-agent/node_modules" });
    return;
  }

  await webcontainer.fs.mkdir("/pi-agent", { recursive: true }).catch(() => {});
  await webcontainer.fs.writeFile("/pi-agent/package.json", PI_AGENT_PACKAGE_JSON);

  const proc = await webcontainer.spawn("npm", ["install"], { cwd: "/pi-agent" });
  proc.output.pipeTo(new WritableStream({ write(data) { onOutput?.(data); } }));
  const exitCode = await proc.exit;
  if (exitCode !== 0) throw new Error(`pi agent install failed (exit code ${exitCode})`);

  const snapshot = await webcontainer.export("pi-agent/node_modules", { format: "binary" });
  await setCached(cacheKey, snapshot as Uint8Array);
}

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
