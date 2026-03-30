import "./LoadingOverlay.css";

interface Props {
  message: string;
}

export default function LoadingOverlay({ message }: Props) {
  return (
    <div className="loading-overlay">
      <div className="loading-spinner" />
      <span className="loading-message">{message}</span>
    </div>
  );
}
