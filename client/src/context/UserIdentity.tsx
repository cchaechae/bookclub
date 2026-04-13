import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { STORAGE_EMAIL, STORAGE_ONBOARDING_SESSION } from "../lib/storageKeys";

type Ctx = {
  email: string | null;
  hydrated: boolean;
  setEmail: (email: string) => void;
  clearEmail: () => void;
};

const UserIdentityContext = createContext<Ctx | null>(null);

function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

export function UserIdentityProvider({ children }: { children: ReactNode }) {
  const [email, setEmailState] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_EMAIL);
      setEmailState(raw ? normalizeEmail(raw) : null);
    } finally {
      setHydrated(true);
    }
  }, []);

  const setEmail = useCallback((raw: string) => {
    const next = normalizeEmail(raw);
    if (!next.includes("@")) return;
    localStorage.setItem(STORAGE_EMAIL, next);
    setEmailState(next);
  }, []);

  const clearEmail = useCallback(() => {
    localStorage.removeItem(STORAGE_EMAIL);
    localStorage.removeItem(STORAGE_ONBOARDING_SESSION);
    setEmailState(null);
  }, []);

  const value = useMemo(
    () => ({ email, hydrated, setEmail, clearEmail }),
    [email, hydrated, setEmail, clearEmail],
  );

  return (
    <UserIdentityContext.Provider value={value}>{children}</UserIdentityContext.Provider>
  );
}

export function useUserIdentity(): Ctx {
  const ctx = useContext(UserIdentityContext);
  if (!ctx) {
    throw new Error("useUserIdentity must be used within UserIdentityProvider");
  }
  return ctx;
}
