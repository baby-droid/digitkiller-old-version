import { useEffect, useState } from "react";
import {
  getMarketFeedSnapshot,
  MARKETS,
  subscribeToMarket,
} from "./useDerivWebSocket";

type MarketData = {
  isConnected: boolean;
  price: number | null;
  lastDigit: number | null;
  evenOddRatio: number;
  signal: "BUY" | "SELL" | "WAIT";
  digits: number[];
  frequencies: number[];
};

export function useDerivMultiMarket() {
  const [marketsData, setMarketsData] = useState<Record<string, MarketData>>(() =>
    MARKETS.reduce((acc, market) => {
      acc[market.symbol] = marketDataFor(market.symbol);
      return acc;
    }, {} as Record<string, MarketData>)
  );

  useEffect(() => {
    const unsubscribers = MARKETS.map((market) =>
      subscribeToMarket(market.symbol, () => {
        const data = marketDataFor(market.symbol);
        setMarketsData((previous) => ({ ...previous, [market.symbol]: data }));
      })
    );
    setMarketsData(
      MARKETS.reduce((next, market) => {
        next[market.symbol] = marketDataFor(market.symbol);
        return next;
      }, {} as Record<string, MarketData>)
    );
    return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
  }, []);

  return marketsData;
}

function marketDataFor(symbol: string): MarketData {
  const snapshot = getMarketFeedSnapshot(symbol);
  const ticks = snapshot.digits.slice(-100);
  const digits = ticks.map((tick) => tick.digit);
  const counts = new Array(10).fill(0);
  let evens = 0;

  digits.forEach((digit) => {
    counts[digit]++;
    if (digit % 2 === 0) evens++;
  });

  const total = digits.length || 1;
  const evenOddRatio = digits.length ? Math.round((evens / total) * 100) : 50;
  let signal: MarketData["signal"] = "WAIT";
  if (evenOddRatio > 70) signal = "BUY";
  else if (evenOddRatio < 30) signal = "SELL";

  return {
    isConnected: snapshot.isConnected,
    price: ticks[ticks.length - 1]?.price ?? null,
    lastDigit: digits[digits.length - 1] ?? null,
    evenOddRatio,
    signal,
    digits,
    frequencies: counts.map((count) => (count / total) * 100),
  };
}
