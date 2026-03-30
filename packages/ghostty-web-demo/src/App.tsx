import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from './components/ui/resizable.tsx';
import Preview from './components/Preview.tsx';
import GhosttyTerminal from './components/GhosttyTerminal.tsx';

export default function App() {
  return (
    <ResizablePanelGroup direction="vertical" style={{ height: '100vh', width: '100vw' }}>
      <ResizablePanel defaultSize={40} minSize={20}>
        <Preview />
      </ResizablePanel>
      <ResizableHandle style={{ height: '4px' }} />
      <ResizablePanel defaultSize={60} minSize={20}>
        <GhosttyTerminal />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
