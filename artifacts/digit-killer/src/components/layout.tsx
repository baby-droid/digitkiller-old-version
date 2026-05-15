import { Link, useLocation } from "wouter";
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
  BrainCog
} from "lucide-react";
import { MARKETS } from "@/hooks/useDerivWebSocket";
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
  { name: "AI Learning", href: "/learning", icon: BrainCircuit },
  { name: "Performance", href: "/performance", icon: TrendingUp },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { activeMarket, setActiveMarket } = useMarket();
  const activeMarketName = MARKETS.find(m => m.symbol === activeMarket)?.name;

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground font-sans selection:bg-primary/30">
      {/* Sidebar */}
      <div className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col flex-shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-sidebar-border gap-3">
          <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-primary-foreground font-bold">
            A
          </div>
          <div>
            <div className="font-bold text-sm tracking-widest text-primary">AHMED SYNTRADER</div>
            <div className="text-xs text-muted-foreground font-mono flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              {activeMarketName} Connected
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
                <item.icon className={`w-5 h-5 ${isActive ? "text-sidebar-primary" : "text-sidebar-foreground/70"}`} />
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
        <header className="h-16 bg-card border-b border-border flex items-center px-6 gap-2 overflow-x-auto whitespace-nowrap flex-shrink-0 hide-scrollbar">
          {MARKETS.map((m) => (
            <button
              key={m.symbol}
              onClick={() => setActiveMarket(m.symbol)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                activeMarket === m.symbol
                  ? "bg-primary text-primary-foreground shadow-[0_0_15px_rgba(0,209,209,0.3)]"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {m.name}
            </button>
          ))}
        </header>

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
