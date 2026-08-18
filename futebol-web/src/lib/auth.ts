import type { Role, Session } from "./types";

const TOKEN_KEY = "futebol_token";
const USER_KEY = "futebol_user";
const GUEST_EMAIL = "visitante@futebol.local";

type StoredUser = Omit<Session, "token">;

let guestSession: { token: string; user: StoredUser } | null = null;

function toStoredUser(session: Session): StoredUser {
  return {
    id: session.id,
    name: session.name,
    email: session.email,
    role: session.role,
    playerId: session.playerId ?? null,
    guest: session.guest === true,
  };
}

export function isGuestUser(user: { guest?: boolean; email?: string } | null) {
  if (!user) return false;
  return user.guest === true || user.email === GUEST_EMAIL;
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  if (guestSession?.token) return guestSession.token;
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): StoredUser | null {
  if (typeof window === "undefined") return null;
  if (guestSession) return guestSession.user;

  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    const stored = JSON.parse(raw) as StoredUser;
    if (isGuestUser(stored)) {
      clearSession();
      return null;
    }
    return stored;
  } catch {
    return null;
  }
}

export function saveSession(session: Session) {
  if (session.guest) {
    guestSession = {
      token: session.token,
      user: toStoredUser(session),
    };
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    return;
  }

  guestSession = null;
  localStorage.setItem(TOKEN_KEY, session.token);
  localStorage.setItem(USER_KEY, JSON.stringify(toStoredUser(session)));
}

export function clearSession() {
  guestSession = null;
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function homePath(role: Role) {
  return role === "PLAYER" ? "/eu" : "/players";
}
