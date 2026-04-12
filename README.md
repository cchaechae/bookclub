# Bookclub

## PKNIC Full-stack Coding Interview

Welcome to the PKNIC coding interview!

This interview will be conducted as a **pair programming session** with a senior software engineer, either virtually (on-site via video call) or in person at our office. You'll work together to implement the solution, discussing your approach and decisions along the way.

## Challenge Overview

Your task is to build a **recommended bookclub discovery** that allows users to find bookclubs that matches best with customer information, preferences, and taste.

**This repository implements the challenge with React (Vite + TypeScript) and a Python (FastAPI) backend.** The original prompt referenced `pknic-react` + Node; here the API is under `/api/*` on port **8000** (see below).

### Requirements

Build a form with the following fields:

1. **Book Search** (Combobox with search)
   - Implement a searchable combobox/autocomplete component
   - This will be optional field (users can skip this)
   - Fetch books from the backend API: `GET /api/books?q=<search-query>`
   - Display book names in the dropdown
   - Allow user to select a book

2. **Book Genre** (Text input)
   - Required field

3. **User Goal** (Text input)
   - Required field

4. **Cadence** (Number input)
   - Required field
   - Must be greater than 0
   - At most two decimal places

5. **Submit**
   - Send POST request to **`/api/recommendations`** with all form data (discovery match against the Supabase catalog)
   - Handle success/error states appropriately

There is also an **Add book club** tab (`/addBookClub`) that **`POST /api/bookclubs`** to insert a new row in Supabase (same service-role pattern as Givy’s server-side Supabase client — **never** put the service key in frontend code).

## What We're Assessing

Your solution will be evaluated on:

### 1. Component Architecture

- How you break down the form into smaller, reusable components
- Separation of concerns
- Component composition and props design

### 2. Validation

- Form field validation (required fields, value ranges)
- User-friendly error messages
- Validation timing (on blur, on submit, etc.)

### 3. Testing

- **Unit tests** for business logic (especially calculation functions)
- **Interaction tests** using Testing Library and/or Playwright
- Test user workflows (typing, selecting, submitting)
- Extract computation logic from components and unit test it
- You can use Testing Library for component tests, Playwright for E2E, or both!

### 4. Accessibility

- Proper ARIA labels and roles
- Keyboard navigation support
- Screen reader friendly
- Form error announcements

### 5. Semantic HTML

- Use appropriate HTML elements (`<form>`, `<label>`, `<input>`, etc.)
- Proper form structure
- Meaningful element choices

### 6. Styling

- Match the Figma design (it's OK not to use exact colours and font)
- Clean and polished UI
- Use Tailwind CSS utilities effectively or plain CSS

### 7. Problem-Solving Approach

- How you break down the problem into smaller chunks
- Implementation order and priorities
- Code organization and file structure

## Incremental steps

For this challenge, we expect you to implement the form incrementally, testing each step as you go.

- Implement the book search combobox (`GET /api/books`)
- Implement validation (required fields, cadence rules)
- Implement submission (`POST /api/recommendations`) and success UI

## Structure (this repo)

- **`client/`** — React + Vite + TypeScript + Tailwind (`/` discovery, `/addBookClub` create)
- **`server/`** — FastAPI (`main.py`, `bookclub_repository.py`, `recommendation.py`, `supabase_schema.sql`)
- **Catalog data** — stored in **Supabase** (`book_clubs` table). `bookclub_data.py` is kept only as a legacy reference (e.g. Java port), not used at runtime.

## Getting Started

### 1. Install dependencies

```bash
cd client
npm install
```

From the repo root you can also run:

```bash
npm run install:all
```

### 2. Python environment (API on port 8000)

```bash
cd server
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 2b. Supabase

1. In the Supabase SQL editor, run **`server/supabase_schema.sql`** to create `book_clubs`.
2. Copy **`server/.env.example`** → **`server/.env`** and set **`SUPABASE_URL`** and **`SUPABASE_SERVICE_KEY`** (service role — server only).

### 3. Run the backend

In **`server/`** (with venv activated):

```bash
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

Or from the **repo root**:

```bash
npm run dev:backend
```

### 4. Run the React app

In another terminal:

```bash
cd client
npm run dev
```

Or from the **repo root**:

```bash
npm run dev:react
```

Open **`http://127.0.0.1:5173`** (HTTP, not HTTPS). Vite proxies `/api/*` to the FastAPI server.

## Available Commands

From the **repo root**:

```bash
npm run dev:backend    # FastAPI on http://127.0.0.1:8000
npm run dev:react      # Vite on http://127.0.0.1:5173
npm run build:react    # Production build of the client
npm run test:react     # Vitest (client)
npm run test:backend   # pytest (server)
npm run test:all       # Both
```

## Backend API Reference

Base URL in development: **`http://127.0.0.1:8000`**

### 1. Search books (combobox)

```
GET /api/books?q=<search-query>
```

Omit `q` or use an empty query to return the full catalog list.

**Example:**

```bash
curl "http://127.0.0.1:8000/api/books?q=cartographer"
```

**Example response:**

```json
[
  { "id": "550e8400-e29b-41d4-a716-446655440000", "name": "The Cartographer's Wife" }
]
```

Ids are **UUIDs** from Supabase.

### 2. Discovery (recommend a club)

```
POST /api/recommendations
Content-Type: application/json
```

**Request body:**

```json
{
  "bookCode": "550e8400-e29b-41d4-a716-446655440000",
  "bookGenre": "Historical fiction",
  "userGoal": "what kind of book club the user is looking for",
  "cadence": 2
}
```

`bookCode` is optional (omit or `null` if the user did not pick a book). If set, it should match a catalog club `id` (UUID string).

**Response:**

```json
{
  "bookCode": "550e8400-e29b-41d4-a716-446655440000",
  "bookLeaderName": "Elena Marquez",
  "bookName": "The Cartographer's Wife",
  "bookClubName": "The Cartographer's Wife",
  "bookGenre": "Historical fiction",
  "bookSummary": "In 1920s Lisbon, …",
  "userGoal": "what kind of book club the user is looking for",
  "cadence": 2,
  "totalPreference": 1.0
}
```

**Scoring:** `totalPreference = 0.3 * cadence + 0.5 * genreMatch`, where `genreMatch` is how closely the user’s **bookGenre** matches the recommended club’s genre (0–1). The server ranks rows from **`book_clubs`** using **userGoal** against each club’s summary (and boosts if **bookCode** matches that club’s id).

### 3. Create a book club row (admin / demo)

```
POST /api/bookclubs
Content-Type: application/json
```

**Request body:**

```json
{
  "leader": "Elena Marquez",
  "genre": "Historical fiction",
  "bookTitle": "The Cartographer's Wife",
  "bookSummary": "In 1920s Lisbon, …"
}
```

**Response:** `{ "id": "<uuid>", "leader": "...", "genre": "...", "bookTitle": "...", "bookSummary": "..." }`

### 4. List all clubs

```
GET /api/bookclubs
```

Returns `{ "bookclubs": [ ... ] }` from Supabase (newest first).

## Tips for Success

1. **Use TDD**: Write tests first! Start with a failing test, make it pass, then refactor
2. **Extract Logic**: Keep business logic (calculations, validation) separate from components
3. **Test Strategy**:
   - Unit tests for pure functions and business logic
   - Component tests for user interactions
4. **Accessibility**: Consider keyboard navigation and screen readers from the start
5. **Component Breakdown**: Think about reusable components (TextField, NumberField, Combobox, etc.)

Good luck!
