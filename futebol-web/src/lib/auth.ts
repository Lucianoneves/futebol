import type { Role, Session } from "./types";

const TOKEN_KEY = "futebol_token";
const USER_KEY = "futebol_user";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): Omit<Session, "token"> | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveSession(session: Session) {
  localStorage.setItem(TOKEN_KEY, session.token);
  localStorage.setItem(
    USER_KEY,
    JSON.stringify({
      id: session.id,
      name: session.name,
      email: session.email,
      role: session.role,
      playerId: session.playerId ?? null,
    })
  );
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function homePath(role: Role) {
  return role === "PLAYER" ? "/eu" : "/players";
}
