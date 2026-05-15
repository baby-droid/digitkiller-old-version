import { useDerivMultiMarket } from "@/hooks/useDerivMultiMarket";
import { MARKETS } from "@/hooks/useDerivWebSocket";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState, useMemo } from "react";
import { Brain, Search, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ScanResult {
  symbol: string;
  name: string;
  strategy: string;
  reason: string;
  entryDigit: string;
  ticks: string;
  confidence: number;
}

export default function Scanner() {
  const marketsData = useDerivMultiMarket();
  const [isScanning, setIsScanning] = useState(false);
  const [scanResults, setScanResults] = useState<ScanResult[]>([]);

  const runAIScan = () => {
    setIsScanning(true);
    
    setTimeout(() => {
      const opportunities: ScanResult[] = [];

      Object.entries(marketsData).forEach(([symbol, data]) => {
        const market = MARKETS.find(m => m.symbol === symbol);
        if (!market || data.digits.length < 10) return;

        const f = data.frequencies;

        // Over 1: digits 0,1 must each be <10% → recommend entry on digit 1 hit
        if (f[0] < 10 && f[1] < 10) {
          opportunities.push({
            symbol,
            name: market.name,
            strategy: "Over 1",
            reason: "Digits 0,1 both < 10%",
            entryDigit: "1",
            ticks: "1-3 Ticks",
            confidence: 100 - (f[0] + f[1])
          });
        }

        // Over 2: digits 0,1,2 each <10% → entry on 0 or 2
        if (f[0] < 10 && f[1] < 10 && f[2] < 10) {
          opportunities.push({
            symbol,
            name: market.name,
            strategy: "Over 2",
            reason: "Digits 0,1,2 all < 10%",
            entryDigit: "0 or 2",
            ticks: "1-3 Ticks",
            confidence: 100 - (f[0] + f[1] + f[2]) / 1.5
          });
        }

        // Over 3: digits 0,1,2,3 each <10% → entry on 1 or 3
        if (f[0] < 10 && f[1] < 10 && f[2] < 10 && f[3] < 10) {
          opportunities.push({
            symbol,
            name: market.name,
            strategy: "Over 3",
            reason: "Digits 0,1,2,3 all < 10%",
            entryDigit: "1 or 3",
            ticks: "2-3 Ticks",
            confidence: 100 - (f[0] + f[1] + f[2] + f[3]) / 2
          });
        }

        // Under 9: digit 9 <10% → entry when digit 9 or 0 appears
        if (f[9] < 10) {
          opportunities.push({
            symbol,
            name: market.name,
            strategy: "Under 9",
            reason: "Digit 9 < 10%",
            entryDigit: "9 or 0",
            ticks: "1-2 Ticks",
            confidence: 100 - f[9]
          });
        }

        // Under 8: digits 8,9 <10% AND digit 7 ≥10.3% → entry at digit 7
        if (f[8] < 10 && f[9] < 10 && f[7] >= 10.3) {
          opportunities.push({
            symbol,
            name: market.name,
            strategy: "Under 8",
            reason: "Digits 8,9 < 10% & Digit 7 high",
            entryDigit: "7",
            ticks: "1-2 Ticks",
            confidence: 100 - (f[8] + f[9])
          });
        }
      });

      // Sort by confidence and take top 3
      const top3 = opportunities
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 3);

      setScanResults(top3);
      setIsScanning(false);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Market Scanner</h1>
          <p className="text-muted-foreground text-sm">Real-time analysis across all volatility markets</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-mono text-xs h-9 px-3">
            {MARKETS.length} Markets Active
          </Badge>
          <Button 
            onClick={runAIScan} 
            disabled={isScanning}
            className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20"
            data-testid="button-ai-scan"
          >
            {isScanning ? (
              <>
                <Search className="mr-2 h-4 w-4 animate-spin" />
                Scanning...
              </>
            ) : (
              <>
                <Brain className="mr-2 h-4 w-4" />
                AI SCAN
              </>
            )}
          </Button>
        </div>
      </div>

      {scanResults.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
          {scanResults.map((result, idx) => (
            <Card key={`${result.symbol}-${idx}`} className="border-primary/50 bg-primary/5">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-sm font-medium text-primary uppercase tracking-wider">Top Opportunity #{idx + 1}</CardTitle>
                  <Badge className="bg-primary text-primary-foreground">{result.confidence.toFixed(0)}% Match</Badge>
                </div>
                <div className="text-2xl font-bold mt-1">{result.name}</div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Strategy</span>
                    <Badge variant="outline" className="font-bold">{result.strategy}</Badge>
                  </div>
                  <div className="p-2 bg-background/50 rounded-md border border-border/50">
                    <div className="text-[10px] uppercase text-muted-foreground font-semibold mb-1">Analysis</div>
                    <div className="text-xs font-medium">{result.reason}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 bg-background/50 rounded-md border border-border/50 text-center">
                      <div className="text-[10px] uppercase text-muted-foreground font-semibold">Entry</div>
                      <div className="text-sm font-bold text-primary">{result.entryDigit}</div>
                    </div>
                    <div className="p-2 bg-background/50 rounded-md border border-border/50 text-center">
                      <div className="text-[10px] uppercase text-muted-foreground font-semibold">Duration</div>
                      <div className="text-sm font-bold text-primary">{result.ticks}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {MARKETS.map((market) => {
          const data = marketsData[market.symbol];
          if (!data) return null;

          const maxFreq = Math.max(...data.frequencies);
          const minFreq = Math.min(...data.frequencies);

          return (
            <Card key={market.symbol} className="bg-card border-border hover:border-primary/50 transition-colors overflow-hidden group">
              <CardContent className="p-0">
                <div className="p-4 border-b border-border/50 bg-muted/30">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-lg group-hover:text-primary transition-colors">{market.name}</div>
                    <div className={`w-2 h-2 rounded-full ${data.isConnected ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" : "bg-destructive animate-pulse"}`} />
                  </div>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="font-mono text-sm font-medium">{data.price ? data.price.toLocaleString(undefined, { minimumFractionDigits: 2 }) : "---"}</span>
                    <span className="text-[10px] text-muted-foreground uppercase">USD</span>
                  </div>
                </div>
                
                <div className="p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase text-muted-foreground font-semibold">Last 10 Digits</span>
                      <div className="flex gap-1 mt-1">
                        {data.digits.slice(-10).map((d, i) => (
                          <div key={i} className={`w-5 h-5 flex items-center justify-center text-[10px] font-bold rounded-sm ${d % 2 === 0 ? "bg-primary/20 text-primary" : "bg-destructive/20 text-destructive"}`}>
                            {d}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] uppercase text-muted-foreground font-semibold">Now</span>
                      <div className={`font-mono text-3xl font-black leading-none ${data.lastDigit !== null && data.lastDigit % 2 === 0 ? "text-primary" : "text-destructive"}`}>
                        {data.lastDigit !== null ? data.lastDigit : "-"}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-end">
                      <span className="text-[10px] uppercase text-muted-foreground font-semibold">Digit Distribution</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-primary font-bold">E {data.evenOddRatio}%</span>
                        <span className="text-[10px] text-destructive font-bold">O {100 - data.evenOddRatio}%</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-10 gap-0.5 h-12 items-end">
                      {data.frequencies.map((freq, i) => (
                        <TooltipProvider key={i}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="relative group/bar flex flex-col items-center h-full justify-end cursor-default">
                                <div 
                                  className={`w-full rounded-t-sm transition-all duration-300 ${freq === maxFreq ? "bg-green-500" : freq === minFreq ? "bg-red-500" : "bg-muted-foreground/30"}`} 
                                  style={{ height: `${Math.max(10, freq * 3)}%` }} 
                                />
                                <span className="text-[8px] mt-0.5 font-mono text-muted-foreground">{i}</span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="p-1 px-2 text-[10px] font-mono">
                              Digit {i}: {freq.toFixed(1)}%
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border/50">
                    <div className="flex items-center gap-1">
                      <Info className="h-3 w-3 text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground uppercase font-semibold">Signal Status</span>
                    </div>
                    {data.signal === "BUY" && <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20 border-green-500/20 text-[10px] h-5">READY (EVEN)</Badge>}
                    {data.signal === "SELL" && <Badge className="bg-destructive/10 text-destructive hover:bg-destructive/20 border-destructive/20 text-[10px] h-5">READY (ODD)</Badge>}
                    {data.signal === "WAIT" && <Badge variant="outline" className="text-muted-foreground border-border text-[10px] h-5">ANALYZING</Badge>}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
