import { useState, useEffect } from "react";
import type { WebContainer } from "@webcontainer/api";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "./components/ui/resizable.tsx";
import Preview from "./components/Preview.tsx";
import XtermTerminal from "./components/XtermTerminal.tsx";
import EditorPanel from "./components/EditorPanel.tsx";
import LoadingOverlay from "./components/LoadingOverlay.tsx";
import { getWebContainer } from "./webcontainer/runtime.ts";
import { createProjectDir, startProjectSync } from "./webcontainer/filesystem.ts";
import { installDependencies, watchDevServer } from "./webcontainer/devserver.ts";

export default function App() {
  const [webcontainer, setWebcontainer] = useState<WebContainer | null>(null);
  const [loadingMessage, setLoadingMessage] = useState<string | null>("Booting WebContainer...");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    let stopped = false;
    let syncDispose: (() => void) | null = null;

    (async () => {
      setLoadingMessage("Booting WebContainer...");
      const wc = await getWebContainer();
      if (stopped) return;

      setLoadingMessage("Mounting project files...");
      await createProjectDir(wc);
      if (stopped) return;

      setLoadingMessage("Installing dependencies...");
      await installDependencies(wc);
      if (stopped) return;

      syncDispose = startProjectSync(wc);
      setWebcontainer(wc);
      setLoadingMessage(null);

      watchDevServer(wc, (url) => {
        if (!stopped) setPreviewUrl(url);
      });
    })().catch(console.error);

    return () => {
      stopped = true;
      syncDispose?.();
    };
  }, []);

  return (
    <div style={{ position: "relative", height: "100vh", width: "100vw" }}>
      <ResizablePanelGroup direction="vertical" style={{ height: "100%", width: "100%" }}>
        <ResizablePanel defaultSize={60} minSize={30}>
          <ResizablePanelGroup direction="horizontal" style={{ height: "100%" }}>
            <ResizablePanel defaultSize={50} minSize={20}>
              <EditorPanel webcontainer={webcontainer} />
            </ResizablePanel>
            <ResizableHandle style={{ width: "4px" }} />
            <ResizablePanel defaultSize={50} minSize={20}>
              <Preview url={previewUrl} />
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
        <ResizableHandle style={{ height: "4px" }} />
        <ResizablePanel defaultSize={40} minSize={15}>
          <XtermTerminal webcontainer={webcontainer} />
        </ResizablePanel>
      </ResizablePanelGroup>
      {loadingMessage && <LoadingOverlay message={loadingMessage} />}
    </div>
  );
}
