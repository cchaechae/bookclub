"""Load and persist book clubs via Supabase (service role on the server only)."""

from __future__ import annotations

import os
from pathlib import Path
from typing import Any

from dotenv import load_dotenv
from postgrest.exceptions import APIError
from supabase import Client, create_client

# Ensure .env is loaded even if this module is imported before main.py (e.g. tests, workers).
load_dotenv(Path(__file__).resolve().parent / ".env")
load_dotenv(Path(__file__).resolve().parent / ".env.local")

_client: Client | None = None


def _env(name: str) -> str | None:
    """Trim whitespace — common copy/paste issue from dashboard."""
    v = os.environ.get(name)
    if v is None:
        return None
    v = v.strip().strip('"').strip("'")
    return v if v else None


def is_configured() -> bool:
    return bool(_env("SUPABASE_URL") and _env("SUPABASE_SERVICE_KEY"))


def get_client() -> Client:
    global _client
    if _client is not None:
        return _client
    url = _env("SUPABASE_URL")
    key = _env("SUPABASE_SERVICE_KEY")
    if not url or not key:
        raise RuntimeError("SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in server/.env")
    _client = create_client(url, key)
    return _client


def row_to_club(row: dict[str, Any]) -> dict[str, Any]:
    """Shape expected by recommendation + list endpoints."""
    cid = str(row["id"])
    return {
        "id": cid,
        "leader": row["leader"],
        "genre": row["genre"],
        "book": {
            "title": row["book_title"],
            "summary": row["book_summary"],
        },
        "sessions": [],
        "session_count": 0,
    }


def list_clubs() -> list[dict[str, Any]]:
    if not is_configured():
        return []
    try:
        res = (
            get_client()
            .table("book_clubs")
            .select("id, leader, genre, book_title, book_summary, created_at")
            .order("created_at", desc=True)
            .execute()
        )
    except APIError as e:
        # PGRST205: table not in schema — APIError exposes .code, not dict in args
        if e.code == "PGRST205":
            return []
        raise
    rows = res.data or []
    return [row_to_club(r) for r in rows]


def insert_club(
    *,
    leader: str,
    genre: str,
    book_title: str,
    book_summary: str,
) -> dict[str, Any]:
    payload = {
        "leader": leader.strip(),
        "genre": genre.strip(),
        "book_title": book_title.strip(),
        "book_summary": book_summary.strip(),
    }
    # postgrest-py: .insert() returns SyncQueryRequestBuilder — no .select(); use
    # default returning=representation so execute() returns inserted row(s) in .data.
    try:
        res = get_client().table("book_clubs").insert(payload).execute()
    except APIError as e:
        if e.code == "PGRST205":
            raise RuntimeError(
                "Table book_clubs not found. Open Supabase → SQL → run server/supabase_schema.sql"
            ) from e
        raise
    if not res.data:
        raise RuntimeError("Supabase insert returned no row")
    return row_to_club(res.data[0])
