// src/contexts/UserContext.tsx
import { createContext, useContext, useEffect, useMemo, useState, useRef, useCallback } from "react";
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
let refreshPromise: Promise<boolean> | null = null;

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const tokenRef = useRef<string | null>(null);

  // ---------------- LOGIN ----------------
  const login = (s: { access_token: string; refresh_token: string; expiration: number; identifier: string }) => {
    const normalized: Session = {
      access_token: s.access_token,
      refresh_token: s.refresh_token,
      expiration: Date.now() + s.expiration * 60 * 1000,
      identifier: s.identifier,
    };
    tokenRef.current = normalized.access_token;

    setSession(normalized);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  };

  const logout = useCallback(async () => {
    try {
      if (session) {
        await logoutRequest(session.access_token, session.refresh_token);
      }
    } catch (err) {
      console.warn("Logout request failed:", err);
    }
    
    tokenRef.current = null;
    setSession(null);
    localStorage.removeItem(STORAGE_KEY);
  }, [session]);

  const refreshSession = useCallback(async (): Promise<boolean> => {
    if (!tokenRef.current && !session) return false;

    if (refreshPromise) return refreshPromise;

    const refreshExecution = async (): Promise<boolean> => {
      const currentRefreshToken = session?.refresh_token; 
      const currentAccessToken = session?.access_token;

      if (!currentRefreshToken || !currentAccessToken) return false;

      try {
        const res = await refreshRequest(currentAccessToken, currentRefreshToken);

        const updated: Session = {
          access_token: res.access_token,
          refresh_token: res.refresh_token ?? currentRefreshToken,
          expiration: Date.now() + res.expiration * 60 * 1000,
          identifier: session?.identifier || "", 
        };

        tokenRef.current = updated.access_token;

        setSession(updated);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

        return true;
      } catch (err) {
        await logout();
        return false;
      } finally {
        refreshPromise = null;
      }
    };

    refreshPromise = refreshExecution();
    return refreshPromise;
  }, [session, logout]); 

  const getAccessToken = useCallback(() => {
    return tokenRef.current;
  }, []);

  // ---------------- RESTORE FROM LOCAL STORAGE ----------------
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);

      if (raw) {
        const parsed: Session = JSON.parse(raw);
        // Ensure we accept expired tokens so refresh can happen
        if (parsed?.refresh_token) {
          tokenRef.current = parsed.access_token;
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

  // ---------------- CONFIG API AUTH ----------------
  useEffect(() => {
    configureApiAuth({
      getAccessToken,
      onUnauthorized: logout,
      refreshSession,
    });
  }, [getAccessToken, refreshSession, logout]); 

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
    [session, userInfo, isLoading, getAccessToken, refreshSession, logout]
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within UserProvider");
  return ctx;
}