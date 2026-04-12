import { useId, useState, type FormEvent } from "react";
import type { BookOption, RecommendationResponse } from "../lib/api";
import { postRecommendation } from "../lib/api";
import {
  parseCadence,
  validateCadence,
  validateRequired,
} from "../lib/validation";
import { BookSearchCombobox } from "./BookSearchCombobox";

type FieldErrors = {
  bookGenre?: string;
  userGoal?: string;
  cadence?: string;
};

export function BookclubForm() {
  const formId = useId();
  const errSummaryId = `${formId}-errors`;

  const [book, setBook] = useState<BookOption | null>(null);
  const [bookGenre, setBookGenre] = useState("");
  const [userGoal, setUserGoal] = useState("");
  const [cadenceRaw, setCadenceRaw] = useState("");

  const [touched, setTouched] = useState({
    bookGenre: false,
    userGoal: false,
    cadence: false,
  });

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState<RecommendationResponse | null>(null);
  const [pending, setPending] = useState(false);

  function validateAll(): boolean {
    const next: FieldErrors = {};
    const g = validateRequired(bookGenre, "Book genre");
    if (g) next.bookGenre = g;
    const ug = validateRequired(userGoal, "User goal");
    if (ug) next.userGoal = ug;
    const c = validateCadence(cadenceRaw);
    if (c) next.cadence = c;
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    setSuccess(null);
    setTouched({ bookGenre: true, userGoal: true, cadence: true });
    if (!validateAll()) return;
    const cadence = parseCadence(cadenceRaw);
    if (cadence === null) return;

    setPending(true);
    try {
      const res = await postRecommendation({
        bookCode: book?.id ?? null,
        bookGenre: bookGenre.trim(),
        userGoal: userGoal.trim(),
        cadence,
      });
      setSuccess(res);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setPending(false);
    }
  }

  const showGenreErr = touched.bookGenre && fieldErrors.bookGenre;
  const showGoalErr = touched.userGoal && fieldErrors.userGoal;
  const showCadenceErr = touched.cadence && fieldErrors.cadence;
  const hasInlineErrors = Boolean(showGenreErr || showGoalErr || showCadenceErr);

  return (
    <div>
      <header className="mb-8 border-b border-stone-200 pb-6">
        <h1 className="font-serif text-3xl font-semibold text-ink">
          Bookclub discovery
        </h1>
        <p className="mt-2 text-stone-600">
          Tell us your genre, goals, and cadence. We’ll match you with a club from our
          catalog and score the fit.
        </p>
      </header>

      <form
        onSubmit={onSubmit}
        className="space-y-6 rounded-2xl border border-stone-200 bg-paper p-6 shadow-md"
        noValidate
        aria-describedby={hasInlineErrors || submitError ? errSummaryId : undefined}
      >
        {(hasInlineErrors || submitError) && (
          <div
            id={errSummaryId}
            role="alert"
            aria-live="polite"
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900"
          >
            {submitError ? (
              <p>{submitError}</p>
            ) : (
              <ul className="list-inside list-disc">
                {showGenreErr ? <li>{fieldErrors.bookGenre}</li> : null}
                {showGoalErr ? <li>{fieldErrors.userGoal}</li> : null}
                {showCadenceErr ? <li>{fieldErrors.cadence}</li> : null}
              </ul>
            )}
          </div>
        )}

        <BookSearchCombobox
          label="Book search"
          value={book}
          onChange={setBook}
        />

        <div className="flex flex-col gap-1">
          <label htmlFor={`${formId}-genre`} className="text-sm font-medium text-stone-800">
            Book genre <span className="text-red-600">*</span>
          </label>
          <input
            id={`${formId}-genre`}
            name="bookGenre"
            type="text"
            required
            aria-required="true"
            aria-invalid={Boolean(showGenreErr)}
            aria-describedby={showGenreErr ? `${formId}-genre-err` : undefined}
            className="rounded-lg border border-stone-300 bg-white px-3 py-2 shadow-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
            placeholder="e.g. Historical fiction"
            value={bookGenre}
            onBlur={() => setTouched((t) => ({ ...t, bookGenre: true }))}
            onChange={(e) => setBookGenre(e.target.value)}
          />
          {showGenreErr ? (
            <p id={`${formId}-genre-err`} className="text-sm text-red-700" role="alert">
              {fieldErrors.bookGenre}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor={`${formId}-goal`} className="text-sm font-medium text-stone-800">
            User goal <span className="text-red-600">*</span>
          </label>
          <input
            id={`${formId}-goal`}
            name="userGoal"
            type="text"
            required
            aria-required="true"
            aria-invalid={Boolean(showGoalErr)}
            aria-describedby={showGoalErr ? `${formId}-goal-err` : undefined}
            className="rounded-lg border border-stone-300 bg-white px-3 py-2 shadow-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
            placeholder="What kind of club are you looking for?"
            value={userGoal}
            onBlur={() => setTouched((t) => ({ ...t, userGoal: true }))}
            onChange={(e) => setUserGoal(e.target.value)}
          />
          {showGoalErr ? (
            <p id={`${formId}-goal-err`} className="text-sm text-red-700" role="alert">
              {fieldErrors.userGoal}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor={`${formId}-cadence`} className="text-sm font-medium text-stone-800">
            Cadence <span className="text-red-600">*</span>
          </label>
          <input
            id={`${formId}-cadence`}
            name="cadence"
            type="text"
            inputMode="decimal"
            required
            aria-required="true"
            aria-invalid={Boolean(showCadenceErr)}
            aria-describedby={showCadenceErr ? `${formId}-cadence-err` : undefined}
            className="rounded-lg border border-stone-300 bg-white px-3 py-2 shadow-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
            placeholder="e.g. 2 or 1.25"
            value={cadenceRaw}
            onBlur={() => setTouched((t) => ({ ...t, cadence: true }))}
            onChange={(e) => setCadenceRaw(e.target.value)}
          />
          <p className="text-xs text-stone-500">
            Number greater than 0, at most two decimal places.
          </p>
          {showCadenceErr ? (
            <p id={`${formId}-cadence-err`} className="text-sm text-red-700" role="alert">
              {fieldErrors.cadence}
            </p>
          ) : null}
        </div>

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-accent px-4 py-3 font-medium text-white shadow hover:bg-rose-900 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Submitting…" : "Find my book club"}
        </button>
      </form>

      {success ? (
        <section
          className="mt-8 rounded-2xl border border-stone-200 bg-white p-6 shadow-md"
          aria-live="polite"
        >
          <h2 className="font-serif text-xl font-semibold text-ink">Your match</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-stone-500">Leader</dt>
              <dd className="text-right font-medium text-ink">{success.bookLeaderName}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-stone-500">Book</dt>
              <dd className="text-right font-medium text-ink">{success.bookName}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-stone-500">Genre</dt>
              <dd className="text-right text-ink">{success.bookGenre}</dd>
            </div>
            <div className="mt-3 border-t border-stone-100 pt-3">
              <dt className="text-stone-500">Summary</dt>
              <dd className="mt-1 text-ink">{success.bookSummary}</dd>
            </div>
            <div className="flex justify-between gap-4 border-t border-stone-100 pt-3">
              <dt className="text-stone-500">Total preference</dt>
              <dd className="font-mono text-lg font-semibold text-accent">
                {success.totalPreference.toFixed(4)}
              </dd>
            </div>
            <p className="text-xs text-stone-500">
              Formula:{" "}
              <code className="rounded bg-stone-100 px-1">
                0.3 × cadence + 0.5 × genre match
              </code>{" "}
              (genre match vs. this club’s genre).
            </p>
          </dl>
        </section>
      ) : null}
    </div>
  );
}
