import {
  PanelGroup,
  Panel,
  PanelResizeHandle,
  type PanelGroupProps,
  type PanelProps,
  type PanelResizeHandleProps,
} from 'react-resizable-panels';

export function ResizablePanelGroup({ style, ...props }: PanelGroupProps) {
  return (
    <PanelGroup
      style={{ display: 'flex', ...style }}
      {...props}
    />
  );
}

export function ResizablePanel(props: PanelProps) {
  return <Panel style={{ overflow: 'hidden' }} {...props} />;
}

export function ResizableHandle({ style, ...props }: PanelResizeHandleProps) {
  return (
    <PanelResizeHandle
      style={{
        background: '#333',
        flexShrink: 0,
        outline: 'none',
        ...style,
      }}
      {...props}
    />
  );
}
