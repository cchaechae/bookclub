# Bookclub

PKNIC-style **book club discovery**: users describe genre, goals, and cadence; the API recommends a club from a **Supabase-backed** catalog. The app also includes **Add book club** to seed the catalog, **chat onboarding** (GPT‑4o) that learns preferences and saves an embeddable profile, and **lightweight identity** so onboarding state survives restarts.

**Planned extension:** richer **semantic match** and optional **RAG** (see [Roadmap: embeddings & RAG](#roadmap-embeddings--rag) and [Enhancing further with AI](#enhancing-further-with-ai)).

---

## Objectives

- **Discovery without a static catalog:** clubs live in Postgres; scoring picks a best match from real rows.
- **Two ways to express taste:** a structured **Discovery** form (genre, goal, cadence) and a **conversational onboarding** flow that ends in a persisted **`user_profiles`** row (with embedding storage for later semantic use).
- **Operational clarity:** FastAPI + React, env-driven Supabase and OpenAI keys, SQL you can run once in the Supabase editor, and scripts for local dev and tests.

---

## What the app does

| Area | Behavior |
|------|----------|
| **Discovery** (`/`) | Form + book combobox backed by `GET /api/books` and `POST /api/recommendations`. Scoring is rule-based (`server/recommendation.py`). |
| **Add book club** (`/addBookClub`) | `POST /api/bookclubs` inserts a row into `book_clubs`. |
| **Chat onboarding** (`/onboarding`) | GPT‑4o asks one question at a time, then calls a tool to save profile + embedding. Chat history is stored in **`chat_sessions`** so **uvicorn reloads** do not wipe conversations. |
| **Identity (demo-grade)** | Email is stored in **`localStorage`** and sent as **`X-User-Email`** on onboarding requests. The API upserts **`bookclub_users`** and ties **`user_profiles.user_id`** to that row. This is not password auth; it is enough to reconnect data to a stable identifier on one browser. |
| **After onboarding** (`/matches`) | Simple confirmation and link back to discovery; **`profileId`** is in the query string for future personalization. |

The top bar collects email (save / change / sign out) and clears the onboarding session id on sign-out so the next visit can mint a fresh chat id when needed.

---

## Stack

| Layer | Tech |
|--------|------|
| UI | React 18, TypeScript, Vite, Tailwind, React Router |
| API | Python 3.10+, FastAPI, Uvicorn |
| LLM | OpenAI (chat + `text-embedding-3-small`); keys only in `server/.env` |
| Data | Supabase Postgres (`book_clubs`, `bookclub_users`, `chat_sessions`, `user_profiles`; service role **only** on the server) |

---

## Layout

```
client/src/                    # Vite app
  App.tsx                      # Routes: /, /addBookClub, /onboarding, /matches
  components/                  # AppTabBar, OnboardingChat, UserIdentityBar, forms, combobox
  context/UserIdentity.tsx     # Email in localStorage + hydration
  pages/                       # Discovery, Add club, Onboarding, Matches
server/
  main.py                      # FastAPI app, CORS, core routes
  routers/onboarding.py        # /api/onboarding/*, Supabase-backed sessions
  onboarding_agent.py          # System prompt, tool save_profile, OpenAI calls
  onboarding_repository.py     # Users, chat_sessions persistence, message JSON helpers
  bookclub_repository.py       # book_clubs CRUD / list
  recommendation.py            # Scoring helpers
  supabase_schema.sql          # Run first: book_clubs
  supabase_onboarding_auth.sql # Run second: users, profiles, chat_sessions (+ idempotent column adds)
```

Legacy reference only (not used at runtime): `server/bookclub_data.py`, `server/bookclub_data.java`.

---

## Setup

1. **Client**

   ```bash
   cd client && npm install
   ```

2. **Server**

   ```bash
   cd server
   python3 -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. **Supabase**

   - Run **`server/supabase_schema.sql`** in the **SQL Editor** first (creates **`book_clubs`**).
   - Run **`server/supabase_onboarding_auth.sql`** second (creates **`bookclub_users`**, **`user_profiles`**, **`chat_sessions`**). Safe to re-run on partially migrated projects thanks to `IF NOT EXISTS` / `ADD COLUMN IF NOT EXISTS` patterns where needed.
   - Copy `server/.env.example` → **`server/.env`** (exact filename) and set:
     - **`SUPABASE_URL`** and **`SUPABASE_SERVICE_KEY`** (service role — never commit, never expose to the browser).
     - **`OPENAI_API_KEY`** (required for onboarding chat and profile embeddings).

4. **Run** (two terminals)

   ```bash
   # API — http://127.0.0.1:8000
   cd server && source .venv/bin/activate && uvicorn main:app --reload --host 127.0.0.1 --port 8000
   ```

   ```bash
   # UI — http://127.0.0.1:5173  (proxies /api → 8000)
   cd client && npm run dev
   ```

Use **http** (not https) for local URLs.

---

## Scripts (repo root)

| Command | Purpose |
|---------|---------|
| `npm run install:all` | `npm install` under `client/` |
| `npm run dev:backend` | FastAPI on :8000 (expects `server/.venv`) |
| `npm run dev:react` | Vite on :5173 |
| `npm run build:react` | Production build of `client/` |
| `npm run test:react` | Vitest |
| `npm run test:backend` | pytest in `server/` |
| `npm run test:all` | Both |

---

## API

Base URL (dev): `http://127.0.0.1:8000`

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/health` | Liveness; includes whether Supabase env vars are set |
| GET | `/api/books?q=` | Book titles for the combobox (`q` optional) |
| POST | `/api/recommendations` | Discovery: body `bookCode?`, `bookGenre`, `userGoal`, `cadence` → best match + `totalPreference` |
| POST | `/api/bookclubs` | Create a club (`leader`, `genre`, `bookTitle`, `bookSummary`) |
| GET | `/api/bookclubs` | List clubs (newest first) |
| GET | `/api/onboarding/start/{session_id}` | Start or **resume** onboarding; header **`X-User-Email`** required. Returns `reply`, optional `messages` for UI hydration, `resumed`, and `needs_new_session` if the stored session was already completed. |
| POST | `/api/onboarding/chat` | Body `{ session_id, message }`; same **`X-User-Email`** header. Returns `reply`, `done`, `profile_id` when the profile tool ran. |

The browser keeps **`bookclub_user_email`** and **`bookclub_onboarding_session_id`** in `localStorage` until onboarding finishes, so a tab close or API restart can resume an **active** session. Completed sessions get `needs_new_session`; the client mints a new UUID and retries start.

**Current matching** (`server/recommendation.py`): genre overlap, goal text overlap vs club summary, optional boost if `bookCode` matches a club id. Score: `totalPreference = 0.3 × cadence + 0.5 × genreMatch` vs the chosen club’s genre.

OpenAPI: with the server running, see **`/docs`**.

---

## Roadmap: embeddings & RAG

This repo is structured so you can add **semantic retrieval** without rewriting the whole stack.

| Direction | Idea |
|-----------|------|
| **Embeddings API** | New route e.g. `POST /api/embeddings/query` or `POST /api/match-semantic`: embed user text + club documents (title, genre, summary), rank by cosine similarity (Supabase **pgvector** or stored vectors). |
| **Data** | Add a vector column (or side table) for each club row; refresh on create/update; optional background job for backfill. **`user_profiles.embedding`** is already stored for onboarding users. |
| **RAG (optional)** | Retrieve top‑k club chunks, then **constrained** LLM output (pick `id` from catalog + short rationale). Keep deterministic fallbacks (rule-based or embedding-only). |
| **Eval** | Golden queries + metrics (e.g. recall@k, MRR) in `server/eval/` or CI; compare embedding model / prompt changes. |
| **Secrets** | Embedding and chat keys only in `server/.env` (same pattern as `SUPABASE_*`). |

**Today:** discovery matching is lexical/rule-based; onboarding already produces vectors for profiles. **Next:** connect profile (and club) vectors in a small service layer so the FastAPI surface stays stable.

---

## Enhancing further with AI

Beyond embeddings and RAG for **matching**, you can deepen the product incrementally:

| Direction | Idea |
|-----------|------|
| **Personalized discovery** | Use `user_profiles` + `profileId` (and future **`book_clubs`** vectors) to re-rank or explain recommendations (“Because you liked slow-burn literary fiction…”). |
| **Grounded answers** | When users ask questions about a club, retrieve only that row (or top‑k) and answer with citations to title, leader, summary — reduces hallucination. |
| **Summarization & memory** | Periodically summarize long `chat_sessions.messages` into a short “preference digest” for cheaper follow-up calls or email digests. |
| **Safety & quality** | Classify or filter user/club text before persistence; log refusal patterns; add lightweight eval sets for onboarding completion and tone. |
| **Multi-step agents** | Separate “intake” vs “match” tools: one agent refines preferences, another only selects `book_clubs.id` from a retrieved set so behavior stays auditable. |
| **Streaming** | Stream assistant tokens to the client for perceived latency; keep the same persistence boundaries (save after full assistant turns to avoid partial JSON in DB). |

The guiding principle: **keep catalog writes and IDs deterministic**, use models for **language and ranking**, and store enough structured + embedding data in Supabase to iterate without reworking the whole app.

---

## License

Use for learning and interviews; adjust license as needed for your org.
