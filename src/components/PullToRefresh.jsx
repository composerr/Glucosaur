import { useState, useRef, useEffect } from "react";
import { RefreshCw } from "lucide-react";

const THRESHOLD = 80;

export default function PullToRefresh({ onRefresh, children }) {
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const pullRef = useRef(0);
  const pulling = useRef(false);

  useEffect(() => {
    pullRef.current = pullDistance;
  }, [pullDistance]);

  const handleTouchStart = (e) => {
    if (window.scrollY > 5 || refreshing) return;
    startY.current = e.touches[0].clientY;
    pulling.current = true;
  };

  const handleTouchMove = (e) => {
    if (!pulling.current) return;
    const diff = e.touches[0].clientY - startY.current;
    if (diff <= 0) {
      pulling.current = false;
      setPullDistance(0);
      return;
    }
    setPullDistance(Math.min(diff * 0.4, 120));
  };

  const handleTouchEnd = async () => {
    if (!pulling.current) return;
    pulling.current = false;
    if (pullRef.current >= THRESHOLD) {
      setRefreshing(true);
      setPullDistance(THRESHOLD);
      try { await onRefresh(); } catch {}
      setRefreshing(false);
    }
    setPullDistance(0);
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative"
    >
      <div
        className="absolute left-1/2 -translate-x-1/2 z-10 flex items-center justify-center transition-all duration-200"
        style={{
          top: pullDistance > 0 ? Math.min(pullDistance - 40, 20) : -40,
          opacity: pullDistance > 0 ? Math.min(pullDistance / 40, 1) : 0,
        }}
      >
        <div className="w-10 h-10 rounded-full bg-card border border-border/50 shadow-lg flex items-center justify-center">
          <RefreshCw
            className={`w-5 h-5 text-primary ${refreshing ? "animate-spin" : ""}`}
            style={!refreshing ? { transform: `rotate(${Math.min(pullDistance / THRESHOLD * 360, 360)}deg)` } : {}}
          />
        </div>
      </div>
      <div
        className="transition-transform duration-200 ease-out"
        style={{ transform: pullDistance > 0 ? `translateY(${pullDistance}px)` : "translateY(0)" }}
      >
        {children}
      </div>
    </div>
  );
}