import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AppTabBar } from "./components/AppTabBar";
import { AddBookClubPage } from "./pages/AddBookClubPage";
import { DiscoveryPage } from "./pages/DiscoveryPage";

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen px-4 py-8">
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
        </Routes>
      </div>
    </BrowserRouter>
  );
}
