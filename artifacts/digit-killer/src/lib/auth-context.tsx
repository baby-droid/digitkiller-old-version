import { createContext, useContext, useState, useEffect, ReactNode } from "react";

const ADMIN_PIN = "AHMED2005";
const SESSION_KEY = "dk_session";
const USERS_KEY = "dk_users";

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
  loginUser: (id: string) => boolean;
  logout: () => void;
  users: UserRecord[];
  generateUserId: (name: string) => string;
  revokeUser: (id: string) => void;
  restoreUser: (id: string) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function loadUsers(): UserRecord[] {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveUsers(users: UserRecord[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function generateId(): string {
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
  const [users, setUsers] = useState<UserRecord[]>(loadUsers);

  useEffect(() => {
    if (session) sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    else sessionStorage.removeItem(SESSION_KEY);
  }, [session]);

  const loginAdmin = (pin: string): boolean => {
    if (pin === ADMIN_PIN) {
      const s: Session = { type: "admin", userId: "ADMIN", userName: "Admin" };
      setSession(s);
      return true;
    }
    return false;
  };

  const loginUser = (id: string): boolean => {
    const normalizedId = id.trim().toUpperCase();
    const user = users.find((u) => u.id === normalizedId && u.active);
    if (user) {
      const updated = users.map((u) =>
        u.id === normalizedId ? { ...u, lastLogin: new Date().toISOString() } : u
      );
      saveUsers(updated);
      setUsers(updated);
      const s: Session = { type: "user", userId: user.id, userName: user.name };
      setSession(s);
      return true;
    }
    return false;
  };

  const logout = () => setSession(null);

  const generateUserId = (name: string): string => {
    let id = generateId();
    while (users.find((u) => u.id === id)) id = generateId();
    const newUser: UserRecord = {
      id,
      name,
      created: new Date().toISOString(),
      active: true,
      lastLogin: null,
    };
    const updated = [...users, newUser];
    saveUsers(updated);
    setUsers(updated);
    return id;
  };

  const revokeUser = (id: string) => {
    const updated = users.map((u) => (u.id === id ? { ...u, active: false } : u));
    saveUsers(updated);
    setUsers(updated);
  };

  const restoreUser = (id: string) => {
    const updated = users.map((u) => (u.id === id ? { ...u, active: true } : u));
    saveUsers(updated);
    setUsers(updated);
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
