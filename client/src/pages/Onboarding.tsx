/**
 * Onboarding page — full-page wrapper around OnboardingChat.
 *
 * After the agent saves the profile, it navigates to /matches?profileId=<uuid>.
 */

import { useNavigate } from "react-router-dom";
import { useMemo } from "react";
import { v4 as uuidv4 } from "uuid";
import OnboardingChat from "../components/OnboardingChat";

export default function Onboarding() {
  const navigate = useNavigate();

  const sessionId = useMemo(() => uuidv4(), []);

  const handleComplete = (profileId: string) => {
    navigate(`/matches?profileId=${profileId}`);
  };

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-lg">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold text-gray-900 mb-1">
            Find your book club
          </h1>
          <p className="text-sm text-gray-500">
            Answer a few questions and we'll match you with clubs that actually fit.
          </p>
        </div>

        <OnboardingChat sessionId={sessionId} onComplete={handleComplete} />

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
