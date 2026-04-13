import { useState, useEffect, useRef } from "react";

// ── Types ────────────────────────────────────────────────────────────────────

type Message = {
  role: "user" | "assistant";
  text: string;
};

type Props = {
  sessionId: string;
  /** Called with the saved profile_id once the agent finishes. */
  onComplete: (profileId: string) => void;
};

// ── Component ────────────────────────────────────────────────────────────────

export default function OnboardingChat({ sessionId, onComplete }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load the agent's opening message when the component mounts
  useEffect(() => {
    setLoading(true);
    fetch(`/api/onboarding/start/${sessionId}`)
      .then((r) => {
        if (!r.ok) throw new Error("Failed to start session");
        return r.json();
      })
      .then((data) => {
        setMessages([{ role: "assistant", text: data.reply }]);
      })
      .catch(() => setError("Could not connect to the server. Is the API running?"))
      .finally(() => setLoading(false));
  }, [sessionId]);

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input after assistant replies
  useEffect(() => {
    if (!loading) inputRef.current?.focus();
  }, [loading]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    setInput("");
    setError(null);
    setMessages((prev) => [...prev, { role: "user", text }]);
    setLoading(true);

    try {
      const res = await fetch("/api/onboarding/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, message: text }),
      });

      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const data = await res.json();

      setMessages((prev) => [...prev, { role: "assistant", text: data.reply }]);

      if (data.done && data.profile_id) {
        // Small delay so user reads the closing message before redirect
        setTimeout(() => onComplete(data.profile_id), 1400);
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-[500px] rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
      {/* Message list */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={[
                "max-w-[78%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed",
                m.role === "user"
                  ? "bg-indigo-600 text-white rounded-br-sm"
                  : "bg-gray-100 text-gray-800 rounded-bl-sm",
              ].join(" ")}
            >
              {m.text}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-400 px-4 py-3 rounded-2xl rounded-bl-sm">
              <span className="inline-flex gap-1">
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
              </span>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <p className="text-center text-xs text-red-500 py-1">{error}</p>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="border-t border-gray-100 px-4 py-3 flex gap-2 bg-gray-50">
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your answer…"
          disabled={loading}
          className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-300 disabled:opacity-50"
        />
        <button
          onClick={send}
          disabled={loading || !input.trim()}
          className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-sm font-medium rounded-xl transition-colors"
        >
          Send
        </button>
      </div>
    </div>
  );
}
