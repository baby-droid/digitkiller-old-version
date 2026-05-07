import { useDerivWebSocket } from "@/hooks/useDerivWebSocket";
import { useMarket } from "@/lib/market-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip as RechartsTooltip, Legend } from "recharts";

export default function Analysis() {
  const { activeMarket } = useMarket();
  const { digits } = useDerivWebSocket(activeMarket);

  const last100 = digits.slice(-100).map(d => d.digit);

  // Frequency
  const freqData = Array.from({ length: 10 }, (_, i) => {
    const count = last100.filter(d => d === i).length;
    return { digit: i, percentage: last100.length ? (count / last100.length) * 100 : 0 };
  });

  // Hot/Cold
  const sortedByFreq = [...freqData].sort((a, b) => b.percentage - a.percentage);
  const hot = sortedByFreq.slice(0, 3);
  const cold = sortedByFreq.slice(-3).reverse();

  // Even/Odd Donut
  const evenCount = last100.filter(d => d % 2 === 0).length;
  const oddCount = last100.length - evenCount;
  const donutData = [
    { name: "Even", value: evenCount, color: "hsl(var(--primary))" },
    { name: "Odd", value: oddCount, color: "hsl(var(--destructive))" }
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Deep Digit Analysis</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <Card className="bg-card border-border lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">0-9 Frequency Table (Last 100)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {freqData.map((d) => (
                <div key={d.digit} className="flex items-center gap-4">
                  <div className={`w-8 h-8 rounded flex items-center justify-center font-mono font-bold text-lg flex-shrink-0 ${d.digit % 2 === 0 ? 'bg-primary/20 text-primary' : 'bg-destructive/20 text-destructive'}`}>
                    {d.digit}
                  </div>
                  <div className="flex-1">
                    <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full transition-all duration-500 rounded-full" 
                        style={{ 
                          width: `${d.percentage}%`,
                          backgroundColor: d.digit % 2 === 0 ? 'hsl(var(--primary))' : 'hsl(var(--destructive))' 
                        }} 
                      />
                    </div>
                  </div>
                  <div className="w-12 text-right font-mono text-sm text-muted-foreground">
                    {d.percentage.toFixed(0)}%
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg">Even / Odd Distribution</CardTitle>
            </CardHeader>
            <CardContent className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {donutData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Legend iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg">Hot / Cold Digits</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="text-xs text-muted-foreground mb-2 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  HOTTEST DIGITS
                </div>
                <div className="flex gap-2">
                  {hot.map(h => (
                    <div key={h.digit} className="flex-1 bg-muted p-2 rounded text-center">
                      <div className="font-mono text-xl font-bold text-foreground">{h.digit}</div>
                      <div className="font-mono text-[10px] text-muted-foreground">{h.percentage.toFixed(0)}%</div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <div className="text-xs text-muted-foreground mb-2 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  COLDEST DIGITS
                </div>
                <div className="flex gap-2">
                  {cold.map(c => (
                    <div key={c.digit} className="flex-1 bg-muted p-2 rounded text-center opacity-70">
                      <div className="font-mono text-xl font-bold text-foreground">{c.digit}</div>
                      <div className="font-mono text-[10px] text-muted-foreground">{c.percentage.toFixed(0)}%</div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg">Heatmap: Last 100 Digits</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-20 gap-1 sm:grid-cols-25 md:grid-cols-33 lg:grid-cols-50">
            {last100.map((digit, i) => (
              <div 
                key={i} 
                className={`aspect-square flex items-center justify-center text-[10px] font-mono font-bold rounded-sm ${
                  digit % 2 === 0 
                    ? "bg-primary/20 text-primary border border-primary/10" 
                    : "bg-destructive/20 text-destructive border border-destructive/10"
                }`}
              >
                {digit}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
