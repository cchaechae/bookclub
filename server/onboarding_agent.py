"""
Onboarding quiz agent — OpenAI GPT-4o, raw API (no LangChain).

Conversation flow:
  1. Agent asks one question at a time to learn the user's reading preferences.
  2. After enough signal (4-5 exchanges), it calls the save_profile tool.
  3. The tool embeds the profile with text-embedding-3-small and saves to Supabase.
  4. Agent returns a closing message; the route sets done=True.
"""

import os
import json
from openai import OpenAI
from supabase import create_client, Client

openai_client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])
supabase: Client = create_client(
    os.environ["SUPABASE_URL"],
    os.environ["SUPABASE_SERVICE_KEY"],
)

# ── System prompt ────────────────────────────────────────────────────────────

SYSTEM_PROMPT = """You are a warm, friendly onboarding assistant for a book club discovery app.
Your job is to learn about the user's reading preferences through natural, flowing conversation.

You need to discover (in any order — let the conversation guide you):
  1. Favorite genres  (e.g. sci-fi, literary fiction, mystery, romance, non-fiction)
  2. Reading goal     (e.g. meet people, deep thematic discussion, casual fun, accountability)
  3. Meeting cadence  (weekly, bi-weekly, or monthly)
  4. Extra tastes or deal-breakers  (anything they mention naturally — "I hate sad endings", "love slow burns")

Rules:
  - Ask ONE question per message. Never list multiple questions.
  - Sound human. React to what they say. If they mention Dune, riff on Dune.
  - After 4-5 good exchanges, once you have enough signal on all four areas, call save_profile.
  - Do NOT tell the user you are saving their profile or calling a tool.
  - End the conversation naturally: "Perfect — I've got a great sense of your taste. Let me find your matches!"
  - If the user's first message is just a greeting, start with:
    "Hey! Let's find you the perfect book club. What kind of books do you usually reach for?"
"""

# ── Tool definition ──────────────────────────────────────────────────────────

TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "save_profile",
            "description": (
                "Save the completed user reading profile to the database. "
                "Call this once you have confidently learned the user's genres, "
                "reading goal, preferred cadence, and any extra preferences."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "preferred_genres": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "Genres the user enjoys, e.g. ['sci-fi', 'literary fiction']",
                    },
                    "reading_goal": {
                        "type": "string",
                        "description": "What they want from a book club, e.g. 'deep thematic discussion'",
                    },
                    "cadence": {
                        "type": "string",
                        "enum": ["weekly", "bi-weekly", "monthly"],
                        "description": "How often they want the club to meet",
                    },
                    "freetext": {
                        "type": "string",
                        "description": "Any extra tastes or deal-breakers mentioned in conversation",
                    },
                },
                "required": ["preferred_genres", "reading_goal", "cadence"],
            },
        },
    }
]

# ── Core agent function ──────────────────────────────────────────────────────

def chat_turn(session_id: str, history: list[dict], user_message: str) -> dict:
    """
    Process one conversational turn.

    Args:
        session_id: Unique ID for this user session.
        history:    List of {"role": ..., "content": ...} dicts (mutated in place).
        user_message: The user's latest message.

    Returns:
        {
            "reply":      str,        # agent's response text
            "done":       bool,       # True once profile is saved
            "profile_id": str | None  # Supabase row ID once saved
        }
    """
    history.append({"role": "user", "content": user_message})

    response = openai_client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "system", "content": SYSTEM_PROMPT}] + history,
        tools=TOOLS,
        tool_choice="auto",
        temperature=0.7,
    )

    message = response.choices[0].message

    # ── Tool call branch ─────────────────────────────────────────────────────
    if message.tool_calls:
        tool_call = message.tool_calls[0]
        profile_data = json.loads(tool_call.function.arguments)
        profile_id = _save_profile(session_id, profile_data)

        # Append the assistant's tool-call message, then the tool result
        history.append(message)
        history.append({
            "role": "tool",
            "tool_call_id": tool_call.id,
            "content": "Profile saved successfully.",
        })

        # One more LLM call to get the natural closing message
        closing = openai_client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "system", "content": SYSTEM_PROMPT}] + history,
            temperature=0.7,
        )
        reply_text = closing.choices[0].message.content
        history.append({"role": "assistant", "content": reply_text})

        return {"reply": reply_text, "done": True, "profile_id": profile_id}

    # ── Normal reply branch ──────────────────────────────────────────────────
    reply_text = message.content
    history.append({"role": "assistant", "content": reply_text})

    return {"reply": reply_text, "done": False, "profile_id": None}


# ── Private helpers ──────────────────────────────────────────────────────────

def _build_profile_string(profile: dict) -> str:
    """Concatenate profile fields into a single embeddable string."""
    genres = ", ".join(profile.get("preferred_genres", []))
    goal = profile.get("reading_goal", "")
    cadence = profile.get("cadence", "")
    freetext = profile.get("freetext", "")
    return (
        f"genres: {genres}. "
        f"goal: {goal}. "
        f"cadence: {cadence}."
        + (f" notes: {freetext}" if freetext else "")
    )


def _embed(text: str) -> list[float]:
    """Embed a string using OpenAI text-embedding-3-small (1536-dim)."""
    response = openai_client.embeddings.create(
        model="text-embedding-3-small",
        input=text,
    )
    return response.data[0].embedding


def _save_profile(session_id: str, profile: dict) -> str:
    """Embed the profile and insert into Supabase user_profiles table."""
    profile_text = _build_profile_string(profile)
    embedding = _embed(profile_text)

    result = supabase.table("user_profiles").insert({
        "session_id": session_id,
        "preferred_genres": profile.get("preferred_genres", []),
        "reading_goal": profile.get("reading_goal", ""),
        "cadence": profile.get("cadence", ""),
        "freetext": profile.get("freetext", ""),
        "embedding": embedding,
    }).execute()

    return result.data[0]["id"]
