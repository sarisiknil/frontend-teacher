// src/contexts/UserContext.tsx
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getUserInfo, logoutRequest, refreshRequest, userLookup } from "../api/Api";
import { configureApiAuth } from "../api/Api";

export type Session = {
  access_token: string;
  refresh_token: string;
  expiration: number;
  identifier: string;
};

export type UserContextType = {
  session: Session | null;
  isLoading: boolean;
  userInfo: UserInfo | null;
  isAuthenticated: boolean;
  login: (s: { access_token: string; refresh_token: string; expiration: number; identifier: string }) => void;
  logout: () => Promise<void>;
  getAccessToken: () => string | null;
  refreshSession: () => Promise<boolean>;
};

export interface UserInfo {
  user_id: string;
  phone_number: string;
  email: string;
  user_type: "TEACHER";
}

const STORAGE_KEY = "app_session_v1";
const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  // ---------------- LOGIN ----------------
  const login = (s: { access_token: string; refresh_token: string; expiration: number; identifier: string }) => {
    const normalized: Session = {
      access_token: s.access_token,
      refresh_token: s.refresh_token,
      expiration: Date.now() + s.expiration * 60 * 1000,
      identifier: s.identifier,
    };

    setSession(normalized);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  };

  // ---------------- LOGOUT ----------------
  const logout = async () => {
    try {
      if (session) {
        await logoutRequest(session.access_token, session.refresh_token);
      }
    } catch (err) {
      console.warn("Logout request failed:", err);
    }
    setSession(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  // ---------------- REFRESH TOKEN ----------------
  const refreshSession = async (): Promise<boolean> => {
    if (!session) return false;

    try {
      const res = await refreshRequest(session.access_token, session.refresh_token);

      const updated: Session = {
        access_token: res.access_token,
        refresh_token: res.refresh_token ?? session.refresh_token,
        expiration: Date.now() + res.expiration * 60 * 1000,
        identifier: session.identifier,
      };

      setSession(updated);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

      return true;
    } catch {
      await logout();
      return false;
    }
  };

  const getAccessToken = () => session?.access_token ?? null;

  // ---------------- RESTORE FROM LOCAL STORAGE ----------------
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);

      if (raw) {
        const parsed: Session = JSON.parse(raw);

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

  // ---------------- LOAD USER INFO ----------------
  useEffect(() => {
    if (!session?.identifier) {
      setUserInfo(null);
      return;
    }
    const safeSession = session;
    async function loadUserInfo() {
      try {
        const lookup = await userLookup(safeSession.identifier, "TEACHER");
        const full = await getUserInfo(lookup.user_id);
        setUserInfo(full);
      } catch (err) {
        console.error("user lookup failed", err);
      }
    }

    loadUserInfo();
  }, [session]);



  useEffect(() => {
    configureApiAuth({
      getAccessToken,
      onUnauthorized: logout,
      refreshSession,
    });
  }, [session]); // re-run when token changes

  // ---------------- CONTEXT VALUE ----------------
  const value = useMemo(
    () => ({
      session,
      userInfo,
      isLoading,
      isAuthenticated: !!session,
      login,
      logout,
      getAccessToken,
      refreshSession,
    }),
    [session, userInfo, isLoading]
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within UserProvider");
  return ctx;
}
