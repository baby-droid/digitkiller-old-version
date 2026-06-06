import { useState, useMemo } from "react";
import {
  useDerivWebSocket,
  MARKETS_BY_CATEGORY,
  CATEGORY_LABELS,
  MarketCategory,
} from "@/hooks/useDerivWebSocket";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, Activity } from "lucide-react";

/* ─── per-digit colour palette (0→9) ───────────────────────────────────── */
const D_COLORS = [
  { bg: "#4f46e5", border: "#6366f1", text: "#fff" },
  { bg: "#2563eb", border: "#3b82f6", text: "#fff" },
  { bg: "#0891b2", border: "#06b6d4", text: "#fff" },
  { bg: "#059669", border: "#10b981", text: "#fff" },
  { bg: "#65a30d", border: "#84cc16", text: "#000" },
  { bg: "#d97706", border: "#f59e0b", text: "#000" },
  { bg: "#ea580c", border: "#f97316", text: "#fff" },
  { bg: "#dc2626", border: "#ef4444", text: "#fff" },
  { bg: "#db2777", border: "#ec4899", text: "#fff" },
  { bg: "#9333ea", border: "#a855f7", text: "#fff" },
];

/* ─── Deriv-style digit circle row ─────────────────────────────────────── */
function DigitCircles({
  digits,
  lastDigit,
  window: win,
}: {
  digits: number[];
  lastDigit: number | null;
  window: number;
}) {
  const slice = digits.slice(-win);
  const total = slice.length || 1;

  const counts = new Array(10).fill(0);
  slice.forEach((d) => counts[d]++);
  const pcts = counts.map((c) => (c / total) * 100);

  const maxD = pcts.indexOf(Math.max(...pcts));
  const minD = pcts.indexOf(Math.min(...pcts));

  return (
    <div className="w-full">
      {/* circles row */}
      <div className="flex justify-between items-end gap-1">
        {Array.from({ length: 10 }, (_, i) => {
          const isCurrent = lastDigit === i;
          const isMost    = i === maxD && !isCurrent;
          const isLeast   = i === minD && !isCurrent;

          /* size: 40 px base, scale by frequency vs 10 % baseline */
          const sz = Math.round(Math.max(36, Math.min(64, 40 + (pcts[i] - 10) * 3)));

          /* colours */
          let bgColor     = "transparent";
          let borderColor = "rgba(255,255,255,0.15)";
          let textColor   = "rgba(255,255,255,0.55)";
          let glow        = "none";
          let fontWeight  = "600";

          if (isCurrent) {
            bgColor     = "#00d1d1";
            borderColor = "#00d1d1";
            textColor   = "#000";
            glow        = "0 0 18px rgba(0,209,209,0.7)";
            fontWeight  = "900";
          } else if (isMost) {
            bgColor     = "#2563eb";
            borderColor = "#3b82f6";
            textColor   = "#fff";
            glow        = "0 0 12px rgba(37,99,235,0.5)";
            fontWeight  = "800";
          } else if (isLeast) {
            bgColor     = "#dc2626";
            borderColor = "#ef4444";
            textColor   = "#fff";
            glow        = "0 0 10px rgba(220,38,38,0.4)";
            fontWeight  = "700";
          }

          return (
            <div key={i} className="flex flex-col items-center gap-1 flex-1">
              {/* indicator tab above current digit */}
              <div className="h-4 flex items-end justify-center">
                {isCurrent && (
                  <div
                    className="rounded-sm"
                    style={{
                      width: 10,
                      height: 6,
                      backgroundColor: "#00d1d1",
                      boxShadow: "0 0 6px rgba(0,209,209,0.8)",
                    }}
                  />
                )}
                {isMost && !isCurrent && (
                  <div
                    className="rounded-sm"
                    style={{ width: 8, height: 5, backgroundColor: "#3b82f6" }}
                  />
                )}
              </div>

              {/* the circle */}
              <div
                className="rounded-full flex items-center justify-center transition-all duration-300 select-none border-2"
                style={{
                  width:  sz,
                  height: sz,
                  backgroundColor: bgColor,
                  borderColor,
                  color: textColor,
                  boxShadow: glow,
                  fontSize: sz >= 52 ? 20 : sz >= 44 ? 17 : 14,
                  fontWeight,
                }}
              >
                {i}
              </div>

              {/* percentage label */}
              <span
                className="font-mono text-center leading-none"
                style={{
                  fontSize: 10,
                  color: isCurrent ? "#00d1d1" : isMost ? "#60a5fa" : isLeast ? "#f87171" : "rgba(255,255,255,0.45)",
                  fontWeight: isCurrent || isMost ? 700 : 400,
                }}
              >
                {pcts[i].toFixed(1)}%
              </span>
            </div>
          );
        })}
      </div>

      {/* legend */}
      <div className="flex items-center gap-4 mt-3 text-[10px] text-muted-foreground flex-wrap">
        <span className="flex items-center gap-1">
          <span className="inline-block w-2.5 h-2 rounded-sm" style={{ backgroundColor: "#00d1d1" }} />
          current digit
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-2.5 h-2 rounded-sm" style={{ backgroundColor: "#2563eb" }} />
          most frequent ({maxD} · {pcts[maxD].toFixed(1)}%)
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-2.5 h-2 rounded-sm" style={{ backgroundColor: "#dc2626" }} />
          least frequent ({minD} · {pcts[minD].toFixed(1)}%)
        </span>
      </div>
    </div>
  );
}

/* ─── Triangle indicator ───────────────────────────────────────────────── */
function TriangleIndicator({ digit }: { digit: number | null }) {
  const pct = digit !== null ? (digit / 9) * 100 : 0;
  return (
    <div className="relative w-full select-none">
      <div className="relative h-6 flex items-center mt-2">
        <div className="absolute inset-x-0 h-1 bg-muted rounded-full" />
        <div
          className="absolute inset-x-0 h-1 rounded-full opacity-40"
          style={{ background: "linear-gradient(to right,#4f46e5,#2563eb,#0891b2,#059669,#65a30d,#d97706,#ea580c,#dc2626,#db2777,#9333ea)" }}
        />
        <div
          className="absolute top-0 transition-all duration-300 ease-out"
          style={{ left: `calc(${pct}% - 8px)`, marginLeft: digit === 0 ? "4px" : digit === 9 ? "-4px" : "0" }}
        >
          <div
            className="w-0 h-0"
            style={{
              borderLeft: "8px solid transparent",
              borderRight: "8px solid transparent",
              borderTop: `14px solid ${digit !== null ? D_COLORS[digit].border : "#666"}`,
              filter: digit !== null ? `drop-shadow(0 0 4px ${D_COLORS[digit].border})` : "none",
            }}
          />
        </div>
        <div className="absolute inset-x-0 flex">
          {Array.from({ length: 10 }, (_, i) => (
            <div key={i} className="flex-1 flex justify-center">
              <div
                className="w-2 h-2 rounded-full border transition-all duration-300"
                style={{
                  backgroundColor: digit === i ? D_COLORS[i].bg : "transparent",
                  borderColor: D_COLORS[i].border,
                  opacity: digit === i ? 1 : 0.35,
                  boxShadow: digit === i ? `0 0 8px ${D_COLORS[i].border}` : "none",
                }}
              />
            </div>
          ))}
        </div>
      </div>
      {/* digit labels under track */}
      <div className="flex mt-1">
        {Array.from({ length: 10 }, (_, i) => (
          <div key={i} className="flex-1 text-center text-[9px] font-mono font-bold" style={{ color: D_COLORS[i].border, opacity: digit === i ? 1 : 0.45 }}>
            {i}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Main page ─────────────────────────────────────────────────────────── */
export default function WideEye() {
  const [selectedMarket,     setSelectedMarket]     = useState("R_10");
  const [tickWindow,         setTickWindow]         = useState(1000);
  const [overUnderThreshold, setOverUnderThreshold] = useState(5);

  const { digits, lastDigit, currentPrice, isConnected, historyLoaded } =
    useDerivWebSocket(selectedMarket);

  const displayDigits = useMemo(
    () => digits.slice(-tickWindow).map((d) => d.digit),
    [digits, tickWindow]
  );

  const freqs = useMemo(() => {
    const f = new Array(10).fill(0);
    displayDigits.forEach((d) => f[d]++);
    const n = displayDigits.length || 1;
    return f.map((c) => ({ count: c, pct: (c / n) * 100 }));
  }, [displayDigits]);

  const maxFreqDigit = freqs.reduce((mx, f, i) => (f.pct > freqs[mx].pct ? i : mx), 0);
  const minFreqDigit = freqs.reduce((mn, f, i) => (f.pct < freqs[mn].pct ? i : mn), 0);

  const total      = displayDigits.length || 1;
  const evenCount  = displayDigits.filter((d) => d % 2 === 0).length;
  const oddCount   = total - evenCount;
  const overCount  = displayDigits.filter((d) => d > overUnderThreshold).length;
  const underCount = displayDigits.filter((d) => d < overUnderThreshold).length;
  const equalCount = displayDigits.filter((d) => d === overUnderThreshold).length;

  const allMarkets = Object.entries(MARKETS_BY_CATEGORY);

  /* price display: format using current pip size if we know it */
  const priceStr = currentPrice !== null
    ? currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 5 })
    : "—";

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Eye className="w-6 h-6 text-primary" /> Wide Eye View
          </h1>
          <p className="text-muted-foreground text-sm">
            Real-time digit distribution — last {displayDigits.length} ticks
          </p>
        </div>
        <Badge
          variant="outline"
          className={`gap-1.5 font-mono text-xs ${isConnected ? "border-green-500/30 text-green-400" : "border-red-500/30 text-red-400"}`}
        >
          <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? "bg-green-500 animate-pulse" : "bg-red-500"}`} />
          {isConnected ? "Live" : "Connecting..."}
        </Badge>
      </div>

      {/* ── Market selector + price display (matches screenshot layout) ── */}
      <Card className="bg-card border-border">
        <CardContent className="p-4 space-y-4">
          {/* row 1: Select Market label + dropdown */}
          <div>
            <label className="text-sm font-semibold text-muted-foreground mb-1.5 block">
              Select Market:
            </label>
            <select
              value={selectedMarket}
              onChange={(e) => setSelectedMarket(e.target.value)}
              className="w-full bg-background border border-border text-foreground rounded-md px-3 py-2 text-sm font-mono focus:outline-none focus:border-primary"
            >
              {allMarkets.map(([cat, mkts]) => (
                <optgroup key={cat} label={CATEGORY_LABELS[cat as MarketCategory]}>
                  {mkts.map((m) => (
                    <option key={m.symbol} value={m.symbol}>{m.name}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          {/* row 2: price (large left) + current digit (large right) — exactly like screenshot */}
          <div
            className="flex items-center justify-between rounded-lg px-5 py-3 border border-border/60"
            style={{ background: "rgba(0,209,209,0.03)" }}
          >
            <span
              className="font-mono font-bold tracking-tight"
              style={{ fontSize: 28, color: "hsl(var(--foreground))" }}
            >
              {priceStr}
            </span>

            {lastDigit !== null ? (
              <div
                className="rounded-full flex items-center justify-center font-black border-2 transition-all duration-300"
                style={{
                  width: 56, height: 56,
                  fontSize: 26,
                  backgroundColor: "#00d1d1",
                  borderColor: "#00d1d1",
                  color: "#000",
                  boxShadow: "0 0 24px rgba(0,209,209,0.6)",
                }}
              >
                {lastDigit}
              </div>
            ) : (
              <div className="w-14 h-14 rounded-full border border-border/40 bg-muted/30 animate-pulse" />
            )}
          </div>

          {/* row 3: tick window controls */}
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex items-center gap-2">
              <label className="text-xs text-muted-foreground font-semibold whitespace-nowrap">
                Ticks window:
              </label>
              <input
                type="number"
                min={50}
                max={5000}
                value={tickWindow}
                onChange={(e) => setTickWindow(Math.max(50, Math.min(5000, +e.target.value)))}
                className="w-24 bg-background border border-border text-foreground rounded px-2 py-1 text-sm font-mono focus:outline-none focus:border-primary"
              />
              <span className="text-xs text-muted-foreground">(50–5000)</span>
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {[100, 500, 1000, 2000].map((n) => (
                <button
                  key={n}
                  onClick={() => setTickWindow(n)}
                  className={`px-3 py-1 rounded text-xs font-bold border transition-colors ${
                    tickWindow === n
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
            <div className="ml-auto text-xs font-mono text-muted-foreground">
              {!historyLoaded
                ? <span className="text-yellow-400 animate-pulse">loading history…</span>
                : <span className="text-green-400">{displayDigits.length}/{tickWindow}</span>}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Digit Circles (main feature matching the screenshot) ── */}
      <Card className="bg-card border-border">
        <CardHeader className="py-3 px-5 border-b border-border">
          <CardTitle className="text-xs font-bold uppercase text-muted-foreground">
            Last {displayDigits.length} ticks digit distribution
          </CardTitle>
        </CardHeader>
        <CardContent className="px-5 pt-5 pb-4">
          {displayDigits.length < 10 ? (
            <div className="flex flex-col items-center py-10 gap-3 text-muted-foreground">
              <Activity className="w-8 h-8 opacity-20 animate-spin" style={{ animationDuration: "3s" }} />
              <p className="text-sm">Loading ticks…</p>
            </div>
          ) : (
            <DigitCircles
              digits={displayDigits}
              lastDigit={lastDigit}
              window={tickWindow}
            />
          )}
        </CardContent>
      </Card>

      {/* ── Triangle sliding indicator ── */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-1 px-5 pt-4">
          <CardTitle className="text-xs font-bold uppercase text-muted-foreground">
            Live Digit Indicator
          </CardTitle>
        </CardHeader>
        <CardContent className="px-8 pb-5">
          <TriangleIndicator digit={lastDigit} />
        </CardContent>
      </Card>

      {/* ── Rolling tick stream ── */}
      <Card className="bg-card border-border">
        <CardHeader className="py-3 px-5 border-b border-border flex flex-row items-center justify-between">
          <CardTitle className="text-xs font-bold uppercase text-muted-foreground">
            Rolling Tick Stream
          </CardTitle>
          <span className="text-[10px] font-mono text-muted-foreground">
            last {Math.min(displayDigits.length, 200)} of {displayDigits.length} ticks
          </span>
        </CardHeader>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-1">
            {displayDigits.slice(-200).map((d, i, arr) => {
              const isLatest = i === arr.length - 1;
              return (
                <div key={i} className="relative">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black border transition-all ${
                      isLatest ? "ring-2 ring-primary ring-offset-1 ring-offset-background" : ""
                    }`}
                    style={{
                      backgroundColor: D_COLORS[d].bg,
                      borderColor:     D_COLORS[d].border,
                      color:           D_COLORS[d].text,
                    }}
                  >
                    {d}
                  </div>
                  {isLatest && (
                    <div
                      className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-0 h-0"
                      style={{
                        borderLeft:   "5px solid transparent",
                        borderRight:  "5px solid transparent",
                        borderTop:    `8px solid ${D_COLORS[d].border}`,
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
          <p className="mt-2 text-[10px] text-muted-foreground">▼ = latest · colour = digit 0(indigo)→9(purple)</p>
        </CardContent>
      </Card>

      {/* ── Even / Odd ── */}
      <Card className="bg-card border-border">
        <CardHeader className="py-3 px-5 border-b border-border">
          <CardTitle className="text-xs font-bold uppercase text-muted-foreground">Even / Odd</CardTitle>
        </CardHeader>
        <CardContent className="p-5 grid grid-cols-2 gap-5">
          {[
            { label: "Even", count: evenCount, pct: (evenCount / total) * 100, color: "#22c55e" },
            { label: "Odd",  count: oddCount,  pct: (oddCount  / total) * 100, color: "#ef4444" },
          ].map(({ label, count, pct, color }) => (
            <div key={label}>
              <div className="flex justify-between items-baseline mb-2">
                <span className="font-bold text-lg">{label}</span>
                <span className="font-mono text-xl font-black">
                  {count} <span className="text-sm text-muted-foreground">({pct.toFixed(1)}%)</span>
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
              </div>
            </div>
          ))}
          <div className="col-span-2 mt-1">
            <div className="text-xs font-bold text-muted-foreground mb-2">Recent 20</div>
            <div className="flex flex-wrap gap-1">
              {displayDigits.slice(-20).map((d, i) => (
                <div
                  key={i}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black border"
                  style={{
                    backgroundColor: d % 2 === 0 ? "#16a34a" : "#dc2626",
                    borderColor:     d % 2 === 0 ? "#22c55e" : "#ef4444",
                    color: "#fff",
                  }}
                >
                  {d % 2 === 0 ? "E" : "O"}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Over / Under ── */}
      <Card className="bg-card border-border">
        <CardHeader className="py-3 px-5 border-b border-border flex flex-row items-center justify-between">
          <CardTitle className="text-xs font-bold uppercase text-muted-foreground">Over / Under</CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Threshold:</span>
            <select
              value={overUnderThreshold}
              onChange={(e) => setOverUnderThreshold(+e.target.value)}
              className="bg-background border border-border text-foreground rounded px-2 py-1 text-xs font-mono focus:outline-none focus:border-primary"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
        </CardHeader>
        <CardContent className="p-5 grid grid-cols-3 gap-4">
          {[
            { label: "Under", count: underCount, pct: (underCount / total) * 100, color: "#3b82f6" },
            { label: "Equal", count: equalCount, pct: (equalCount / total) * 100, color: "#6b7280" },
            { label: "Over",  count: overCount,  pct: (overCount  / total) * 100, color: "#ef4444" },
          ].map(({ label, count, pct, color }) => (
            <div key={label} className="text-center">
              <div className="font-bold text-sm mb-1">{label}</div>
              <div className="font-mono text-xl font-black">
                {count} <span className="text-xs text-muted-foreground">({pct.toFixed(1)}%)</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden mt-2">
                <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
              </div>
            </div>
          ))}
          <div className="col-span-3 mt-2">
            <div className="text-xs font-bold text-muted-foreground mb-2">Recent 20</div>
            <div className="flex flex-wrap gap-1">
              {displayDigits.slice(-20).map((d, i) => {
                const lbl = d < overUnderThreshold ? "U" : d === overUnderThreshold ? "=" : "O";
                const clr = d < overUnderThreshold ? "#2563eb" : d === overUnderThreshold ? "#4b5563" : "#dc2626";
                return (
                  <div
                    key={i}
                    className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black border"
                    style={{ backgroundColor: clr, borderColor: clr, color: "#fff" }}
                  >
                    {lbl}
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
