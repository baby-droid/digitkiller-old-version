import { useState, useEffect, useRef } from "react";
import { MARKETS, extractDigit } from "./useDerivWebSocket";

const WS_URL = "wss://ws.binaryws.com/websockets/v3?app_id=1089";

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
  const [marketsData, setMarketsData] = useState<Record<string, MarketData>>(
    MARKETS.reduce((acc, m) => {
      acc[m.symbol] = {
        isConnected: false,
        price: null,
        lastDigit: null,
        evenOddRatio: 50,
        signal: "WAIT",
        digits: [],
        frequencies: new Array(10).fill(0),
      };
      return acc;
    }, {} as Record<string, MarketData>)
  );

  // Per-symbol pip_size cache — filled from the first tick of each symbol
  const pipSizes = useRef<Record<string, number>>(
    MARKETS.reduce((acc, m) => {
      // Seed with known pip sizes so digit 0 works from the very first tick
      acc[m.symbol] = m.pipSize ?? 4;
      return acc;
    }, {} as Record<string, number>)
  );

  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      setMarketsData((prev) => {
        const next = { ...prev };
        for (const key in next) next[key].isConnected = true;
        return next;
      });
      // Subscribe to live ticks for every market
      MARKETS.forEach((m) => {
        ws.send(JSON.stringify({ ticks: m.symbol, subscribe: 1 }));
      });
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.msg_type === "tick" && data.tick) {
        const symbol   = data.tick.symbol as string;
        const price    = data.tick.quote  as number;

        // Update pip_size from the live tick if the API provides it
        if (typeof data.tick.pip_size === "number") {
          pipSizes.current[symbol] = data.tick.pip_size;
        }
        const pip      = pipSizes.current[symbol] ?? 4;
        const lastDigit = extractDigit(price, pip);

        setMarketsData((prev) => {
          const m = prev[symbol];
          if (!m) return prev;

          const newDigits = [...m.digits, lastDigit];
          if (newDigits.length > 100) newDigits.shift();

          let evens = 0;
          const freqCounts = new Array(10).fill(0);
          for (const d of newDigits) {
            if (d % 2 === 0) evens++;
            freqCounts[d]++;
          }
          const n            = newDigits.length || 1;
          const evenOddRatio = Math.round((evens / n) * 100);
          const frequencies  = freqCounts.map((c) => (c / n) * 100);

          let signal: "BUY" | "SELL" | "WAIT" = "WAIT";
          if (evenOddRatio > 70) signal = "BUY";
          else if (evenOddRatio < 30) signal = "SELL";

          return {
            ...prev,
            [symbol]: {
              ...m,
              price,
              lastDigit,
              digits: newDigits,
              evenOddRatio,
              frequencies,
              signal,
            },
          };
        });
      }
    };

    ws.onclose = () => {
      setMarketsData((prev) => {
        const next = { ...prev };
        for (const key in next) next[key].isConnected = false;
        return next;
      });
    };

    return () => { ws.close(); };
  }, []);

  return marketsData;
}
