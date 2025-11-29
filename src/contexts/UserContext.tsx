// src/contexts/UserContext.tsx
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { refreshRequest } from "../Api";

export type Session = {
  access_token: string;
  refresh_token: string;
  expiration: number; // absolute timestamp in ms
};

export type UserContextType = {
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (s: { access_token: string; refresh_token: string; expiration: number }) => void;
  logout: () => void;
  getAccessToken: () => string | null;
  refreshSession: () => Promise<boolean>;
};

const STORAGE_KEY = "app_session_v1";

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setLoading] = useState(true);

  // -------- Login --------
  const login = (s: { access_token: string; refresh_token: string; expiration: number }) => {
    const normalized: Session = {
      access_token: s.access_token,
      refresh_token: s.refresh_token,
      expiration: Date.now() + s.expiration * 60 * 1000, // minutes → ms
    };

    setSession(normalized);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  };

  // -------- Logout --------
  const logout = () => {
    setSession(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  // -------- Refresh Token --------
  const refreshSession = async (): Promise<boolean> => {
    if (!session) return false;

    try {
      const res = await refreshRequest(session.access_token, session.refresh_token);

      const updated: Session = {
        access_token: res.access_token,
        refresh_token: res.refresh_token ?? session.refresh_token,
        expiration: Date.now() + res.expiration * 60 * 1000,
      };

      setSession(updated);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

      return true;
    } catch {
      logout();
      return false;
    }
  };

  // -------- Access Token Getter --------
  const getAccessToken = () => session?.access_token ?? null;

  // -------- Restore from LocalStorage --------
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: Session = JSON.parse(raw);

        // expired?
        if (parsed.expiration > Date.now()) {
          setSession(parsed);
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }

    setLoading(false);
  }, []);

  const value = useMemo(
    () => ({
      session,
      isLoading,
      isAuthenticated: !!session,
      login,
      logout,
      getAccessToken,
      refreshSession,
    }),
    [session, isLoading]
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within UserProvider");
  return ctx;
}
