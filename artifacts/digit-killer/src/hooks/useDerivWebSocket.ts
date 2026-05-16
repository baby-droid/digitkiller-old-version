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
    { name: "Vol 10",   symbol: "R_10",     category: "volatility" },
    { name: "Vol 25",   symbol: "R_25",     category: "volatility" },
    { name: "Vol 50",   symbol: "R_50",     category: "volatility" },
    { name: "Vol 75",   symbol: "R_75",     category: "volatility" },
    { name: "Vol 100",  symbol: "R_100",    category: "volatility" },
    { name: "1s V10",   symbol: "1HZ10V",   category: "volatility" },
    { name: "1s V25",   symbol: "1HZ25V",   category: "volatility" },
    { name: "1s V50",   symbol: "1HZ50V",   category: "volatility" },
    { name: "1s V75",   symbol: "1HZ75V",   category: "volatility" },
    { name: "1s V100",  symbol: "1HZ100V",  category: "volatility" },
  ],
  crash_boom: [
    { name: "Crash 300",  symbol: "CRASH300N", category: "crash_boom" },
    { name: "Crash 500",  symbol: "CRASH500",  category: "crash_boom" },
    { name: "Crash 1000", symbol: "CRASH1000", category: "crash_boom" },
    { name: "Boom 300",   symbol: "BOOM300N",  category: "crash_boom" },
    { name: "Boom 500",   symbol: "BOOM500",   category: "crash_boom" },
    { name: "Boom 1000",  symbol: "BOOM1000",  category: "crash_boom" },
  ],
  jump: [
    { name: "Jump 10",  symbol: "JD10",  category: "jump" },
    { name: "Jump 25",  symbol: "JD25",  category: "jump" },
    { name: "Jump 50",  symbol: "JD50",  category: "jump" },
    { name: "Jump 75",  symbol: "JD75",  category: "jump" },
    { name: "Jump 100", symbol: "JD100", category: "jump" },
  ],
  bear_bull: [
    { name: "Bear",        symbol: "RDBEAR",   category: "bear_bull" },
    { name: "Bull",        symbol: "RDBULL",   category: "bear_bull" },
    { name: "Step 2",      symbol: "stpRNG2",  category: "bear_bull" },
    { name: "Step 5",      symbol: "stpRNG5",  category: "bear_bull" },
    { name: "Rng Brk 100", symbol: "RB100",    category: "bear_bull" },
    { name: "Rng Brk 200", symbol: "RB200",    category: "bear_bull" },
  ],
};

export const CATEGORY_LABELS: Record<MarketCategory, string> = {
  volatility:  "Volatility",
  crash_boom:  "Crash / Boom",
  jump:        "Jump",
  bear_bull:   "Bear · Bull · Step",
};

export const MARKETS: Market[] = Object.values(MARKETS_BY_CATEGORY).flat();

const WS_URL = "wss://ws.binaryws.com/websockets/v3?app_id=1089";

function extractDigit(price: number): number {
  const s = price.toFixed(Math.max(2, (price.toString().split(".")[1] || "").length));
  return parseInt(s.replace(".", "").slice(-1));
}

export function useDerivWebSocket(symbol: string) {
  const [digits, setDigits] = useState<TickData[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  const connect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.close();
    }

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      setDigits([]);
      setHistoryLoaded(false);
      ws.send(JSON.stringify({
        ticks_history: symbol,
        end: "latest",
        count: 1000,
        style: "ticks",
        subscribe: 1,
      }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.msg_type === "history" && data.history) {
        const { prices, times } = data.history as { prices: number[]; times: number[] };
        const ticks: TickData[] = prices.map((p, i) => ({
          price: p,
          digit: extractDigit(p),
          time: times[i],
        }));
        setDigits(ticks);
        setHistoryLoaded(true);
        return;
      }

      if (data.msg_type === "tick" && data.tick) {
        const price = data.tick.quote as number;
        const time = data.tick.epoch as number;
        const digit = extractDigit(price);
        setDigits((prev) => {
          const next = [...prev, { price, digit, time }];
          if (next.length > 1500) next.shift();
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
    return () => {
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
      }
    };
  }, [connect]);

  const lastDigit     = digits.length > 0 ? digits[digits.length - 1].digit : null;
  const currentPrice  = digits.length > 0 ? digits[digits.length - 1].price : null;

  return { digits, lastDigit, currentPrice, isConnected, historyLoaded };
}

export type PriceData = { price: number; time: number };

export function useForexWebSocket(symbol: string) {
  const [prices, setPrices] = useState<PriceData[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  const connect = useCallback(() => {
    if (wsRef.current) { wsRef.current.onclose = null; wsRef.current.close(); }
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      setPrices([]);
      ws.send(JSON.stringify({
        ticks_history: symbol,
        end: "latest",
        count: 500,
        style: "ticks",
        subscribe: 1,
      }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.msg_type === "history" && data.history) {
        const { prices: ps, times: ts } = data.history as { prices: number[]; times: number[] };
        setPrices(ps.map((p, i) => ({ price: p, time: ts[i] })));
        return;
      }
      if (data.msg_type === "tick" && data.tick) {
        const price = data.tick.quote as number;
        const time  = data.tick.epoch as number;
        setPrices((prev) => {
          const next = [...prev, { price, time }];
          if (next.length > 1000) next.shift();
          return next;
        });
      }
    };

    ws.onclose = () => { setIsConnected(false); setTimeout(connect, 2000); };
    ws.onerror = () => ws.close();
  }, [symbol]);

  useEffect(() => {
    connect();
    return () => { if (wsRef.current) { wsRef.current.onclose = null; wsRef.current.close(); } };
  }, [connect]);

  const currentPrice = prices.length > 0 ? prices[prices.length - 1].price : null;
  return { prices, currentPrice, isConnected };
}
