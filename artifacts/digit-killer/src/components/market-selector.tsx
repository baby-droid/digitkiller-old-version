import {
  CATEGORY_LABELS,
  MARKETS_BY_CATEGORY,
  type MarketCategory,
  useDerivMarketCatalog,
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
  const catalog = useDerivMarketCatalog();
  const feed = useDerivWebSocket(value);
  const historyError = feed.error;
  const historyStatus = feed.historyLoaded
    ? feed.digits.length === 0
      ? "No history returned · waiting for live ticks"
      : feed.digits.length < 1000
        ? `${feed.digits.length.toLocaleString()} / 1,000 ticks · collecting history`
        : `1,000 tick history loaded · ${feed.isConnected ? "live" : "reconnecting"}`
    : historyError
      ?? (!catalog.loaded
        ? catalog.error
          ? "Using built-in markets while the catalog retries…"
          : "Checking Deriv's active markets…"
        : feed.historyPhase === "queued"
          ? "Queued for tick history…"
          : feed.historyPhase === "loading"
            ? "Requesting the latest 1,000 ticks…"
            : feed.isConnected
              ? "Waiting for a history response…"
              : "Connecting to Deriv's market feed…");

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
        {!MARKETS_BY_CATEGORY[Object.keys(MARKETS_BY_CATEGORY)[0] as MarketCategory]?.some((market) => market.symbol === value)
          && !Object.values(MARKETS_BY_CATEGORY).flat().some((market) => market.symbol === value)
          && (
            <option value={value} key={`unavailable-${value}`}>
              {value} · unavailable
            </option>
          )}
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
        <span className={feed.historyLoaded && feed.digits.length >= 1000 ? "text-emerald-400" : historyError ? "text-amber-300" : "text-muted-foreground"}>
          {historyStatus}
        </span>
        {historyError && (
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
