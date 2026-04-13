import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AppTabBar } from "./components/AppTabBar";
import { UserIdentityBar } from "./components/UserIdentityBar";
import { AddBookClubPage } from "./pages/AddBookClubPage";
import { DiscoveryPage } from "./pages/DiscoveryPage";
import { MatchesPage } from "./pages/MatchesPage";
import Onboarding from "./pages/Onboarding";

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen px-4 py-8">
        <UserIdentityBar />
        <AppTabBar />
        <Routes>
          <Route
            path="/"
            element={
              <div id="panel-discovery" role="tabpanel" aria-labelledby="tab-discovery">
                <DiscoveryPage />
              </div>
            }
          />
          <Route
            path="/addBookClub"
            element={
              <div id="panel-add" role="tabpanel" aria-labelledby="tab-add">
                <AddBookClubPage />
              </div>
            }
          />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/matches" element={<MatchesPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
