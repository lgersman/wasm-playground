interface Props {
  files: string[];
  selectedFile: string | null;
  onSelect: (path: string) => void;
}

export default function FileTree({ files, selectedFile, onSelect }: Props) {
  return (
    <div style={{ height: "100%", overflow: "auto", background: "#21252b", userSelect: "none" }}>
      {files.map((f) => (
        <div
          key={f}
          onClick={() => onSelect(f)}
          style={{
            padding: "4px 12px",
            cursor: "pointer",
            background: f === selectedFile ? "#2c313a" : "transparent",
            color: f === selectedFile ? "#61afef" : "#abb2bf",
            fontSize: "13px",
            fontFamily: "monospace",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            borderLeft: f === selectedFile ? "2px solid #528bff" : "2px solid transparent",
          }}
        >
          {f}
        </div>
      ))}
    </div>
  );
}
