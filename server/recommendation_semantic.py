"""
Semantic retrieval + RAG generation for club matching.

Pipeline:
  1. Embed the user query (profile + discovery form) and all club documents.
    2. Rank clubs by cosine similarity (retrieval step).
      3. Pass the top-k clubs as context to GPT-4o and ask it to generate a
           grounded recommendation with a rationale (generation step).

           Falls back to lexical scoring in main.py when OPENAI_API_KEY is missing or
           any OpenAI call fails.
           """

from __future__ import annotations

import os
from math import sqrt
from typing import Any

from openai import OpenAI

# ---------------------------------------------------------------------------
# Text helpers
# ---------------------------------------------------------------------------

def user_profile_row_to_text(row: dict[str, Any]) -> str:
        """Flatten user_profiles row into one embeddable string (onboarding voice)."""
        genres = row.get("preferred_genres") or []
        if isinstance(genres, list):
                    g = ", ".join(str(x) for x in genres)
else:
        g = str(genres)
        parts = [
            f"genres: {g}",
            f"reading goal: {row.get('reading_goal') or ''}",
            f"meeting cadence: {row.get('cadence') or ''}",
        ]
        ft = (row.get("freetext") or "").strip()
        if ft:
                    parts.append(f"notes: {ft}")
                return ". ".join(parts)


def form_preferences_text(*, book_genre: str, user_goal: str, cadence: float) -> str:
        """Discovery form as one string (the user's current search intent)."""
    return (
                f"current search — genre: {book_genre.strip()}. "
                f"goal: {user_goal.strip()}. "
                f"cadence preference: {cadence}."
    )


def club_document(club: dict[str, Any]) -> str:
        """Render a club as a plain-text document for embedding and RAG context."""
    b = club["book"]
    return (
                f"Club ID: {club['id']}. Leader: {club['leader']}. "
                f"Genre: {club['genre']}. "
                f"Book: {b['title']}. Summary: {b['summary']}"
    )


# ---------------------------------------------------------------------------
# Math
# ---------------------------------------------------------------------------

def cosine_similarity(a: list[float], b: list[float]) -> float:
        if len(a) != len(b) or not a:
                    return 0.0
                dot = 0.0
    na = 0.0
    nb = 0.0
    for x, y in zip(a, b, strict=True):
                dot += x * y
                na += x * x
                nb += y * y
            if na <= 0.0 or nb <= 0.0:
                        return 0.0
                    v = dot / (sqrt(na) * sqrt(nb))
    return max(0.0, min(1.0, v))


# ---------------------------------------------------------------------------
# Step 1 – Retrieval: embed and rank clubs
# ---------------------------------------------------------------------------

def retrieve_top_k_clubs(
        clubs: list[dict[str, Any]],
        *,
        profile_text: str | None,
        book_genre: str,
        user_goal: str,
        cadence: float,
        book_code: str | None,
        top_k: int = 3,
        client: OpenAI,
) -> list[tuple[dict[str, Any], float]]:
        """
            Embed the user query and every club document, then return the top-k clubs
                sorted by descending cosine similarity score.

                    Scoring:
                          - If a saved profile exists: 0.5 * cos(profile, club) + 0.5 * cos(form, club)
                                - Otherwise: cos(form, club)
                                      - Optional +0.12 boost when book_code matches a club id (capped at 1.0).
                                          """
    profile_side = (profile_text or "").strip()
    form_side = form_preferences_text(
                book_genre=book_genre, user_goal=user_goal, cadence=cadence
    )
    docs = [club_document(c) for c in clubs]

    has_profile = bool(profile_side)
    batch: list[str] = []
    if has_profile:
                batch.append(profile_side)
            batch.append(form_side)
    batch.extend(docs)

    resp = client.embeddings.create(model="text-embedding-3-small", input=batch)
    embs = [d.embedding for d in resp.data]

    idx = 0
    if has_profile:
                emb_profile: list[float] | None = embs[idx]
                idx += 1
else:
            emb_profile = None
        emb_form = embs[idx]
    idx += 1
    emb_clubs = embs[idx:]

    scored: list[tuple[dict[str, Any], float]] = []
    for club, ce in zip(clubs, emb_clubs, strict=True):
                s_form = cosine_similarity(emb_form, ce)
                if has_profile and emb_profile is not None:
                                s_prof = cosine_similarity(emb_profile, ce)
                                base = 0.5 * s_prof + 0.5 * s_form
else:
                base = s_form
            if book_code is not None and str(book_code).strip() == str(club["id"]):
                            base = min(1.0, base + 0.12)
                        scored.append((club, base))

    scored.sort(key=lambda t: t[1], reverse=True)
    return scored[:top_k]


# ---------------------------------------------------------------------------
# Step 2 – Generation: ask GPT-4o to recommend from retrieved clubs
# ---------------------------------------------------------------------------

_RAG_SYSTEM_PROMPT = """\
You are a helpful book club recommender assistant.
You will be given a user's reading preferences and a short list of real book clubs
retrieved from a catalog.

Your job:
1. Select the BEST matching club from the retrieved list.
2. Write a short, friendly recommendation (2-4 sentences) explaining why this club
   fits the user — referencing the club's book, genre, and leader by name.
   3. End with the exact club ID on its own line in the format:  CLUB_ID: <id>

   Rules:
   - Only recommend a club that appears in the retrieved list. Do not invent clubs.
   - Do not mention any clubs that were not retrieved.
   - Be specific and warm — the user should feel understood.
   """


def generate_rag_recommendation(
        top_clubs: list[tuple[dict[str, Any], float]],
        *,
        user_preferences: str,
        client: OpenAI,
) -> dict[str, Any]:
        """
            RAG generation step: feed the top-k retrieved clubs + user preferences to
                GPT-4o and return a structured result with the chosen club and the generated
                    rationale text.
                        """
        # Build the context block from retrieved clubs
        context_lines = []
    for rank, (club, score) in enumerate(top_clubs, start=1):
                context_lines.append(f"[{rank}] {club_document(club)} (similarity: {score:.3f})")
            context = "\n".join(context_lines)

    user_message = (
                f"User preferences:\n{user_preferences}\n\n"
                f"Retrieved book clubs:\n{context}\n\n"
                "Please recommend the best club and explain why."
    )

    response = client.chat.completions.create(
                model="gpt-4o",
                messages=[
                                {"role": "system", "content": _RAG_SYSTEM_PROMPT},
                                {"role": "user", "content": user_message},
                ],
                temperature=0.4,
                max_tokens=300,
    )

    generated_text = response.choices[0].message.content or ""

    # Parse the CLUB_ID line the model was instructed to emit
    chosen_club = top_clubs[0][0]  # fallback: highest-ranked retrieval
    for line in generated_text.splitlines():
                line = line.strip()
                if line.upper().startswith("CLUB_ID:"):
                                raw_id = line.split(":", 1)[1].strip()
                                for club, _ in top_clubs:
                                                    if str(club["id"]) == raw_id:
                                                                            chosen_club = club
                                                                            break

                                        # Strip the CLUB_ID line from the user-facing text
                                        display_lines = [
                            l for l in generated_text.splitlines()
                            if not l.strip().upper().startswith("CLUB_ID:")
                                ]
                        rationale = "\n".join(display_lines).strip()

    return {
                "club": chosen_club,
                "rationale": rationale,
                "retrieved_clubs": [c for c, _ in top_clubs],
                "retrieval_scores": [round(s, 4) for _, s in top_clubs],
    }


# ---------------------------------------------------------------------------
# Public entry point – full RAG pipeline
# ---------------------------------------------------------------------------

def pick_best_semantic_rag(
        clubs: list[dict[str, Any]],
        *,
        profile_text: str | None,
        book_genre: str,
        user_goal: str,
        cadence: float,
        book_code: str | None,
        top_k: int = 3,
) -> dict[str, Any] | None:
        """
            Full RAG pipeline: retrieve top-k clubs via embedding similarity, then
                generate a grounded recommendation with GPT-4o.

                    Returns a dict with keys:
                          - club           : the recommended club row
                                - rationale      : GPT-4o's natural-language explanation
                                      - retrieved_clubs: list of top-k clubs considered (for transparency)
                                            - retrieval_scores: cosine similarity scores for each retrieved club

                                                Returns None if OPENAI_API_KEY is missing or any OpenAI call fails
                                                    (caller should fall back to lexical scoring).
                                                        """
    key = os.environ.get("OPENAI_API_KEY")
    if not key or not str(key).strip():
                return None

    try:
                client = OpenAI(api_key=str(key).strip())

        # Step 1 – Retrieve
        top_clubs = retrieve_top_k_clubs(
                        clubs,
                        profile_text=profile_text,
                        book_genre=book_genre,
                        user_goal=user_goal,
                        cadence=cadence,
                        book_code=book_code,
                        top_k=top_k,
                        client=client,
        )

        if not top_clubs:
                        return None

        # Build user preference summary for the generation prompt
        user_pref_parts = [form_preferences_text(
                        book_genre=book_genre, user_goal=user_goal, cadence=cadence
        )]
        if profile_text and profile_text.strip():
                        user_pref_parts.insert(0, f"Saved profile: {profile_text.strip()}")
                    user_preferences = "\n".join(user_pref_parts)

        # Step 2 – Generate
        return generate_rag_recommendation(
                        top_clubs,
                        user_preferences=user_preferences,
                        client=client,
        )

except Exception:
        return None
