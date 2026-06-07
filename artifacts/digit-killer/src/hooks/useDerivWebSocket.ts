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
  pipSize?: number;
};

export const MARKETS_BY_CATEGORY: Record<MarketCategory, Market[]> = {
  volatility: [
    { name: "Vol 10",   symbol: "R_10",     category: "volatility", pipSize: 3 },
    { name: "Vol 25",   symbol: "R_25",     category: "volatility", pipSize: 3 },
    { name: "Vol 50",   symbol: "R_50",     category: "volatility", pipSize: 4 },
    { name: "Vol 75",   symbol: "R_75",     category: "volatility", pipSize: 4 },
    { name: "Vol 100",  symbol: "R_100",    category: "volatility", pipSize: 2 },
    { name: "1s V10",   symbol: "1HZ10V",   category: "volatility", pipSize: 3 },
    { name: "1s V15",   symbol: "1HZ15V",   category: "volatility", pipSize: 3 },
    { name: "1s V25",   symbol: "1HZ25V",   category: "volatility", pipSize: 3 },
    { name: "1s V30",   symbol: "1HZ30V",   category: "volatility", pipSize: 3 },
    { name: "1s V50",   symbol: "1HZ50V",   category: "volatility", pipSize: 4 },
    { name: "1s V75",   symbol: "1HZ75V",   category: "volatility", pipSize: 4 },
    { name: "1s V90",   symbol: "1HZ90V",   category: "volatility", pipSize: 4 },
    { name: "1s V100",  symbol: "1HZ100V",  category: "volatility", pipSize: 2 },
  ],
  crash_boom: [
    { name: "Crash 300",  symbol: "CRASH300N", category: "crash_boom", pipSize: 4 },
    { name: "Crash 500",  symbol: "CRASH500",  category: "crash_boom", pipSize: 4 },
    { name: "Crash 1000", symbol: "CRASH1000", category: "crash_boom", pipSize: 4 },
    { name: "Boom 300",   symbol: "BOOM300N",  category: "crash_boom", pipSize: 4 },
    { name: "Boom 500",   symbol: "BOOM500",   category: "crash_boom", pipSize: 4 },
    { name: "Boom 1000",  symbol: "BOOM1000",  category: "crash_boom", pipSize: 4 },
  ],
  jump: [
    { name: "Jump 10",  symbol: "JD10",  category: "jump", pipSize: 3 },
    { name: "Jump 25",  symbol: "JD25",  category: "jump", pipSize: 3 },
    { name: "Jump 50",  symbol: "JD50",  category: "jump", pipSize: 4 },
    { name: "Jump 75",  symbol: "JD75",  category: "jump", pipSize: 4 },
    { name: "Jump 100", symbol: "JD100", category: "jump", pipSize: 2 },
  ],
  bear_bull: [
    { name: "Bear",        symbol: "RDBEAR",   category: "bear_bull", pipSize: 4 },
    { name: "Bull",        symbol: "RDBULL",   category: "bear_bull", pipSize: 4 },
    { name: "Step 2",      symbol: "stpRNG2",  category: "bear_bull", pipSize: 2 },
    { name: "Step 5",      symbol: "stpRNG5",  category: "bear_bull", pipSize: 2 },
    { name: "Rng Brk 100", symbol: "RB100",    category: "bear_bull", pipSize: 4 },
    { name: "Rng Brk 200", symbol: "RB200",    category: "bear_bull", pipSize: 4 },
  ],
};

export const CATEGORY_LABELS: Record<MarketCategory, string> = {
  volatility:  "Volatility",
  crash_boom:  "Crash / Boom",
  jump:        "Jump",
  bear_bull:   "Bear · Bull · Step",
};

export const MARKETS: Market[] = Object.values(MARKETS_BY_CATEGORY).flat();

const WS_URL    = "wss://ws.binaryws.com/websockets/v3?app_id=1089";
const PING_MS   = 25000;
const MAX_TICKS = 1500;

/**
 * Extract the last digit of a price using the exact pip_size from the API.
 */
export function extractDigit(price: number, pipSize: number): number {
  const formatted = price.toFixed(pipSize);
  const digits = formatted.replace(".", "");
  return parseInt(digits.slice(-1), 10);
}

export function useDerivWebSocket(symbol: string) {
  const [digits,        setDigits]        = useState<TickData[]>([]);
  const [isConnected,   setIsConnected]   = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const wsRef   = useRef<WebSocket | null>(null);
  const pingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pipRef  = useRef<number>(4);

  const clearPing = () => {
    if (pingRef.current) { clearInterval(pingRef.current); pingRef.current = null; }
  };

  const connect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.onerror = null;
      wsRef.current.onmessage = null;
      wsRef.current.close();
      wsRef.current = null;
    }
    clearPing();

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      setDigits([]);
      setHistoryLoaded(false);

      pingRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ ping: 1 }));
      }, PING_MS);

      ws.send(JSON.stringify({
        ticks_history: symbol,
        end: "latest",
        count: 1000,
        style: "ticks",
        subscribe: 1,
      }));
    };

    ws.onmessage = (event: MessageEvent) => {
      const data = JSON.parse(event.data as string);

      if (data.msg_type === "history" && data.history) {
        if (typeof data.pip_size === "number") pipRef.current = data.pip_size;
        const pip = pipRef.current;
        const { prices, times } = data.history as { prices: number[]; times: number[] };
        const ticks: TickData[] = prices.map((p, i) => ({
          price: p, digit: extractDigit(p, pip), time: times[i],
        }));
        setDigits(ticks);
        setHistoryLoaded(true);
        return;
      }

      if (data.msg_type === "tick" && data.tick) {
        if (typeof data.tick.pip_size === "number") pipRef.current = data.tick.pip_size;
        const pip   = pipRef.current;
        const price = data.tick.quote as number;
        const time  = data.tick.epoch as number;
        const digit = extractDigit(price, pip);
        setDigits((prev) => {
          const next = [...prev, { price, digit, time }];
          return next.length > MAX_TICKS ? next.slice(-MAX_TICKS) : next;
        });
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      clearPing();
      setTimeout(connect, 3000);
    };

    ws.onerror = () => {
      clearPing();
      ws.close();
    };
  }, [symbol]);

  useEffect(() => {
    connect();
    return () => {
      clearPing();
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connect]);

  const lastDigit    = digits.length > 0 ? digits[digits.length - 1].digit : null;
  const currentPrice = digits.length > 0 ? digits[digits.length - 1].price : null;

  return { digits, lastDigit, currentPrice, isConnected, historyLoaded, pipSize: pipRef.current };
}

export type PriceData = { price: number; time: number };

export function useForexWebSocket(symbol: string) {
  const [prices,      setPrices]      = useState<PriceData[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef   = useRef<WebSocket | null>(null);
  const pingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearPing = () => {
    if (pingRef.current) { clearInterval(pingRef.current); pingRef.current = null; }
  };

  const connect = useCallback(() => {
    if (wsRef.current) { wsRef.current.onclose = null; wsRef.current.close(); wsRef.current = null; }
    clearPing();
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      setPrices([]);
      pingRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ ping: 1 }));
      }, PING_MS);
      ws.send(JSON.stringify({ ticks_history: symbol, end: "latest", count: 500, style: "ticks", subscribe: 1 }));
    };

    ws.onmessage = (event: MessageEvent) => {
      const data = JSON.parse(event.data as string);
      if (data.msg_type === "history" && data.history) {
        const { prices: ps, times: ts } = data.history as { prices: number[]; times: number[] };
        setPrices(ps.map((p, i) => ({ price: p, time: ts[i] })));
        return;
      }
      if (data.msg_type === "tick" && data.tick) {
        const price = data.tick.quote as number;
        const time  = data.tick.epoch as number;
        setPrices((prev) => { const next = [...prev, { price, time }]; return next.length > 1000 ? next.slice(-1000) : next; });
      }
    };

    ws.onclose = () => { setIsConnected(false); clearPing(); setTimeout(connect, 3000); };
    ws.onerror = () => { clearPing(); ws.close(); };
  }, [symbol]);

  useEffect(() => {
    connect();
    return () => { clearPing(); if (wsRef.current) { wsRef.current.onclose = null; wsRef.current.close(); wsRef.current = null; } };
  }, [connect]);

  const currentPrice = prices.length > 0 ? prices[prices.length - 1].price : null;
  return { prices, currentPrice, isConnected };
}
