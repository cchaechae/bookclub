import { useLocation, useNavigate } from "react-router-dom";

const base =
  "rounded-lg px-4 py-2.5 text-sm font-semibold shadow-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2";

export function AppTabBar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isDiscovery = pathname === "/";
  const isAdd = pathname === "/addBookClub";
  const isOnboarding = pathname === "/onboarding";

  return (
    <div
      className="mx-auto mb-8 flex max-w-xl flex-wrap items-center gap-3 border-b border-stone-200 pb-4"
      role="tablist"
      aria-label="Bookclub sections"
    >
      <button
        type="button"
        role="tab"
        id="tab-discovery"
        aria-controls="panel-discovery"
        aria-selected={isDiscovery}
        tabIndex={isDiscovery ? 0 : -1}
        className={`${base} ${
          isDiscovery
            ? "bg-accent text-white ring-2 ring-accent/30"
            : "bg-white text-stone-700 ring-1 ring-stone-200 hover:bg-stone-50"
        }`}
        onClick={() => navigate("/")}
      >
        Discovery
      </button>
      <button
        type="button"
        role="tab"
        id="tab-add"
        aria-controls="panel-add"
        aria-selected={isAdd}
        tabIndex={isAdd ? 0 : -1}
        className={`${base} ${
          isAdd
            ? "bg-accent text-white ring-2 ring-accent/30"
            : "bg-white text-stone-700 ring-1 ring-stone-200 hover:bg-stone-50"
        }`}
        onClick={() => navigate("/addBookClub")}
      >
        Add book club
      </button>
      <button
        type="button"
        className={`${base} ${
          isOnboarding
            ? "bg-accent text-white ring-2 ring-accent/30"
            : "bg-white text-stone-700 ring-1 ring-stone-200 hover:bg-stone-50"
        }`}
        onClick={() => navigate("/onboarding")}
      >
        Chat onboarding
      </button>
    </div>
  );
}
