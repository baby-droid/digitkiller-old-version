import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

const ADMIN_PIN   = "AHMED2005";
const SESSION_KEY = "dk_session";
const API_BASE    = "/api";

export type UserRecord = {
  id: string;
  name: string;
  created: string;
  active: boolean;
  lastLogin: string | null;
};

type Session = {
  type: "admin" | "user";
  userId: string | null;
  userName: string | null;
};

type AuthContextType = {
  session: Session | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  loginAdmin: (pin: string) => boolean;
  loginUser: (id: string) => Promise<boolean>;
  logout: () => void;
  users: UserRecord[];
  generateUserId: (name: string) => Promise<string>;
  revokeUser: (id: string) => Promise<void>;
  restoreUser: (id: string) => Promise<void>;
  refreshUsers: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function generateLocalId(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let id = "DK-";
  for (let i = 0; i < 6; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return id;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(() => {
    try {
      return JSON.parse(sessionStorage.getItem(SESSION_KEY) || "null");
    } catch {
      return null;
    }
  });
  const [users, setUsers] = useState<UserRecord[]>([]);

  useEffect(() => {
    if (session) sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    else sessionStorage.removeItem(SESSION_KEY);
  }, [session]);

  /* ── Fetch user list from server (admin only) ── */
  const refreshUsers = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/users`, {
        headers: { "x-admin-pin": ADMIN_PIN },
      });
      if (res.ok) setUsers(await res.json());
    } catch {
      /* server offline during dev — ignore */
    }
  }, []);

  useEffect(() => {
    if (session?.type === "admin") refreshUsers();
  }, [session, refreshUsers]);

  /* ── Admin PIN login (local, instant) ── */
  const loginAdmin = (pin: string): boolean => {
    if (pin === ADMIN_PIN) {
      setSession({ type: "admin", userId: "ADMIN", userName: "Admin" });
      return true;
    }
    return false;
  };

  /* ── User login — validated against server ── */
  const loginUser = async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE}/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: id.trim().toUpperCase() }),
      });
      if (res.ok) {
        const user = await res.json() as { id: string; name: string };
        setSession({ type: "user", userId: user.id, userName: user.name });
        return true;
      }
    } catch {
      /* network error */
    }
    return false;
  };

  const logout = () => setSession(null);

  /* ── Generate + persist user to server ── */
  const generateUserId = async (name: string): Promise<string> => {
    let id = generateLocalId();
    while (users.find((u) => u.id === id)) id = generateLocalId();

    const res = await fetch(`${API_BASE}/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-pin": ADMIN_PIN,
      },
      body: JSON.stringify({ id, name }),
    });
    if (!res.ok) throw new Error("Failed to create user on server");
    const newUser: UserRecord = await res.json();
    setUsers((prev) => [...prev, newUser]);
    return id;
  };

  /* ── Revoke / restore — server-side ── */
  const revokeUser = async (id: string): Promise<void> => {
    await fetch(`${API_BASE}/users/${id}/revoke`, {
      method: "PATCH",
      headers: { "x-admin-pin": ADMIN_PIN },
    });
    setUsers((prev) => prev.map((u) => u.id === id ? { ...u, active: false } : u));
  };

  const restoreUser = async (id: string): Promise<void> => {
    await fetch(`${API_BASE}/users/${id}/restore`, {
      method: "PATCH",
      headers: { "x-admin-pin": ADMIN_PIN },
    });
    setUsers((prev) => prev.map((u) => u.id === id ? { ...u, active: true } : u));
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        isAuthenticated: !!session,
        isAdmin: session?.type === "admin",
        loginAdmin,
        loginUser,
        logout,
        users,
        generateUserId,
        revokeUser,
        restoreUser,
        refreshUsers,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
