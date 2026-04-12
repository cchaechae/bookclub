"""Legacy reference data (Java port uses the same copy).

Runtime catalog lives in Supabase (`book_clubs`) via `bookclub_repository.py`.
"""

from __future__ import annotations

from datetime import date, timedelta


def _sessions(club_index: int) -> list[dict[str, str | int]]:
    """Four meet-ups per club, staggered across 2026 (Jan–Dec)."""
    # Stagger first session through January; keep all dates in 2026.
    d0 = date(2026, 1, 8) + timedelta(days=club_index % 12)
    # Roughly quarterly + small per-club shift so calendars don’t look identical.
    shift = timedelta(days=(club_index * 3) % 9)
    dates = [
        d0 + shift,
        date(2026, 4, 14) + shift,
        date(2026, 7, 22) + shift,
        date(2026, 10, 28) + shift,
    ]
    out: list[dict[str, str | int]] = []
    for n, d in enumerate(dates, start=1):
        if d > date(2026, 12, 31):
            d = date(2026, 12, 15) - timedelta(days=(4 - n) * 2)
        out.append(
            {
                "session": n,
                "date": d.isoformat(),
                "weekday": d.strftime("%A"),
            }
        )
    return out


# Static leader + genre + pick for each club (2026 session dates added in get_bookclubs).
_BOOKCLUB_DEFINITIONS: list[dict[str, str]] = [
    {
        "leader": "Elena Marquez",
        "genre": "Historical fiction",
        "title": "The Cartographer’s Wife",
        "summary": (
            "In 1920s Lisbon, a woman discovers her husband’s secret maps chart not "
            "coastlines but escape routes for refugees. A story of love, cartography, "
            "and moral courage when borders harden overnight."
        ),
    },
    {
        "leader": "Marcus Chen",
        "genre": "Science fiction",
        "title": "Echoes in the Kepler Silence",
        "summary": (
            "A xenolinguist aboard a failing ark parses a signal that sounds like poetry "
            "but might be a warning—or an invitation. Tight, idea-forward, with the "
            "loneliness of deep time."
        ),
    },
    {
        "leader": "Priya Nair",
        "genre": "Romance / book club fiction",
        "title": "Monsoon on Maple Street",
        "summary": (
            "Two rival bookstore owners in Ohio fake a joint event to save rent, then "
            "borrow each other’s favorite childhood myths from Kerala and Michigan. Warm, "
            "funny, and unabashedly earnest."
        ),
    },
    {
        "leader": "James Oduya",
        "genre": "Thriller",
        "title": "The Last Ledger",
        "summary": (
            "An auditor inherits a client list that doesn’t exist on paper—only in cash, "
            "coded receipts, and one name circled twice. Every chapter closes a door you "
            "thought was locked."
        ),
    },
    {
        "leader": "Sofia Lindström",
        "genre": "Literary fiction",
        "title": "Winter Bees",
        "summary": (
            "Three siblings return to their mother’s apiary after her disappearance, "
            "finding her journals written as letters to the hive. Prose like cold air and "
            "honey: sharp, sweet, and slow to melt."
        ),
    },
    {
        "leader": "David Kwon",
        "genre": "Memoir / food writing",
        "title": "Salt at the Table",
        "summary": (
            "Essays on kimchi trials, Thanksgiving mis-translations, and the night the "
            "author’s father taught him to fillet a fish by flashlight. Food as family "
            "argument—and reconciliation."
        ),
    },
    {
        "leader": "Amara Okonkwo",
        "genre": "Fantasy",
        "title": "The Bone Harp",
        "summary": (
            "In a city built on the ribs of a sleeping god, a street musician learns that "
            "certain melodies wake dreams others paid to bury. Lush world-building with a "
            "propulsive mystery."
        ),
    },
    {
        "leader": "Rachel Stein",
        "genre": "Mystery",
        "title": "Murder at the Last Chapter",
        "summary": (
            "A retired librarian hosts true-crime tea—until the podcast host turns up "
            "dead in the stacks. Clues hide in marginalia, due dates, and one forged "
            "library card."
        ),
    },
    {
        "leader": "Tom Gallagher",
        "genre": "Narrative history",
        "title": "Empire of Small Things",
        "summary": (
            "How buttons, postage stamps, and standardized clocks quietly reshaped "
            "colonial trade routes. Reads like a detective story about everyday objects."
        ),
    },
    {
        "leader": "Yuki Tanaka",
        "genre": "Mystery / travel",
        "title": "Snow Blind in Kyoto",
        "summary": (
            "A translator for a film crew wakes up with someone else’s itinerary—and a "
            "photograph of a bridge she’s never crossed. Atmospheric, precise, and "
            "strangely funny about jet lag."
        ),
    },
    {
        "leader": "Nina Petrov",
        "genre": "Contemporary fiction",
        "title": "Parallel Mothers, Parallel Seas",
        "summary": (
            "Two women share a hospital room and accidentally swap baby blankets; "
            "fifteen years later, their teenagers meet online. A knotty, humane look at "
            "choice, chance, and what we owe strangers."
        ),
    },
    {
        "leader": "Omar Haddad",
        "genre": "Horror / literary",
        "title": "The Suburbs That Dream",
        "summary": (
            "Identical houses begin syncing their nightmares. A meditation on debt, "
            "homeownership, and the uncanny sameness of ‘good neighborhoods.’"
        ),
    },
    {
        "leader": "Grace O’Brien",
        "genre": "Young adult",
        "title": "Chorus Line at Midnight",
        "summary": (
            "The school musical is cursed—unless the understudies rewrite the ending each "
            "night. Big-hearted, theatrical, and about friendship under stage lights."
        ),
    },
    {
        "leader": "André Silva",
        "genre": "Literary fiction",
        "title": "Hand Me the River",
        "summary": (
            "A river guide in Patagonia ferries strangers and their secrets downstream. "
            "Each chapter is a different passenger; the river is the only constant."
        ),
    },
    {
        "leader": "Meera Shah",
        "genre": "South Asian literary fiction",
        "title": "Mango Season Diplomacy",
        "summary": (
            "A diplomat’s daughter smuggles letters inside mango crates during a summer "
            "ceasefire. Family saga meets political thriller with a sweet, sticky center."
        ),
    },
    {
        "leader": "Frank De Luca",
        "genre": "Crime fiction",
        "title": "Harbor No Secrets",
        "summary": (
            "Dockworkers, customs agents, and a journalist chase a container that keeps "
            "changing its bill of lading. Gritty port procedural with operatic betrayals."
        ),
    },
    {
        "leader": "Lin Zhou",
        "genre": "Speculative fiction",
        "title": "The Memory Tax",
        "summary": (
            "In a near-future city, citizens pay taxes in forgotten minutes—until someone "
            "starts trading them on a black market. Sharp satire with a tender core."
        ),
    },
    {
        "leader": "Harper Wells",
        "genre": "Women’s fiction",
        "title": "The Bookbinder’s Beach House",
        "summary": (
            "Three sisters inherit a falling-down cottage and a client list for bespoke "
            "hand-bound journals. Coastal weather, sibling grudges, and the smell of glue "
            "and salt."
        ),
    },
    {
        "leader": "Vijay Menon",
        "genre": "Essays / philosophy",
        "title": "How to Read a Train Schedule",
        "summary": (
            "Linked essays on time, migration, and the ethics of ‘arriving on time’ across "
            "cultures. Playful footnotes and serious ideas—perfect for slow reading."
        ),
    },
    {
        "leader": "Camila Reyes",
        "genre": "Historical romance",
        "title": "Silver Under San Juan",
        "summary": (
            "A telegraph operator and a rum-runner negotiate love during a hurricane "
            "season in 1930s Puerto Rico. Sparky banter, storm sequences, and ballroom "
            "scenes under candlelight."
        ),
    },
]


def get_bookclubs() -> list[dict[str, object]]:
    clubs: list[dict[str, object]] = []
    for i, definition in enumerate(_BOOKCLUB_DEFINITIONS):
        clubs.append(
            {
                "id": i + 1,
                "leader": definition["leader"],
                "genre": definition["genre"],
                "book": {
                    "title": definition["title"],
                    "summary": definition["summary"],
                },
                "sessions": _sessions(i),
                "session_count": 4,
            }
        )
    return clubs
