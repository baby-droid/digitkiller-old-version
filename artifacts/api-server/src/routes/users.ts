import { Router } from "express";
import fs from "fs";
import path from "path";

const ADMIN_PIN = "AHMED2005";
const DATA_DIR  = path.join(process.cwd(), "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");

type UserRecord = {
  id: string;
  name: string;
  created: string;
  active: boolean;
  lastLogin: string | null;
};

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function loadUsers(): UserRecord[] {
  try {
    ensureDir();
    if (!fs.existsSync(USERS_FILE)) return [];
    return JSON.parse(fs.readFileSync(USERS_FILE, "utf-8")) as UserRecord[];
  } catch {
    return [];
  }
}

function saveUsers(users: UserRecord[]) {
  ensureDir();
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");
}

const router = Router();

/* GET /api/users — admin only */
router.get("/users", (req, res) => {
  if (req.headers["x-admin-pin"] !== ADMIN_PIN) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  res.json(loadUsers());
});

/* POST /api/users — create a user (admin only) */
router.post("/users", (req, res) => {
  if (req.headers["x-admin-pin"] !== ADMIN_PIN) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  const { id, name } = req.body as { id?: string; name?: string };
  if (!id || !name) {
    res.status(400).json({ error: "id and name are required" });
    return;
  }
  const users = loadUsers();
  if (users.find((u) => u.id === id)) {
    res.status(409).json({ error: "User ID already exists" });
    return;
  }
  const newUser: UserRecord = {
    id,
    name,
    created: new Date().toISOString(),
    active: true,
    lastLogin: null,
  };
  users.push(newUser);
  saveUsers(users);
  res.json(newUser);
});

/* POST /api/users/login — validate user ID (public) */
router.post("/users/login", (req, res) => {
  const { id } = req.body as { id?: string };
  if (!id) {
    res.status(400).json({ error: "id is required" });
    return;
  }
  const normalised = id.trim().toUpperCase();
  const users = loadUsers();
  const user  = users.find((u) => u.id === normalised && u.active);
  if (!user) {
    res.status(401).json({ error: "Invalid or revoked User ID" });
    return;
  }
  const updated = users.map((u) =>
    u.id === normalised ? { ...u, lastLogin: new Date().toISOString() } : u
  );
  saveUsers(updated);
  res.json({ id: user.id, name: user.name });
});

/* PATCH /api/users/:id/revoke — admin only */
router.patch("/users/:id/revoke", (req, res) => {
  if (req.headers["x-admin-pin"] !== ADMIN_PIN) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  const users   = loadUsers();
  const updated = users.map((u) =>
    u.id === req.params["id"] ? { ...u, active: false } : u
  );
  saveUsers(updated);
  res.json({ ok: true });
});

/* PATCH /api/users/:id/restore — admin only */
router.patch("/users/:id/restore", (req, res) => {
  if (req.headers["x-admin-pin"] !== ADMIN_PIN) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  const users   = loadUsers();
  const updated = users.map((u) =>
    u.id === req.params["id"] ? { ...u, active: true } : u
  );
  saveUsers(updated);
  res.json({ ok: true });
});

export default router;
