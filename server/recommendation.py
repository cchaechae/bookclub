"""Bookclub matching and total_preference from README: 0.3*cadence + 0.5*genre_score."""

from __future__ import annotations

import re
from typing import Any


def _tokens(s: str) -> set[str]:
    s = s.lower()
    s = re.sub(r"[^\w\s]", " ", s)
    return {w for w in s.split() if w}


def genre_match_score(user_genre: str, club_genre: str) -> float:
    """Scalar in [0, 1] for how well the user's genre text matches a club's genre."""
    u = user_genre.strip().lower()
    c = club_genre.strip().lower()
    if not u or not c:
        return 0.0
    if u == c:
        return 1.0
    if u in c or c in u:
        return 0.9
    tu, tc = _tokens(u), _tokens(c)
    if not tu or not tc:
        return 0.0
    inter = len(tu & tc)
    union = len(tu | tc)
    return inter / union if union else 0.0


def goal_match_score(user_goal: str, club: dict[str, Any]) -> float:
    """Light overlap between user goal and club summary + leader (0–1)."""
    blob = f"{club['leader']} {club['book']['title']} {club['book']['summary']}"
    tg = _tokens(user_goal)
    tb = _tokens(blob)
    if not tg or not tb:
        return 0.0
    inter = len(tg & tb)
    union = len(tg | tb)
    return inter / union if union else 0.0


def total_preference(cadence: float, genre_score: float) -> float:
    """README: total_preference = 0.3*(cadence) + 0.5*(genre)."""
    return 0.3 * cadence + 0.5 * genre_score


def pick_best_club(
    bookclubs: list[dict[str, Any]],
    *,
    book_genre: str,
    user_goal: str,
    book_code: str | None,
) -> dict[str, Any]:
    """Highest-scoring club: genre + goal, with optional boost when book_code matches club id."""
    best: dict[str, Any] | None = None
    best_rank = -1.0
    for club in bookclubs:
        g = genre_match_score(book_genre, club["genre"])
        og = goal_match_score(user_goal, club)
        rank = 0.65 * g + 0.35 * og
        if book_code is not None and book_code.strip() == str(club["id"]):
            rank += 0.5
        if rank > best_rank:
            best_rank = rank
            best = club
    assert best is not None
    return best
