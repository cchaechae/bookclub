import { useNavigate } from "react-router-dom";
import { BookclubForm } from "../components/BookclubForm";

export function DiscoveryPage() {
  const navigate = useNavigate();

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-stone-600">
          Need to add a club to the catalog first? Use the tab or the button.
        </p>
        <button
          type="button"
          onClick={() => navigate("/addBookClub")}
          className="shrink-0 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-accent shadow ring-1 ring-accent/40 hover:bg-accentsoft focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          Add book club →
        </button>
      </div>
      <BookclubForm />
    </div>
  );
}
