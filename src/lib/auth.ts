// Simple client-side auth stub. Replace with real API call when backend is ready.
// Demo credentials: admin / gideon123
const KEY = "gideon_auth_v1";
const DEMO_USER = "admin";
const DEMO_PASS = "gideon123";

export type Session = { username: string; token: string; loginAt: number };

export function login(username: string, password: string): Session | null {
  if (username.trim() === DEMO_USER && password === DEMO_PASS) {
    const s: Session = { username, token: crypto.randomUUID(), loginAt: Date.now() };
    if (typeof window !== "undefined") localStorage.setItem(KEY, JSON.stringify(s));
    return s;
  }
  return null;
}

export function logout() {
  if (typeof window !== "undefined") localStorage.removeItem(KEY);
}

export function getSession(): Session | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

export function isAuthed(): boolean {
  return getSession() !== null;
}
