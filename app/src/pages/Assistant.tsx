import { useMemo, useState } from "react";
import { trpc } from "@/providers/trpc";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export default function Assistant() {
  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState("llama2");
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState<string | null>(null);

  const chatMutation = trpc.ai.chat.useMutation({
    onSuccess: (data) => {
      setError(null);
      setMessages((current) => [
        ...current,
        { role: "assistant", content: data.response },
      ]);
    },
    onError: (err) => {
      setError(err.message || "AI request failed.");
    },
  });
  const isThinking = chatMutation.status === "pending";

  const history = useMemo(
    () => messages.map((message) => ({ role: message.role, content: message.content })),
    [messages],
  );

  return (
    <main className="p-8 min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <div className="max-w-6xl mx-auto space-y-8">
        <section className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-8 shadow-lg">
          <h1 className="text-3xl font-semibold">Security AI Assistant</h1>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Talk to the AI assistant to generate attack payloads, harden defense configuration, debug scripts, and obtain exact commands for real-world cybersecurity tasks.
          </p>
        </section>

        <section className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 shadow-sm">
          <div className="grid gap-4">
            <label className="text-sm font-medium text-[var(--text-primary)]">Ollama Model</label>
            <input
              value={model}
              onChange={(event) => setModel(event.target.value)}
              className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] p-3 text-[var(--text-primary)] outline-none"
              placeholder="Enter Ollama model name (e.g. llama2, llama3, ggml-vicuna)"
            />
            <label className="text-sm font-medium text-[var(--text-primary)]">Ask Sentinel</label>
            <Textarea
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              rows={6}
              className="bg-[var(--bg-primary)] text-[var(--text-primary)]"
              placeholder="Ask for a scan command, payload fix, defensive config, or exact shell command."
            />
            <div className="flex items-center gap-3 flex-wrap">
              <Button
                onClick={() => {
                  if (!prompt.trim()) return;
                  setMessages((current) => [...current, { role: "user", content: prompt.trim() }]);
                  chatMutation.mutate({ prompt: prompt.trim(), history, model: model.trim() });
                  setPrompt("");
                }}
                disabled={isThinking}
              >
                {isThinking ? "Thinking..." : "Send"}
              </Button>
              <span className="text-xs text-[var(--text-muted)]">
                Supports any Ollama model. Use `OLLA_API_URL` for HTTP access or install the Ollama CLI locally for offline mode.
              </span>
            </div>
            {error ? <div className="text-sm text-[var(--text-danger)]">{error}</div> : null}
          </div>
        </section>

        <section className="grid gap-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`rounded-3xl border p-5 shadow-sm ${
                message.role === "user"
                  ? "border-[var(--border-subtle)] bg-[var(--bg-primary)]"
                  : "border-[var(--accent-yellow)] bg-[var(--bg-surface)]"
              }`}
            >
              <p className="text-sm font-semibold text-[var(--text-primary)]">
                {message.role === "user" ? "You" : "Sentinel"}
              </p>
              <pre className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[var(--text-secondary)]">{message.content}</pre>
            </div>
          ))}
          {messages.length === 0 && (
            <div className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] p-6 text-sm text-[var(--text-muted)]">
              AI conversation history appears here after your first query.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
