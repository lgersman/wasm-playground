import { useState, useEffect } from "react";
import type { WebContainer } from "@webcontainer/api";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "./ui/resizable.tsx";
import FileTree from "./FileTree.tsx";
import CodeMirrorEditor from "./CodeMirrorEditor.tsx";
import { listAllFiles, saveFile, createNewFile } from "../webcontainer/filesystem.ts";

interface Props {
  webcontainer: WebContainer | null;
}

export default function EditorPanel({ webcontainer }: Props) {
  const [files, setFiles] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>("");

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
            key={selectedFile}
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
