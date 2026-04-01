/**
 * Web Worker for browser-based LLM inference using @huggingface/transformers.
 *
 * Messages from main thread → worker:
 *   { type: "load", modelId: string, useGpu: boolean }
 *   { type: "generate", requestId: string, messages: ChatMessage[], systemPrompt?: string }
 *   { type: "abort", requestId: string }
 *
 * Messages from worker → main thread:
 *   { type: "load-progress", modelId: string, status: string, progress?: number }
 *   { type: "load-done", modelId: string }
 *   { type: "load-error", modelId: string, error: string }
 *   { type: "token", requestId: string, token: string }
 *   { type: "generate-done", requestId: string }
 *   { type: "generate-error", requestId: string, error: string }
 */

import { pipeline, TextStreamer } from "@huggingface/transformers";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyPipeline = any;

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

let currentPipeline: AnyPipeline | null = null;
let currentModelId: string | null = null;
let currentUseGpu: boolean | null = null;
const abortControllers = new Map<string, AbortController>();

self.addEventListener("message", async (event: MessageEvent) => {
  const msg = event.data as
    | { type: "load"; modelId: string; useGpu: boolean }
    | { type: "generate"; requestId: string; messages: ChatMessage[]; systemPrompt?: string }
    | { type: "abort"; requestId: string };

  if (msg.type === "load") {
    await handleLoad(msg.modelId, msg.useGpu);
  } else if (msg.type === "generate") {
    await handleGenerate(msg.requestId, msg.messages, msg.systemPrompt);
  } else if (msg.type === "abort") {
    abortControllers.get(msg.requestId)?.abort();
  }
});

function makeProgressCallback(modelId: string) {
  return (info: Record<string, unknown>) => {
    const file = typeof info.file === "string" ? info.file : undefined;
    const status = typeof info.status === "string" ? info.status : "";
    const progress = typeof info.progress === "number" ? info.progress : undefined;
    self.postMessage({
      type: "load-progress",
      modelId,
      status: file ? `Downloading ${file}...` : status,
      progress,
    });
  };
}

async function handleLoad(modelId: string, useGpu: boolean) {
  if (currentModelId === modelId && currentUseGpu === useGpu && currentPipeline) {
    self.postMessage({ type: "load-done", modelId });
    return;
  }

  currentPipeline = null;
  currentModelId = null;
  currentUseGpu = null;

  try {
    if (useGpu) {
      self.postMessage({ type: "load-progress", modelId, status: "Loading model on GPU (WebGPU)..." });
      currentPipeline = await pipeline("text-generation", modelId, {
        dtype: "q4f16",
        device: "webgpu",
        progress_callback: makeProgressCallback(modelId),
      });
    } else {
      self.postMessage({ type: "load-progress", modelId, status: "Loading model on CPU (WASM)..." });
      currentPipeline = await pipeline("text-generation", modelId, {
        dtype: "q4",
        device: "wasm",
        progress_callback: makeProgressCallback(modelId),
      });
    }

    currentModelId = modelId;
    currentUseGpu = useGpu;
    self.postMessage({ type: "load-done", modelId });
  } catch (err) {
    self.postMessage({ type: "load-error", modelId, error: String(err) });
  }
}

async function handleGenerate(
  requestId: string,
  messages: ChatMessage[],
  systemPrompt?: string,
) {
  if (!currentPipeline) {
    self.postMessage({ type: "generate-error", requestId, error: "No model loaded" });
    return;
  }

  const controller = new AbortController();
  abortControllers.set(requestId, controller);

  const fullMessages: ChatMessage[] = systemPrompt
    ? [{ role: "system", content: systemPrompt }, ...messages]
    : messages;

  const streamer = new TextStreamer(currentPipeline.tokenizer, {
    skip_prompt: true,
    callback_function: (token: string) => {
      self.postMessage({ type: "token", requestId, token });
    },
  });

  try {
    await currentPipeline(fullMessages, {
      max_new_tokens: 2048,
      do_sample: true,
      temperature: 0.7,
      streamer,
    });
    self.postMessage({ type: "generate-done", requestId });
  } catch (err) {
    if (controller.signal.aborted) {
      self.postMessage({ type: "generate-done", requestId });
    } else {
      self.postMessage({ type: "generate-error", requestId, error: String(err) });
    }
  } finally {
    abortControllers.delete(requestId);
  }
}
