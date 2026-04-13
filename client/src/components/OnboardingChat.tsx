import { useEffect, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { STORAGE_ONBOARDING_SESSION } from "../lib/storageKeys";

type Message = {
  role: "user" | "assistant";
  text: string;
};

type Props = {
  email: string;
  sessionId: string;
  onSessionIdChange: (id: string) => void;
  onComplete: (profileId: string) => void;
};

export default function OnboardingChat({
  email,
  sessionId,
  onSessionIdChange,
  onComplete,
}: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    setMessages([]);
    setError(null);
    setLoading(true);

    const headers = { "X-User-Email": email };

    (async () => {
      try {
        const res = await fetch(`/api/onboarding/start/${sessionId}`, { headers });
        if (!res.ok) {
          if (res.status === 401) {
            throw new Error("Missing or invalid email. Add your email above.");
          }
          throw new Error("Failed to start session");
        }
        const data = await res.json();
        if (cancelled) return;

        if (data.needs_new_session) {
          const nid = uuidv4();
          try {
            localStorage.setItem(STORAGE_ONBOARDING_SESSION, nid);
          } catch {
            /* ignore */
          }
          onSessionIdChange(nid);
          return;
        }

        if (Array.isArray(data.messages) && data.messages.length > 0) {
          setMessages(
            data.messages.map((m: { role: string; text: string }) => ({
              role: m.role === "user" ? "user" : "assistant",
              text: String(m.text ?? ""),
            })),
          );
        } else {
          setMessages([{ role: "assistant", text: String(data.reply ?? "") }]);
        }
      } catch {
        if (!cancelled) {
          setError("Could not connect to the server. Is the API running?");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [email, sessionId, onSessionIdChange]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
        headers: {
          "Content-Type": "application/json",
          "X-User-Email": email,
        },
        body: JSON.stringify({ session_id: sessionId, message: text }),
      });

      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const data = await res.json();

      setMessages((prev) => [...prev, { role: "assistant", text: data.reply }]);

      if (data.done && data.profile_id) {
        setTimeout(() => onComplete(data.profile_id), 1400);
      }
    } catch {
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

  return (
    <div className="flex h-[500px] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-5">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={[
                "max-w-[78%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                m.role === "user"
                  ? "rounded-br-sm bg-indigo-600 text-white"
                  : "rounded-bl-sm bg-gray-100 text-gray-800",
              ].join(" ")}
            >
              {m.text}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-bl-sm bg-gray-100 px-4 py-3 text-gray-400">
              <span className="inline-flex gap-1">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400 [animation-delay:0ms]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400 [animation-delay:150ms]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400 [animation-delay:300ms]" />
              </span>
            </div>
          </div>
        )}

        {error && <p className="py-1 text-center text-xs text-red-500">{error}</p>}

        <div ref={bottomRef} />
      </div>

      <div className="flex gap-2 border-t border-gray-100 bg-gray-50 px-4 py-3">
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
          type="button"
          onClick={send}
          disabled={loading || !input.trim()}
          className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-40"
        >
          Send
        </button>
      </div>
    </div>
  );
}
