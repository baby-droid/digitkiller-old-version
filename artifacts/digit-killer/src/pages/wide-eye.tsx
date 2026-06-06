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

/* ── page accent colour ─────────────────────────────────────────────────── */
const ACCENT = "#16a34a"; // dark green

/* ── per-digit colour palette ───────────────────────────────────────────── */
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

/* ── rank colours for bars ──────────────────────────────────────────────── */
const BAR_COLOR = (rank: number) =>
  rank === 0 ? "#22c55e"  // green  – highest
  : rank === 1 ? "#3b82f6" // blue   – 2nd highest
  : rank === 8 ? "#eab308" // yellow – 2nd lowest
  : rank === 9 ? "#ef4444" // red    – lowest
  : "rgba(255,255,255,0.18)";

/* ── Digit Circles ──────────────────────────────────────────────────────── */
function DigitCircles({ digits, lastDigit }: { digits: number[]; lastDigit: number | null }) {
  const total  = digits.length || 1;
  const counts = new Array(10).fill(0);
  digits.forEach((d) => counts[d]++);
  const pcts = counts.map((c) => (c / total) * 100);
  const maxPct = Math.max(...pcts);

  /* rank 0 = highest freq, rank 9 = lowest */
  const ranked = [...pcts]
    .map((p, i) => ({ p, i }))
    .sort((a, b) => b.p - a.p)
    .map((o, rank) => ({ ...o, rank }));
  const rankOf: Record<number, number> = {};
  ranked.forEach(({ i, rank }) => { rankOf[i] = rank; });

  return (
    <div className="w-full">
      <div className="flex justify-between items-end gap-0.5">
        {Array.from({ length: 10 }, (_, i) => {
          const isCurrent = lastDigit === i;
          const rank      = rankOf[i];
          const sz        = Math.round(Math.max(36, Math.min(62, 40 + (pcts[i] - 10) * 2.8)));

          let bgColor     = "transparent";
          let borderColor = "rgba(255,255,255,0.15)";
          let textColor   = "rgba(255,255,255,0.55)";
          let glow        = "none";
          let fw          = "600";

          if (isCurrent) {
            bgColor = "#00d1d1"; borderColor = "#00d1d1";
            textColor = "#000"; glow = "0 0 18px rgba(0,209,209,0.7)"; fw = "900";
          } else if (rank === 0) {
            bgColor = "#15803d"; borderColor = "#22c55e";
            textColor = "#fff"; glow = "0 0 10px rgba(34,197,94,0.4)"; fw = "800";
          } else if (rank === 9) {
            bgColor = "#dc2626"; borderColor = "#ef4444";
            textColor = "#fff"; glow = "0 0 10px rgba(220,38,38,0.35)"; fw = "700";
          }

          const barW = maxPct > 0 ? (pcts[i] / maxPct) * 100 : 0;

          return (
            <div key={i} className="flex flex-col items-center gap-0.5 flex-1">
              {/* ── Purple triangle cursor (only on current digit) ── */}
              <div className="h-5 flex items-end justify-center">
                {isCurrent && (
                  <div
                    style={{
                      width: 0, height: 0,
                      borderLeft: "7px solid transparent",
                      borderRight: "7px solid transparent",
                      borderTop: "12px solid #a855f7",
                      filter: "drop-shadow(0 0 5px rgba(168,85,247,0.9))",
                      transition: "all 0.3s ease",
                    }}
                  />
                )}
              </div>

              {/* ── Circle ── */}
              <div
                className="rounded-full flex items-center justify-center border-2 select-none"
                style={{
                  width: sz, height: sz,
                  backgroundColor: bgColor,
                  borderColor,
                  color: textColor,
                  boxShadow: glow,
                  fontSize: sz >= 52 ? 19 : sz >= 44 ? 16 : 13,
                  fontWeight: fw,
                  transition: "all 0.3s ease",
                }}
              >
                {i}
              </div>

              {/* ── Pct label ── */}
              <span
                className="font-mono text-center leading-none"
                style={{
                  fontSize: 9,
                  color: isCurrent ? "#00d1d1" : rank === 0 ? "#4ade80" : rank === 9 ? "#f87171" : "rgba(255,255,255,0.4)",
                  fontWeight: isCurrent || rank <= 1 || rank >= 8 ? 700 : 400,
                }}
              >
                {pcts[i].toFixed(1)}%
              </span>

              {/* ── Frequency bar: green=1st, blue=2nd, yellow=2nd-last, red=last ── */}
              <div
                className="w-full rounded-full overflow-hidden"
                style={{ height: 4, backgroundColor: "rgba(255,255,255,0.08)" }}
              >
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${barW}%`,
                    backgroundColor: isCurrent ? "#a855f7" : BAR_COLOR(rank),
                    transition: "width 0.5s ease",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* legend */}
      <div className="flex flex-wrap gap-3 mt-3 text-[9px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-1 rounded-full" style={{ backgroundColor: "#a855f7" }} />
          current
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-1 rounded-full bg-green-500" />
          highest
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-1 rounded-full" style={{ backgroundColor: "#3b82f6" }} />
          2nd highest
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-1 rounded-full" style={{ backgroundColor: "#eab308" }} />
          2nd lowest
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-1 rounded-full bg-red-500" />
          lowest
        </span>
      </div>
    </div>
  );
}

/* ── Triangle track indicator ───────────────────────────────────────────── */
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
        {/* purple triangle cursor */}
        <div
          className="absolute top-0 transition-all duration-300 ease-out"
          style={{ left: `calc(${pct}% - 7px)`, marginLeft: digit === 0 ? "4px" : digit === 9 ? "-4px" : "0" }}
        >
          <div
            style={{
              width: 0, height: 0,
              borderLeft: "7px solid transparent",
              borderRight: "7px solid transparent",
              borderTop: "12px solid #a855f7",
              filter: "drop-shadow(0 0 4px rgba(168,85,247,0.9))",
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
      <div className="flex mt-1">
        {Array.from({ length: 10 }, (_, i) => (
          <div
            key={i}
            className="flex-1 text-center font-mono font-bold"
            style={{ fontSize: 9, color: D_COLORS[i].border, opacity: digit === i ? 1 : 0.4 }}
          >
            {i}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Main page ──────────────────────────────────────────────────────────── */
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

  const total      = displayDigits.length || 1;
  const evenCount  = displayDigits.filter((d) => d % 2 === 0).length;
  const oddCount   = total - evenCount;
  const overCount  = displayDigits.filter((d) => d > overUnderThreshold).length;
  const underCount = displayDigits.filter((d) => d < overUnderThreshold).length;
  const equalCount = displayDigits.filter((d) => d === overUnderThreshold).length;

  const allMarkets = Object.entries(MARKETS_BY_CATEGORY);
  const priceStr   = currentPrice !== null
    ? currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 5 })
    : "—";

  /* recent 100 bubbles */
  const recent100 = displayDigits.slice(-100);

  const lastDigitIsEven = lastDigit !== null && lastDigit % 2 === 0;
  const lastDigitClass  = lastDigit !== null
    ? (lastDigit < overUnderThreshold ? "UNDER" : lastDigit === overUnderThreshold ? "EQUAL" : "OVER")
    : "—";

  return (
    <div className="space-y-5">
      {/* ── Green accent stripe ── */}
      <div className="h-0.5 rounded-full -mb-3" style={{ background: `linear-gradient(to right, ${ACCENT}, transparent)` }} />

      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2" style={{ color: ACCENT }}>
            <Eye className="w-6 h-6" /> Wide Eye View
          </h1>
          <p className="text-muted-foreground text-sm">
            Real-time digit distribution · {displayDigits.length} ticks loaded
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

      {/* ── Market selector — dark green theme ── */}
      <Card
        className="border"
        style={{
          background: "linear-gradient(135deg, rgba(5,46,22,0.95) 0%, rgba(3,30,15,0.98) 100%)",
          borderColor: "#166534",
          boxShadow: `0 0 24px rgba(22,163,74,0.15)`,
        }}
      >
        <CardContent className="p-4 space-y-4">
          <div>
            <label className="text-sm font-semibold mb-1.5 block" style={{ color: "#4ade80" }}>
              Select Market:
            </label>
            <select
              value={selectedMarket}
              onChange={(e) => setSelectedMarket(e.target.value)}
              className="w-full rounded-md px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2"
              style={{
                background: "rgba(0,0,0,0.5)",
                border: "1px solid #166534",
                color: "#86efac",
                focusRingColor: "#16a34a",
              }}
            >
              {allMarkets.map(([cat, mkts]) => (
                <optgroup key={cat} label={CATEGORY_LABELS[cat as MarketCategory]}>
                  {mkts.map((m) => (
                    <option key={m.symbol} value={m.symbol} style={{ backgroundColor: "#052e16" }}>
                      {m.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          {/* Price + live digit row */}
          <div
            className="flex items-center justify-between rounded-lg px-5 py-3 border"
            style={{ background: "rgba(0,0,0,0.4)", borderColor: "#14532d" }}
          >
            <span className="font-mono font-bold tracking-tight text-white" style={{ fontSize: 28 }}>
              {priceStr}
            </span>
            {lastDigit !== null ? (
              <div
                className="rounded-full flex items-center justify-center font-black border-2"
                style={{
                  width: 56, height: 56, fontSize: 26,
                  backgroundColor: "#00d1d1", borderColor: "#00d1d1",
                  color: "#000", boxShadow: "0 0 24px rgba(0,209,209,0.6)",
                }}
              >
                {lastDigit}
              </div>
            ) : (
              <div className="w-14 h-14 rounded-full border animate-pulse" style={{ borderColor: "#166534" }} />
            )}
          </div>

          {/* Tick window */}
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold whitespace-nowrap" style={{ color: "#86efac" }}>
                Ticks window:
              </label>
              <input
                type="number"
                min={50} max={5000}
                value={tickWindow}
                onChange={(e) => setTickWindow(Math.max(50, Math.min(5000, +e.target.value)))}
                className="w-24 rounded px-2 py-1 text-sm font-mono focus:outline-none"
                style={{ background: "rgba(0,0,0,0.5)", border: "1px solid #166534", color: "#86efac" }}
              />
              <span className="text-xs" style={{ color: "#4ade8088" }}>(50–5000)</span>
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {[100, 500, 1000, 2000].map((n) => (
                <button
                  key={n}
                  onClick={() => setTickWindow(n)}
                  className="px-3 py-1 rounded text-xs font-bold border transition-all"
                  style={tickWindow === n
                    ? { backgroundColor: "#16a34a", borderColor: "#16a34a", color: "#fff" }
                    : { backgroundColor: "rgba(22,163,74,0.12)", borderColor: "#166534", color: "#4ade80" }
                  }
                >
                  {n}
                </button>
              ))}
            </div>
            <div className="ml-auto text-xs font-mono">
              {!historyLoaded
                ? <span className="text-yellow-400 animate-pulse">loading history…</span>
                : <span style={{ color: "#4ade80" }}>{displayDigits.length}/{tickWindow}</span>}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Digit Circles ── */}
      <Card className="bg-card border-border">
        <CardHeader className="py-3 px-5 border-b border-border flex flex-row items-center justify-between">
          <CardTitle className="text-xs font-bold uppercase text-muted-foreground">
            Last {displayDigits.length} ticks — digit distribution
          </CardTitle>
          <span className="text-[10px] text-muted-foreground font-mono">
            ▼ purple = current digit
          </span>
        </CardHeader>
        <CardContent className="px-5 pt-5 pb-4">
          {displayDigits.length < 10 ? (
            <div className="flex flex-col items-center py-10 gap-3 text-muted-foreground">
              <Activity className="w-8 h-8 opacity-20" style={{ animation: "spin 3s linear infinite" }} />
              <p className="text-sm">Loading ticks…</p>
            </div>
          ) : (
            <DigitCircles digits={displayDigits} lastDigit={lastDigit} />
          )}
        </CardContent>
      </Card>

      {/* ── Triangle Indicator ── */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-1 px-5 pt-4">
          <CardTitle className="text-xs font-bold uppercase text-muted-foreground">
            Live Digit Position — purple triangle cursor
          </CardTitle>
        </CardHeader>
        <CardContent className="px-8 pb-5">
          <TriangleIndicator digit={lastDigit} />
        </CardContent>
      </Card>

      {/* ── Even / Odd — with live digit in centre ── */}
      <Card className="bg-card border-border">
        <CardHeader className="py-3 px-5 border-b border-border">
          <CardTitle className="text-xs font-bold uppercase text-muted-foreground">
            Even / Odd · {displayDigits.length} ticks
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5">
          {/* Three-col: Even | LIVE digit | Odd */}
          <div className="grid grid-cols-3 gap-4 items-center mb-5">
            {/* Even */}
            <div>
              <div className="text-green-400 font-bold text-base mb-1">Even</div>
              <div className="font-mono text-3xl font-black">{evenCount}</div>
              <div className="text-muted-foreground text-sm">{((evenCount / total) * 100).toFixed(1)}%</div>
              <div className="h-2 bg-muted rounded-full mt-2 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${(evenCount / total) * 100}%`, backgroundColor: "#22c55e" }}
                />
              </div>
            </div>

            {/* Middle live digit */}
            <div className="flex flex-col items-center gap-1">
              <span className="text-[10px] text-muted-foreground uppercase font-bold">Live digit</span>
              {lastDigit !== null ? (
                <div
                  className="rounded-full flex items-center justify-center font-black border-2"
                  style={{
                    width: 60, height: 60, fontSize: 28,
                    backgroundColor: lastDigitIsEven ? "#15803d" : "#991b1b",
                    borderColor:     lastDigitIsEven ? "#22c55e" : "#ef4444",
                    color: "#fff",
                    boxShadow: lastDigitIsEven
                      ? "0 0 18px rgba(34,197,94,0.5)"
                      : "0 0 18px rgba(239,68,68,0.5)",
                  }}
                >
                  {lastDigit}
                </div>
              ) : (
                <div className="w-14 h-14 rounded-full border border-border/40 bg-muted/30 animate-pulse" />
              )}
              <span
                className="text-xs font-black"
                style={{ color: lastDigitIsEven ? "#4ade80" : "#f87171" }}
              >
                {lastDigit !== null ? (lastDigitIsEven ? "EVEN" : "ODD") : "—"}
              </span>
            </div>

            {/* Odd */}
            <div className="text-right">
              <div className="text-red-400 font-bold text-base mb-1">Odd</div>
              <div className="font-mono text-3xl font-black">{oddCount}</div>
              <div className="text-muted-foreground text-sm">{((oddCount / total) * 100).toFixed(1)}%</div>
              <div className="h-2 bg-muted rounded-full mt-2 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all ml-auto"
                  style={{ width: `${(oddCount / total) * 100}%`, backgroundColor: "#ef4444" }}
                />
              </div>
            </div>
          </div>

          {/* Recent 100 bubbles showing actual digit values */}
          <div>
            <div className="text-xs font-bold text-muted-foreground mb-2">
              Recent {Math.min(recent100.length, 100)} ticks · E=even O=odd
            </div>
            <div className="flex flex-wrap gap-1">
              {recent100.map((d, i) => (
                <div
                  key={i}
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black"
                  style={{
                    backgroundColor: d % 2 === 0 ? "#15803d" : "#991b1b",
                    borderColor:     d % 2 === 0 ? "#22c55e" : "#ef4444",
                    color: "#fff",
                    border: "1px solid",
                  }}
                  title={`Digit ${d}`}
                >
                  {d}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Over / Under — with live digit in centre ── */}
      <Card className="bg-card border-border">
        <CardHeader className="py-3 px-5 border-b border-border flex flex-row items-center justify-between">
          <CardTitle className="text-xs font-bold uppercase text-muted-foreground">
            Over / Under · {displayDigits.length} ticks
          </CardTitle>
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
        <CardContent className="p-5">
          {/* Three-col: Under | LIVE digit | Over */}
          <div className="grid grid-cols-3 gap-4 items-center mb-4">
            {/* Under */}
            <div>
              <div className="text-blue-400 font-bold text-base mb-1">Under {overUnderThreshold}</div>
              <div className="font-mono text-3xl font-black">{underCount}</div>
              <div className="text-muted-foreground text-sm">{((underCount / total) * 100).toFixed(1)}%</div>
              <div className="h-2 bg-muted rounded-full mt-2 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${(underCount / total) * 100}%`, backgroundColor: "#3b82f6" }}
                />
              </div>
            </div>

            {/* Middle live digit */}
            <div className="flex flex-col items-center gap-1">
              <span className="text-[10px] text-muted-foreground uppercase font-bold">Live digit</span>
              {lastDigit !== null ? (
                <div
                  className="rounded-full flex items-center justify-center font-black border-2"
                  style={{
                    width: 60, height: 60, fontSize: 28,
                    backgroundColor:
                      lastDigitClass === "UNDER" ? "#1e3a8a"
                      : lastDigitClass === "OVER"  ? "#991b1b"
                      : "#374151",
                    borderColor:
                      lastDigitClass === "UNDER" ? "#3b82f6"
                      : lastDigitClass === "OVER"  ? "#ef4444"
                      : "#6b7280",
                    color: "#fff",
                    boxShadow:
                      lastDigitClass === "UNDER" ? "0 0 18px rgba(59,130,246,0.5)"
                      : lastDigitClass === "OVER"  ? "0 0 18px rgba(239,68,68,0.5)"
                      : "none",
                  }}
                >
                  {lastDigit}
                </div>
              ) : (
                <div className="w-14 h-14 rounded-full border border-border/40 bg-muted/30 animate-pulse" />
              )}
              <span
                className="text-xs font-black"
                style={{
                  color: lastDigitClass === "UNDER" ? "#60a5fa"
                    : lastDigitClass === "OVER"  ? "#f87171"
                    : "#9ca3af",
                }}
              >
                {lastDigitClass}
              </span>
            </div>

            {/* Over */}
            <div className="text-right">
              <div className="text-red-400 font-bold text-base mb-1">Over {overUnderThreshold}</div>
              <div className="font-mono text-3xl font-black">{overCount}</div>
              <div className="text-muted-foreground text-sm">{((overCount / total) * 100).toFixed(1)}%</div>
              <div className="h-2 bg-muted rounded-full mt-2 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all ml-auto"
                  style={{ width: `${(overCount / total) * 100}%`, backgroundColor: "#ef4444" }}
                />
              </div>
            </div>
          </div>

          {/* Equal row */}
          <div className="flex items-center gap-3 py-2 px-3 rounded-lg mb-4"
            style={{ background: "rgba(107,114,128,0.1)", border: "1px solid rgba(107,114,128,0.2)" }}>
            <span className="text-xs text-muted-foreground">Equal to {overUnderThreshold}:</span>
            <span className="font-mono font-bold">{equalCount}</span>
            <span className="text-muted-foreground text-xs">({((equalCount / total) * 100).toFixed(1)}%)</span>
          </div>

          {/* Recent 100 showing actual digit values */}
          <div>
            <div className="text-xs font-bold text-muted-foreground mb-2">
              Recent {Math.min(recent100.length, 100)} ticks · U=under ={overUnderThreshold} O=over
            </div>
            <div className="flex flex-wrap gap-1">
              {recent100.map((d, i) => {
                const isUnder = d < overUnderThreshold;
                const isOver  = d > overUnderThreshold;
                return (
                  <div
                    key={i}
                    className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black border"
                    style={{
                      backgroundColor: isUnder ? "#1e3a8a" : isOver ? "#991b1b" : "#374151",
                      borderColor:     isUnder ? "#3b82f6" : isOver ? "#ef4444" : "#6b7280",
                      color: "#fff",
                    }}
                    title={`Digit ${d}`}
                  >
                    {d}
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Rolling tick stream ── */}
      <Card className="bg-card border-border">
        <CardHeader className="py-3 px-5 border-b border-border flex flex-row items-center justify-between">
          <CardTitle className="text-xs font-bold uppercase text-muted-foreground">Rolling Tick Stream</CardTitle>
          <span className="text-[10px] font-mono text-muted-foreground">
            last {Math.min(displayDigits.length, 200)} of {displayDigits.length}
          </span>
        </CardHeader>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-1">
            {displayDigits.slice(-200).map((d, i, arr) => {
              const isLatest = i === arr.length - 1;
              return (
                <div key={i} className="relative">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black border transition-all ${isLatest ? "ring-2 ring-purple-500 ring-offset-1 ring-offset-background" : ""}`}
                    style={{ backgroundColor: D_COLORS[d].bg, borderColor: D_COLORS[d].border, color: D_COLORS[d].text }}
                  >
                    {d}
                  </div>
                  {isLatest && (
                    <div
                      className="absolute -top-2 left-1/2 -translate-x-1/2"
                      style={{
                        width: 0, height: 0,
                        borderLeft: "5px solid transparent",
                        borderRight: "5px solid transparent",
                        borderTop: "8px solid #a855f7",
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
          <p className="mt-2 text-[10px] text-muted-foreground">▼ = latest tick (purple) · digit 0(indigo)→9(purple)</p>
        </CardContent>
      </Card>
    </div>
  );
}
