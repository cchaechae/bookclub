import { Link, useSearchParams } from "react-router-dom";

/**
 * Shown after onboarding saves a profile. The recommendation agent can later
 * use profileId to personalize matches; for now we link back to Discovery.
 */
export function MatchesPage() {
  const [params] = useSearchParams();
  const profileId = params.get("profileId");

  return (
    <main className="mx-auto max-w-lg px-4 py-12 text-center">
      <h1 className="text-2xl font-semibold text-stone-900">You're all set</h1>
      <p className="mt-3 text-stone-600">
        Your reading profile was saved. Continue to discovery to find a club that
        fits your taste.
      </p>
      {profileId && (
        <p className="mt-4 font-mono text-xs text-stone-400 break-all">
          Profile ID: {profileId}
        </p>
      )}
      <Link
        to="/"
        className="mt-8 inline-block rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white shadow-sm ring-2 ring-accent/30"
      >
        Go to discovery
      </Link>
    </main>
  );
}
