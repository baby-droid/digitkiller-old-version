import { useDerivWebSocket } from "@/hooks/useDerivWebSocket";
import { useMarket } from "@/lib/market-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, BarChart, Bar, XAxis, Tooltip as RechartsTooltip, Cell } from "recharts";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export default function TradeDesk() {
  const { activeMarket } = useMarket();
  const { digits, currentPrice } = useDerivWebSocket(activeMarket);

  const last10 = digits.slice(-10);
  const last100 = digits.slice(-100);

  const freqData = Array.from({ length: 10 }, (_, i) => {
    const count = last100.filter(d => d.digit === i).length;
    const percentage = last100.length > 0 ? (count / last100.length) * 100 : 0;
    return { digit: i, percentage, isEven: i % 2 === 0 };
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Trade Desk</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-card border-border">
            <CardHeader className="pb-3 border-b border-border/50">
              <CardTitle className="text-sm font-medium text-muted-foreground">Live Digit Stream</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex flex-wrap gap-3">
                {last10.map((d, i) => (
                  <div 
                    key={d.time + i}
                    className={`flex items-center justify-center w-14 h-16 rounded-md text-3xl font-mono font-bold animate-in fade-in zoom-in slide-in-from-right-4 duration-300 ${
                      d.digit % 2 === 0 
                        ? "bg-primary/20 text-primary border border-primary/30" 
                        : "bg-destructive/20 text-destructive border border-destructive/30"
                    }`}
                  >
                    {d.digit}
                  </div>
                ))}
                {last10.length === 0 && (
                  <div className="text-muted-foreground font-mono text-sm py-4">Waiting for ticks...</div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-3 border-b border-border/50">
              <CardTitle className="text-sm font-medium text-muted-foreground">Digit Frequency (Last 100)</CardTitle>
            </CardHeader>
            <CardContent className="p-6 h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={freqData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                  <XAxis 
                    dataKey="digit" 
                    tickLine={false} 
                    axisLine={false}
                    tick={{ fill: "hsl(var(--muted-foreground))", fontFamily: "var(--font-mono)" }}
                  />
                  <RechartsTooltip 
                    cursor={{ fill: 'hsl(var(--muted))' }}
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                    itemStyle={{ color: 'hsl(var(--foreground))', fontFamily: "var(--font-mono)" }}
                    formatter={(val: number) => [`${val.toFixed(1)}%`, "Frequency"]}
                  />
                  <Bar dataKey="percentage" radius={[4, 4, 0, 0]}>
                    {freqData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.isEven ? "hsl(var(--primary))" : "hsl(var(--destructive))"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bg-card border-border shadow-[0_0_20px_rgba(0,0,0,0.2)]">
            <CardHeader className="bg-muted/20 border-b border-border pb-4">
              <CardTitle className="text-lg">Execution Panel</CardTitle>
              <div className="text-2xl font-mono font-bold mt-2">
                {currentPrice ? currentPrice.toFixed(2) : "---"}
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
              <div className="space-y-2">
                <Label>Trade Type</Label>
                <Select defaultValue="matches_differs">
                  <SelectTrigger className="font-medium bg-input border-border">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="matches_differs">Matches / Differs</SelectItem>
                    <SelectItem value="even_odd">Even / Odd</SelectItem>
                    <SelectItem value="over_under">Over / Under</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Stake (USD)</Label>
                <Input type="number" defaultValue="10.00" className="font-mono bg-input border-border text-lg" />
              </div>

              <div className="pt-4 grid grid-cols-2 gap-3">
                <Button className="w-full h-14 text-lg font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_15px_rgba(0,209,209,0.3)]">
                  EVEN
                </Button>
                <Button className="w-full h-14 text-lg font-bold bg-destructive hover:bg-destructive/90 text-destructive-foreground shadow-[0_0_15px_rgba(255,107,107,0.3)]">
                  ODD
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-5 space-y-4">
              <div className="text-sm font-medium text-muted-foreground mb-2">Quick Stats</div>
              <div className="flex justify-between items-center border-b border-border/50 pb-2">
                <span className="text-sm">Even %</span>
                <span className="font-mono text-primary font-bold">{freqData.filter(d => d.isEven).reduce((a,b)=>a+b.percentage, 0).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between items-center border-b border-border/50 pb-2">
                <span className="text-sm">Odd %</span>
                <span className="font-mono text-destructive font-bold">{freqData.filter(d => !d.isEven).reduce((a,b)=>a+b.percentage, 0).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between items-center border-b border-border/50 pb-2">
                <span className="text-sm">Over 4</span>
                <span className="font-mono font-bold text-muted-foreground">
                  {freqData.filter(d => d.digit > 4).reduce((a,b)=>a+b.percentage, 0).toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Under 5</span>
                <span className="font-mono font-bold text-muted-foreground">
                  {freqData.filter(d => d.digit < 5).reduce((a,b)=>a+b.percentage, 0).toFixed(1)}%
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
