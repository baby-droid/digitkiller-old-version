import { useEffect, useState } from "react";

export function LoadingScreen({ onDone }: { onDone: () => void }) {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState(0);

  const phases = [
    "INITIALIZING NEURAL CORE...",
    "SYNCING MARKET FEEDS...",
    "LOADING AI MODELS...",
    "READY",
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((p) => {
        const next = p + Math.random() * 8 + 3;
        if (next >= 100) {
          clearInterval(interval);
          setTimeout(onDone, 600);
          return 100;
        }
        return next;
      });
    }, 80);
    return () => clearInterval(interval);
  }, [onDone]);

  useEffect(() => {
    if (progress < 30) setPhase(0);
    else if (progress < 60) setPhase(1);
    else if (progress < 90) setPhase(2);
    else setPhase(3);
  }, [progress]);

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
      style={{
        background: "radial-gradient(ellipse at 50% 40%, #001a1a 0%, #0a0d14 60%, #000000 100%)",
      }}
    >
      {/* Rotating rings */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {[200, 300, 420].map((size, i) => (
          <div
            key={i}
            className="absolute rounded-full border border-primary/10"
            style={{
              width: size,
              height: size,
              animation: `spin ${6 + i * 3}s linear infinite ${i % 2 === 0 ? "" : "reverse"}`,
              borderStyle: i === 1 ? "dashed" : "solid",
            }}
          />
        ))}
        {/* Scan line */}
        <div
          className="absolute left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/40 to-transparent"
          style={{
            animation: "scanline 2s ease-in-out infinite",
          }}
        />
      </div>

      {/* Logo */}
      <div className="relative z-10 flex flex-col items-center gap-8">
        <div className="relative">
          <img
            src={`${import.meta.env.BASE_URL}logo.png`.replace("//", "/")}
            alt="Ahmed Syntrader Logo"
            className="w-36 h-36 rounded-full"
            style={{
              filter: "drop-shadow(0 0 30px rgba(0,209,209,0.6))",
              animation: "pulse-glow 2s ease-in-out infinite",
            }}
          />
          <div
            className="absolute inset-0 rounded-full border-2 border-primary/50"
            style={{ animation: "ping 1.5s ease-in-out infinite" }}
          />
        </div>

        <div className="text-center space-y-1">
          <div
            className="text-4xl font-black tracking-[0.3em] text-primary"
            style={{ fontFamily: "monospace", textShadow: "0 0 20px rgba(0,209,209,0.8)" }}
          >
            DIGIT KILLER
          </div>
          <div className="text-xs tracking-[0.5em] text-primary/60 uppercase">
            Ahmed Syntrader · AI Trading System
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-72 space-y-3">
          <div className="h-1.5 bg-primary/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-100"
              style={{
                width: `${progress}%`,
                boxShadow: "0 0 10px rgba(0,209,209,0.8)",
              }}
            />
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs font-mono text-primary/70">{phases[phase]}</span>
            <span className="text-xs font-mono text-primary font-bold">{Math.round(progress)}%</span>
          </div>
        </div>

        {/* Hex grid decoration */}
        <div className="flex gap-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              className="w-1.5 h-4 rounded-full bg-primary"
              style={{
                opacity: progress / 100 > i / 7 ? 1 : 0.15,
                transform: "scaleY(1)",
                animation: progress / 100 > i / 7 ? `bar-pulse 1s ease-in-out infinite ${i * 0.1}s` : "none",
              }}
            />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes scanline {
          0%, 100% { transform: translateY(-150px); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: translateY(150px); opacity: 0; }
        }
        @keyframes pulse-glow {
          0%, 100% { filter: drop-shadow(0 0 20px rgba(0,209,209,0.5)); }
          50% { filter: drop-shadow(0 0 40px rgba(0,209,209,0.9)); }
        }
        @keyframes bar-pulse {
          0%, 100% { transform: scaleY(0.6); opacity: 0.7; }
          50% { transform: scaleY(1.4); opacity: 1; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
