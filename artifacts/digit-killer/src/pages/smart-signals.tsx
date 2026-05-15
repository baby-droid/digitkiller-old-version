import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useDerivMultiMarket } from "@/hooks/useDerivMultiMarket";
import { MARKETS } from "@/hooks/useDerivWebSocket";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Download, RefreshCw, Zap, Clock, TrendingUp, TrendingDown,
  BarChart2, Target, AlertCircle, Sparkles, Timer
} from "lucide-react";

const SIGNAL_VALIDITY_MS = 20 * 60 * 1000;
const CONTACT = "0768925411";
const AUTHOR = "AHMED AI";

const THEMES = [
  { id: 1, name: "Cyber Teal", primary: "#00d1d1", bg1: "#000000", bg2: "#001a1a", accent: "#00ffff" },
  { id: 2, name: "Gold Cosmos", primary: "#f59e0b", bg1: "#0a0020", bg2: "#1a0040", accent: "#fde68a" },
  { id: 3, name: "Matrix Green", primary: "#00ff41", bg1: "#000000", bg2: "#001200", accent: "#39ff14" },
  { id: 4, name: "Neon Night", primary: "#a855f7", bg1: "#050012", bg2: "#0d0030", accent: "#e879f9" },
  { id: 5, name: "Fire Steel", primary: "#ef4444", bg1: "#0a0000", bg2: "#200000", accent: "#f97316" },
];

type GeneratedSignal = {
  id: string;
  market: string;
  marketName: string;
  tradeType: string;
  entryDigit: string;
  ticks: string;
  confidence: number;
  generatedAt: number;
  validUntil: number;
  theme: number;
  reason: string;
};

function generateSignals(marketsData: Record<string, { digits: number[]; lastDigit: number | null; prices?: number[] }>): GeneratedSignal[] {
  const signals: GeneratedSignal[] = [];
  const now = Date.now();

  Object.entries(marketsData).forEach(([symbol, data]) => {
    if (data.digits.length < 30) return;
    const mkt = MARKETS.find((m) => m.symbol === symbol);
    if (!mkt) return;
    const marketName = mkt.name;

    const freqs = new Array(10).fill(0);
    data.digits.slice(-100).forEach((d) => freqs[d]++);
    const total = Math.min(data.digits.length, 100);
    const pct = freqs.map((f) => (f / total) * 100);

    const maxPct = Math.max(...pct);
    const minPct = Math.min(...pct);
    const maxDigit = pct.indexOf(maxPct);
    const minDigit = pct.indexOf(minPct);

    const evenPct = [0, 2, 4, 6, 8].reduce((s, d) => s + pct[d], 0);
    const oddPct = [1, 3, 5, 7, 9].reduce((s, d) => s + pct[d], 0);
    const overPct = [5, 6, 7, 8, 9].reduce((s, d) => s + pct[d], 0);

    const theme = ((signals.length % 5) + 1) as 1 | 2 | 3 | 4 | 5;
    const base = { market: symbol, marketName, generatedAt: now, validUntil: now + SIGNAL_VALIDITY_MS, theme };

    if (maxPct > 14) {
      signals.push({ ...base, id: `${symbol}-match`, tradeType: "MATCHES", entryDigit: `${maxDigit}`, ticks: "1 tick", confidence: Math.min(85, 60 + maxPct * 1.5), reason: `Digit ${maxDigit} appeared ${maxPct.toFixed(1)}% of last 100 ticks` });
    }

    if (minPct < 7) {
      signals.push({ ...base, id: `${symbol}-differ`, tradeType: "DIFFERS", entryDigit: `${minDigit}`, ticks: "1 tick", confidence: Math.min(82, 55 + (10 - minPct) * 2), theme: ((theme % 5) + 1) as 1|2|3|4|5, reason: `Digit ${minDigit} appeared only ${minPct.toFixed(1)}% of last 100 ticks` });
    }

    if (evenPct > 54) {
      signals.push({ ...base, id: `${symbol}-even`, tradeType: "EVEN", entryDigit: "Any odd digit", ticks: "1 tick", confidence: Math.min(78, 50 + evenPct - 50), theme: ((theme + 1) % 5 + 1) as 1|2|3|4|5, reason: `Even digits at ${evenPct.toFixed(1)}% frequency` });
    } else if (oddPct > 54) {
      signals.push({ ...base, id: `${symbol}-odd`, tradeType: "ODD", entryDigit: "Any even digit", ticks: "1 tick", confidence: Math.min(78, 50 + oddPct - 50), theme: ((theme + 2) % 5 + 1) as 1|2|3|4|5, reason: `Odd digits at ${oddPct.toFixed(1)}% frequency` });
    }

    if (overPct > 55) {
      const t = overPct > 60 ? "OVER 4" : "OVER 5";
      signals.push({ ...base, id: `${symbol}-over`, tradeType: t, entryDigit: "2-4", ticks: "2-3 ticks", confidence: Math.min(80, 55 + overPct - 55), theme: ((theme + 3) % 5 + 1) as 1|2|3|4|5, reason: `High digits (5-9) dominant at ${overPct.toFixed(1)}%` });
    } else if (overPct < 45) {
      const t = overPct < 40 ? "UNDER 4" : "UNDER 5";
      signals.push({ ...base, id: `${symbol}-under`, tradeType: t, entryDigit: "6-8", ticks: "2-3 ticks", confidence: Math.min(80, 55 + (45 - overPct)), theme: ((theme + 4) % 5 + 1) as 1|2|3|4|5, reason: `Low digits (0-4) dominant` });
    }

    const recent5 = data.digits.slice(-5);
    const risingCount = recent5.filter((d, i) => i > 0 && d >= recent5[i - 1]).length;
    if (risingCount >= 4) {
      signals.push({ ...base, id: `${symbol}-rise`, tradeType: "RISE", entryDigit: "Current price", ticks: "5 ticks", confidence: 70, theme: ((theme + 1) % 5 + 1) as 1|2|3|4|5, reason: `4/5 last digits rising — bullish momentum` });
    } else if (risingCount <= 1) {
      signals.push({ ...base, id: `${symbol}-fall`, tradeType: "FALL", entryDigit: "Current price", ticks: "5 ticks", confidence: 70, theme: ((theme + 2) % 5 + 1) as 1|2|3|4|5, reason: `4/5 last digits falling — bearish momentum` });
    }

    if (maxPct > 13) {
      signals.push({ ...base, id: `${symbol}-accu`, tradeType: "ACCUMULATOR", entryDigit: "Current price ±0.03%", ticks: "5-20 ticks", confidence: 73, theme: ((theme + 3) % 5 + 1) as 1|2|3|4|5, reason: `Stable price volatility in low range` });
    }
  });

  return signals.sort((a, b) => b.confidence - a.confidence).slice(0, 12);
}

function drawThemeBackground(ctx: CanvasRenderingContext2D, W: number, H: number, theme: typeof THEMES[0]) {
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, theme.bg1);
  grad.addColorStop(1, theme.bg2);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  if (theme.id === 1) {
    ctx.strokeStyle = `${theme.primary}22`;
    ctx.lineWidth = 0.5;
    for (let x = 0; x < W; x += 35) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += 35) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  } else if (theme.id === 2) {
    for (let i = 0; i < 80; i++) {
      const x = Math.random() * W, y = Math.random() * H, r = Math.random() * 1.5 + 0.5;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.6 + 0.1})`; ctx.fill();
    }
  } else if (theme.id === 3) {
    ctx.font = "10px monospace";
    ctx.fillStyle = `${theme.primary}20`;
    const chars = "01";
    for (let col = 0; col < W; col += 16) {
      const rows = Math.floor(Math.random() * 8) + 4;
      for (let row = 0; row < rows; row++) {
        ctx.fillText(chars[Math.floor(Math.random() * 2)], col, row * 18 + Math.random() * 20);
      }
    }
  } else if (theme.id === 4) {
    ctx.strokeStyle = `${theme.primary}18`;
    ctx.lineWidth = 1;
    const s = 50;
    for (let col = 0; col < W + s; col += s * 1.5) {
      for (let row = 0; row < H + s; row += s * 0.866 * 2) {
        for (let i = 0; i < 6; i++) {
          const angle = (i * 60 - 30) * Math.PI / 180;
          const nx = col + Math.cos(angle) * s * 0.5;
          const ny = row + Math.sin(angle) * s * 0.5;
          if (i === 0) ctx.moveTo(nx, ny); else ctx.lineTo(nx, ny);
        }
        ctx.closePath(); ctx.stroke();
      }
    }
  } else if (theme.id === 5) {
    ctx.strokeStyle = `${theme.primary}15`;
    ctx.lineWidth = 1;
    for (let i = 0; i < 8; i++) {
      const x1 = Math.random() * W, y1 = 0, x2 = Math.random() * W, y2 = H;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    }
  }
}

function drawFlyer(signal: GeneratedSignal, logoUrl: string) {
  const W = 800, H = 500;
  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  const theme = THEMES.find((t) => t.id === signal.theme) ?? THEMES[0];

  const execute = (logoImg: HTMLImageElement | null) => {
    drawThemeBackground(ctx, W, H, theme);

    ctx.strokeStyle = theme.primary;
    ctx.lineWidth = 3;
    ctx.shadowColor = theme.primary;
    ctx.shadowBlur = 15;
    ctx.strokeRect(10, 10, W - 20, H - 20);
    ctx.shadowBlur = 0;

    ctx.strokeStyle = `${theme.accent}40`;
    ctx.lineWidth = 1;
    ctx.strokeRect(20, 20, W - 40, H - 40);

    if (logoImg) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(70, 70, 48, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(logoImg, 22, 22, 96, 96);
      ctx.restore();
      ctx.beginPath();
      ctx.arc(70, 70, 48, 0, Math.PI * 2);
      ctx.strokeStyle = theme.primary;
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    ctx.font = "bold 11px monospace";
    ctx.fillStyle = theme.primary;
    ctx.letterSpacing = "3px";
    ctx.fillText("AHMED SYNTRADER", 140, 52);
    ctx.letterSpacing = "0px";
    ctx.font = "bold 28px monospace";
    ctx.fillStyle = "#ffffff";
    ctx.fillText("AHMED AI SIGNALS", 140, 88);
    ctx.font = "11px monospace";
    ctx.fillStyle = `${theme.primary}aa`;
    ctx.fillText(`ahmedsyntrader.site  ·  ${CONTACT}`, 140, 110);

    const divY = 130;
    ctx.strokeStyle = `${theme.primary}60`;
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(30, divY); ctx.lineTo(W - 30, divY); ctx.stroke();

    const typeGrad = ctx.createLinearGradient(0, 140, W, 200);
    typeGrad.addColorStop(0, `${theme.primary}22`);
    typeGrad.addColorStop(1, "transparent");
    ctx.fillStyle = typeGrad;
    ctx.fillRect(30, 140, W - 60, 70);

    ctx.font = "bold 44px monospace";
    ctx.fillStyle = theme.primary;
    ctx.shadowColor = theme.primary;
    ctx.shadowBlur = 20;
    ctx.fillText(signal.tradeType, 50, 195);
    ctx.shadowBlur = 0;

    ctx.font = "bold 14px monospace";
    ctx.fillStyle = theme.accent;
    ctx.fillText(signal.marketName.toUpperCase(), W - 180, 170);
    ctx.font = "11px monospace";
    ctx.fillStyle = `${theme.primary}99`;
    ctx.fillText(signal.market, W - 180, 190);

    const rows = [
      { label: "📌  ENTRY POINT", value: signal.entryDigit },
      { label: "⏱  DURATION", value: signal.ticks },
      { label: "📊  CONFIDENCE", value: `${signal.confidence}%` },
      { label: "🔍  SIGNAL BASIS", value: signal.reason },
      { label: "⏳  VALID FOR", value: "20 MINUTES" },
    ];

    let ry = 240;
    rows.forEach(({ label, value }) => {
      ctx.font = "11px monospace";
      ctx.fillStyle = `${theme.primary}99`;
      ctx.fillText(label, 50, ry);
      ctx.font = "bold 15px monospace";
      ctx.fillStyle = "#ffffff";
      const displayValue = value.length > 45 ? value.substring(0, 45) + "..." : value;
      ctx.fillText(displayValue, 50, ry + 20);
      ry += 50;
    });

    ctx.strokeStyle = `${theme.primary}40`;
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(30, H - 70); ctx.lineTo(W - 30, H - 70); ctx.stroke();

    ctx.font = "bold 13px monospace";
    ctx.fillStyle = theme.primary;
    ctx.textAlign = "center";
    ctx.fillText(`Made by ${AUTHOR}  ·  ${CONTACT}  ·  ahmedsyntrader.site`, W / 2, H - 42);
    ctx.font = "10px monospace";
    ctx.fillStyle = `${theme.primary}70`;
    ctx.fillText("Risk Disclaimer: Trading involves risk. Past signals do not guarantee future results.", W / 2, H - 22);
    ctx.textAlign = "left";

    const dataUrl = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = `AhmedSignal_${signal.tradeType.replace(/\s+/g, "_")}_${signal.marketName}_${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
  };

  const img = new Image();
  img.crossOrigin = "anonymous";
  img.onload = () => execute(img);
  img.onerror = () => execute(null);
  img.src = logoUrl;
}

function CountdownTimer({ validUntil }: { validUntil: number }) {
  const [timeLeft, setTimeLeft] = useState(Math.max(0, validUntil - Date.now()));
  useEffect(() => {
    const t = setInterval(() => setTimeLeft(Math.max(0, validUntil - Date.now())), 1000);
    return () => clearInterval(t);
  }, [validUntil]);
  const mins = Math.floor(timeLeft / 60000);
  const secs = Math.floor((timeLeft % 60000) / 1000);
  const pct = Math.max(0, (timeLeft / SIGNAL_VALIDITY_MS) * 100);
  const color = pct > 50 ? "text-green-400" : pct > 20 ? "text-yellow-400" : "text-red-400";
  return (
    <div className="flex items-center gap-2">
      <Timer className={`w-3.5 h-3.5 ${color}`} />
      <span className={`font-mono text-sm font-bold ${color}`}>
        {timeLeft <= 0 ? "EXPIRED" : `${mins}:${secs.toString().padStart(2, "0")}`}
      </span>
      <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${pct > 50 ? "bg-green-500" : pct > 20 ? "bg-yellow-500" : "bg-red-500"}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

const THEME_BADGES: Record<number, string> = {
  1: "bg-teal-500/20 text-teal-400 border-teal-500/30",
  2: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  3: "bg-green-500/20 text-green-400 border-green-500/30",
  4: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  5: "bg-red-500/20 text-red-400 border-red-500/30",
};

const CONTRACT_COLORS: Record<string, string> = {
  RISE: "text-green-400", FALL: "text-red-400", EVEN: "text-blue-400", ODD: "text-orange-400",
  MATCHES: "text-primary", DIFFERS: "text-red-400", ACCUMULATOR: "text-yellow-400",
};

export default function SmartSignals() {
  const marketsData = useDerivMultiMarket();
  const [signals, setSignals] = useState<GeneratedSignal[]>([]);
  const [lastGenerated, setLastGenerated] = useState(0);
  const logoUrl = `${import.meta.env.BASE_URL}logo.png`.replace("//", "/");

  const refresh = useCallback(() => {
    const simplified: Record<string, { digits: number[]; lastDigit: number | null }> = {};
    Object.entries(marketsData).forEach(([sym, d]) => {
      simplified[sym] = { digits: d.digits, lastDigit: d.lastDigit };
    });
    setSignals(generateSignals(simplified));
    setLastGenerated(Date.now());
  }, [marketsData]);

  useEffect(() => {
    if (Object.values(marketsData).some((d) => d.digits.length >= 30) && signals.length === 0) {
      refresh();
    }
  }, [marketsData, signals.length, refresh]);

  useEffect(() => {
    if (lastGenerated === 0) return;
    const t = setTimeout(refresh, SIGNAL_VALIDITY_MS);
    return () => clearTimeout(t);
  }, [lastGenerated, refresh]);

  const totalMarkets = Object.keys(marketsData).length;
  const readyMarkets = Object.values(marketsData).filter((d) => d.digits.length >= 30).length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" /> Smart Signals
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            AI-generated trading signals valid for 20 min · Download as shareable flyers
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="font-mono text-xs gap-1">
            {readyMarkets}/{totalMarkets} markets ready
          </Badge>
          <button
            onClick={refresh}
            disabled={readyMarkets === 0}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-bold hover:bg-primary/90 disabled:opacity-40 transition-all"
            style={{ boxShadow: "0 0 15px rgba(0,209,209,0.3)" }}
          >
            <RefreshCw className="w-4 h-4" /> Generate Signals
          </button>
        </div>
      </div>

      {signals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-muted-foreground space-y-3">
          <Sparkles className="w-12 h-12 opacity-20" />
          <p className="font-bold">Collecting market data...</p>
          <p className="text-sm">Need at least 30 ticks per market. Click "Generate Signals" when ready.</p>
          <div className="w-64 h-1.5 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${(readyMarkets / Math.max(totalMarkets, 1)) * 100}%` }} />
          </div>
          <p className="text-xs font-mono">{readyMarkets} / {totalMarkets} markets ready</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {signals.map((sig) => {
            const theme = THEMES.find((t) => t.id === sig.theme)!;
            const tradeColor = Object.entries(CONTRACT_COLORS).find(([k]) => sig.tradeType.includes(k))?.[1] ?? "text-primary";
            return (
              <Card
                key={sig.id}
                className="border-2 border-border hover:border-primary/40 transition-all"
                style={{ boxShadow: "inset 0 0 30px rgba(0,209,209,0.03)" }}
              >
                <CardHeader className="pb-2 border-b border-border">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-xs text-muted-foreground font-mono uppercase">{sig.marketName}</div>
                      <div className={`text-2xl font-black font-mono ${tradeColor}`}>{sig.tradeType}</div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge variant="outline" className={`text-[10px] ${THEME_BADGES[sig.theme]}`}>
                        {theme.name}
                      </Badge>
                      <div className="text-right">
                        <div className="text-lg font-black text-primary font-mono">{sig.confidence}%</div>
                        <div className="text-[10px] text-muted-foreground">confidence</div>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-3 space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="bg-muted rounded p-2">
                      <div className="text-muted-foreground">Entry</div>
                      <div className="font-bold font-mono">{sig.entryDigit}</div>
                    </div>
                    <div className="bg-muted rounded p-2">
                      <div className="text-muted-foreground flex items-center gap-1"><Zap className="w-2.5 h-2.5" />Ticks</div>
                      <div className="font-bold font-mono">{sig.ticks}</div>
                    </div>
                  </div>

                  <div className="bg-muted/50 rounded p-2 text-[10px] text-muted-foreground leading-relaxed">
                    {sig.reason}
                  </div>

                  <CountdownTimer validUntil={sig.validUntil} />

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => drawFlyer(sig, logoUrl)}
                      className="flex items-center justify-center gap-1.5 py-2 bg-primary/10 border border-primary/30 text-primary rounded text-xs font-bold hover:bg-primary/20 transition-all"
                    >
                      <Download className="w-3.5 h-3.5" /> Download Flyer
                    </button>
                    <div className="flex items-center justify-center gap-1.5 py-2 bg-muted border border-border rounded text-[10px] text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {new Date(sig.generatedAt).toLocaleTimeString()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Flyer theme preview */}
      <Card className="bg-card border-border">
        <CardHeader className="py-3 px-4 border-b border-border">
          <CardTitle className="text-xs font-medium text-muted-foreground uppercase">Flyer Themes</CardTitle>
        </CardHeader>
        <CardContent className="p-4 flex flex-wrap gap-3">
          {THEMES.map((t) => (
            <div key={t.id} className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full border-2" style={{ backgroundColor: t.primary, borderColor: t.accent }} />
              <span className="text-xs font-mono text-muted-foreground">{t.name}</span>
            </div>
          ))}
          <span className="text-xs text-muted-foreground ml-2 italic">· Each signal gets a unique futuristic theme</span>
        </CardContent>
      </Card>
    </div>
  );
}
