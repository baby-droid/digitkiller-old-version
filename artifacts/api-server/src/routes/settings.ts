import { Router } from "express";
import fs from "fs";
import path from "path";

const ADMIN_PIN  = "AHMED2005";
const DATA_DIR   = path.join(process.cwd(), "artifacts", "api-server", "data");
const SETTINGS_FILE = path.join(DATA_DIR, "settings.json");

export type AppSettings = {
  primaryHue: number;
  fontFamily: "inter" | "roboto" | "ubuntu" | "poppins" | "jetbrains";
  cardRadius: "sharp" | "normal" | "rounded" | "pill";
  density: "compact" | "normal" | "spacious";
  sidebarGlow: boolean;
  accentPreset: "cyan" | "green" | "purple" | "orange" | "rose" | "custom";
};

const DEFAULTS: AppSettings = {
  primaryHue: 181,
  fontFamily: "inter",
  cardRadius: "normal",
  density: "normal",
  sidebarGlow: true,
  accentPreset: "cyan",
};

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function loadSettings(): AppSettings {
  try {
    ensureDir();
    if (!fs.existsSync(SETTINGS_FILE)) return DEFAULTS;
    return { ...DEFAULTS, ...JSON.parse(fs.readFileSync(SETTINGS_FILE, "utf-8")) };
  } catch { return DEFAULTS; }
}

function saveSettings(s: AppSettings) {
  ensureDir();
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(s, null, 2), "utf-8");
}

const router = Router();

router.get("/settings", (_req, res) => {
  res.json(loadSettings());
});

router.patch("/settings", (req, res) => {
  if (req.headers["x-admin-pin"] !== ADMIN_PIN) {
    res.status(403).json({ error: "Forbidden" }); return;
  }
  const current = loadSettings();
  const updated = { ...current, ...req.body } as AppSettings;
  saveSettings(updated);
  res.json(updated);
});

router.post("/settings/reset", (req, res) => {
  if (req.headers["x-admin-pin"] !== ADMIN_PIN) {
    res.status(403).json({ error: "Forbidden" }); return;
  }
  saveSettings(DEFAULTS);
  res.json(DEFAULTS);
});

export default router;
