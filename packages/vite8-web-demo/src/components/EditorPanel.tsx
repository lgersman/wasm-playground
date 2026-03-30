import { useState, useEffect } from 'react';
import type { Directory } from '@wasmer/sdk';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from './ui/resizable.tsx';
import FileTree from './FileTree.tsx';
import CodeMirrorEditor from './CodeMirrorEditor.tsx';
import { listAllFiles, saveFile, createNewFile } from '../wasmer/filesystem.ts';

interface Props {
  projectDir: Directory | null;
}

export default function EditorPanel({ projectDir }: Props) {
  const [files, setFiles] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>('');

  const refreshFiles = async (dir: Directory, keepSelected?: string) => {
    const list = (await listAllFiles(dir)).sort();
    setFiles(list);
    return list;
  };

  const selectFile = async (dir: Directory, path: string) => {
    const content = await dir.readTextFile(path);
    setSelectedFile(path);
    setFileContent(content);
  };

  useEffect(() => {
    if (!projectDir) return;
    refreshFiles(projectDir).then((list) => {
      if (list.length > 0) selectFile(projectDir, list[0]);
    });
  }, [projectDir]);

  const handleSelect = (path: string) => {
    if (projectDir) selectFile(projectDir, path);
  };

  const handleSave = async (content: string) => {
    if (!projectDir || !selectedFile) return;
    await saveFile(projectDir, selectedFile, content);
  };

  const handleNew = async () => {
    if (!projectDir) return;
    const name = window.prompt('Filename (e.g. src/style.css):');
    if (!name?.trim()) return;
    const path = name.trim();
    await createNewFile(projectDir, path);
    const list = await refreshFiles(projectDir);
    if (list.includes(path)) await selectFile(projectDir, path);
  };

  const handleDelete = async () => {
    if (!projectDir || !selectedFile) return;
    if (!window.confirm(`Delete ${selectedFile}?`)) return;
    await projectDir.removeFile(selectedFile);
    const list = (await listAllFiles(projectDir)).sort();
    setFiles(list);
    if (list.length > 0) {
      await selectFile(projectDir, list[0]);
    } else {
      setSelectedFile(null);
      setFileContent('');
    }
  };

  if (!projectDir) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#21252b', color: '#4b5263', fontSize: '13px' }}>
        Initializing...
      </div>
    );
  }

  return (
    <ResizablePanelGroup direction="horizontal" style={{ height: '100%' }}>
      <ResizablePanel defaultSize={25} minSize={15}>
        <FileTree files={files} selectedFile={selectedFile} onSelect={handleSelect} />
      </ResizablePanel>
      <ResizableHandle style={{ width: '4px' }} />
      <ResizablePanel defaultSize={75} minSize={30}>
        {selectedFile ? (
          <CodeMirrorEditor
            key={selectedFile}
            filePath={selectedFile}
            content={fileContent}
            onSave={handleSave}
            onNew={handleNew}
            onDelete={handleDelete}
          />
        ) : (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#282c34', color: '#4b5263', fontSize: '13px' }}>
            Select a file
          </div>
        )}
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
