import { useEffect, useMemo, useState } from "react";
import Lottie from "lottie-react";

type Props = {
  onDone: () => void;
  minDurationMs?: number;
};

export default function SplashScreen({ onDone, minDurationMs = 5000 }: Props) {
  const [animationData, setAnimationData] = useState<any | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const startedAt = useMemo(() => Date.now(), []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/assetflow-splash.json", { cache: "no-store" });
        if (!res.ok) throw new Error(`Failed to load splash animation (${res.status})`);
        const json = await res.json();
        if (!cancelled) setAnimationData(json);
      } catch (e: any) {
        if (!cancelled) setLoadError(e?.message || "Failed to load splash animation");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const remaining = Math.max(0, minDurationMs - (Date.now() - startedAt));
    const t = window.setTimeout(() => onDone(), remaining);
    return () => window.clearTimeout(t);
  }, [minDurationMs, onDone, startedAt]);

  return (
    <div className="fixed inset-0 z-50 bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-80 h-80 md:w-96 md:h-96">
          {animationData ? (
            <Lottie animationData={animationData} loop />
          ) : (
            <div className="w-full h-full rounded-2xl bg-muted animate-pulse" />
          )}
        </div>
        <div className="text-sm text-muted-foreground select-none">
          {loadError ? "Loading…" : "AssetFlow"}
        </div>
      </div>
    </div>
  );
}

