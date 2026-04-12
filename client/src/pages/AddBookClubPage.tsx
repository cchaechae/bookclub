import { useId, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { createBookClub } from "../lib/api";
import { validateRequired } from "../lib/validation";

type Errors = Partial<Record<"leader" | "genre" | "bookTitle" | "bookSummary", string>>;

export function AddBookClubPage() {
  const navigate = useNavigate();
  const id = useId();
  const [leader, setLeader] = useState("");
  const [genre, setGenre] = useState("");
  const [bookTitle, setBookTitle] = useState("");
  const [bookSummary, setBookSummary] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [pending, setPending] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [createdId, setCreatedId] = useState<string | null>(null);

  function validate(): boolean {
    const next: Errors = {};
    const a = validateRequired(leader, "Leader name");
    if (a) next.leader = a;
    const b = validateRequired(genre, "Genre");
    if (b) next.genre = b;
    const c = validateRequired(bookTitle, "Book title");
    if (c) next.bookTitle = c;
    const d = validateRequired(bookSummary, "Book summary");
    if (d) next.bookSummary = d;
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    setCreatedId(null);
    if (!validate()) return;
    setPending(true);
    try {
      const res = await createBookClub({
        leader: leader.trim(),
        genre: genre.trim(),
        bookTitle: bookTitle.trim(),
        bookSummary: bookSummary.trim(),
      });
      setCreatedId(res.id);
      setLeader("");
      setGenre("");
      setBookTitle("");
      setBookSummary("");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Request failed.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="self-start rounded-lg bg-white px-4 py-2 text-sm font-medium text-stone-700 shadow ring-1 ring-stone-200 hover:bg-stone-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          ← Back to discovery
        </button>
      </div>
      <header className="mb-8 border-b border-stone-200 pb-6">
        <h1 className="font-serif text-3xl font-semibold text-ink">Add a book club</h1>
        <p className="mt-2 text-stone-600">
          Create a catalog entry (leader, genre, book title, summary). Discovery uses these
          rows from Supabase — same pattern as Givy&apos;s server-side{" "}
          <code className="rounded bg-stone-100 px-1 text-sm">createClient</code> with the
          service role (never expose the service key in the browser).
        </p>
      </header>

      <form
        onSubmit={onSubmit}
        className="space-y-5 rounded-2xl border border-stone-200 bg-paper p-6 shadow-md"
        noValidate
      >
        {submitError ? (
          <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">
            {submitError}
          </div>
        ) : null}
        {createdId ? (
          <div
            role="status"
            className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900"
          >
            Saved. New club id: <code className="font-mono">{createdId}</code>
          </div>
        ) : null}

        <div className="flex flex-col gap-1">
          <label htmlFor={`${id}-leader`} className="text-sm font-medium text-stone-800">
            Leader name <span className="text-red-600">*</span>
          </label>
          <input
            id={`${id}-leader`}
            name="leader"
            className="rounded-lg border border-stone-300 bg-white px-3 py-2 shadow-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
            value={leader}
            onChange={(e) => setLeader(e.target.value)}
            aria-invalid={Boolean(errors.leader)}
            aria-describedby={errors.leader ? `${id}-leader-err` : undefined}
          />
          {errors.leader ? (
            <p id={`${id}-leader-err`} className="text-sm text-red-700" role="alert">
              {errors.leader}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor={`${id}-genre`} className="text-sm font-medium text-stone-800">
            Book genre <span className="text-red-600">*</span>
          </label>
          <input
            id={`${id}-genre`}
            name="genre"
            className="rounded-lg border border-stone-300 bg-white px-3 py-2 shadow-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
            aria-invalid={Boolean(errors.genre)}
            aria-describedby={errors.genre ? `${id}-genre-err` : undefined}
          />
          {errors.genre ? (
            <p id={`${id}-genre-err`} className="text-sm text-red-700" role="alert">
              {errors.genre}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor={`${id}-title`} className="text-sm font-medium text-stone-800">
            Book title <span className="text-red-600">*</span>
          </label>
          <input
            id={`${id}-title`}
            name="bookTitle"
            className="rounded-lg border border-stone-300 bg-white px-3 py-2 shadow-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
            value={bookTitle}
            onChange={(e) => setBookTitle(e.target.value)}
            aria-invalid={Boolean(errors.bookTitle)}
            aria-describedby={errors.bookTitle ? `${id}-title-err` : undefined}
          />
          {errors.bookTitle ? (
            <p id={`${id}-title-err`} className="text-sm text-red-700" role="alert">
              {errors.bookTitle}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor={`${id}-summary`} className="text-sm font-medium text-stone-800">
            Book summary <span className="text-red-600">*</span>
          </label>
          <textarea
            id={`${id}-summary`}
            name="bookSummary"
            rows={5}
            className="rounded-lg border border-stone-300 bg-white px-3 py-2 shadow-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
            value={bookSummary}
            onChange={(e) => setBookSummary(e.target.value)}
            aria-invalid={Boolean(errors.bookSummary)}
            aria-describedby={errors.bookSummary ? `${id}-summary-err` : undefined}
          />
          {errors.bookSummary ? (
            <p id={`${id}-summary-err`} className="text-sm text-red-700" role="alert">
              {errors.bookSummary}
            </p>
          ) : null}
        </div>

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-accent px-4 py-3 font-medium text-white shadow hover:bg-rose-900 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save book club"}
        </button>
      </form>
    </div>
  );
}
