"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useMemo, useRef, useState } from "react";
import { DEMO_SCENARIOS } from "@/lib/data/mock-data";

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function MessagePart({
  part,
  messageId,
  index,
}: {
  part: UIMessage["parts"][number];
  messageId: string;
  index: number;
}) {
  if (part.type === "text") {
    return (
      <p className="whitespace-pre-wrap text-sm leading-relaxed">{part.text}</p>
    );
  }

  if (part.type === "file" && part.mediaType?.startsWith("image/")) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={part.url}
        alt={part.filename ?? "Attached image"}
        className="mt-2 max-h-56 rounded-lg border border-zinc-700 object-contain"
      />
    );
  }

  if (part.type.startsWith("tool-")) {
    const label = part.type.replace("tool-", "");
    const state = "state" in part ? part.state : "unknown";
    const output =
      "output" in part && part.output ? part.output : undefined;
    return (
      <div
        key={`${messageId}-tool-${index}`}
        className="mt-2 rounded-lg border border-[#7B2CBF]/40 bg-[rgb(123_44_191/0.10)] px-3 py-2 text-xs"
      >
        <div className="flex items-center justify-between">
          <span className="font-medium text-[#C77DFF]">⚙ {label}</span>
          <span className="text-zinc-500">
            {state === "input-available" && "calling…"}
            {state === "output-available" && "done"}
            {state === "output-error" && "error"}
          </span>
        </div>
        {output && (
          <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap break-words rounded bg-black/40 p-2 text-[11px] text-zinc-300">
            {JSON.stringify(output, null, 2)}
          </pre>
        )}
      </div>
    );
  }

  return null;
}

export function ChatApp() {
  const [input, setInput] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
      }),
    [],
  );

  const { messages, sendMessage, status, error, stop } = useChat({ transport });

  const isBusy = status === "streaming" || status === "submitted";

  async function attachFile(file: File) {
    setImageFile(file);
    setImagePreview(await fileToDataUrl(file));
  }

  function clearAttachment() {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const text = input.trim();
    if (!text && !imageFile) return;

    const parts: Array<
      | { type: "text"; text: string }
      | { type: "file"; mediaType: string; url: string; filename?: string }
    > = [];

    if (imageFile && imagePreview) {
      parts.push({
        type: "file",
        mediaType: imageFile.type || "image/png",
        url: imagePreview,
        filename: imageFile.name,
      });
    }
    if (text) parts.push({ type: "text", text });

    sendMessage({ parts });
    setInput("");
    clearAttachment();
  }

  function loadScenario(
    scenarioText: string,
    photoUrl?: string,
  ) {
    if (isBusy) return;
    const parts: Array<
      | { type: "text"; text: string }
      | { type: "file"; mediaType: string; url: string; filename?: string }
    > = [];
    if (photoUrl) {
      parts.push({
        type: "file",
        mediaType: "image/png",
        url: photoUrl,
        filename: "customer-photo.png",
      });
    }
    parts.push({ type: "text", text: scenarioText });
    sendMessage({ parts });
  }

  return (
    <div className="flex min-h-screen flex-col bg-black">
      <header className="border-b border-zinc-800 bg-gradient-to-r from-black via-[#1a0033] to-black">
        <div className="mx-auto flex max-w-5xl flex-col gap-2 px-4 py-5">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#C77DFF]">
            Wayfair × Subconscious · Track 3 — FinOps & CS
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-white">
            Returns Triage Agent
          </h1>
          <p className="text-sm text-zinc-400">
            Reads the complaint. Looks at the photo. Checks the policy. Scores
            fraud risk. Decides refund / replace / escalate. Drafts the reply.
          </p>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-6">
        <div className="mb-4 grid gap-2 sm:grid-cols-2">
          {DEMO_SCENARIOS.map((s, i) => (
            <button
              key={`${s.orderId}-${i}`}
              type="button"
              onClick={() =>
                loadScenario(`Order ${s.orderId}\n\n${s.complaint}`, s.photoUrl)
              }
              disabled={isBusy}
              className="rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-left text-sm transition hover:border-[#C77DFF] hover:bg-[rgb(123_44_191/0.05)] disabled:opacity-40"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wide text-[#C77DFF]">
                  {s.orderId}
                </span>
                {s.photoLabel && (
                  <span className="rounded-full bg-[#C77DFF]/15 px-2 py-0.5 text-[10px] font-medium text-[#C77DFF]">
                    📎 {s.photoLabel}
                  </span>
                )}
              </div>
              <div className="mt-1 font-medium text-zinc-100">{s.title}</div>
              <div className="mt-1 line-clamp-2 text-xs text-zinc-500">
                {s.complaint}
              </div>
            </button>
          ))}
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
          {messages.length === 0 && (
            <div className="flex h-full min-h-[200px] flex-col items-center justify-center text-center text-zinc-500">
              <p className="text-base text-zinc-300">
                Click a scenario above (some include the customer's photo), or
                paste your own.
              </p>
              <p className="mt-2 text-xs">
                Order ID like{" "}
                <code className="rounded bg-zinc-900 px-1 text-zinc-300">
                  WF-88421
                </code>{" "}
                · attach a damage photo with the paperclip.
              </p>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[90%] rounded-2xl px-4 py-3 ${
                  message.role === "user"
                    ? "bg-[#C77DFF] text-black"
                    : "border border-zinc-800 bg-zinc-900 text-zinc-100"
                }`}
              >
                <div
                  className={`mb-1 text-xs font-medium uppercase tracking-wide ${
                    message.role === "user"
                      ? "text-black/60"
                      : "text-[#C77DFF]"
                  }`}
                >
                  {message.role === "user" ? "Complaint" : "Triage Agent"}
                </div>
                {message.parts.map((part, index) => (
                  <MessagePart
                    key={`${message.id}-${index}`}
                    part={part}
                    messageId={message.id}
                    index={index}
                  />
                ))}
              </div>
            </div>
          ))}

          {isBusy && (
            <div className="flex items-center gap-2 text-sm text-zinc-400">
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-[#C77DFF]" />
              Agent is investigating…
            </div>
          )}
        </div>

        {error && (
          <p className="mt-3 rounded-lg border border-red-900/50 bg-red-950/40 px-3 py-2 text-sm text-red-400">
            {error.message}
          </p>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          {imagePreview && (
            <div className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imagePreview}
                alt="preview"
                className="h-12 w-12 rounded object-cover"
              />
              <span className="flex-1 truncate text-xs text-zinc-300">
                {imageFile?.name}
              </span>
              <button
                type="button"
                onClick={clearAttachment}
                className="text-xs text-[#C77DFF] hover:underline"
              >
                Remove
              </button>
            </div>
          )}

          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void attachFile(file);
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm font-medium text-zinc-200 hover:border-[#C77DFF] hover:text-[#C77DFF]"
              title="Attach a damage photo"
            >
              📎
            </button>
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Paste a customer complaint, e.g. 'Order WF-88421 — sofa arrived torn'"
              className="flex-1 rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2 text-sm text-white outline-none placeholder:text-zinc-500 focus:border-[#C77DFF] focus:ring-2 focus:ring-[#C77DFF]/30"
              disabled={isBusy}
            />
            {isBusy ? (
              <button
                type="button"
                onClick={() => stop()}
                className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-200 hover:border-[#C77DFF]"
              >
                Stop
              </button>
            ) : (
              <button
                type="submit"
                disabled={!input.trim() && !imageFile}
                className="rounded-xl bg-[#C77DFF] px-4 py-2 text-sm font-medium text-black hover:bg-[#d294ff] disabled:opacity-40"
              >
                Triage
              </button>
            )}
          </div>
          <p className="mt-2 text-[11px] text-zinc-500">
            Powered by Subconscious TIM-Qwen3.6 · Wayfair mock data ·
            Multimodal damage verification
          </p>
        </form>
      </main>
    </div>
  );
}
