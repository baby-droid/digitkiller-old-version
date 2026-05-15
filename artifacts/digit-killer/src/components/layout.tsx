import { Link, useLocation } from "wouter";
import { useState } from "react";
import {
  LayoutDashboard, Activity, Zap, Binary, MonitorPlay,
  Lightbulb, BrainCircuit, TrendingUp, Settings, Cpu,
  BrainCog, TrendingDown, DollarSign, Sparkles, LogOut,
  Eye, Calculator,
} from "lucide-react";
import {
  MARKETS, MARKETS_BY_CATEGORY, CATEGORY_LABELS, MarketCategory,
} from "@/hooks/useDerivWebSocket";
import { useMarket } from "@/lib/market-context";
import { useAuth } from "@/lib/auth-context";

const navItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Smart Trade", href: "/smart-trade", icon: BrainCog },
  { name: "Smart Signals", href: "/smart-signals", icon: Sparkles },
  { name: "Wide Eye View", href: "/wide-eye", icon: Eye },
  { name: "Market Scanner", href: "/scanner", icon: Activity },
  { name: "AI Signals", href: "/signals", icon: Zap },
  { name: "Tick Generator", href: "/tick-generator", icon: Cpu },
  { name: "Digit Analysis", href: "/analysis", icon: Binary },
  { name: "Trade Desk", href: "/trade-desk", icon: MonitorPlay },
  { name: "Strategies", href: "/strategies", icon: Lightbulb },
  { name: "Forex · Gold/USD", href: "/forex", icon: DollarSign },
  { name: "Risk Calculator", href: "/risk-calculator", icon: Calculator },
  { name: "AI Learning", href: "/learning", icon: BrainCircuit },
  { name: "Performance", href: "/performance", icon: TrendingUp },
  { name: "Settings", href: "/settings", icon: Settings },
];

const CATEGORY_ICONS: Record<MarketCategory, React.ReactNode> = {
  volatility: <Activity className="w-3 h-3" />,
  crash_boom: <TrendingDown className="w-3 h-3" />,
  jump: <Zap className="w-3 h-3" />,
  bear_bull: <TrendingUp className="w-3 h-3" />,
};

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { activeMarket, setActiveMarket } = useMarket();
  const { session, isAdmin, logout } = useAuth();
  const [activeCategory, setActiveCategory] = useState<MarketCategory>("volatility");

  const activeMkt = MARKETS.find((m) => m.symbol === activeMarket);
  const activeMarketName = activeMkt?.name ?? activeMarket;
  const isForexPage = location === "/forex";

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground font-sans selection:bg-primary/30">
      {/* Sidebar */}
      <div className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col flex-shrink-0">
        {/* Logo + Branding */}
        <div className="h-16 flex items-center px-4 border-b border-sidebar-border gap-3 flex-shrink-0">
          <img
            src={`${import.meta.env.BASE_URL}logo.png`.replace("//", "/")}
            alt="Logo"
            className="w-10 h-10 rounded-full flex-shrink-0"
            style={{ filter: "drop-shadow(0 0 8px rgba(0,209,209,0.5))" }}
          />
          <div className="min-w-0">
            <div className="font-bold text-xs tracking-widest text-primary truncate">AHMED SYNTRADER</div>
            <div className="text-[10px] text-muted-foreground font-mono flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse flex-shrink-0" />
              <span className="truncate">{isForexPage ? "XAU/USD" : activeMarketName} Live</span>
            </div>
          </div>
        </div>

        {/* Session badge */}
        <div className="px-4 py-2 border-b border-sidebar-border/50 flex items-center justify-between">
          <span className="text-[10px] font-mono text-muted-foreground">
            {isAdmin ? "👑 ADMIN" : `👤 ${session?.userName ?? "User"}`}
          </span>
          <button onClick={logout} className="text-muted-foreground hover:text-destructive transition-colors" title="Logout">
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-sidebar-accent text-sidebar-primary"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                }`}
              >
                <item.icon className={`w-4 h-4 flex-shrink-0 ${isActive ? "text-sidebar-primary" : "text-sidebar-foreground/70"}`} />
                <span className="truncate">{item.name}</span>
                {item.href === "/smart-signals" && (
                  <span className="ml-auto text-[9px] font-bold bg-primary/20 text-primary rounded px-1">NEW</span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-sidebar-border text-[10px] text-muted-foreground text-center font-mono">
          Digit Killer v2.1.0 · ahmedsyntrader.site
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Market Selector Header */}
        {isForexPage ? (
          <header className="h-14 bg-card border-b border-border flex items-center px-6 gap-3 flex-shrink-0">
            <DollarSign className="w-4 h-4 text-primary" />
            <span className="font-bold text-sm text-primary tracking-wide">FOREX ANALYSIS</span>
            <span className="text-muted-foreground text-xs font-mono">|</span>
            <span className="font-mono text-sm font-bold">Gold / USD · XAU/USD</span>
            <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground font-mono">
              <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
              Live Spot Price
            </div>
          </header>
        ) : (
          <header className="bg-card border-b border-border flex-shrink-0">
            <div className="flex items-center px-4 gap-1 h-10 border-b border-border/50 overflow-x-auto hide-scrollbar">
              {(Object.keys(MARKETS_BY_CATEGORY) as MarketCategory[]).map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    setActiveCategory(cat);
                    const first = MARKETS_BY_CATEGORY[cat][0];
                    if (first) setActiveMarket(first.symbol);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded text-[11px] font-bold whitespace-nowrap transition-all ${
                    activeCategory === cat
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  {CATEGORY_ICONS[cat]}
                  {CATEGORY_LABELS[cat]}
                </button>
              ))}
            </div>
            <div className="flex items-center px-4 gap-2 h-12 overflow-x-auto hide-scrollbar">
              {MARKETS_BY_CATEGORY[activeCategory].map((m) => (
                <button
                  key={m.symbol}
                  onClick={() => setActiveMarket(m.symbol)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                    activeMarket === m.symbol
                      ? "bg-primary text-primary-foreground shadow-[0_0_15px_rgba(0,209,209,0.3)]"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {m.name}
                </button>
              ))}
            </div>
          </header>
        )}

        <main className="flex-1 overflow-y-auto p-6 relative">
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-background to-background opacity-50" />
          <div className="relative z-10 h-full">{children}</div>
        </main>
      </div>
    </div>
  );
}
