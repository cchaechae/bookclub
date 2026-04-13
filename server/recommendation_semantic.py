"""
Semantic retrieval for club matching: embed saved profile + discovery form,
score each club document with a 50/50 cosine blend (form-only when no profile).

Falls back to lexical scoring in main.py when OPENAI_API_KEY is missing or the
embedding call fails.
"""

from __future__ import annotations

import os
from math import sqrt
from typing import Any

from openai import OpenAI


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
    b = club["book"]
    return (
        f"leader: {club['leader']}. genre: {club['genre']}. "
        f"book: {b['title']}. summary: {b['summary']}"
    )


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


def pick_best_semantic_rag(
    clubs: list[dict[str, Any]],
    *,
    profile_text: str | None,
    book_genre: str,
    user_goal: str,
    cadence: float,
    book_code: str | None,
) -> tuple[dict[str, Any], float] | None:
    """
    Retrieve via embedding similarity (same model as onboarding).

    When profile_text is non-empty: combined_score = 0.5 * cos(profile, club_doc)
    + 0.5 * cos(form, club_doc). Otherwise: combined_score = cos(form, club_doc).

    Optional boost when book_code matches club id. Returns (club, score) or None
    if OpenAI is unavailable or the request fails.
    """
    key = os.environ.get("OPENAI_API_KEY")
    if not key or not str(key).strip():
        return None

    profile_side = (profile_text or "").strip()
    form_side = form_preferences_text(
        book_genre=book_genre, user_goal=user_goal, cadence=cadence
    )
    docs = [club_document(c) for c in clubs]

    batch: list[str] = []
    has_profile = bool(profile_side)
    if has_profile:
        batch.append(profile_side)
    batch.append(form_side)
    batch.extend(docs)

    try:
        client = OpenAI(api_key=str(key).strip())
        resp = client.embeddings.create(
            model="text-embedding-3-small",
            input=batch,
        )
    except Exception:
        return None

    embs = [d.embedding for d in resp.data]
    idx = 0
    if has_profile:
        emb_profile = embs[idx]
        idx += 1
    else:
        emb_profile = None
    emb_form = embs[idx]
    idx += 1
    emb_clubs = embs[idx:]

    best: dict[str, Any] | None = None
    best_score = -1.0
    for club, ce in zip(clubs, emb_clubs, strict=True):
        s_form = cosine_similarity(emb_form, ce)
        if has_profile and emb_profile is not None:
            s_prof = cosine_similarity(emb_profile, ce)
            base = 0.5 * s_prof + 0.5 * s_form
        else:
            base = s_form
        if book_code is not None and str(book_code).strip() == str(club["id"]):
            base = min(1.0, base + 0.12)
        if base > best_score:
            best_score = base
            best = club

    if best is None:
        return None
    return best, best_score
