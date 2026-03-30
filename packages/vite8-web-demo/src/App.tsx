import { useState, useEffect } from 'react';
import type { Directory } from '@wasmer/sdk';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from './components/ui/resizable.tsx';
import Preview from './components/Preview.tsx';
import XtermTerminal from './components/XtermTerminal.tsx';
import EditorPanel from './components/EditorPanel.tsx';
import { initWasmer } from './wasmer/runtime.ts';
import { createProjectDir, startProjectSync } from './wasmer/filesystem.ts';

export default function App() {
  const [projectDir, setProjectDir] = useState<Directory | null>(null);

  useEffect(() => {
    let stopped = false;
    let syncDispose: (() => void) | null = null;

    (async () => {
      await initWasmer();
      if (stopped) return;
      const dir = await createProjectDir();
      if (stopped) return;
      syncDispose = startProjectSync(dir);
      setProjectDir(dir);
    })().catch(console.error);

    return () => {
      stopped = true;
      syncDispose?.();
    };
  }, []);

  return (
    <ResizablePanelGroup direction="vertical" style={{ height: '100vh', width: '100vw' }}>
      <ResizablePanel defaultSize={60} minSize={30}>
        <ResizablePanelGroup direction="horizontal" style={{ height: '100%' }}>
          <ResizablePanel defaultSize={50} minSize={20}>
            <EditorPanel projectDir={projectDir} />
          </ResizablePanel>
          <ResizableHandle style={{ width: '4px' }} />
          <ResizablePanel defaultSize={50} minSize={20}>
            <Preview />
          </ResizablePanel>
        </ResizablePanelGroup>
      </ResizablePanel>
      <ResizableHandle style={{ height: '4px' }} />
      <ResizablePanel defaultSize={40} minSize={15}>
        <XtermTerminal projectDir={projectDir} />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
