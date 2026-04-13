/**
 * Onboarding — chat agent. Session id is persisted in localStorage so a tab
 * close + server restart can resume while status is active.
 */

import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import { useUserIdentity } from "../context/UserIdentity";
import { STORAGE_ONBOARDING_SESSION } from "../lib/storageKeys";
import OnboardingChat from "../components/OnboardingChat";

function readOrCreateSessionId(): string {
  try {
    const existing = localStorage.getItem(STORAGE_ONBOARDING_SESSION);
    if (existing) return existing;
  } catch {
    /* ignore */
  }
  const id = uuidv4();
  try {
    localStorage.setItem(STORAGE_ONBOARDING_SESSION, id);
  } catch {
    /* ignore */
  }
  return id;
}

export default function Onboarding() {
  const navigate = useNavigate();
  const { email, hydrated } = useUserIdentity();
  const [sessionId, setSessionId] = useState<string>(() => readOrCreateSessionId());

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_ONBOARDING_SESSION, sessionId);
    } catch {
      /* ignore */
    }
  }, [sessionId]);

  const onSessionIdChange = useCallback((id: string) => {
    setSessionId(id);
  }, []);

  const handleComplete = useCallback(
    (profileId: string) => {
      try {
        localStorage.removeItem(STORAGE_ONBOARDING_SESSION);
      } catch {
        /* ignore */
      }
      navigate(`/matches?profileId=${profileId}`);
    },
    [navigate],
  );

  if (!hydrated) {
    return (
      <main className="flex min-h-[40vh] items-center justify-center text-stone-500">
        Loading…
      </main>
    );
  }

  if (!email) {
    return (
      <main className="mx-auto max-w-lg px-4 py-12 text-center text-stone-600">
        <p className="text-lg font-medium text-stone-800">Email required</p>
        <p className="mt-2 text-sm">
          Add your email in the bar above so we can save your chat and link your profile to you.
        </p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-lg">
        <div className="mb-6 text-center">
          <h1 className="mb-1 text-2xl font-semibold text-gray-900">Find your book club</h1>
          <p className="text-sm text-gray-500">
            Answer a few questions and we&apos;ll match you with clubs that actually fit.
          </p>
        </div>

        <OnboardingChat
          email={email}
          sessionId={sessionId}
          onSessionIdChange={onSessionIdChange}
          onComplete={handleComplete}
        />

        <p className="mt-4 text-center text-xs text-gray-400">
          Prefer a form?{" "}
          <a href="/" className="underline hover:text-gray-600">
            Use manual search instead
          </a>
        </p>
      </div>
    </main>
  );
}
