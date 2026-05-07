import { useDerivWebSocket } from "@/hooks/useDerivWebSocket";
import { useMarket } from "@/lib/market-context";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type SignalType = {
  id: string;
  name: string;
  condition: (digit: number) => boolean;
  type: "EVEN_BIAS" | "ODD_BIAS" | "OVER_BIAS" | "UNDER_BIAS";
};

const SIGNAL_TYPES: SignalType[] = [
  { id: "even", name: "Even", condition: (d) => d % 2 === 0, type: "EVEN_BIAS" },
  { id: "odd", name: "Odd", condition: (d) => d % 2 !== 0, type: "ODD_BIAS" },
  { id: "over1", name: "Over 1", condition: (d) => d > 1, type: "OVER_BIAS" },
  { id: "over2", name: "Over 2", condition: (d) => d > 2, type: "OVER_BIAS" },
  { id: "over3", name: "Over 3", condition: (d) => d > 3, type: "OVER_BIAS" },
  { id: "over4", name: "Over 4", condition: (d) => d > 4, type: "OVER_BIAS" },
  { id: "over5", name: "Over 5", condition: (d) => d > 5, type: "OVER_BIAS" },
  { id: "under9", name: "Under 9", condition: (d) => d < 9, type: "UNDER_BIAS" },
  { id: "under8", name: "Under 8", condition: (d) => d < 8, type: "UNDER_BIAS" },
  { id: "under7", name: "Under 7", condition: (d) => d < 7, type: "UNDER_BIAS" },
  { id: "under6", name: "Under 6", condition: (d) => d < 6, type: "UNDER_BIAS" },
  { id: "under5", name: "Under 5", condition: (d) => d < 5, type: "UNDER_BIAS" },
];

export default function Signals() {
  const { activeMarket } = useMarket();
  const { digits } = useDerivWebSocket(activeMarket);

  const last100 = digits.slice(-100).map(d => d.digit);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">AI Signals</h1>
        <Badge variant="outline" className="font-mono text-xs">Live Updating</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {SIGNAL_TYPES.map((sig) => {
          const hits = last100.filter(sig.condition).length;
          const prob = last100.length > 0 ? (hits / last100.length) * 100 : 0;
          
          let streak = 0;
          for (let i = last100.length - 1; i >= 0; i--) {
            if (sig.condition(last100[i])) streak++;
            else break;
          }

          let colorClass = "text-muted-foreground";
          let bgClass = "bg-muted";
          let badgeText = "WAIT";
          let badgeColor = "bg-muted/20 text-muted-foreground border-border";

          if (prob >= 70 || streak >= 5) {
            colorClass = "text-primary";
            bgClass = "bg-primary";
            badgeText = "BUY";
            badgeColor = "bg-green-500/20 text-green-500 border-green-500/30";
          } else if (prob <= 30) {
            colorClass = "text-destructive";
            bgClass = "bg-destructive";
            badgeText = "SELL";
            badgeColor = "bg-destructive/20 text-destructive border-destructive/30";
          } else if (prob >= 60) {
            colorClass = "text-primary/70";
            bgClass = "bg-primary/70";
          }

          return (
            <Card key={sig.id} className="bg-card border-border overflow-hidden">
              <div className={`h-1 w-full ${bgClass} opacity-50`} />
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-4">
                  <div className="font-bold text-lg">{sig.name}</div>
                  <Badge variant="outline" className={badgeColor}>{badgeText}</Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Probability</div>
                    <div className={`text-2xl font-mono font-bold ${colorClass}`}>
                      {prob.toFixed(0)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Current Streak</div>
                    <div className="text-2xl font-mono font-bold text-foreground">
                      {streak}
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[10px] text-muted-foreground mb-1.5 uppercase font-medium">
                    <span>Signal Strength</span>
                    <span>100 ticks</span>
                  </div>
                  <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                    <div className={`h-full ${bgClass} transition-all duration-500`} style={{ width: `${prob}%` }} />
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
