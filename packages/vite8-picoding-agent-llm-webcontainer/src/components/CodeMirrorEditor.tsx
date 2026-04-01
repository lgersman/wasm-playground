import { useEffect, useRef } from "react";
import { EditorView, keymap } from "@codemirror/view";
import { EditorState } from "@codemirror/state";
import { history, historyKeymap, defaultKeymap, undo, redo } from "@codemirror/commands";
import { html } from "@codemirror/lang-html";
import { javascript } from "@codemirror/lang-javascript";
import { css } from "@codemirror/lang-css";
import { json } from "@codemirror/lang-json";
import { oneDark } from "@codemirror/theme-one-dark";
import "./CodeMirrorEditor.css";

function langFor(path: string) {
  const ext = path.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "html":
      return html();
    case "js":
    case "jsx":
      return javascript({ jsx: true });
    case "ts":
      return javascript({ typescript: true });
    case "tsx":
      return javascript({ typescript: true, jsx: true });
    case "css":
      return css();
    case "json":
      return json();
    default:
      return [];
  }
}

const btnStyle: React.CSSProperties = {
  padding: "2px 8px",
  background: "#2c313a",
  border: "1px solid #3e4451",
  borderRadius: "3px",
  color: "#abb2bf",
  cursor: "pointer",
  fontSize: "12px",
};

interface Props {
  filePath: string;
  content: string;
  onSave: (content: string) => void;
  onNew: () => void;
  onDelete: () => void;
}

export default function CodeMirrorEditor({ filePath, content, onSave, onNew, onDelete }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onSaveRef = useRef(onSave);
  onSaveRef.current = onSave;

  useEffect(() => {
    if (!containerRef.current) return;
    const view = new EditorView({
      state: EditorState.create({
        doc: content,
        extensions: [
          history(),
          keymap.of([
            ...defaultKeymap,
            ...historyKeymap,
            {
              key: "Mod-s",
              run: (v) => {
                onSaveRef.current(v.state.doc.toString());
                return true;
              },
            },
          ]),
          langFor(filePath),
          oneDark,
          EditorView.lineWrapping,
          EditorView.theme({ "&": { height: "100%" }, ".cm-scroller": { overflow: "auto", fontFamily: "JetBrainsMonoNerdFont, monospace", fontSize: "14px" } }),
        ],
      }),
      parent: containerRef.current,
    });
    viewRef.current = view;
    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, [filePath]);

  const handleSave = () => {
    const v = viewRef.current;
    if (v) onSaveRef.current(v.state.doc.toString());
  };

  return (
    <div
      style={{ display: "flex", flexDirection: "column", height: "100%", background: "#282c34" }}
    >
      <div
        style={{
          padding: "4px 8px",
          background: "#21252b",
          borderBottom: "1px solid #181a1f",
          display: "flex",
          gap: "6px",
          alignItems: "center",
          flexShrink: 0,
        }}
      >
        <span style={{ color: "#abb2bf", fontSize: "12px", flex: 1, fontFamily: "JetBrainsMonoNerdFont, monospace" }}>
          {filePath}
        </span>
        <button
          style={btnStyle}
          title="Undo"
          onClick={() => {
            const v = viewRef.current;
            if (v) undo(v);
          }}
        >
          ↩
        </button>
        <button
          style={btnStyle}
          title="Redo"
          onClick={() => {
            const v = viewRef.current;
            if (v) redo(v);
          }}
        >
          ↪
        </button>
        <button style={{ ...btnStyle, color: "#98c379" }} onClick={handleSave}>
          Save
        </button>
        <button style={btnStyle} onClick={onNew}>
          New
        </button>
        <button style={{ ...btnStyle, color: "#e06c75" }} onClick={onDelete}>
          Delete
        </button>
      </div>
      <div ref={containerRef} style={{ flex: 1, overflow: "hidden" }} />
    </div>
  );
}
