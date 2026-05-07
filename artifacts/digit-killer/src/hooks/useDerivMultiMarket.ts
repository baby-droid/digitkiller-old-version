import { useState, useEffect, useRef } from "react";
import { MARKETS, TickData } from "./useDerivWebSocket";

const WS_URL = "wss://ws.binaryws.com/websockets/v3?app_id=1089";

type MarketData = {
  isConnected: boolean;
  price: number | null;
  lastDigit: number | null;
  evenOddRatio: number; // % of even in last 50 ticks
  signal: "BUY" | "SELL" | "WAIT";
  digits: number[];
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
      };
      return acc;
    }, {} as Record<string, MarketData>)
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
      
      MARKETS.forEach((m) => {
        ws.send(JSON.stringify({ ticks: m.symbol, subscribe: 1 }));
      });
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.tick) {
        const symbol = data.tick.symbol;
        const price = data.tick.quote;
        
        const priceStr = price.toFixed(Math.max(2, (price.toString().split(".")[1] || "").length));
        const lastDigit = parseInt(priceStr.replace(".", "").slice(-1));

        setMarketsData((prev) => {
          const m = prev[symbol];
          if (!m) return prev;
          
          const newDigits = [...m.digits, lastDigit];
          if (newDigits.length > 50) newDigits.shift();
          
          let evens = 0;
          for (const d of newDigits) {
            if (d % 2 === 0) evens++;
          }
          const evenOddRatio = newDigits.length > 0 ? Math.round((evens / newDigits.length) * 100) : 50;
          
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
              signal
            }
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

    return () => {
      ws.close();
    };
  }, []);

  return marketsData;
}
