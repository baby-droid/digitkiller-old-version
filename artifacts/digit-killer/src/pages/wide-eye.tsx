import { useState, useEffect, useMemo, useRef } from "react";
import { useDerivWebSocket, MARKETS, MARKETS_BY_CATEGORY, CATEGORY_LABELS, MarketCategory } from "@/hooks/useDerivWebSocket";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, TrendingUp, TrendingDown, Activity } from "lucide-react";

const TICK_WINDOW = 120;

const DIGIT_COLORS: Record<number, { bg: string; text: string; border: string }> = {
  0: { bg: "#4f46e5", text: "#ffffff", border: "#6366f1" },
  1: { bg: "#2563eb", text: "#ffffff", border: "#3b82f6" },
  2: { bg: "#0891b2", text: "#ffffff", border: "#06b6d4" },
  3: { bg: "#059669", text: "#ffffff", border: "#10b981" },
  4: { bg: "#65a30d", text: "#000000", border: "#84cc16" },
  5: { bg: "#d97706", text: "#000000", border: "#f59e0b" },
  6: { bg: "#ea580c", text: "#ffffff", border: "#f97316" },
  7: { bg: "#dc2626", text: "#ffffff", border: "#ef4444" },
  8: { bg: "#db2777", text: "#ffffff", border: "#ec4899" },
  9: { bg: "#9333ea", text: "#ffffff", border: "#a855f7" },
};

function TriangleIndicator({ digit }: { digit: number | null }) {
  const pct = digit !== null ? (digit / 9) * 100 : 0;
  return (
    <div className="relative w-full select-none">
      {/* Digit labels row */}
      <div className="flex mb-1">
        {Array.from({ length: 10 }, (_, i) => (
          <div key={i} className="flex-1 text-center text-xs font-mono font-bold" style={{ color: DIGIT_COLORS[i].border }}>
            {i}
          </div>
        ))}
      </div>
      {/* Triangle track */}
      <div className="relative h-6 flex items-center">
        {/* Track background */}
        <div className="absolute inset-x-0 h-1 bg-muted rounded-full" />
        {/* Color gradient track */}
        <div
          className="absolute inset-x-0 h-1 rounded-full opacity-40"
          style={{ background: "linear-gradient(to right,#4f46e5,#2563eb,#0891b2,#059669,#65a30d,#d97706,#ea580c,#dc2626,#db2777,#9333ea)" }}
        />
        {/* Moving triangle pointer */}
        <div
          className="absolute top-0 transition-all duration-300 ease-out"
          style={{ left: `calc(${pct}% - 8px)`, marginLeft: digit === 0 ? "4px" : digit === 9 ? "-4px" : "0" }}
        >
          <div
            className="w-0 h-0"
            style={{
              borderLeft: "8px solid transparent",
              borderRight: "8px solid transparent",
              borderTop: `14px solid ${digit !== null ? DIGIT_COLORS[digit].border : "#666"}`,
              filter: digit !== null ? `drop-shadow(0 0 4px ${DIGIT_COLORS[digit].border})` : "none",
            }}
          />
        </div>
        {/* Dot markers at each digit position */}
        <div className="absolute inset-x-0 flex">
          {Array.from({ length: 10 }, (_, i) => (
            <div key={i} className="flex-1 flex justify-center">
              <div
                className="w-2 h-2 rounded-full border"
                style={{
                  backgroundColor: digit === i ? DIGIT_COLORS[i].bg : "transparent",
                  borderColor: DIGIT_COLORS[i].border,
                  opacity: digit === i ? 1 : 0.4,
                  boxShadow: digit === i ? `0 0 8px ${DIGIT_COLORS[i].border}` : "none",
                  transition: "all 0.3s ease",
                }}
              />
            </div>
          ))}
        </div>
      </div>
      {/* Current digit large display */}
      {digit !== null && (
        <div className="flex justify-center mt-2">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-2xl font-black border-2 transition-all duration-300"
            style={{
              backgroundColor: DIGIT_COLORS[digit].bg,
              borderColor: DIGIT_COLORS[digit].border,
              color: DIGIT_COLORS[digit].text,
              boxShadow: `0 0 20px ${DIGIT_COLORS[digit].border}60`,
            }}
          >
            {digit}
          </div>
        </div>
      )}
    </div>
  );
}

function DigitBubble({ digit, size = "md" }: { digit: number; size?: "sm" | "md" }) {
  const c = DIGIT_COLORS[digit];
  const cls = size === "sm" ? "w-6 h-6 text-[10px]" : "w-8 h-8 text-xs";
  return (
    <div
      className={`${cls} rounded-full flex items-center justify-center font-black border transition-all`}
      style={{ backgroundColor: c.bg, borderColor: c.border, color: c.text }}
    >
      {digit}
    </div>
  );
}

export default function WideEye() {
  const [selectedMarket, setSelectedMarket] = useState("R_10");
  const [tickWindow, setTickWindow] = useState(120);
  const [overUnderThreshold, setOverUnderThreshold] = useState(5);

  const { digits, lastDigit, currentPrice, isConnected } = useDerivWebSocket(selectedMarket);

  const displayDigits = useMemo(() => digits.slice(-tickWindow).map((d) => d.digit), [digits, tickWindow]);

  const freqs = useMemo(() => {
    const f = new Array(10).fill(0);
    displayDigits.forEach((d) => f[d]++);
    return f.map((c) => ({ count: c, pct: displayDigits.length > 0 ? (c / displayDigits.length) * 100 : 0 }));
  }, [displayDigits]);

  const maxFreqDigit = freqs.reduce((mx, f, i) => (f.pct > freqs[mx].pct ? i : mx), 0);
  const minFreqDigit = freqs.reduce((mn, f, i) => (f.pct < freqs[mn].pct ? i : mn), 0);

  const evenCount = displayDigits.filter((d) => d % 2 === 0).length;
  const oddCount = displayDigits.filter((d) => d % 2 !== 0).length;
  const total = displayDigits.length || 1;

  const overCount = displayDigits.filter((d) => d > overUnderThreshold).length;
  const underCount = displayDigits.filter((d) => d < overUnderThreshold).length;
  const equalCount = displayDigits.filter((d) => d === overUnderThreshold).length;

  const allMarkets = Object.entries(MARKETS_BY_CATEGORY);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Eye className="w-6 h-6 text-primary" /> Wide Eye View
          </h1>
          <p className="text-muted-foreground text-sm">{tickWindow} tick real-time digit analysis with live triangle indicator</p>
        </div>
        <Badge variant="outline" className={`gap-1.5 font-mono text-xs ${isConnected ? "border-green-500/30 text-green-400" : "border-red-500/30 text-red-400"}`}>
          <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? "bg-green-500 animate-pulse" : "bg-red-500"}`} />
          {isConnected ? "Live" : "Connecting..."}
        </Badge>
      </div>

      {/* Market + Controls */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-48">
              <label className="text-xs font-bold text-muted-foreground uppercase mb-1.5 block">Select Market</label>
              <select
                value={selectedMarket}
                onChange={(e) => setSelectedMarket(e.target.value)}
                className="w-full bg-background border border-border text-foreground rounded-md px-3 py-2 text-sm font-mono focus:outline-none focus:border-primary"
              >
                {allMarkets.map(([cat, markets]) => (
                  <optgroup key={cat} label={CATEGORY_LABELS[cat as MarketCategory]}>
                    {markets.map((m) => (
                      <option key={m.symbol} value={m.symbol}>{m.name}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase mb-1.5 block">
                Tick Window — <span className="text-primary font-black">{tickWindow} ticks</span>
              </label>
              {/* Preset buttons */}
              <div className="flex items-center gap-1.5 flex-wrap mb-2">
                {[100, 120, 200, 300, 500].map((n) => (
                  <button
                    key={n}
                    onClick={() => setTickWindow(n)}
                    className={`px-3 py-1.5 rounded text-xs font-bold border transition-colors ${
                      tickWindow === n
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-muted text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
              {/* Custom input */}
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={50}
                  max={1000}
                  value={tickWindow}
                  onChange={(e) => setTickWindow(Math.max(50, Math.min(1000, +e.target.value)))}
                  className="w-24 bg-background border border-border text-foreground rounded-md px-3 py-2 text-sm font-mono focus:outline-none focus:border-primary"
                />
                <span className="text-xs text-muted-foreground font-mono">custom (50–1000)</span>
              </div>
            </div>

            {/* Live price + digit */}
            <div className="flex-1 min-w-48">
              <div className="bg-muted/50 border border-border rounded-lg px-4 py-2 flex items-center justify-between">
                <span className="font-mono text-2xl font-bold">{currentPrice?.toFixed(2) ?? "—"}</span>
                {lastDigit !== null && (
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-2xl font-black border-2 flex-shrink-0"
                    style={{
                      backgroundColor: DIGIT_COLORS[lastDigit].bg,
                      borderColor: DIGIT_COLORS[lastDigit].border,
                      color: DIGIT_COLORS[lastDigit].text,
                      boxShadow: `0 0 20px ${DIGIT_COLORS[lastDigit].border}80`,
                    }}
                  >
                    {lastDigit}
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Triangle Indicator */}
      <Card className="bg-card border-border" style={{ boxShadow: "inset 0 0 40px rgba(0,209,209,0.03)" }}>
        <CardHeader className="pb-2 px-5 pt-4">
          <CardTitle className="text-xs font-bold uppercase text-muted-foreground">Live Digit Indicator</CardTitle>
        </CardHeader>
        <CardContent className="px-8 pb-5">
          <TriangleIndicator digit={lastDigit} />
        </CardContent>
      </Card>

      {/* Rolling Tick Stream — constant tickWindow slots */}
      <Card className="bg-card border-border">
        <CardHeader className="py-3 px-5 border-b border-border flex flex-row items-center justify-between">
          <CardTitle className="text-xs font-bold uppercase text-muted-foreground">
            Rolling {tickWindow}-Tick Stream
          </CardTitle>
          <div className="flex items-center gap-3">
            {displayDigits.length < tickWindow && (
              <span className="text-[10px] text-yellow-400 font-mono animate-pulse">
                filling… {displayDigits.length}/{tickWindow}
              </span>
            )}
            {displayDigits.length >= tickWindow && (
              <span className="text-[10px] text-green-400 font-mono">● live rolling window</span>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-4">
          {/* Fixed grid: always tickWindow slots — empty slots are grey placeholders */}
          <div className="flex flex-wrap gap-1">
            {Array.from({ length: tickWindow }, (_, slotIndex) => {
              // slots are filled right-to-left: last slot = most recent tick
              const filled = displayDigits.length;
              const emptySlots = tickWindow - filled;
              const digitIndex = slotIndex - emptySlots; // index into displayDigits
              const isLatest = slotIndex === tickWindow - 1;

              if (digitIndex < 0) {
                // unfilled placeholder
                return (
                  <div
                    key={slotIndex}
                    className="w-6 h-6 rounded-full border border-dashed border-border/40 bg-muted/20"
                  />
                );
              }

              const d = displayDigits[digitIndex];
              return (
                <div key={slotIndex} className="relative">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black border transition-all ${isLatest ? "ring-2 ring-primary ring-offset-1 ring-offset-background" : ""}`}
                    style={{
                      backgroundColor: DIGIT_COLORS[d].bg,
                      borderColor: DIGIT_COLORS[d].border,
                      color: DIGIT_COLORS[d].text,
                    }}
                  >
                    {d}
                  </div>
                  {isLatest && (
                    <div
                      className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-0 h-0"
                      style={{
                        borderLeft: "5px solid transparent",
                        borderRight: "5px solid transparent",
                        borderTop: `8px solid ${DIGIT_COLORS[d].border}`,
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
          <div className="mt-3 flex items-center gap-4 text-[10px] text-muted-foreground">
            <span>▼ = latest digit</span>
            <span>· color = digit value (0 indigo → 9 purple)</span>
            <span>· <span className="border border-dashed border-border/60 px-1 rounded">empty</span> = awaiting ticks</span>
          </div>
        </CardContent>
      </Card>

      {/* Digit Distribution */}
      <Card className="bg-card border-border">
        <CardHeader className="py-3 px-5 border-b border-border flex flex-row items-center justify-between">
          <CardTitle className="text-xs font-bold uppercase text-muted-foreground">
            Last {tickWindow} Ticks Digit Distribution
          </CardTitle>
          <div className="flex items-center gap-3 text-[10px] text-muted-foreground font-mono">
            <span className="text-green-400">▲ = most frequent</span>
            <span className="text-red-400">▼ = least frequent</span>
          </div>
        </CardHeader>
        <CardContent className="p-5">
          <div className="grid grid-cols-5 md:grid-cols-10 gap-3">
            {freqs.map(({ count, pct }, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-black border-2 relative"
                  style={{
                    backgroundColor: DIGIT_COLORS[i].bg,
                    borderColor: i === maxFreqDigit ? "#22c55e" : i === minFreqDigit ? "#ef4444" : DIGIT_COLORS[i].border,
                    color: DIGIT_COLORS[i].text,
                    boxShadow: i === maxFreqDigit
                      ? "0 0 15px rgba(34,197,94,0.5)"
                      : i === minFreqDigit
                      ? "0 0 15px rgba(239,68,68,0.3)"
                      : "none",
                  }}
                >
                  {i}
                  {i === maxFreqDigit && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <div className="w-0 h-0"
                        style={{ borderLeft: "5px solid transparent", borderRight: "5px solid transparent", borderBottom: "7px solid #22c55e" }} />
                    </div>
                  )}
                  {i === minFreqDigit && (
                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2">
                      <div className="w-0 h-0"
                        style={{ borderLeft: "5px solid transparent", borderRight: "5px solid transparent", borderTop: "7px solid #ef4444" }} />
                    </div>
                  )}
                </div>
                <div className="text-center">
                  <div className="text-xs font-bold font-mono">{pct.toFixed(1)}%</div>
                  <div className="text-[9px] text-muted-foreground">{count}</div>
                </div>
                {/* Freq bar */}
                <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${pct * 10}%`, backgroundColor: DIGIT_COLORS[i].border }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 flex gap-2 text-[10px] text-muted-foreground">
            <span className="text-green-400">current digit</span>
            <span>/</span>
            <span>most frequent = {maxFreqDigit} ({freqs[maxFreqDigit].pct.toFixed(1)}%)</span>
            <span>/</span>
            <span>least frequent = {minFreqDigit} ({freqs[minFreqDigit].pct.toFixed(1)}%)</span>
          </div>
        </CardContent>
      </Card>

      {/* Even/Odd */}
      <Card className="bg-card border-border">
        <CardHeader className="py-3 px-5 border-b border-border">
          <CardTitle className="text-xs font-bold uppercase text-muted-foreground">Even / Odd</CardTitle>
        </CardHeader>
        <CardContent className="p-5 grid grid-cols-2 gap-5">
          {[
            { label: "Even", count: evenCount, pct: (evenCount / total) * 100, color: "#22c55e" },
            { label: "Odd", count: oddCount, pct: (oddCount / total) * 100, color: "#ef4444" },
          ].map(({ label, count, pct, color }) => (
            <div key={label}>
              <div className="flex justify-between items-baseline mb-2">
                <span className="font-bold text-lg">{label}</span>
                <span className="font-mono text-2xl font-black">{count} <span className="text-sm text-muted-foreground">({pct.toFixed(1)}%)</span></span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
              </div>
            </div>
          ))}
          <div className="col-span-2 mt-2">
            <div className="text-xs font-bold text-muted-foreground mb-2">Recent E/O</div>
            <div className="flex flex-wrap gap-1">
              {displayDigits.slice(-20).map((d, i) => (
                <div
                  key={i}
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black border`}
                  style={{
                    backgroundColor: d % 2 === 0 ? "#16a34a" : "#dc2626",
                    borderColor: d % 2 === 0 ? "#22c55e" : "#ef4444",
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

      {/* Over/Under */}
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
              {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        </CardHeader>
        <CardContent className="p-5 grid grid-cols-3 gap-4">
          {[
            { label: "Under", count: underCount, pct: (underCount / total) * 100, color: "#3b82f6" },
            { label: "Equal", count: equalCount, pct: (equalCount / total) * 100, color: "#6b7280" },
            { label: "Over", count: overCount, pct: (overCount / total) * 100, color: "#ef4444" },
          ].map(({ label, count, pct, color }) => (
            <div key={label} className="text-center">
              <div className="font-bold text-sm mb-1">{label}</div>
              <div className="font-mono text-xl font-black">{count} <span className="text-xs text-muted-foreground">({pct.toFixed(1)}%)</span></div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden mt-2">
                <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
              </div>
            </div>
          ))}
          <div className="col-span-3 mt-2">
            <div className="text-xs font-bold text-muted-foreground mb-2">Recent U/=/O</div>
            <div className="flex flex-wrap gap-1">
              {displayDigits.slice(-20).map((d, i) => {
                const label = d < overUnderThreshold ? "U" : d === overUnderThreshold ? "=" : "O";
                const clr = d < overUnderThreshold ? "#2563eb" : d === overUnderThreshold ? "#4b5563" : "#dc2626";
                return (
                  <div key={i} className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black border" style={{ backgroundColor: clr, borderColor: clr, color: "#fff" }}>
                    {label}
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
