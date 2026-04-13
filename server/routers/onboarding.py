"""
FastAPI router for the onboarding quiz agent.
Mount this in server/main.py with:
    from routers.onboarding import router as onboarding_router
    app.include_router(onboarding_router)
"""

from fastapi import APIRouter
from pydantic import BaseModel
from onboarding_agent import chat_turn

router = APIRouter(prefix="/api/onboarding", tags=["onboarding"])

# In-memory session store.
# For production swap with Redis:
#   from redis import Redis
#   r = Redis(host="localhost"); r.set(session_id, json.dumps(history))
_sessions: dict[str, list] = {}


class ChatRequest(BaseModel):
    session_id: str
    message: str


@router.get("/start/{session_id}")
def start_session(session_id: str):
    """
    Initialize a new session and return the agent's opening message.
    Call this when the onboarding UI mounts.
    """
    _sessions[session_id] = []
    result = chat_turn(session_id, _sessions[session_id], "hello")
    return result


@router.post("/chat")
def chat(req: ChatRequest):
    """
    Process one conversational turn.
    Returns { reply, done, profile_id }.
    When done=True, redirect the user to the match results page.
    """
    if req.session_id not in _sessions:
        # Session expired or server restarted — restart gracefully
        _sessions[req.session_id] = []

    history = _sessions[req.session_id]
    result = chat_turn(req.session_id, history, req.message)

    if result["done"]:
        # Clean up session memory once profile is persisted
        del _sessions[req.session_id]

    return result
