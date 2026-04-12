"""Bookclub API — JSON under /api/*. Supabase for persisted clubs; recommendations use DB rows."""

from __future__ import annotations

from decimal import Decimal
from pathlib import Path

from dotenv import load_dotenv

# Load from server/ only — filename must be `.env` (not `.env.example`).
_server_dir = Path(__file__).resolve().parent
load_dotenv(_server_dir / ".env")
load_dotenv(_server_dir / ".env.local")  # optional override for local dev

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator

from bookclub_repository import insert_club, is_configured, list_clubs
from recommendation import genre_match_score, pick_best_club, total_preference

app = FastAPI(title="Bookclub API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
async def health() -> dict[str, bool | str]:
    return {"ok": True, "supabase": "configured" if is_configured() else "missing_env"}


@app.get("/api/books")
async def search_books(
    q: str | None = Query(default=None, description="Search query (title)"),
) -> list[dict[str, str]]:
    """Books for combobox — titles from Supabase `book_clubs`."""
    clubs = list_clubs()
    rows: list[dict[str, str]] = []
    for c in clubs:
        title = str(c["book"]["title"])
        cid = str(c["id"])
        rows.append({"id": cid, "name": title})
    if not q or not q.strip():
        return rows
    needle = q.strip().lower()
    return [r for r in rows if needle in r["name"].lower()]


class RecommendationBody(BaseModel):
    """POST /api/recommendations — PKNIC discovery form (match against DB catalog)."""

    bookCode: str | None = None
    bookGenre: str = Field(min_length=1)
    userGoal: str = Field(min_length=1)
    cadence: float = Field(gt=0)

    @field_validator("cadence")
    @classmethod
    def cadence_at_most_two_decimals(cls, v: float) -> float:
        d = Decimal(str(v))
        exp = d.as_tuple().exponent
        if isinstance(exp, int) and exp < -2:
            raise ValueError("Cadence must have at most two decimal places")
        return float(d)


class RecommendationResponse(BaseModel):
    bookCode: str | None
    bookLeaderName: str
    bookName: str
    bookClubName: str
    bookGenre: str
    bookSummary: str
    userGoal: str
    cadence: float
    totalPreference: float


@app.post("/api/recommendations", response_model=RecommendationResponse)
async def recommend(body: RecommendationBody) -> RecommendationResponse:
    """Score and return best-matching club from Supabase-backed catalog."""
    if not is_configured():
        raise HTTPException(
            status_code=503,
            detail="Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_KEY.",
        )
    clubs = list_clubs()
    if not clubs:
        raise HTTPException(
            status_code=400,
            detail="No book clubs yet. Add at least one on the Add book club page.",
        )
    best = pick_best_club(
        clubs,
        book_genre=body.bookGenre,
        user_goal=body.userGoal,
        book_code=body.bookCode,
    )
    g = genre_match_score(body.bookGenre, best["genre"])
    tp = total_preference(body.cadence, g)
    title = str(best["book"]["title"])
    leader = str(best["leader"])
    return RecommendationResponse(
        bookCode=body.bookCode,
        bookLeaderName=leader,
        bookName=title,
        bookClubName=title,
        bookGenre=str(best["genre"]),
        bookSummary=str(best["book"]["summary"]),
        userGoal=body.userGoal,
        cadence=body.cadence,
        totalPreference=round(tp, 4),
    )


class BookClubCreateBody(BaseModel):
    """POST /api/bookclubs — persist a new club (admin / demo)."""

    leader: str = Field(min_length=1)
    genre: str = Field(min_length=1)
    bookTitle: str = Field(min_length=1)
    bookSummary: str = Field(min_length=1)


class BookClubCreatedResponse(BaseModel):
    id: str
    leader: str
    genre: str
    bookTitle: str
    bookSummary: str


@app.post("/api/bookclubs", response_model=BookClubCreatedResponse)
async def create_bookclub_row(body: BookClubCreateBody) -> BookClubCreatedResponse:
    """Insert a new book club row in Supabase."""
    if not is_configured():
        raise HTTPException(
            status_code=503,
            detail="Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_KEY.",
        )
    try:
        row = insert_club(
            leader=body.leader,
            genre=body.genre,
            book_title=body.bookTitle,
            book_summary=body.bookSummary,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e
    return BookClubCreatedResponse(
        id=str(row["id"]),
        leader=str(row["leader"]),
        genre=str(row["genre"]),
        bookTitle=str(row["book"]["title"]),
        bookSummary=str(row["book"]["summary"]),
    )


@app.get("/api/bookclubs")
async def list_bookclubs() -> dict[str, list[dict[str, object]]]:
    """All clubs from Supabase (newest first)."""
    if not is_configured():
        return {"bookclubs": []}
    return {"bookclubs": list_clubs()}
