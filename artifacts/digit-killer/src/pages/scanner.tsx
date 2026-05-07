import { useDerivMultiMarket } from "@/hooks/useDerivMultiMarket";
import { MARKETS } from "@/hooks/useDerivWebSocket";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Scanner() {
  const marketsData = useDerivMultiMarket();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Market Scanner</h1>
        <Badge variant="outline" className="font-mono text-xs">
          Scanning {MARKETS.length} Markets
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {MARKETS.map((market) => {
          const data = marketsData[market.symbol];
          if (!data) return null;

          return (
            <Card key={market.symbol} className="bg-card border-border hover:border-primary/50 transition-colors">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="font-bold text-lg">{market.name}</div>
                  <div className={`w-2.5 h-2.5 rounded-full ${data.isConnected ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" : "bg-destructive"}`} />
                </div>
                
                <div className="flex items-end justify-between mb-4">
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Price</div>
                    <div className="font-mono text-lg">{data.price ? data.price.toFixed(2) : "---"}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1 text-right">Last Digit</div>
                    <div className={`font-mono text-3xl font-bold leading-none ${data.lastDigit !== null && data.lastDigit % 2 === 0 ? "text-primary" : "text-destructive"}`}>
                      {data.lastDigit !== null ? data.lastDigit : "-"}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Even/Odd Ratio</span>
                      <span className="font-mono">{data.evenOddRatio}% Even</span>
                    </div>
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden flex">
                      <div className="h-full bg-primary" style={{ width: `${data.evenOddRatio}%` }} />
                      <div className="h-full bg-destructive" style={{ width: `${100 - data.evenOddRatio}%` }} />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border/50">
                    <span className="text-xs text-muted-foreground">Signal (50 ticks)</span>
                    {data.signal === "BUY" && <Badge className="bg-green-500/20 text-green-500 hover:bg-green-500/30 border-0">STRONG EVEN</Badge>}
                    {data.signal === "SELL" && <Badge className="bg-destructive/20 text-destructive hover:bg-destructive/30 border-0">STRONG ODD</Badge>}
                    {data.signal === "WAIT" && <Badge variant="outline" className="text-muted-foreground border-border">NEUTRAL</Badge>}
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
