import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useDerivMultiMarket } from "@/hooks/useDerivMultiMarket";
import { MARKETS } from "@/hooks/useDerivWebSocket";
import { Cpu, TrendingUp, AlertTriangle, CheckCircle2, Zap } from "lucide-react";

// Strategy constants based on PDF rules
const OVER_UNDER_STRATEGIES = [
  {
    type: "Over 1",
    check: (freqs: number[]) => freqs[0] < 10 && freqs[1] < 10,
    entryDigits: [1],
    ticks: "1-2 ticks",
    risk: "Low"
  },
  {
    type: "Over 2",
    check: (freqs: number[]) => freqs[0] < 10 && freqs[1] < 10 && freqs[2] < 10,
    entryDigits: [0, 2],
    ticks: "1-2 ticks",
    risk: "Low"
  },
  {
    type: "Over 3",
    check: (freqs: number[]) => freqs[0] < 10 && freqs[1] < 10 && freqs[2] < 10 && freqs[3] < 10,
    entryDigits: [1, 3],
    ticks: "2-3 ticks",
    risk: "Medium"
  },
  {
    type: "Over 4",
    check: (freqs: number[]) => {
      const lowDigits = [0, 1, 2, 3, 4];
      const belowTen = lowDigits.filter(d => freqs[d] < 10).length;
      return belowTen >= 3;
    },
    entryDigits: [2, 4],
    ticks: "2-3 ticks",
    risk: "Medium"
  },
  {
    type: "Over 5",
    check: (freqs: number[]) => {
      const lowDigits = [0, 1, 2, 3, 4, 5];
      const belowTen = lowDigits.filter(d => freqs[d] < 10).length;
      return belowTen >= 3;
    },
    entryDigits: [1, 3, 5],
    ticks: "3-5 ticks",
    risk: "High"
  },
  {
    type: "Under 9",
    check: (freqs: number[]) => freqs[9] < 10,
    entryDigits: [9, 0],
    ticks: "1-2 ticks",
    risk: "Low"
  },
  {
    type: "Under 8",
    check: (freqs: number[]) => freqs[8] < 10 && freqs[9] < 10 && freqs[7] >= 10.3,
    entryDigits: [7],
    ticks: "1-2 ticks",
    risk: "Low"
  },
  {
    type: "Under 7",
    check: (freqs: number[]) => freqs[7] < 10 && freqs[8] < 10 && freqs[9] < 10 && freqs[6] >= 10.3,
    entryDigits: [6],
    ticks: "2-3 ticks",
    risk: "Medium"
  },
  {
    type: "Under 6",
    check: (freqs: number[]) => freqs[6] < 10 && freqs[7] < 10 && freqs[8] < 10 && freqs[9] < 10 && freqs[5] >= 10.3,
    entryDigits: [6],
    ticks: "2-3 ticks",
    risk: "Medium"
  },
  {
    type: "Under 5",
    check: (freqs: number[]) => {
      const highDigits = [5, 6, 7, 8, 9];
      const belowTen = highDigits.every(d => freqs[d] < 10);
      const shieldDigits = [0, 1, 2].some(d => freqs[d] >= 10.3);
      return belowTen && shieldDigits;
    },
    entryDigits: [5], // Entry on high digit hit
    ticks: "3-5 ticks",
    risk: "High"
  }
];

export default function TickGenerator() {
  const marketsData = useDerivMultiMarket();

  const opportunities = useMemo(() => {
    const results: any[] = [];

    Object.entries(marketsData).forEach(([symbol, data]) => {
      if (data.digits.length < 20) return;

      const marketName = MARKETS.find(m => m.symbol === symbol)?.name || symbol;
      
      // Calculate frequencies
      const freqs = new Array(10).fill(0);
      data.digits.forEach(d => freqs[d]++);
      const freqsPercent = freqs.map(f => (f / data.digits.length) * 100);
      
      const maxFreq = Math.max(...freqsPercent);
      const minFreq = Math.min(...freqsPercent);
      const greenBarDigit = freqsPercent.indexOf(maxFreq);
      const redBarDigit = freqsPercent.indexOf(minFreq);

      OVER_UNDER_STRATEGIES.forEach(strat => {
        if (strat.check(freqsPercent)) {
          // Calculate confidence score
          let confidence = 70; // Base confidence if check passes
          
          // Boost confidence based on parity and green bar for Over
          if (strat.type.startsWith("Over")) {
             const threshold = parseInt(strat.type.split(" ")[1]);
             // If green bar is a digit that would win
             if (greenBarDigit > threshold) confidence += 15;
             // If red bar is a digit that would lose
             if (redBarDigit <= threshold) confidence += 10;
          } else {
             const threshold = parseInt(strat.type.split(" ")[1]);
             if (greenBarDigit < threshold) confidence += 15;
             if (redBarDigit >= threshold) confidence += 10;
          }

          confidence = Math.min(confidence, 99);

          results.push({
            symbol,
            marketName,
            type: strat.type,
            confidence,
            freqsPercent,
            entryDigits: strat.entryDigits,
            ticks: strat.ticks,
            risk: strat.risk,
            greenBarDigit,
            redBarDigit,
            lastDigit: data.lastDigit
          });
        }
      });
    });

    return results.sort((a, b) => b.confidence - a.confidence);
  }, [marketsData]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Cpu className="w-8 h-8 text-primary" />
          Over/Under Tick Generator
        </h1>
        <p className="text-muted-foreground">
          Real-time AI analysis of all markets using advanced digit strategy matrices.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {opportunities.length > 0 ? (
          opportunities.map((opp, idx) => {
            const isEntryNow = opp.entryDigits.includes(opp.lastDigit);
            
            return (
              <Card key={`${opp.symbol}-${opp.type}-${idx}`} className={`relative overflow-hidden border-2 transition-all ${isEntryNow ? "border-primary shadow-[0_0_20px_rgba(0,209,209,0.2)] scale-[1.02]" : "border-border"}`}>
                {isEntryNow && (
                  <div className="absolute top-0 right-0 p-2">
                    <Badge className="bg-primary text-primary-foreground animate-pulse">
                      ENTRY NOW
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl">{opp.marketName}</CardTitle>
                      <CardDescription className="font-bold text-primary">{opp.type}</CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-black text-primary">{opp.confidence}%</div>
                      <div className="text-[10px] uppercase text-muted-foreground font-bold">Confidence</div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Frequency Bars */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-bold uppercase text-muted-foreground px-1">
                      <span>Digit Freq (0-9)</span>
                      <span>Last: {opp.lastDigit}</span>
                    </div>
                    <div className="flex h-12 gap-0.5 items-end bg-muted/30 rounded p-1">
                      {opp.freqsPercent.map((f: number, i: number) => (
                        <div 
                          key={i} 
                          className={`flex-1 rounded-t-sm transition-all ${
                            i === opp.greenBarDigit ? "bg-green-500" : 
                            i === opp.redBarDigit ? "bg-red-500" : 
                            "bg-primary/40"
                          }`}
                          style={{ height: `${Math.max(f * 3, 10)}%` }}
                          title={`Digit ${i}: ${f.toFixed(1)}%`}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <div className="text-[10px] font-bold uppercase text-muted-foreground">Entry Strategy</div>
                      <div className="text-sm font-medium">
                        Wait for: <span className="text-primary">{opp.entryDigits.join(", ")}</span>
                      </div>
                    </div>
                    <div className="space-y-1 text-right">
                      <div className="text-[10px] font-bold uppercase text-muted-foreground">Duration</div>
                      <div className="text-sm font-medium flex items-center justify-end gap-1">
                        <Zap className="w-3 h-3 text-yellow-500" />
                        {opp.ticks}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-border flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        opp.risk === "Low" ? "bg-green-500" : 
                        opp.risk === "Medium" ? "bg-yellow-500" : "bg-red-500"
                      }`} />
                      <span className="text-xs font-bold uppercase">{opp.risk} RISK</span>
                    </div>
                    
                    {isEntryNow ? (
                      <div className="flex items-center gap-1 text-primary text-xs font-bold">
                        <CheckCircle2 className="w-4 h-4" />
                        MATCHED
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-muted-foreground text-xs font-bold">
                        <AlertTriangle className="w-4 h-4" />
                        WAITING
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center py-20 text-muted-foreground">
            <TrendingUp className="w-12 h-12 mb-4 opacity-20" />
            <p>Scanning all markets for opportunities...</p>
            <p className="text-sm">Collecting tick data (need at least 20 ticks per market)</p>
          </div>
        )}
      </div>
    </div>
  );
}
