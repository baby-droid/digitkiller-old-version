import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useDerivMultiMarket } from "@/hooks/useDerivMultiMarket";
import { MARKETS } from "@/hooks/useDerivWebSocket";
import {
  Cpu, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, Zap,
  ArrowUpDown, BarChart2, Layers, Target, RefreshCw, Timer, Activity
} from "lucide-react";

const TABS = [
  { id: "over-under", label: "Over / Under", icon: ArrowUpDown },
  { id: "rise-fall", label: "Rise / Fall", icon: TrendingUp },
  { id: "in-out", label: "In / Out", icon: Layers },
  { id: "high-low", label: "High / Low Tick", icon: BarChart2 },
  { id: "digit-types", label: "Even · Odd · Match · Differ", icon: Target },
  { id: "accumulators", label: "Accumulators", icon: RefreshCw },
  { id: "asians", label: "Asians", icon: Timer },
] as const;

type TabId = typeof TABS[number]["id"];

type Opportunity = {
  symbol: string;
  marketName: string;
  type: string;
  subLabel?: string;
  confidence: number;
  freqsPercent: number[];
  entryDigits: (number | string)[];
  ticks: string;
  risk: string;
  greenBarDigit: number;
  redBarDigit: number;
  lastDigit: number | null;
  entryNow: boolean;
  validTime: string;
  reason: string;
};

function getFreqs(digits: number[], window = 100) {
  const last = digits.slice(-window);
  const freqs = new Array(10).fill(0);
  last.forEach((d) => freqs[d]++);
  return freqs.map((f) => (f / (last.length || 1)) * 100);
}

function buildOpportunities(marketsData: Record<string, { digits: number[]; lastDigit: number | null; prices?: number[] }>, tab: TabId): Opportunity[] {
  const results: Opportunity[] = [];

  Object.entries(marketsData).forEach(([symbol, data]) => {
    if (data.digits.length < 30) return;
    const mkt = MARKETS.find((m) => m.symbol === symbol);
    if (!mkt) return;
    const mn = mkt.name;
    const pct = getFreqs(data.digits, 100);
    const maxPct = Math.max(...pct), minPct = Math.min(...pct);
    const maxD = pct.indexOf(maxPct), minD = pct.indexOf(minPct);
    const last = data.lastDigit;

    const push = (o: Omit<Opportunity, "symbol" | "marketName" | "freqsPercent" | "greenBarDigit" | "redBarDigit" | "lastDigit">) =>
      results.push({ symbol, marketName: mn, freqsPercent: pct, greenBarDigit: maxD, redBarDigit: minD, lastDigit: last, ...o });

    if (tab === "over-under") {
      const overPct = [5, 6, 7, 8, 9].reduce((s, d) => s + pct[d], 0);
      if (overPct > 55) { const t = overPct > 60 ? "Over 4" : "Over 5"; push({ type: t, confidence: Math.min(85, 55 + overPct - 55), entryDigits: [2, 4], ticks: "2-3 ticks", risk: "Medium", entryNow: [2, 4].includes(last ?? -1), validTime: "2-5 min", reason: `High digits dominant (${overPct.toFixed(1)}%)` }); }
      if (overPct < 45) { const t = overPct < 40 ? "Under 4" : "Under 5"; push({ type: t, confidence: Math.min(85, 55 + (45 - overPct)), entryDigits: [5, 7], ticks: "2-3 ticks", risk: "Medium", entryNow: [5, 7].includes(last ?? -1), validTime: "2-5 min", reason: `Low digits dominant (${(100 - overPct).toFixed(1)}%)` }); }
      if (pct[0] < 7 && pct[1] < 7) push({ type: "Over 1", confidence: 72, entryDigits: [0, 1], ticks: "1-2 ticks", risk: "Low", entryNow: [0, 1].includes(last ?? -1), validTime: "1-2 min", reason: `Digits 0-1 underrepresented` });
      if (pct[9] < 7 && pct[8] < 7) push({ type: "Under 9", confidence: 70, entryDigits: [8, 9], ticks: "1-2 ticks", risk: "Low", entryNow: [8, 9].includes(last ?? -1), validTime: "1-2 min", reason: `Digits 8-9 underrepresented` });
      if (pct[9] > 14) push({ type: "Over 8", confidence: Math.min(82, 55 + (pct[9] - 10) * 2), entryDigits: [6, 7], ticks: "1-2 ticks", risk: "Low", entryNow: [6, 7].includes(last ?? -1), validTime: "1-3 min", reason: `Digit 9 at ${pct[9].toFixed(1)}% — very high` });
    }

    if (tab === "rise-fall") {
      const recent = data.digits.slice(-8);
      const prices = (data as any).prices as number[] | undefined;
      const recentPrices = prices ? prices.slice(-10) : null;
      let riseTrend = 0;
      recent.forEach((d, i) => { if (i > 0 && d >= recent[i - 1]) riseTrend++; });
      const fallTrend = recent.length - 1 - riseTrend;
      if (riseTrend >= 6) push({ type: "RISE", confidence: Math.min(80, 60 + riseTrend * 3), entryDigits: ["Current price"], ticks: "5 ticks", risk: "Medium", entryNow: true, validTime: "1-2 min", reason: `${riseTrend}/7 last digits rising — bullish momentum` });
      if (fallTrend >= 6) push({ type: "FALL", confidence: Math.min(80, 60 + fallTrend * 3), entryDigits: ["Current price"], ticks: "5 ticks", risk: "Medium", entryNow: true, validTime: "1-2 min", reason: `${fallTrend}/7 last digits falling — bearish momentum` });
      if (recentPrices && recentPrices.length >= 5) {
        const slope = recentPrices[recentPrices.length - 1] - recentPrices[0];
        if (slope > 0 && riseTrend >= 4) push({ type: "RISE", subLabel: "Price + Digit", confidence: 74, entryDigits: ["Entry now"], ticks: "5 ticks", risk: "Medium", entryNow: true, validTime: "1-3 min", reason: `Price trending up +${slope.toFixed(3)} over last 10 ticks` });
        if (slope < 0 && fallTrend >= 4) push({ type: "FALL", subLabel: "Price + Digit", confidence: 74, entryDigits: ["Entry now"], ticks: "5 ticks", risk: "Medium", entryNow: true, validTime: "1-3 min", reason: `Price trending down ${slope.toFixed(3)} over last 10 ticks` });
      }
    }

    if (tab === "in-out") {
      const recentDigits = data.digits.slice(-20);
      const spread = Math.max(...recentDigits) - Math.min(...recentDigits);
      if (spread <= 4) push({ type: "IN (Stay In)", confidence: 72, entryDigits: ["Current barrier"], ticks: "5 ticks", risk: "Low", entryNow: true, validTime: "2-5 min", reason: `Last 20 digits in tight range (${Math.min(...recentDigits)}-${Math.max(...recentDigits)})` });
      if (spread >= 8) push({ type: "OUT (Exit)", confidence: 70, entryDigits: ["Current barrier"], ticks: "5 ticks", risk: "Medium", entryNow: true, validTime: "2-5 min", reason: `Price volatile — last 20 digits spanning ${spread} range` });
      const midRange = [3, 4, 5, 6].reduce((s, d) => s + pct[d], 0);
      if (midRange > 44) push({ type: "IN (Mid Range)", confidence: Math.min(76, 50 + midRange - 40), entryDigits: ["Mid barrier"], ticks: "3 ticks", risk: "Low", entryNow: [3, 4, 5, 6].includes(last ?? -1), validTime: "1-2 min", reason: `Mid digits 3-6 at ${midRange.toFixed(1)}% frequency` });
    }

    if (tab === "high-low") {
      const recent5 = data.digits.slice(-5);
      const maxInRecent = Math.max(...recent5);
      const minInRecent = Math.min(...recent5);
      const highTickConf = 60 + (pct[maxInRecent] > 12 ? 15 : pct[maxInRecent] > 10 ? 8 : 0);
      const lowTickConf = 60 + (pct[minInRecent] > 12 ? 15 : pct[minInRecent] > 10 ? 8 : 0);
      push({ type: "HIGH TICK", confidence: highTickConf, entryDigits: [maxInRecent], ticks: "5 ticks", risk: "Medium", entryNow: last === maxInRecent, validTime: "1-3 min", reason: `Digit ${maxInRecent} is current period high — ${pct[maxInRecent].toFixed(1)}% frequency` });
      push({ type: "LOW TICK", confidence: lowTickConf, entryDigits: [minInRecent], ticks: "5 ticks", risk: "Medium", entryNow: last === minInRecent, validTime: "1-3 min", reason: `Digit ${minInRecent} is current period low — ${pct[minInRecent].toFixed(1)}% frequency` });
    }

    if (tab === "digit-types") {
      const evenPct = [0, 2, 4, 6, 8].reduce((s, d) => s + pct[d], 0);
      const oddPct = [1, 3, 5, 7, 9].reduce((s, d) => s + pct[d], 0);
      if (evenPct > 53) push({ type: "EVEN", confidence: Math.min(78, 50 + (evenPct - 50) * 1.5), entryDigits: [0, 2, 4, 6, 8], ticks: "1 tick", risk: "Low", entryNow: [0, 2, 4, 6, 8].includes(last ?? -1), validTime: "Immediate", reason: `Even digits at ${evenPct.toFixed(1)}%` });
      if (oddPct > 53) push({ type: "ODD", confidence: Math.min(78, 50 + (oddPct - 50) * 1.5), entryDigits: [1, 3, 5, 7, 9], ticks: "1 tick", risk: "Low", entryNow: [1, 3, 5, 7, 9].includes(last ?? -1), validTime: "Immediate", reason: `Odd digits at ${oddPct.toFixed(1)}%` });
      if (maxPct > 13) push({ type: "MATCHES", confidence: Math.min(82, 55 + (maxPct - 10) * 2), entryDigits: [maxD], ticks: "1 tick", risk: "Low", entryNow: last === maxD, validTime: "Immediate", reason: `Digit ${maxD} at ${maxPct.toFixed(1)}% — statistically favored` });
      if (minPct < 7) push({ type: "DIFFERS", confidence: Math.min(80, 55 + (8 - minPct) * 2), entryDigits: [minD], ticks: "1 tick", risk: "Low", entryNow: last === minD, validTime: "Immediate", reason: `Digit ${minD} at ${minPct.toFixed(1)}% — rarely appearing` });
    }

    if (tab === "accumulators") {
      const recent10 = data.digits.slice(-10);
      const variance = recent10.reduce((s, d) => s + Math.abs(d - 5), 0) / recent10.length;
      if (variance < 2.5) push({ type: "ACCUMULATOR", subLabel: "Growth 1%", confidence: 74, entryDigits: ["±0.01% barrier"], ticks: "5-20 ticks", risk: "Low", entryNow: true, validTime: "5-20 min", reason: `Low digit variance (${variance.toFixed(2)}) — price stable, accumulate growth` });
      if (maxPct > 12 && maxPct < 18) push({ type: "ACCUMULATOR", subLabel: "Steady trend", confidence: 70, entryDigits: ["Current barrier"], ticks: "10-30 ticks", risk: "Low", entryNow: true, validTime: "10-30 min", reason: `Consistent digit pattern — accumulate safely` });
    }

    if (tab === "asians") {
      const last20 = data.digits.slice(-20);
      const avg = last20.reduce((s, d) => s + d, 0) / last20.length;
      const avgLastDigit = Math.round(avg) % 10;
      if (avg > 5.2) push({ type: "ASIAN OVER", confidence: 68 + Math.round((avg - 5) * 5), entryDigits: [avgLastDigit], ticks: "N/A (Asian)", risk: "Medium", entryNow: last === avgLastDigit, validTime: "End of period", reason: `20-tick average last digit = ${avg.toFixed(2)} (above 5)` });
      if (avg < 4.8) push({ type: "ASIAN UNDER", confidence: 68 + Math.round((5 - avg) * 5), entryDigits: [avgLastDigit], ticks: "N/A (Asian)", risk: "Medium", entryNow: last === avgLastDigit, validTime: "End of period", reason: `20-tick average last digit = ${avg.toFixed(2)} (below 5)` });
      const evenAvg = avg % 1 < 0.3 || avg % 1 > 0.7;
      if (evenAvg && avgLastDigit % 2 === 0) push({ type: "ASIAN EVEN", confidence: 66, entryDigits: [avgLastDigit], ticks: "N/A", risk: "Medium", entryNow: last === avgLastDigit, validTime: "End of period", reason: `Average digit rounds to ${avgLastDigit} (even)` });
    }
  });

  return results.sort((a, b) => b.confidence - a.confidence);
}

const TYPE_COLORS: Record<string, string> = {
  "RISE": "text-green-400", "FALL": "text-red-400",
  "EVEN": "text-blue-400", "ODD": "text-orange-400",
  "MATCHES": "text-primary", "DIFFERS": "text-red-400",
  "ACCUMULATOR": "text-yellow-400", "HIGH TICK": "text-green-300",
  "LOW TICK": "text-red-300", "IN (Stay In)": "text-primary",
  "IN (Mid Range)": "text-primary", "OUT (Exit)": "text-orange-400",
  "ASIAN OVER": "text-green-400", "ASIAN UNDER": "text-red-400",
  "ASIAN EVEN": "text-blue-400", "Over 4": "text-primary",
  "Over 5": "text-primary", "Over 1": "text-primary",
  "Over 8": "text-primary", "Under 4": "text-orange-400",
  "Under 5": "text-orange-400", "Under 9": "text-orange-400",
};

export default function TickGenerator() {
  const [activeTab, setActiveTab] = useState<TabId>("over-under");
  const marketsData = useDerivMultiMarket();

  const opportunities = useMemo(
    () => buildOpportunities(marketsData as any, activeTab),
    [marketsData, activeTab]
  );

  const readyMarkets = Object.values(marketsData).filter((d) => d.digits.length >= 30).length;
  const totalMarkets = Object.keys(marketsData).length;

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Cpu className="w-6 h-6 text-primary" /> Signal Generator
          </h1>
          <p className="text-muted-foreground text-sm">
            Live AI signals for all Deriv contract types — {readyMarkets}/{totalMarkets} markets ready
          </p>
        </div>
        <Badge variant="outline" className={`font-mono text-xs gap-1.5 ${readyMarkets >= 5 ? "border-green-500/30 text-green-400" : "border-yellow-500/30 text-yellow-400"}`}>
          <div className={`w-1.5 h-1.5 rounded-full ${readyMarkets >= 5 ? "bg-green-500 animate-pulse" : "bg-yellow-500"}`} />
          {readyMarkets >= 5 ? "Scanning All Markets" : "Collecting Data..."}
        </Badge>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 p-1 bg-muted/30 rounded-lg border border-border">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? "bg-primary text-primary-foreground shadow"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Signal Cards */}
      {opportunities.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground space-y-3">
          <Activity className="w-12 h-12 opacity-20" />
          <p className="font-bold">Scanning markets...</p>
          <p className="text-sm">Collecting tick data — need at least 30 ticks per market</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {opportunities.map((opp, idx) => {
            const typeColor = Object.entries(TYPE_COLORS).find(([k]) => opp.type.includes(k) || opp.type === k)?.[1] ?? "text-primary";
            const entryNow = opp.entryNow;
            return (
              <Card
                key={`${opp.symbol}-${opp.type}-${idx}`}
                className={`relative overflow-hidden border-2 transition-all ${
                  entryNow
                    ? "border-primary shadow-[0_0_20px_rgba(0,209,209,0.15)] scale-[1.01]"
                    : "border-border hover:border-border/80"
                }`}
              >
                {entryNow && (
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary" />
                )}
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <CardTitle className="text-sm font-mono text-muted-foreground">{opp.marketName}</CardTitle>
                      <div className={`text-xl font-black font-mono ${typeColor}`}>
                        {opp.type}
                        {opp.subLabel && <span className="text-xs ml-2 opacity-70">{opp.subLabel}</span>}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      {entryNow ? (
                        <Badge className="bg-primary text-primary-foreground text-[10px] animate-pulse">ENTRY NOW</Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px]">WAITING</Badge>
                      )}
                      <div className="text-xl font-black text-primary font-mono mt-1">{opp.confidence}%</div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  {/* Freq bars */}
                  {opp.freqsPercent.length === 10 && (
                    <div className="flex h-8 gap-0.5 items-end bg-muted/30 rounded p-1">
                      {opp.freqsPercent.map((f, i) => (
                        <div
                          key={i}
                          className={`flex-1 rounded-t-sm transition-all ${
                            i === opp.greenBarDigit ? "bg-green-500" :
                            i === opp.redBarDigit ? "bg-red-500" : "bg-primary/30"
                          }`}
                          style={{ height: `${Math.max(f * 2.5, 8)}%` }}
                          title={`${i}: ${f.toFixed(1)}%`}
                        />
                      ))}
                    </div>
                  )}

                  <div className="text-[10px] text-muted-foreground bg-muted/50 rounded p-2 leading-relaxed">
                    {opp.reason}
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-[10px]">
                    <div className="bg-muted rounded p-2">
                      <div className="text-muted-foreground">Entry</div>
                      <div className="font-bold font-mono">{Array.isArray(opp.entryDigits) ? opp.entryDigits.join(", ") : opp.entryDigits}</div>
                    </div>
                    <div className="bg-muted rounded p-2">
                      <div className="text-muted-foreground flex items-center gap-1"><Zap className="w-2.5 h-2.5" />Ticks</div>
                      <div className="font-bold font-mono">{opp.ticks}</div>
                    </div>
                    <div className="bg-muted rounded p-2">
                      <div className="text-muted-foreground">Valid</div>
                      <div className="font-bold font-mono">{opp.validTime}</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px]">
                    <div className="flex items-center gap-1.5">
                      <div className={`w-2 h-2 rounded-full ${opp.risk === "Low" ? "bg-green-500" : opp.risk === "Medium" ? "bg-yellow-500" : "bg-red-500"}`} />
                      <span className="font-bold uppercase">{opp.risk} RISK</span>
                    </div>
                    <span className="font-mono text-muted-foreground">Last: {opp.lastDigit ?? "—"}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
