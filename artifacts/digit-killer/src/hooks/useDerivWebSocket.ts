import { useState, useEffect, useRef, useCallback } from "react";

export type TickData = {
  price: number;
  digit: number;
  time: number;
};

export const MARKETS = [
  { name: "Vol 10", symbol: "R_10" },
  { name: "Vol 25", symbol: "R_25" },
  { name: "Vol 50", symbol: "R_50" },
  { name: "Vol 75", symbol: "R_75" },
  { name: "Vol 100", symbol: "R_100" },
  { name: "1s V10", symbol: "1HZ10V" },
  { name: "1s V25", symbol: "1HZ25V" },
  { name: "1s V50", symbol: "1HZ50V" },
  { name: "1s V75", symbol: "1HZ75V" },
  { name: "1s V100", symbol: "1HZ100V" },
];

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
      setDigits([]); // clear on connect
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
          if (newDigits.length > 500) {
            newDigits.shift();
          }
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
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  const lastDigit = digits.length > 0 ? digits[digits.length - 1].digit : null;
  const currentPrice = digits.length > 0 ? digits[digits.length - 1].price : null;

  return { digits, lastDigit, currentPrice, isConnected };
}
