"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { clearSession, getStoredUser, getToken, homePath, saveSession } from "@/lib/auth";
import { authApi } from "@/lib/services";
import type { Role, Session } from "@/lib/types";

type AuthUser = Omit<Session, "token">;

type AuthContextValue = {
  user: AuthUser | null;
  ready: boolean;
  isAdmin: boolean;
  isPlayer: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginAsGuest: () => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = getToken();
    const stored = getStoredUser();
    if (token && stored) {
      setUser(stored);
    }
    setReady(true);
  }, []);

  function applySession(session: Session) {
    saveSession(session);
    setUser({
      id: session.id,
      name: session.name,
      email: session.email,
      role: session.role,
      playerId: session.playerId ?? null,
    });
    router.replace(homePath(session.role));
  }

  const login = useCallback(
    async (email: string, password: string) => {
      const session = await authApi.login(email, password);
      applySession(session);
    },
    [router]
  );

  const loginAsGuest = useCallback(async () => {
    const session = await authApi.guest();
    applySession(session);
  }, [router]);

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
    router.replace("/login");
  }, [router]);

  const value = useMemo(
    () => ({
      user,
      ready,
      isAdmin: user?.role === ("ADMIN" as Role),
      isPlayer: user?.role === ("PLAYER" as Role),
      login,
      loginAsGuest,
      logout,
    }),
    [user, ready, login, loginAsGuest, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de AuthProvider");
  }
  return context;
}
