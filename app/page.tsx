"use client";

import { useEffect, useMemo, useState } from "react";
import SizeRuler from "./components/SizeRuler";
import {
  FillPattern,
  formatBytes,
  formatExactBytes,
  PRESETS,
  toBytes,
  Unit,
  UNITS,
} from "./lib/file-utils";
import { buildDownloadPath } from "./lib/link-utils";

const PATTERNS: { id: FillPattern; label: string; note: string; ext: string }[] =
  [
    { id: "zero", label: "Zero-filled", note: "fastest · compresses to ~0", ext: "bin" },
    { id: "random", label: "Random bytes", note: "incompressible · realistic transfer weight", ext: "bin" },
    { id: "text", label: "Repeating text", note: "human-readable · good for diff/encoding tests", ext: "txt" },
  ];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          // clipboard permission denied — silently ignore
        }
      }}
      className="font-mono text-[10px] uppercase tracking-widest text-blueprint hover:text-blueprint-deep transition-colors"
    >
      {copied ? "Copied ✓" : "Copy link"}
    </button>
  );
}

export default function Home() {
  const [origin, setOrigin] = useState("");
  const [customBytes, setCustomBytes] = useState<number>(toBytes(10, "MB"));
  const [amount, setAmount] = useState("10");
  const [unit, setUnit] = useState<Unit>("MB");
  const [pattern, setPattern] = useState<FillPattern>("zero");
  const [filename, setFilename] = useState("");

  // Read the real origin after mount (server has no window) so links render
  // as absolute, shareable URLs without causing a hydration mismatch.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOrigin(window.location.origin);
  }, []);

  const syncFromRuler = (bytes: number) => {
    setCustomBytes(bytes);
    const nextUnit: Unit =
      bytes >= toBytes(1, "TB")
        ? "TB"
        : bytes >= toBytes(1, "GB")
        ? "GB"
        : bytes >= toBytes(1, "MB")
        ? "MB"
        : bytes >= toBytes(1, "KB")
        ? "KB"
        : "B";
    const divisor = toBytes(1, nextUnit);
    setUnit(nextUnit);
    setAmount(
      (bytes / divisor).toFixed(nextUnit === "B" ? 0 : 2).replace(/\.?0+$/, "")
    );
  };

  const syncFromFields = (nextAmount: string, nextUnit: Unit) => {
    setAmount(nextAmount);
    setUnit(nextUnit);
    const parsed = parseFloat(nextAmount);
    if (!Number.isNaN(parsed) && parsed >= 0) {
      setCustomBytes(toBytes(parsed, nextUnit));
    }
  };

  const activePattern = useMemo(
    () => PATTERNS.find((p) => p.id === pattern)!,
    [pattern]
  );

  const defaultFilename = useMemo(() => {
    const size = formatBytes(customBytes).replace(/\s/g, "");
    return `testfile-${size}.${activePattern.ext}`;
  }, [customBytes, activePattern]);

  const customPath = useMemo(
    () => buildDownloadPath(customBytes, pattern, filename.trim() || defaultFilename),
    [customBytes, pattern, filename, defaultFilename]
  );
  const customUrl = origin ? origin + customPath : customPath;

  return (
    <main className="flex-1">
      {/* Header / spec sheet strip */}
      <header className="border-b border-paper-line">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-baseline gap-3">
            <span className="font-display font-bold text-lg tracking-tight">
              Payload
            </span>
            <span className="hidden sm:inline font-mono text-[11px] tracking-widest text-blueprint-deep/60 uppercase">
              Test File Generator
            </span>
          </div>
          <span className="font-mono text-[11px] text-blueprint-deep/50 uppercase tracking-widest">
            Streamed on request
          </span>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 pt-14 pb-10">
        <div className="font-mono text-[11px] tracking-widest text-rule-red uppercase mb-3">
          Doc No. 0001 — Blank Payload Fixture
        </div>
        <h1 className="font-display text-4xl md:text-5xl font-bold leading-[1.05] max-w-2xl">
          A link for every byte size.
        </h1>
        <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-ink/70">
          Drag the ruler or pick a preset to get a stable download link — for
          probing upload limits, benchmarking bandwidth, or wiring into
          <code className="mx-1 font-mono text-[13px] bg-paper-line/60 px-1 rounded">curl</code>
          in a script. Each request streams fresh bytes; nothing is
          pre-stored on the server.
        </p>

        <div className="mt-10 border border-paper-line bg-white/60 rounded-md px-6 py-6">
          <SizeRuler bytes={customBytes} onChange={syncFromRuler} />
        </div>
      </section>

      {/* Presets */}
      <section className="max-w-5xl mx-auto px-6 pb-14">
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="font-display font-bold text-xl">Presets</h2>
          <span className="font-mono text-[11px] text-blueprint-deep/50 uppercase tracking-widest">
            Zero-filled · .bin
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {PRESETS.map((p) => {
            const path = buildDownloadPath(
              p.bytes,
              "zero",
              `testfile-${p.label.replace(/\s/g, "")}.bin`
            );
            const url = origin ? origin + path : path;
            return (
              <div
                key={p.label}
                className="group border border-paper-line bg-white/60 hover:border-blueprint hover:bg-white rounded-md px-4 py-3 transition-colors"
              >
                <div className="font-display font-semibold text-lg">
                  {p.label}
                </div>
                <div className="font-mono text-[11px] text-blueprint-deep/60 tabular-nums">
                  {formatExactBytes(p.bytes)}
                </div>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <a
                    href={path}
                    className="font-mono text-[10px] uppercase tracking-widest text-blueprint hover:text-blueprint-deep transition-colors"
                  >
                    Download ↓
                  </a>
                  <CopyButton text={url} />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Custom builder */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <div className="border border-paper-line bg-white/60 rounded-md">
          <div className="border-b border-paper-line px-6 py-4 flex items-baseline justify-between">
            <h2 className="font-display font-bold text-xl">Custom build</h2>
            <span className="font-mono text-[11px] text-blueprint-deep/50 uppercase tracking-widest">
              {formatExactBytes(customBytes)}
            </span>
          </div>

          <div className="p-6 grid md:grid-cols-2 gap-8">
            {/* left: size + filename */}
            <div className="space-y-5">
              <div>
                <label className="block font-mono text-[11px] uppercase tracking-widest text-blueprint-deep/70 mb-1.5">
                  Size
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min={0}
                    step="any"
                    value={amount}
                    onChange={(e) => syncFromFields(e.target.value, unit)}
                    className="w-full font-mono text-base border border-paper-line rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blueprint/40 focus:border-blueprint"
                  />
                  <select
                    value={unit}
                    onChange={(e) =>
                      syncFromFields(amount, e.target.value as Unit)
                    }
                    className="font-mono text-base border border-paper-line rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blueprint/40 focus:border-blueprint"
                  >
                    {UNITS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="mt-1.5 font-mono text-[11px] text-ink/50">
                  Binary units — 1 KB = 1,024 bytes. Max 1 TB per link.
                </p>
              </div>

              <div>
                <label className="block font-mono text-[11px] uppercase tracking-widest text-blueprint-deep/70 mb-1.5">
                  Filename
                </label>
                <input
                  type="text"
                  value={filename}
                  onChange={(e) => setFilename(e.target.value)}
                  placeholder={defaultFilename}
                  className="w-full font-mono text-base border border-paper-line rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blueprint/40 focus:border-blueprint placeholder:text-ink/30"
                />
              </div>
            </div>

            {/* right: pattern */}
            <div>
              <label className="block font-mono text-[11px] uppercase tracking-widest text-blueprint-deep/70 mb-1.5">
                Content
              </label>
              <div className="space-y-2">
                {PATTERNS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPattern(p.id)}
                    className={`w-full flex items-center justify-between text-left border rounded-md px-3 py-2.5 transition-colors ${
                      pattern === p.id
                        ? "border-blueprint bg-blueprint/5"
                        : "border-paper-line bg-white hover:border-blueprint/50"
                    }`}
                  >
                    <span>
                      <span className="font-display font-medium text-sm block">
                        {p.label}
                      </span>
                      <span className="font-mono text-[10px] text-ink/50">
                        {p.note}
                      </span>
                    </span>
                    <span
                      className={`w-3 h-3 rounded-full border-2 flex-shrink-0 ${
                        pattern === p.id
                          ? "border-blueprint bg-blueprint"
                          : "border-paper-line"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* generated link */}
          <div className="border-t border-paper-line px-6 py-5 space-y-3">
            <label className="block font-mono text-[11px] uppercase tracking-widest text-blueprint-deep/70">
              Link
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                readOnly
                value={customUrl}
                onFocus={(e) => e.currentTarget.select()}
                className="w-full font-mono text-[13px] border border-paper-line rounded-md px-3 py-2 bg-paper text-ink/80 truncate"
              />
              <div className="flex gap-2 flex-shrink-0">
                <CopyButton text={customUrl} />
                <a
                  href={customPath}
                  className="font-mono text-sm uppercase tracking-widest bg-blueprint text-white px-4 py-2 rounded-md hover:bg-blueprint-deep transition-colors whitespace-nowrap"
                >
                  Download ↓
                </a>
              </div>
            </div>
            <pre className="font-mono text-[11px] text-ink/50 bg-paper border border-paper-line rounded-md px-3 py-2 overflow-x-auto">
{`curl -OJ "${customUrl}"`}
            </pre>
            {customBytes > toBytes(5, "GB") && (
              <p className="font-mono text-[11px] text-amber leading-relaxed">
                Serverless hosts (e.g. Vercel) kill single connections after a
                fixed duration — a download this large may not finish in one
                request. It still works via Range requests (
                <code className="mx-1">curl --continue-at -</code> or a
                download manager), or self-host on a long-running server for
                a single sustained transfer.
              </p>
            )}
          </div>
        </div>
      </section>

      <footer className="border-t border-paper-line mt-auto">
        <div className="max-w-5xl mx-auto px-6 py-6 flex flex-wrap items-center justify-between gap-2 font-mono text-[11px] text-ink/50 uppercase tracking-widest">
          <span>Bytes are streamed fresh per request — nothing is pre-stored.</span>
          <span>Max 1 TB per link.</span>
        </div>
      </footer>
    </main>
  );
}
