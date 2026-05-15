import { useState, useEffect, useRef, useCallback } from "react";

export type TickData = {
  price: number;
  digit: number;
  time: number;
};

export type MarketCategory = "volatility" | "crash_boom" | "jump" | "bear_bull";

export type Market = {
  name: string;
  symbol: string;
  category: MarketCategory;
};

export const MARKETS_BY_CATEGORY: Record<MarketCategory, Market[]> = {
  volatility: [
    { name: "Vol 10", symbol: "R_10", category: "volatility" },
    { name: "Vol 25", symbol: "R_25", category: "volatility" },
    { name: "Vol 50", symbol: "R_50", category: "volatility" },
    { name: "Vol 75", symbol: "R_75", category: "volatility" },
    { name: "Vol 100", symbol: "R_100", category: "volatility" },
    { name: "1s V10", symbol: "1HZ10V", category: "volatility" },
    { name: "1s V25", symbol: "1HZ25V", category: "volatility" },
    { name: "1s V50", symbol: "1HZ50V", category: "volatility" },
    { name: "1s V75", symbol: "1HZ75V", category: "volatility" },
    { name: "1s V100", symbol: "1HZ100V", category: "volatility" },
  ],
  crash_boom: [
    { name: "Crash 300", symbol: "CRASH300N", category: "crash_boom" },
    { name: "Crash 500", symbol: "CRASH500", category: "crash_boom" },
    { name: "Crash 1000", symbol: "CRASH1000", category: "crash_boom" },
    { name: "Boom 300", symbol: "BOOM300N", category: "crash_boom" },
    { name: "Boom 500", symbol: "BOOM500", category: "crash_boom" },
    { name: "Boom 1000", symbol: "BOOM1000", category: "crash_boom" },
  ],
  jump: [
    { name: "Jump 10", symbol: "JD10", category: "jump" },
    { name: "Jump 25", symbol: "JD25", category: "jump" },
    { name: "Jump 50", symbol: "JD50", category: "jump" },
    { name: "Jump 75", symbol: "JD75", category: "jump" },
    { name: "Jump 100", symbol: "JD100", category: "jump" },
  ],
  bear_bull: [
    { name: "Bear", symbol: "RDBEAR", category: "bear_bull" },
    { name: "Bull", symbol: "RDBULL", category: "bear_bull" },
    { name: "Step 2", symbol: "stpRNG2", category: "bear_bull" },
    { name: "Step 5", symbol: "stpRNG5", category: "bear_bull" },
    { name: "Rng Brk 100", symbol: "RB100", category: "bear_bull" },
    { name: "Rng Brk 200", symbol: "RB200", category: "bear_bull" },
  ],
};

export const CATEGORY_LABELS: Record<MarketCategory, string> = {
  volatility: "Volatility",
  crash_boom: "Crash / Boom",
  jump: "Jump",
  bear_bull: "Bear · Bull · Step",
};

export const MARKETS: Market[] = Object.values(MARKETS_BY_CATEGORY).flat();

const WS_URL = "wss://ws.binaryws.com/websockets/v3?app_id=1089";

export function useDerivWebSocket(symbol: string) {
  const [digits, setDigits] = useState<TickData[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.close();
    }

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      setDigits([]);
      ws.send(JSON.stringify({ ticks: symbol, subscribe: 1 }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.tick) {
        const price = data.tick.quote;
        const time = data.tick.epoch;

        const priceStr = price.toFixed(Math.max(2, (price.toString().split(".")[1] || "").length));
        const lastDigit = parseInt(priceStr.replace(".", "").slice(-1));

        setDigits((prev) => {
          const newDigits = [...prev, { price, digit: lastDigit, time }];
          if (newDigits.length > 500) newDigits.shift();
          return newDigits;
        });
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      setTimeout(connect, 2000);
    };

    ws.onerror = () => {
      ws.close();
    };
  }, [symbol]);

  useEffect(() => {
    connect();
    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, [connect]);

  const lastDigit = digits.length > 0 ? digits[digits.length - 1].digit : null;
  const currentPrice = digits.length > 0 ? digits[digits.length - 1].price : null;

  return { digits, lastDigit, currentPrice, isConnected };
}

/* Forex tick hook — no digit extraction, raw price only */
export type PriceData = {
  price: number;
  time: number;
};

export function useForexWebSocket(symbol: string) {
  const [prices, setPrices] = useState<PriceData[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) wsRef.current.close();
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      setPrices([]);
      ws.send(JSON.stringify({ ticks: symbol, subscribe: 1 }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.tick) {
        const price = data.tick.quote;
        const time = data.tick.epoch;
        setPrices((prev) => {
          const next = [...prev, { price, time }];
          if (next.length > 1000) next.shift();
          return next;
        });
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      setTimeout(connect, 2000);
    };

    ws.onerror = () => ws.close();
  }, [symbol]);

  useEffect(() => {
    connect();
    return () => { if (wsRef.current) wsRef.current.close(); };
  }, [connect]);

  const currentPrice = prices.length > 0 ? prices[prices.length - 1].price : null;
  return { prices, currentPrice, isConnected };
}
