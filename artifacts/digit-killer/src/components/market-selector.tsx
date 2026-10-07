import {
  CATEGORY_LABELS,
  MARKETS_BY_CATEGORY,
  type MarketCategory,
  useDerivWebSocket,
} from "@/hooks/useDerivWebSocket";

type MarketSelectorProps = {
  value: string;
  onChange: (symbol: string) => void;
  className?: string;
  testId?: string;
  label?: string;
};

export function MarketSelector({
  value,
  onChange,
  className = "w-full rounded-md px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2",
  testId = "select-market",
  label = "Select market",
}: MarketSelectorProps) {
  const feed = useDerivWebSocket(value);

  return (
    <div className="space-y-1.5">
      <select
        aria-label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={className}
        style={{
          background: "rgba(0,0,0,0.5)",
          border: "1px solid #166534",
          color: "#86efac",
        }}
        data-testid={testId}
      >
        {(Object.entries(MARKETS_BY_CATEGORY) as [MarketCategory, typeof MARKETS_BY_CATEGORY[MarketCategory]][]).map(([category, markets]) => (
          <optgroup key={category} label={CATEGORY_LABELS[category]}>
            {markets.map((market) => (
              <option key={market.symbol} value={market.symbol} style={{ backgroundColor: "#052e16" }}>
                {market.name}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
      <div className="flex min-h-4 items-center justify-between gap-2 text-[10px] font-mono" role="status" data-testid={`status-market-history-${value}`}>
        <span className={feed.historyLoaded ? "text-emerald-400" : feed.error ? "text-amber-300" : "text-muted-foreground"}>
          {feed.historyLoaded
            ? `${Math.min(feed.digits.length, 1000).toLocaleString()} history ticks loaded · ${feed.isConnected ? "live" : "reconnecting"}`
            : feed.error ?? (feed.isConnected ? "Loading 1,000-tick history…" : "Connecting to market feed…")}
        </span>
        {feed.error && (
          <button
            type="button"
            onClick={feed.refreshHistory}
            className="shrink-0 rounded border border-amber-400/30 px-2 py-0.5 text-amber-200 transition hover:bg-amber-400/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/50"
            data-testid={`button-retry-market-history-${value}`}
          >
            Retry history
          </button>
        )}
      </div>
    </div>
  );
}
