import { Link, useLocation } from "wouter";
import { useState } from "react";
import {
  LayoutDashboard,
  Activity,
  Zap,
  Binary,
  MonitorPlay,
  Lightbulb,
  BrainCircuit,
  TrendingUp,
  Settings,
  Cpu,
  BrainCog,
  TrendingDown,
  DollarSign,
} from "lucide-react";
import {
  MARKETS,
  MARKETS_BY_CATEGORY,
  CATEGORY_LABELS,
  MarketCategory,
} from "@/hooks/useDerivWebSocket";
import { useMarket } from "@/lib/market-context";

const navItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Smart Trade", href: "/smart-trade", icon: BrainCog },
  { name: "Market Scanner", href: "/scanner", icon: Activity },
  { name: "AI Signals", href: "/signals", icon: Zap },
  { name: "Tick Generator", href: "/tick-generator", icon: Cpu },
  { name: "Digit Analysis", href: "/analysis", icon: Binary },
  { name: "Trade Desk", href: "/trade-desk", icon: MonitorPlay },
  { name: "Strategies", href: "/strategies", icon: Lightbulb },
  { name: "Forex · Gold/USD", href: "/forex", icon: DollarSign },
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
  const [activeCategory, setActiveCategory] = useState<MarketCategory>("volatility");

  const activeMkt = MARKETS.find((m) => m.symbol === activeMarket);
  const activeMarketName = activeMkt?.name ?? activeMarket;

  const isForexPage = location === "/forex";

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground font-sans selection:bg-primary/30">
      {/* Sidebar */}
      <div className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col flex-shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-sidebar-border gap-3 flex-shrink-0">
          <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-primary-foreground font-bold">
            A
          </div>
          <div>
            <div className="font-bold text-sm tracking-widest text-primary">AHMED SYNTRADER</div>
            <div className="text-xs text-muted-foreground font-mono flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              {isForexPage ? "XAU/USD" : activeMarketName} Live
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-sidebar-accent text-sidebar-primary"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                }`}
              >
                <item.icon
                  className={`w-5 h-5 ${isActive ? "text-sidebar-primary" : "text-sidebar-foreground/70"}`}
                />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-sidebar-border text-xs text-muted-foreground text-center">
          Digit Killer v2.1.0
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Market Selector Header */}
        {isForexPage ? (
          /* Forex header — fixed label */
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
          /* Synthetic market selector — two-row */
          <header className="bg-card border-b border-border flex-shrink-0">
            {/* Category tabs row */}
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

            {/* Market pills row */}
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

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6 relative">
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-background to-background opacity-50" />
          <div className="relative z-10 h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
