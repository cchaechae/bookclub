import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { UserIdentityProvider } from "./context/UserIdentity";
import "./index.css";

const root = document.getElementById("root");
if (root) {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <UserIdentityProvider>
        <App />
      </UserIdentityProvider>
    </React.StrictMode>,
  );
}
