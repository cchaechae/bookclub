import java.time.LocalDate;
import java.time.format.TextStyle;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Objects;

/**
 * Reference port of {@code bookclub_data.py} — same imaginary book clubs and session dates.
 * Not wired to the FastAPI app; use when you swap the backend to Java (e.g. Spring Boot).
 */
public final class bookclub_data {

    private bookclub_data() {}

    public record Book(String title, String summary) {}

    public record Session(int session, String date, String weekday) {}

    public record Bookclub(
            int id,
            String leader,
            String genre,
            Book book,
            List<Session> sessions,
            int sessionCount) {}

    private static final LocalDate YEAR_END_2026 = LocalDate.of(2026, 12, 31);

    /** Four meet-ups per club, staggered across 2026 (Jan–Dec). Mirrors Python {@code _sessions}. */
    public static List<Session> sessions(int clubIndex) {
        LocalDate d0 = LocalDate.of(2026, 1, 8).plusDays(clubIndex % 12);
        int shiftDays = (clubIndex * 3) % 9;
        List<LocalDate> dates = new ArrayList<>(4);
        dates.add(d0.plusDays(shiftDays));
        dates.add(LocalDate.of(2026, 4, 14).plusDays(shiftDays));
        dates.add(LocalDate.of(2026, 7, 22).plusDays(shiftDays));
        dates.add(LocalDate.of(2026, 10, 28).plusDays(shiftDays));

        List<Session> out = new ArrayList<>(4);
        for (int n = 0; n < dates.size(); n++) {
            LocalDate d = dates.get(n);
            if (d.isAfter(YEAR_END_2026)) {
                d = LocalDate.of(2026, 12, 15).minusDays((4 - (n + 1)) * 2L);
            }
            String iso = d.toString();
            String weekday =
                    d.getDayOfWeek().getDisplayName(TextStyle.FULL, Locale.ENGLISH);
            out.add(new Session(n + 1, iso, weekday));
        }
        return List.copyOf(out);
    }

    /** Static leader, genre, and book copy for each club (session dates added in getBookclubs). */
    private static final List<BookclubDefinition> BOOKCLUB_DEFINITIONS =
            List.of(
                    new BookclubDefinition(
                            "Elena Marquez",
                            "Historical fiction",
                            "The Cartographer's Wife",
                            "In 1920s Lisbon, a woman discovers her husband's secret maps chart not "
                                    + "coastlines but escape routes for refugees. A story of love, cartography, "
                                    + "and moral courage when borders harden overnight."),
                    new BookclubDefinition(
                            "Marcus Chen",
                            "Science fiction",
                            "Echoes in the Kepler Silence",
                            "A xenolinguist aboard a failing ark parses a signal that sounds like poetry "
                                    + "but might be a warning—or an invitation. Tight, idea-forward, with the "
                                    + "loneliness of deep time."),
                    new BookclubDefinition(
                            "Priya Nair",
                            "Romance / book club fiction",
                            "Monsoon on Maple Street",
                            "Two rival bookstore owners in Ohio fake a joint event to save rent, then "
                                    + "borrow each other's favorite childhood myths from Kerala and Michigan. Warm, "
                                    + "funny, and unabashedly earnest."),
                    new BookclubDefinition(
                            "James Oduya",
                            "Thriller",
                            "The Last Ledger",
                            "An auditor inherits a client list that doesn't exist on paper—only in cash, "
                                    + "coded receipts, and one name circled twice. Every chapter closes a door you "
                                    + "thought was locked."),
                    new BookclubDefinition(
                            "Sofia Lindström",
                            "Literary fiction",
                            "Winter Bees",
                            "Three siblings return to their mother's apiary after her disappearance, "
                                    + "finding her journals written as letters to the hive. Prose like cold air and "
                                    + "honey: sharp, sweet, and slow to melt."),
                    new BookclubDefinition(
                            "David Kwon",
                            "Memoir / food writing",
                            "Salt at the Table",
                            "Essays on kimchi trials, Thanksgiving mis-translations, and the night the "
                                    + "author's father taught him to fillet a fish by flashlight. Food as family "
                                    + "argument—and reconciliation."),
                    new BookclubDefinition(
                            "Amara Okonkwo",
                            "Fantasy",
                            "The Bone Harp",
                            "In a city built on the ribs of a sleeping god, a street musician learns that "
                                    + "certain melodies wake dreams others paid to bury. Lush world-building with a "
                                    + "propulsive mystery."),
                    new BookclubDefinition(
                            "Rachel Stein",
                            "Mystery",
                            "Murder at the Last Chapter",
                            "A retired librarian hosts true-crime tea—until the podcast host turns up "
                                    + "dead in the stacks. Clues hide in marginalia, due dates, and one forged "
                                    + "library card."),
                    new BookclubDefinition(
                            "Tom Gallagher",
                            "Narrative history",
                            "Empire of Small Things",
                            "How buttons, postage stamps, and standardized clocks quietly reshaped "
                                    + "colonial trade routes. Reads like a detective story about everyday objects."),
                    new BookclubDefinition(
                            "Yuki Tanaka",
                            "Mystery / travel",
                            "Snow Blind in Kyoto",
                            "A translator for a film crew wakes up with someone else's itinerary—and a "
                                    + "photograph of a bridge she's never crossed. Atmospheric, precise, and "
                                    + "strangely funny about jet lag."),
                    new BookclubDefinition(
                            "Nina Petrov",
                            "Contemporary fiction",
                            "Parallel Mothers, Parallel Seas",
                            "Two women share a hospital room and accidentally swap baby blankets; "
                                    + "fifteen years later, their teenagers meet online. A knotty, humane look at "
                                    + "choice, chance, and what we owe strangers."),
                    new BookclubDefinition(
                            "Omar Haddad",
                            "Horror / literary",
                            "The Suburbs That Dream",
                            "Identical houses begin syncing their nightmares. A meditation on debt, "
                                    + "homeownership, and the uncanny sameness of 'good neighborhoods.'"),
                    new BookclubDefinition(
                            "Grace O'Brien",
                            "Young adult",
                            "Chorus Line at Midnight",
                            "The school musical is cursed—unless the understudies rewrite the ending each "
                                    + "night. Big-hearted, theatrical, and about friendship under stage lights."),
                    new BookclubDefinition(
                            "André Silva",
                            "Literary fiction",
                            "Hand Me the River",
                            "A river guide in Patagonia ferries strangers and their secrets downstream. "
                                    + "Each chapter is a different passenger; the river is the only constant."),
                    new BookclubDefinition(
                            "Meera Shah",
                            "South Asian literary fiction",
                            "Mango Season Diplomacy",
                            "A diplomat's daughter smuggles letters inside mango crates during a summer "
                                    + "ceasefire. Family saga meets political thriller with a sweet, sticky center."),
                    new BookclubDefinition(
                            "Frank De Luca",
                            "Crime fiction",
                            "Harbor No Secrets",
                            "Dockworkers, customs agents, and a journalist chase a container that keeps "
                                    + "changing its bill of lading. Gritty port procedural with operatic betrayals."),
                    new BookclubDefinition(
                            "Lin Zhou",
                            "Speculative fiction",
                            "The Memory Tax",
                            "In a near-future city, citizens pay taxes in forgotten minutes—until someone "
                                    + "starts trading them on a black market. Sharp satire with a tender core."),
                    new BookclubDefinition(
                            "Harper Wells",
                            "Women's fiction",
                            "The Bookbinder's Beach House",
                            "Three sisters inherit a falling-down cottage and a client list for bespoke "
                                    + "hand-bound journals. Coastal weather, sibling grudges, and the smell of glue "
                                    + "and salt."),
                    new BookclubDefinition(
                            "Vijay Menon",
                            "Essays / philosophy",
                            "How to Read a Train Schedule",
                            "Linked essays on time, migration, and the ethics of 'arriving on time' across "
                                    + "cultures. Playful footnotes and serious ideas—perfect for slow reading."),
                    new BookclubDefinition(
                            "Camila Reyes",
                            "Historical romance",
                            "Silver Under San Juan",
                            "A telegraph operator and a rum-runner negotiate love during a hurricane "
                                    + "season in 1930s Puerto Rico. Sparky banter, storm sequences, and ballroom "
                                    + "scenes under candlelight."));

    /** Same shape as Python {@code get_bookclubs()}: 20 clubs with ids 1–20. */
    public static List<Bookclub> getBookclubs() {
        List<Bookclub> clubs = new ArrayList<>(BOOKCLUB_DEFINITIONS.size());
        for (int i = 0; i < BOOKCLUB_DEFINITIONS.size(); i++) {
            BookclubDefinition def = BOOKCLUB_DEFINITIONS.get(i);
            Book book = new Book(def.title, def.summary);
            clubs.add(
                    new Bookclub(
                            i + 1,
                            def.leader,
                            def.genre,
                            book,
                            sessions(i),
                            4));
        }
        return List.copyOf(clubs);
    }

    /** One club’s static catalog entry: leader, genre, title, summary (before sessions are attached). */
    private record BookclubDefinition(String leader, String genre, String title, String summary) {
        BookclubDefinition {
            Objects.requireNonNull(leader);
            Objects.requireNonNull(genre);
            Objects.requireNonNull(title);
            Objects.requireNonNull(summary);
        }
    }
}
