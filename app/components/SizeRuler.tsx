"use client";

import { useCallback, useRef } from "react";
import {
  bytesToRulerFraction,
  formatBytes,
  rulerFractionToBytes,
} from "../lib/file-utils";

const DECADES = [
  { bytes: 1, label: "1 B" },
  { bytes: 1e3, label: "1 KB" },
  { bytes: 1e6, label: "1 MB" },
  { bytes: 1e9, label: "1 GB" },
  { bytes: 1024 ** 4, label: "1 TB" },
];

export default function SizeRuler({
  bytes,
  onChange,
}: {
  bytes: number;
  onChange: (bytes: number) => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const fraction = bytesToRulerFraction(bytes);

  const setFromClientX = useCallback(
    (clientX: number) => {
      const track = trackRef.current;
      if (!track) return;
      const rect = track.getBoundingClientRect();
      const f = (clientX - rect.left) / rect.width;
      onChange(rulerFractionToBytes(f));
    },
    [onChange]
  );

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setFromClientX(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.buttons !== 1) return;
    setFromClientX(e.clientX);
  };

  return (
    <div className="w-full select-none">
      <div className="flex items-baseline justify-between mb-3">
        <span className="font-mono text-[11px] tracking-widest text-blueprint-deep/70 uppercase">
          Size — drag to set
        </span>
        <span className="font-mono text-2xl md:text-3xl font-medium text-ink tabular-nums">
          {formatBytes(bytes)}
        </span>
      </div>

      <div
        ref={trackRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        className="relative h-16 cursor-pointer touch-none"
      >
        {/* baseline */}
        <div className="absolute left-0 right-0 top-8 h-[2px] bg-blueprint-deep/40" />

        {/* filled portion */}
        <div
          className="absolute left-0 top-8 h-[2px] bg-blueprint origin-left"
          style={{ width: `${fraction * 100}%` }}
        />

        {/* decade ticks */}
        {DECADES.map((d) => {
          const f = bytesToRulerFraction(d.bytes);
          return (
            <div
              key={d.label}
              className="absolute top-4 flex flex-col items-center"
              style={{ left: `${f * 100}%`, transform: "translateX(-50%)" }}
            >
              <div className="w-px h-4 bg-blueprint-deep/50" />
              <span className="mt-1 font-mono text-[10px] text-blueprint-deep/60 whitespace-nowrap">
                {d.label}
              </span>
            </div>
          );
        })}

        {/* minor ticks every ~1/40 for texture */}
        {Array.from({ length: 41 }).map((_, i) => {
          const f = i / 40;
          return (
            <div
              key={i}
              className="absolute top-7 w-px h-2 bg-blueprint-deep/20"
              style={{ left: `${f * 100}%` }}
            />
          );
        })}

        {/* draggable indicator */}
        <div
          className="absolute top-0 flex flex-col items-center"
          style={{ left: `${fraction * 100}%`, transform: "translateX(-50%)" }}
        >
          <div className="rounded-sm bg-blueprint text-white font-mono text-[10px] px-1.5 py-0.5 shadow-sm">
            ▲
          </div>
          <div className="w-[2px] h-8 bg-blueprint" />
        </div>
      </div>
    </div>
  );
}
