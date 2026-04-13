"""Supabase persistence for onboarding users and chat_sessions (survives process restarts)."""

from __future__ import annotations

import json
from datetime import UTC, datetime
from typing import Any

from postgrest.exceptions import APIError

from bookclub_repository import get_client


def normalize_email(raw: str) -> str:
    return raw.strip().lower()


def upsert_user_by_email(email: str) -> str:
    """Return bookclub_users.id; email must be normalized."""
    c = get_client()
    sel = c.table("bookclub_users").select("id").eq("email", email).limit(1).execute()
    if sel.data:
        return str(sel.data[0]["id"])
    try:
        ins = c.table("bookclub_users").insert({"email": email}).execute()
        return str(ins.data[0]["id"])
    except APIError:
        sel2 = c.table("bookclub_users").select("id").eq("email", email).limit(1).execute()
        if sel2.data:
            return str(sel2.data[0]["id"])
        raise


def get_chat_session(session_id: str, user_id: str) -> dict[str, Any] | None:
    c = get_client()
    r = (
        c.table("chat_sessions")
        .select("id, user_id, messages, status, profile_id")
        .eq("id", session_id)
        .eq("user_id", user_id)
        .limit(1)
        .execute()
    )
    if not r.data:
        return None
    row = r.data[0]
    return {
        "id": str(row["id"]),
        "user_id": str(row["user_id"]),
        "messages": row.get("messages") or [],
        "status": row["status"],
        "profile_id": str(row["profile_id"]) if row.get("profile_id") else None,
    }


def insert_chat_session(session_id: str, user_id: str) -> None:
    c = get_client()
    c.table("chat_sessions").insert(
        {
            "id": session_id,
            "user_id": user_id,
            "messages": [],
            "status": "active",
        }
    ).execute()


def save_chat_session(
    session_id: str,
    user_id: str,
    messages: list[dict[str, Any]],
    *,
    status: str = "active",
    profile_id: str | None = None,
) -> None:
    c = get_client()
    payload: dict[str, Any] = {
        "messages": messages,
        "status": status,
        "updated_at": datetime.now(UTC).isoformat(),
    }
    if profile_id is not None:
        payload["profile_id"] = profile_id
    c.table("chat_sessions").update(payload).eq("id", session_id).eq("user_id", user_id).execute()


def jsonify_chat_messages(history: list[Any]) -> list[dict[str, Any]]:
    """Make OpenAI message objects / mixed history JSON-serializable for jsonb."""
    out: list[dict[str, Any]] = []
    for item in history:
        if isinstance(item, dict):
            out.append(item)
        elif hasattr(item, "model_dump"):
            dumped = item.model_dump(mode="json")  # type: ignore[union-attr]
            out.append(dumped)
        else:
            out.append(json.loads(json.dumps(item, default=str)))
    return out


def history_to_ui_messages(history: list[dict[str, Any]]) -> list[dict[str, str]]:
    """Strip tool-call-only assistant turns; map to {role, text} for the React UI."""
    ui: list[dict[str, str]] = []
    for m in history:
        role = m.get("role")
        content = m.get("content")
        if role == "user":
            ui.append({"role": "user", "text": (content or "") if isinstance(content, str) else ""})
        elif role == "assistant":
            text = content if isinstance(content, str) else ""
            if text.strip():
                ui.append({"role": "assistant", "text": text})
    return ui


def last_assistant_reply(history: list[dict[str, Any]]) -> str:
    for m in reversed(history):
        if m.get("role") == "assistant" and isinstance(m.get("content"), str) and m["content"].strip():
            return m["content"]
    return ""
