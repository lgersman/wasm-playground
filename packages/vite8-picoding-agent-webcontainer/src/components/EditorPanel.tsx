import { useState, useEffect, useRef } from "react";
import type { WebContainer } from "@webcontainer/api";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "./ui/resizable.tsx";
import FileTree from "./FileTree.tsx";
import CodeMirrorEditor from "./CodeMirrorEditor.tsx";
import { listAllFiles, saveFile, createNewFile } from "../webcontainer/filesystem.ts";

interface Props {
  webcontainer: WebContainer | null;
  // Incremented each time the agent changes a file; triggers file tree refresh
  fileChangeCounter?: number;
  // The path (relative, no leading slash) of the most recently changed file
  changedFilePath?: string | null;
}

export default function EditorPanel({ webcontainer, fileChangeCounter, changedFilePath }: Props) {
  const [files, setFiles] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>("");
  // Incrementing this key forces the CodeMirrorEditor to remount with fresh content
  const [editorRefreshKey, setEditorRefreshKey] = useState(0);
  const selectedFileRef = useRef<string | null>(null);
  selectedFileRef.current = selectedFile;

  const refreshFiles = async (wc: WebContainer) => {
    const list = (await listAllFiles(wc)).sort();
    setFiles(list);
    return list;
  };

  const selectFile = async (wc: WebContainer, path: string) => {
    const content = await wc.fs.readFile("/" + path, "utf-8");
    setSelectedFile(path);
    setFileContent(content);
  };

  useEffect(() => {
    if (!webcontainer) return;
    refreshFiles(webcontainer).then((list) => {
      if (list.length > 0) selectFile(webcontainer, list[0]);
    });
  }, [webcontainer]);

  // React to agent file changes: refresh tree, and reload editor if current file changed
  useEffect(() => {
    if (!webcontainer || !fileChangeCounter) return;

    refreshFiles(webcontainer).catch(() => {});

    if (changedFilePath) {
      const normalized = changedFilePath.startsWith("/") ? changedFilePath.slice(1) : changedFilePath;
      if (normalized === selectedFileRef.current) {
        webcontainer.fs.readFile("/" + normalized, "utf-8").then((content) => {
          setFileContent(content);
          setEditorRefreshKey((k) => k + 1);
        }).catch(() => {});
      }
    }
  }, [fileChangeCounter, changedFilePath, webcontainer]);

  const handleSelect = (path: string) => {
    if (webcontainer) selectFile(webcontainer, path);
  };

  const handleSave = async (content: string) => {
    if (!webcontainer || !selectedFile) return;
    await saveFile(webcontainer, selectedFile, content);
  };

  const handleNew = async () => {
    if (!webcontainer) return;
    const name = window.prompt("Filename (e.g. src/style.css):");
    if (!name?.trim()) return;
    const path = name.trim();
    await createNewFile(webcontainer, path);
    const list = await refreshFiles(webcontainer);
    if (list.includes(path)) await selectFile(webcontainer, path);
  };

  const handleDelete = async () => {
    if (!webcontainer || !selectedFile) return;
    if (!window.confirm(`Delete ${selectedFile}?`)) return;
    await webcontainer.fs.rm("/" + selectedFile);
    const list = (await listAllFiles(webcontainer)).sort();
    setFiles(list);
    if (list.length > 0) {
      await selectFile(webcontainer, list[0]);
    } else {
      setSelectedFile(null);
      setFileContent("");
    }
  };

  if (!webcontainer) {
    return (
      <div
        style={{
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#21252b",
          color: "#4b5263",
          fontSize: "13px",
        }}
      >
        Initializing...
      </div>
    );
  }

  return (
    <ResizablePanelGroup direction="horizontal" style={{ height: "100%" }}>
      <ResizablePanel defaultSize={25} minSize={15}>
        <FileTree files={files} selectedFile={selectedFile} onSelect={handleSelect} />
      </ResizablePanel>
      <ResizableHandle style={{ width: "4px" }} />
      <ResizablePanel defaultSize={75} minSize={30}>
        {selectedFile ? (
          <CodeMirrorEditor
            key={`${selectedFile}-${editorRefreshKey}`}
            filePath={selectedFile}
            content={fileContent}
            onSave={handleSave}
            onNew={handleNew}
            onDelete={handleDelete}
          />
        ) : (
          <div
            style={{
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#282c34",
              color: "#4b5263",
              fontSize: "13px",
            }}
          >
            Select a file
          </div>
        )}
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
