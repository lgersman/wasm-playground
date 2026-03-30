interface Props {
  url: string | null;
}

export default function Preview({ url }: Props) {
  if (!url) {
    return (
      <div
        style={{
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#1a1a1a",
          color: "#888",
          fontSize: "1rem",
          fontFamily: "sans-serif",
        }}
      >
        Run <code style={{ background: "#2a2a2a", padding: "2px 6px", borderRadius: 3 }}>npm run dev</code> in the terminal to start the preview
      </div>
    );
  }

  return (
    <iframe
      src={url}
      style={{ width: "100%", height: "100%", border: "none" }}
      allow="cross-origin-isolated"
    />
  );
}
