export type BookOption = { id: string; name: string };

export type RecommendationPayload = {
  bookCode: string | null;
  bookGenre: string;
  userGoal: string;
  cadence: number;
};

export type RecommendationResponse = {
  bookCode: string | null;
  bookLeaderName: string;
  bookName: string;
  bookClubName: string;
  bookGenre: string;
  bookSummary: string;
  userGoal: string;
  cadence: number;
  totalPreference: number;
};

export type CreateBookClubPayload = {
  leader: string;
  genre: string;
  bookTitle: string;
  bookSummary: string;
};

export type CreateBookClubResponse = {
  id: string;
  leader: string;
  genre: string;
  bookTitle: string;
  bookSummary: string;
};

export async function fetchBooks(q: string): Promise<BookOption[]> {
  const params = new URLSearchParams();
  if (q.trim()) params.set("q", q.trim());
  const res = await fetch(`/api/books?${params.toString()}`);
  if (!res.ok) throw new Error(`Books search failed (${res.status})`);
  return (await res.json()) as BookOption[];
}

export async function postRecommendation(
  body: RecommendationPayload,
): Promise<RecommendationResponse> {
  const res = await fetch("/api/recommendations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) {
    let detail = text;
    try {
      const j = JSON.parse(text) as { detail?: unknown };
      if (j.detail) detail = JSON.stringify(j.detail);
    } catch {
      /* use raw */
    }
    throw new Error(detail || `Request failed (${res.status})`);
  }
  return JSON.parse(text) as RecommendationResponse;
}

export async function createBookClub(
  body: CreateBookClubPayload,
): Promise<CreateBookClubResponse> {
  const res = await fetch("/api/bookclubs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) {
    let detail = text;
    try {
      const j = JSON.parse(text) as { detail?: unknown };
      if (j.detail) detail = JSON.stringify(j.detail);
    } catch {
      /* use raw */
    }
    throw new Error(detail || `Request failed (${res.status})`);
  }
  return JSON.parse(text) as CreateBookClubResponse;
}
