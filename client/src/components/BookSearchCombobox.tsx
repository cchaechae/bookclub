import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { BookOption } from "../lib/api";
import { fetchBooks } from "../lib/api";

type Props = {
  label: string;
  value: BookOption | null;
  onChange: (next: BookOption | null) => void;
};

const DEBOUNCE_MS = 300;

export function BookSearchCombobox({ label, value, onChange }: Props) {
  const baseId = useId();
  const listId = `${baseId}-listbox`;
  const inputId = `${baseId}-input`;

  const [query, setQuery] = useState(value?.name ?? "");
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<BookOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setQuery(value?.name ?? "");
  }, [value?.id, value?.name]);

  const runSearch = useCallback(async (q: string) => {
    setLoading(true);
    try {
      const data = await fetchBooks(q);
      setResults(data);
      setHighlight(0);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (value) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      void runSearch(query);
    }, DEBOUNCE_MS);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [query, value, runSearch]);

  const showList = open && !value && (results.length > 0 || loading);

  function selectBook(opt: BookOption) {
    onChange(opt);
    setQuery(opt.name);
    setOpen(false);
  }

  function clearSelection() {
    onChange(null);
    setQuery("");
    setOpen(true);
    void runSearch("");
  }

  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-stone-800" htmlFor={inputId}>
        {label}
        <span className="ml-1 font-normal text-stone-500">(optional)</span>
      </label>
      <div className="relative">
        <input
          id={inputId}
          type="text"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={showList}
          aria-controls={listId}
          aria-activedescendant={
            showList && results[highlight]
              ? `${listId}-opt-${results[highlight].id}`
              : undefined
          }
          autoComplete="off"
          className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-stone-900 shadow-sm outline-none ring-accent focus:border-accent focus:ring-2 focus:ring-accent/30"
          placeholder="Search by book title…"
          value={value ? value.name : query}
          onChange={(e) => {
            const v = e.target.value;
            if (value) onChange(null);
            setQuery(v);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            window.setTimeout(() => setOpen(false), 150);
          }}
          onKeyDown={(e) => {
            if (!showList || results.length === 0) return;
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setHighlight((h) => Math.min(h + 1, results.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setHighlight((h) => Math.max(h - 1, 0));
            } else if (e.key === "Enter") {
              e.preventDefault();
              selectBook(results[highlight]);
            } else if (e.key === "Escape") {
              setOpen(false);
            }
          }}
        />
        {value ? (
          <button
            type="button"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded px-2 py-1 text-xs text-accent underline"
            onMouseDown={(e) => e.preventDefault()}
            onClick={clearSelection}
          >
            Clear
          </button>
        ) : null}
        {showList ? (
          <ul
            id={listId}
            role="listbox"
            className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-stone-200 bg-paper py-1 shadow-lg"
          >
            {loading ? (
              <li className="px-3 py-2 text-sm text-muted">Searching…</li>
            ) : (
              results.map((opt, i) => (
                <li
                  key={opt.id}
                  id={`${listId}-opt-${opt.id}`}
                  role="option"
                  aria-selected={i === highlight}
                  className={`cursor-pointer px-3 py-2 text-sm ${
                    i === highlight ? "bg-accentsoft text-accent" : "text-ink"
                  }`}
                  onMouseDown={(e) => e.preventDefault()}
                  onMouseEnter={() => setHighlight(i)}
                  onClick={() => selectBook(opt)}
                >
                  {opt.name}
                </li>
              ))
            )}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
