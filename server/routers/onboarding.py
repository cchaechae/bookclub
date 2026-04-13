"""
FastAPI router for the onboarding quiz agent.
Persists chat in Supabase `chat_sessions`; requires `X-User-Email` (normalized, from localStorage).
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel

from bookclub_repository import is_configured
from onboarding_agent import chat_turn
from onboarding_repository import (
    get_chat_session,
    history_to_ui_messages,
    insert_chat_session,
    jsonify_chat_messages,
    last_assistant_reply,
    normalize_email,
    save_chat_session,
    upsert_user_by_email,
)

router = APIRouter(prefix="/api/onboarding", tags=["onboarding"])


def get_user_email(x_user_email: str | None = Header(None, alias="X-User-Email")) -> str:
    if not x_user_email or not str(x_user_email).strip():
        raise HTTPException(status_code=401, detail="Missing X-User-Email header.")
    email = normalize_email(str(x_user_email))
    if "@" not in email or len(email) > 254:
        raise HTTPException(status_code=400, detail="Invalid email.")
    return email


class ChatRequest(BaseModel):
    session_id: str
    message: str


@router.get("/start/{session_id}")
def start_session(session_id: str, email: str = Depends(get_user_email)):
    """
    Initialize or resume a session. Client sends stable session id from localStorage.
    If the session row is completed, returns needs_new_session=True (client should mint a new id).
    """
    if not is_configured():
        raise HTTPException(
            status_code=503,
            detail="Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_KEY.",
        )

    user_id = upsert_user_by_email(email)
    row = get_chat_session(session_id, user_id)

    if row and row["status"] == "completed":
        return {"needs_new_session": True}

    msgs = list(row["messages"]) if row else []
    if row and row["status"] == "active" and len(msgs) > 0:
        ui = history_to_ui_messages(msgs)
        return {
            "reply": last_assistant_reply(msgs),
            "done": False,
            "profile_id": None,
            "messages": ui,
            "resumed": True,
        }

    if row is None:
        insert_chat_session(session_id, user_id)

    history: list = []
    result = chat_turn(session_id, history, "hello", user_id=user_id)
    serialized = jsonify_chat_messages(history)
    status = "completed" if result["done"] else "active"
    profile_id = str(result["profile_id"]) if result.get("done") and result.get("profile_id") else None
    save_chat_session(session_id, user_id, serialized, status=status, profile_id=profile_id)
    ui = history_to_ui_messages(serialized)
    return {**result, "messages": ui, "resumed": False}


@router.post("/chat")
def chat(req: ChatRequest, email: str = Depends(get_user_email)):
    if not is_configured():
        raise HTTPException(
            status_code=503,
            detail="Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_KEY.",
        )

    user_id = upsert_user_by_email(email)
    row = get_chat_session(req.session_id, user_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Unknown chat session. Open /onboarding again.")
    if row["status"] == "completed":
        raise HTTPException(status_code=400, detail="This onboarding chat is already completed.")

    history = list(row["messages"] or [])
    result = chat_turn(req.session_id, history, req.message, user_id=user_id)
    serialized = jsonify_chat_messages(history)
    status = "completed" if result["done"] else "active"
    profile_id = str(result["profile_id"]) if result.get("done") and result.get("profile_id") else None
    save_chat_session(req.session_id, user_id, serialized, status=status, profile_id=profile_id)
    return result
