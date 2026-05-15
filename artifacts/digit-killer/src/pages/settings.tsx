import { useState } from "react";
import { useAuth, UserRecord } from "@/lib/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Shield, User, Plus, Trash2, RotateCcw, CheckCircle2, AlertCircle,
  Settings2, Wifi, RefreshCw, Info, Database, Zap, LogOut, Copy, Power
} from "lucide-react";

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text).catch(() => {});
}

function SectionCard({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <Card className="bg-card border-border">
      <CardHeader className="py-3 px-5 border-b border-border flex flex-row items-center gap-2">
        <Icon className="w-4 h-4 text-primary" />
        <CardTitle className="text-xs font-bold uppercase text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-5">{children}</CardContent>
    </Card>
  );
}

export default function Settings() {
  const { session, isAdmin, logout, users, generateUserId, revokeUser, restoreUser } = useAuth();
  const [newUserName, setNewUserName] = useState("");
  const [generatedId, setGeneratedId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [wsStatus, setWsStatus] = useState<"idle" | "checking" | "ok" | "fail">("idle");

  const handleGenerate = () => {
    if (!newUserName.trim()) return;
    const id = generateUserId(newUserName.trim());
    setGeneratedId(id);
    setNewUserName("");
  };

  const handleCopy = (text: string) => {
    copyToClipboard(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWsCheck = () => {
    setWsStatus("checking");
    const ws = new WebSocket("wss://ws.binaryws.com/websockets/v3?app_id=1089");
    ws.onopen = () => { setWsStatus("ok"); ws.close(); };
    ws.onerror = () => setWsStatus("fail");
    setTimeout(() => { if (wsStatus === "checking") setWsStatus("fail"); }, 5000);
  };

  const handleReload = () => window.location.reload();

  const handleClearCache = () => {
    localStorage.removeItem("dk_session");
    sessionStorage.clear();
    window.location.reload();
  };

  const activeUsers = users.filter((u) => u.active);
  const revokedUsers = users.filter((u) => !u.active);

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Settings2 className="w-6 h-6 text-primary" /> Settings
            {isAdmin && <Badge variant="outline" className="border-primary/30 text-primary text-xs ml-1">ADMIN MODE</Badge>}
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {isAdmin ? "Full admin access — manage users and system configuration" : "User settings and account info"}
          </p>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-2 px-4 py-2 border border-destructive/30 text-destructive rounded-md text-sm font-bold hover:bg-destructive/10 transition-all"
        >
          <LogOut className="w-4 h-4" /> Logout
        </button>
      </div>

      {/* Account Info */}
      <SectionCard title="Account" icon={User}>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-1">
            <div className="text-muted-foreground text-xs">Access Level</div>
            <div className="font-bold flex items-center gap-2">
              {isAdmin ? <><Shield className="w-4 h-4 text-primary" /> Administrator</> : <><User className="w-4 h-4 text-muted-foreground" /> User</>}
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-muted-foreground text-xs">User ID</div>
            <div className="font-mono font-bold">{session?.userId ?? "—"}</div>
          </div>
          {session?.userName && (
            <div className="space-y-1">
              <div className="text-muted-foreground text-xs">Name</div>
              <div className="font-bold">{session.userName}</div>
            </div>
          )}
        </div>
      </SectionCard>

      {/* Admin: User Management */}
      {isAdmin && (
        <SectionCard title="User Management" icon={Shield}>
          <div className="space-y-5">
            {/* Generate new user */}
            <div>
              <div className="text-sm font-bold mb-2">Generate New User ID</div>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter user name..."
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
                  className="bg-background border-border"
                />
                <button
                  onClick={handleGenerate}
                  disabled={!newUserName.trim()}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-bold hover:bg-primary/90 disabled:opacity-40 transition-all whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" /> Generate
                </button>
              </div>
              {generatedId && (
                <div className="mt-3 p-3 bg-primary/10 border border-primary/30 rounded-lg flex items-center justify-between">
                  <div>
                    <div className="text-xs text-muted-foreground">New User ID Generated:</div>
                    <div className="font-mono font-black text-primary text-lg">{generatedId}</div>
                  </div>
                  <button onClick={() => handleCopy(generatedId)} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/20 rounded text-xs font-bold text-primary hover:bg-primary/30 transition-all">
                    {copied ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? "Copied!" : "Copy"}
                  </button>
                </div>
              )}
            </div>

            {/* Active users */}
            {activeUsers.length > 0 && (
              <div>
                <div className="text-sm font-bold mb-2 flex items-center gap-2">
                  Active Users <Badge variant="outline" className="text-green-400 border-green-400/30 text-xs">{activeUsers.length}</Badge>
                </div>
                <div className="space-y-2">
                  {activeUsers.map((u: UserRecord) => (
                    <div key={u.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-green-500" />
                          <span className="font-bold text-sm">{u.name}</span>
                        </div>
                        <div className="font-mono text-xs text-muted-foreground flex items-center gap-3 mt-0.5">
                          <span>{u.id}</span>
                          <span>Created: {new Date(u.created).toLocaleDateString()}</span>
                          {u.lastLogin && <span>Last: {new Date(u.lastLogin).toLocaleString()}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleCopy(u.id)} className="p-1.5 text-muted-foreground hover:text-foreground transition-colors" title="Copy ID">
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => revokeUser(u.id)} className="flex items-center gap-1.5 px-3 py-1.5 border border-destructive/30 text-destructive rounded text-xs font-bold hover:bg-destructive/10 transition-all">
                          <Trash2 className="w-3 h-3" /> Revoke
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Revoked users */}
            {revokedUsers.length > 0 && (
              <div>
                <div className="text-sm font-bold mb-2 flex items-center gap-2 text-muted-foreground">
                  Revoked Users <Badge variant="outline" className="text-red-400 border-red-400/30 text-xs">{revokedUsers.length}</Badge>
                </div>
                <div className="space-y-2">
                  {revokedUsers.map((u: UserRecord) => (
                    <div key={u.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg opacity-70">
                      <div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-red-500" />
                          <span className="font-bold text-sm">{u.name}</span>
                          <Badge variant="outline" className="text-[10px] border-red-500/30 text-red-400">REVOKED</Badge>
                        </div>
                        <div className="font-mono text-xs text-muted-foreground">{u.id}</div>
                      </div>
                      <button onClick={() => restoreUser(u.id)} className="flex items-center gap-1.5 px-3 py-1.5 border border-primary/30 text-primary rounded text-xs font-bold hover:bg-primary/10 transition-all">
                        <RotateCcw className="w-3 h-3" /> Restore
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {users.length === 0 && (
              <div className="text-center py-6 text-muted-foreground text-sm">
                No users yet. Generate the first User ID above.
              </div>
            )}
          </div>
        </SectionCard>
      )}

      {/* System Diagnostics (Admin only) */}
      {isAdmin && (
        <SectionCard title="System Diagnostics" icon={Wifi}>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-bold text-sm">Deriv WebSocket</div>
                <div className="text-xs text-muted-foreground">wss://ws.binaryws.com/websockets/v3</div>
              </div>
              <div className="flex items-center gap-3">
                {wsStatus !== "idle" && (
                  <span className={`flex items-center gap-1 text-xs font-bold ${wsStatus === "ok" ? "text-green-400" : wsStatus === "fail" ? "text-red-400" : "text-yellow-400"}`}>
                    {wsStatus === "ok" ? <><CheckCircle2 className="w-3.5 h-3.5" /> Connected</> : wsStatus === "fail" ? <><AlertCircle className="w-3.5 h-3.5" /> Failed</> : "Checking..."}
                  </span>
                )}
                <button onClick={handleWsCheck} className="flex items-center gap-1.5 px-3 py-1.5 bg-muted border border-border rounded text-xs font-bold hover:bg-muted/80 transition-all">
                  <Wifi className="w-3.5 h-3.5" /> Test Connection
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-bold text-sm">Force Reload App</div>
                <div className="text-xs text-muted-foreground">Refresh all market feeds and UI</div>
              </div>
              <button onClick={handleReload} className="flex items-center gap-1.5 px-3 py-1.5 bg-muted border border-border rounded text-xs font-bold hover:bg-muted/80 transition-all">
                <RefreshCw className="w-3.5 h-3.5" /> Reload
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-bold text-sm">Clear Cache & Reset Session</div>
                <div className="text-xs text-muted-foreground">Clears session storage, forces re-login</div>
              </div>
              <button onClick={handleClearCache} className="flex items-center gap-1.5 px-3 py-1.5 border border-destructive/30 text-destructive rounded text-xs font-bold hover:bg-destructive/10 transition-all">
                <Database className="w-3.5 h-3.5" /> Clear & Reset
              </button>
            </div>
          </div>
        </SectionCard>
      )}

      {/* Admin: Advanced Settings */}
      {isAdmin && (
        <SectionCard title="Admin Configuration" icon={Zap}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            {[
              { label: "App Version", value: "v2.1.0" },
              { label: "Build Mode", value: import.meta.env.MODE },
              { label: "Base URL", value: import.meta.env.BASE_URL },
              { label: "Admin PIN", value: "AHMED2005 (hardcoded)" },
              { label: "WebSocket", value: "wss://ws.binaryws.com" },
              { label: "App ID", value: "1089" },
              { label: "Signal Validity", value: "20 minutes" },
              { label: "Tick Buffer", value: "500 ticks/market" },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between items-center py-2 border-b border-border/40 last:border-0">
                <span className="text-muted-foreground text-xs">{label}</span>
                <span className="font-mono text-xs font-bold">{value}</span>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* App Info */}
      <SectionCard title="About" icon={Info}>
        <div className="flex items-start gap-5">
          <img
            src={`${import.meta.env.BASE_URL}logo.png`.replace("//", "/")}
            alt="Logo"
            className="w-16 h-16 rounded-full flex-shrink-0"
            style={{ filter: "drop-shadow(0 0 10px rgba(0,209,209,0.4))" }}
          />
          <div className="space-y-1">
            <div className="font-black text-lg text-primary">Digit Killer</div>
            <div className="text-sm text-muted-foreground">Ahmed Syntrader AI Trading Dashboard</div>
            <div className="text-xs text-muted-foreground">Version 2.1.0 · Real-time Deriv market analysis</div>
            <div className="text-xs text-muted-foreground">Contact: <span className="text-primary">0768925411</span></div>
            <div className="text-xs text-muted-foreground">Web: <span className="text-primary">ahmedsyntrader.site</span></div>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
