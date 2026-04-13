import { useState } from "react";
import { useUserIdentity } from "../context/UserIdentity";

export function UserIdentityBar() {
  const { email, hydrated, setEmail, clearEmail } = useUserIdentity();
  const [draft, setDraft] = useState("");
  const [editing, setEditing] = useState(false);

  if (!hydrated) return null;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const v = draft.trim();
    if (!v.includes("@")) return;
    setEmail(v);
    setDraft("");
    setEditing(false);
  };

  if (!email || editing) {
    return (
      <form
        onSubmit={submit}
        className="mx-auto mb-6 flex max-w-xl flex-col gap-2 rounded-xl border border-stone-200 bg-stone-50/80 p-4 sm:flex-row sm:items-end"
      >
        <div className="min-w-0 flex-1">
          <label htmlFor="user-email" className="block text-xs font-medium text-stone-600">
            Your email (saved in this browser only)
          </label>
          <input
            id="user-email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="mt-1 w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 outline-none ring-accent/40 focus:ring-2"
          />
        </div>
        <button
          type="submit"
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white shadow-sm ring-2 ring-accent/30"
        >
          Save
        </button>
      </form>
    );
  }

  return (
    <div className="mx-auto mb-4 flex max-w-xl flex-wrap items-center justify-between gap-2 rounded-lg border border-stone-200 bg-white px-4 py-2 text-sm text-stone-700">
      <span>
        Signed in as <span className="font-medium text-stone-900">{email}</span>
      </span>
      <div className="flex gap-2">
        <button
          type="button"
          className="text-accent underline-offset-2 hover:underline"
          onClick={() => {
            setEditing(true);
            setDraft(email);
          }}
        >
          Change
        </button>
        <button
          type="button"
          className="text-stone-500 underline-offset-2 hover:underline"
          onClick={() => clearEmail()}
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
