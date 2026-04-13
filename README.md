# Bookclub

PKNIC-style **book club discovery**: users describe genre, goals, and cadence; the API recommends a club from a **Supabase-backed** catalog. Includes an **Add book club** flow to seed rows.

**Planned extension:** semantic match via **embeddings** and optional **RAG** (see [Roadmap: embeddings & RAG](#roadmap-embeddings--rag)).

---

## Stack

| Layer | Tech |
|--------|------|
| UI | React 18, TypeScript, Vite, Tailwind, React Router |
| API | Python 3.10+, FastAPI, Uvicorn |
| Data | Supabase Postgres (`book_clubs`, `bookclub_users`, `chat_sessions`, `user_profiles`; service role **only** on the server) |

---

## Layout

```
client/          # Vite app — `/` discovery, `/addBookClub` create
server/          # FastAPI — `/api/*`, loads `server/.env`
server/supabase_schema.sql           # Run once (book_clubs)
server/supabase_onboarding_auth.sql  # Run once (users, profiles, chat_sessions)
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

   - Run `server/supabase_schema.sql` in the **SQL Editor** (creates `book_clubs`).
   - Run `server/supabase_onboarding_auth.sql` (creates `bookclub_users`, `user_profiles`, `chat_sessions` for persisted onboarding + email identity).
   - Copy `server/.env.example` → `server/.env` and set `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` (service role — never commit, never expose to the browser).

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
| `npm run dev:backend` | FastAPI on :8000 |
| `npm run dev:react` | Vite on :5173 |
| `npm run build:react` | Production build of `client/` |
| `npm run test:react` | Vitest |
| `npm run test:backend` | pytest |
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
| GET | `/api/onboarding/start/{session_id}` | Start or resume onboarding chat; header **`X-User-Email`** (normalized) required |
| POST | `/api/onboarding/chat` | Body `{ session_id, message }`; same **`X-User-Email`** header |

The web client stores **email** and **onboarding session id** in `localStorage` so chats survive tab close and API restarts until onboarding completes.

**Current matching** (`server/recommendation.py`): combines genre overlap, goal text overlap vs club summary, optional boost if `bookCode` matches a club id. Score: `totalPreference = 0.3 × cadence + 0.5 × genreMatch` vs the chosen club’s genre.

OpenAPI: with the server running, see `/docs`.

---

## Roadmap: embeddings & RAG

This repo is structured so you can add **semantic retrieval** without rewriting the whole stack.

| Direction | Idea |
|-----------|------|
| **Embeddings API** | New route e.g. `POST /api/embeddings/query` or `POST /api/match-semantic`: embed user text + club documents (title, genre, summary), rank by cosine similarity (Supabase **pgvector** or stored vectors). |
| **Data** | Add an `embedding vector` column (or side table) for each club row; refresh on create/update; optional background job for backfill. |
| **RAG (optional)** | Retrieve top‑k club chunks, then **constrained** LLM output (pick `id` from catalog + short rationale). Keep deterministic fallbacks (rule-based or embedding-only). |
| **Eval** | Golden queries + metrics (e.g. recall@k, MRR) in `server/eval/` or CI; compare embedding model / prompt changes. |
| **Secrets** | Embedding provider API keys only in `server/.env` (same pattern as `SUPABASE_*`). |

**Today:** matching is lexical/rule-based. **Next:** swap or blend with embedding scores behind a small service layer so the FastAPI surface stays stable.

---

## License

Use for learning and interviews; adjust license as needed for your org.
