import { useState, useEffect, useRef, useCallback } from "react";
import type { WebContainer } from "@webcontainer/api";
import { listAllFiles } from "../webcontainer/filesystem.ts";

interface Props {
  webcontainer: WebContainer | null;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ModelOption {
  /** Model ID used when loading on CPU (WASM, dtype q4) */
  wasmId: string;
  /** Model ID used when loading on GPU (WebGPU, dtype q4f16); falls back to wasmId if not set */
  gpuId?: string;
  label: string;
  description: string;
  /** If true, WASM is unlikely to work due to memory limits — GPU recommended */
  gpuRecommended?: boolean;
}

const MODELS: ModelOption[] = [
  {
    wasmId: "HuggingFaceTB/SmolLM2-135M-Instruct",
    label: "SmolLM2 (135M)",
    description: "HuggingFace · 135M params · ~100MB · fast",
  },
  {
    wasmId: "HuggingFaceTB/SmolLM2-360M-Instruct",
    label: "SmolLM2 (360M)",
    description: "HuggingFace · 360M params · ~250MB",
  },
  {
    wasmId: "HuggingFaceTB/SmolLM2-1.7B-Instruct",
    label: "SmolLM2 (1.7B)",
    description: "HuggingFace · 1.7B params · ~1GB",
  },
  {
    wasmId: "onnx-community/Qwen2.5-0.5B-Instruct",
    label: "Qwen 2.5 (0.5B)",
    description: "Alibaba · 0.5B params · ~350MB · fast",
  },
  {
    wasmId: "onnx-community/Qwen2.5-1.5B-Instruct",
    label: "Qwen 2.5 (1.5B)",
    description: "Alibaba · 1.5B params · ~1GB",
  },
  {
    wasmId: "onnx-community/Qwen2.5-3B-Instruct",
    gpuId: "onnx-community/Qwen2.5-3B-Instruct",
    label: "Qwen 2.5 (3B)",
    description: "Alibaba · 3B params · ~2GB",
    gpuRecommended: true,
  },
  {
    wasmId: "onnx-community/Llama-3.2-3B-Instruct",
    gpuId: "onnx-community/Llama-3.2-3B-Instruct-q4f16",
    label: "Llama 3.2 (3B)",
    description: "Meta · 3B params · ~2GB",
    gpuRecommended: true,
  },
  {
    wasmId: "onnx-community/Phi-3.5-mini-instruct-onnx-web",
    label: "Phi-3.5-mini (3.8B)",
    description: "Microsoft · 3.8B params · ~2.5GB",
    gpuRecommended: true,
  },
];

const SYSTEM_PROMPT = `You are a coding assistant running inside a browser-based development environment powered by WebContainer.
The user is working on a web project. You can help them write, modify, and debug code.
When the user asks you to create or modify files, provide the complete file contents in a code block with the filename as a comment at the top.
Be concise and practical. Focus on code.`;

type WorkerStatus =
  | { phase: "idle" }
  | { phase: "loading"; modelId: string; status: string; progress?: number }
  | { phase: "ready"; modelId: string }
  | { phase: "generating" }
  | { phase: "error"; message: string };

export default function AgentPanel({ webcontainer }: Props) {
  const [selectedModelIdx, setSelectedModelIdx] = useState<number>(0);
  const [useGpu, setUseGpu] = useState(false);
  const [workerStatus, setWorkerStatus] = useState<WorkerStatus>({ phase: "idle" });
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [files, setFiles] = useState<string[]>([]);

  const workerRef = useRef<Worker | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentRequestId = useRef<string | null>(null);
  const partialAssistantRef = useRef<string>("");

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Refresh file list when webcontainer is ready or files change
  useEffect(() => {
    if (!webcontainer) return;
    listAllFiles(webcontainer).then((f) => setFiles(f.sort())).catch(() => {});
  }, [webcontainer]);

  // Initialize Web Worker
  useEffect(() => {
    const worker = new Worker(new URL("../workers/llm.worker.ts", import.meta.url), {
      type: "module",
    });

    worker.onmessage = (event) => {
      const msg = event.data as
        | { type: "load-progress"; modelId: string; status: string; progress?: number }
        | { type: "load-done"; modelId: string }
        | { type: "load-error"; modelId: string; error: string }
        | { type: "token"; requestId: string; token: string }
        | { type: "generate-done"; requestId: string }
        | { type: "generate-error"; requestId: string; error: string };

      if (msg.type === "load-progress") {
        setWorkerStatus({ phase: "loading", modelId: msg.modelId, status: msg.status, progress: msg.progress });
      } else if (msg.type === "load-done") {
        setWorkerStatus({ phase: "ready", modelId: msg.modelId });
      } else if (msg.type === "load-error") {
        setWorkerStatus({ phase: "error", message: `Failed to load model: ${msg.error}` });
      } else if (msg.type === "token") {
        if (msg.requestId !== currentRequestId.current) return;
        partialAssistantRef.current += msg.token;
        const partial = partialAssistantRef.current;
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant") {
            return [...prev.slice(0, -1), { role: "assistant", content: partial }];
          }
          return [...prev, { role: "assistant", content: partial }];
        });
      } else if (msg.type === "generate-done") {
        currentRequestId.current = null;
        partialAssistantRef.current = "";
        setWorkerStatus((s) => (s.phase === "generating" ? { phase: "ready", modelId: msg.requestId } : s));
      } else if (msg.type === "generate-error") {
        currentRequestId.current = null;
        partialAssistantRef.current = "";
        setWorkerStatus({ phase: "error", message: `Generation failed: ${msg.error}` });
      }
    };

    workerRef.current = worker;
    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  const handleLoadModel = useCallback(() => {
    if (!workerRef.current) return;
    const model = MODELS[selectedModelIdx];
    const modelId = useGpu ? (model.gpuId ?? model.wasmId) : model.wasmId;
    workerRef.current.postMessage({ type: "load", modelId, useGpu });
    setWorkerStatus({ phase: "loading", modelId, status: "Initializing..." });
  }, [selectedModelIdx, useGpu]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || workerStatus.phase !== "ready") return;

    const userMessage: ChatMessage = { role: "user", content: text };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    // Optionally inject file list context for first message
    const contextMessages: ChatMessage[] = messages.length === 0 && files.length > 0
      ? [
          { role: "user", content: `Project files:\n${files.join("\n")}\n\n${text}` },
        ]
      : [...messages, userMessage];

    const requestId = crypto.randomUUID();
    currentRequestId.current = requestId;
    partialAssistantRef.current = "";
    setWorkerStatus({ phase: "generating" });

    workerRef.current!.postMessage({
      type: "generate",
      requestId,
      messages: contextMessages,
      systemPrompt: SYSTEM_PROMPT,
    });
  }, [input, messages, files, workerStatus]);

  const handleAbort = useCallback(() => {
    if (!currentRequestId.current || !workerRef.current) return;
    workerRef.current.postMessage({ type: "abort", requestId: currentRequestId.current });
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isReady = workerStatus.phase === "ready";
  const isLoading = workerStatus.phase === "loading";
  const isGenerating = workerStatus.phase === "generating";

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "#1a1e24", color: "#abb2bf", fontFamily: "JetBrainsMonoNerdFont, monospace" }}>
      {/* Header */}
      <div style={{ padding: "8px 12px", borderBottom: "1px solid #2c313a", background: "#21252b", flexShrink: 0 }}>
        <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
          <select
            value={selectedModelIdx}
            onChange={(e) => {
              setSelectedModelIdx(Number(e.target.value));
              setWorkerStatus({ phase: "idle" });
            }}
            disabled={isLoading || isGenerating}
            style={{
              flex: 1,
              background: "#2c313a",
              border: "1px solid #3e4451",
              borderRadius: "3px",
              color: "#abb2bf",
              fontSize: "12px",
              padding: "3px 6px",
              cursor: "pointer",
            }}
          >
            {MODELS.map((m, i) => (
              <option key={m.wasmId} value={i}>
                {m.label} — {m.description}
              </option>
            ))}
          </select>
          {!isReady && !isLoading && (
            <button
              onClick={handleLoadModel}
              style={{
                padding: "3px 10px",
                background: "#528bff",
                border: "none",
                borderRadius: "3px",
                color: "#fff",
                fontSize: "12px",
                cursor: "pointer",
                flexShrink: 0,
              }}
            >
              Load
            </button>
          )}
        </div>
        <div style={{ marginTop: "6px", display: "flex", alignItems: "center", gap: "6px" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", color: "#888", cursor: isLoading || isGenerating ? "default" : "pointer" }}>
            <input
              type="checkbox"
              checked={useGpu}
              disabled={isLoading || isGenerating}
              onChange={(e) => {
                setUseGpu(e.target.checked);
                setWorkerStatus({ phase: "idle" });
              }}
            />
            Use GPU (WebGPU)
          </label>
          {isLoading && (
            <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#888", fontSize: "11px" }}>
              <div style={{ width: "10px", height: "10px", border: "2px solid #333", borderTopColor: "#6eb77a", borderRadius: "50%", animation: "spin 0.8s linear infinite", flexShrink: 0 }} />
              {(workerStatus as { phase: "loading"; status: string }).status}
            </div>
          )}
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        {MODELS[selectedModelIdx].gpuRecommended && !useGpu && workerStatus.phase !== "ready" && (
          <div style={{ marginTop: "5px", fontSize: "11px", color: "#e5c07b" }}>
            ⚠ This model needs ~2GB+ WASM heap — may crash. Enable GPU for reliable use.
          </div>
        )}
        {workerStatus.phase === "error" && (
          <div style={{ marginTop: "6px", fontSize: "11px", color: "#e06c75" }}>
            {(workerStatus as { phase: "error"; message: string }).message}
          </div>
        )}
        {isReady && (
          <div style={{ marginTop: "4px", fontSize: "11px", color: "#98c379" }}>
            Model ready · {MODELS[selectedModelIdx].label} · {useGpu ? "GPU" : "CPU"}
          </div>
        )}
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflow: "auto", padding: "8px 0" }}>
        {messages.length === 0 && (
          <div style={{ padding: "24px 16px", color: "#4b5263", fontSize: "13px", textAlign: "center" }}>
            {isReady ? "Ask the agent to help with your code..." : "Load a model to start chatting"}
          </div>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              padding: "8px 12px",
              borderBottom: "1px solid #1e2127",
              background: msg.role === "user" ? "#21252b" : "transparent",
            }}
          >
            <div style={{ fontSize: "11px", color: msg.role === "user" ? "#528bff" : "#98c379", marginBottom: "4px", fontWeight: "bold" }}>
              {msg.role === "user" ? "You" : "Agent"}
            </div>
            <div style={{ fontSize: "13px", whiteSpace: "pre-wrap", lineHeight: "1.5" }}>
              {msg.content}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={{ borderTop: "1px solid #2c313a", padding: "8px", background: "#21252b", flexShrink: 0 }}>
        <div style={{ display: "flex", gap: "6px" }}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={!isReady}
            placeholder={isReady ? "Ask the agent... (Enter to send, Shift+Enter for newline)" : "Load a model first"}
            rows={3}
            style={{
              flex: 1,
              background: "#2c313a",
              border: "1px solid #3e4451",
              borderRadius: "3px",
              color: "#abb2bf",
              fontSize: "13px",
              padding: "6px 8px",
              resize: "none",
              fontFamily: "JetBrainsMonoNerdFont, monospace",
              outline: "none",
            }}
          />
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {isGenerating ? (
              <button
                onClick={handleAbort}
                style={{
                  padding: "6px 10px",
                  background: "#e06c75",
                  border: "none",
                  borderRadius: "3px",
                  color: "#fff",
                  fontSize: "12px",
                  cursor: "pointer",
                }}
              >
                Stop
              </button>
            ) : (
              <button
                onClick={handleSend}
                disabled={!isReady || !input.trim()}
                style={{
                  padding: "6px 10px",
                  background: isReady && input.trim() ? "#528bff" : "#333",
                  border: "none",
                  borderRadius: "3px",
                  color: isReady && input.trim() ? "#fff" : "#555",
                  fontSize: "12px",
                  cursor: isReady && input.trim() ? "pointer" : "default",
                }}
              >
                Send
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
