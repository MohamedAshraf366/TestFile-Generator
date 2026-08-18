// Utilities for building and downloading in-browser test files.

export type FillPattern = "zero" | "random" | "text";

export const UNITS = ["B", "KB", "MB", "GB", "TB"] as const;
export type Unit = (typeof UNITS)[number];

const UNIT_MULTIPLIER: Record<Unit, number> = {
  B: 1,
  KB: 1024,
  MB: 1024 ** 2,
  GB: 1024 ** 3,
  TB: 1024 ** 4,
};

export function toBytes(amount: number, unit: Unit): number {
  return Math.round(amount * UNIT_MULTIPLIER[unit]);
}

/** Human-readable byte size, e.g. 1536 -> "1.5 KB" */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const exp = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1
  );
  const value = bytes / 1024 ** exp;
  const fixed = exp === 0 ? 0 : decimals;
  return `${value.toFixed(fixed)} ${units[exp]}`;
}

/** Exact byte count with thousands separators, e.g. "1,048,576 bytes" */
export function formatExactBytes(bytes: number): string {
  return `${Math.round(bytes).toLocaleString("en-US")} bytes`;
}

export interface Preset {
  label: string;
  bytes: number;
}

export const PRESETS: Preset[] = [
  { label: "1 KB", bytes: toBytes(1, "KB") },
  { label: "10 KB", bytes: toBytes(10, "KB") },
  { label: "100 KB", bytes: toBytes(100, "KB") },
  { label: "500 KB", bytes: toBytes(500, "KB") },
  { label: "1 MB", bytes: toBytes(1, "MB") },
  { label: "5 MB", bytes: toBytes(5, "MB") },
  { label: "10 MB", bytes: toBytes(10, "MB") },
  { label: "25 MB", bytes: toBytes(25, "MB") },
  { label: "50 MB", bytes: toBytes(50, "MB") },
  { label: "100 MB", bytes: toBytes(100, "MB") },
  { label: "250 MB", bytes: toBytes(250, "MB") },
  { label: "500 MB", bytes: toBytes(500, "MB") },
  { label: "1 GB", bytes: toBytes(1, "GB") },
  { label: "10 GB", bytes: toBytes(10, "GB") },
  { label: "100 GB", bytes: toBytes(100, "GB") },
  { label: "1 TB", bytes: toBytes(1, "TB") },
];

export const MIN_BYTES = 1;
export const MAX_BYTES = toBytes(1, "TB");

/** Position [0,1] along a log10 ruler between MIN_BYTES and MAX_BYTES. */
export function bytesToRulerFraction(bytes: number): number {
  const clamped = Math.min(Math.max(bytes, MIN_BYTES), MAX_BYTES);
  const lo = Math.log10(MIN_BYTES);
  const hi = Math.log10(MAX_BYTES);
  return (Math.log10(clamped) - lo) / (hi - lo);
}

export function rulerFractionToBytes(fraction: number): number {
  const lo = Math.log10(MIN_BYTES);
  const hi = Math.log10(MAX_BYTES);
  const clamped = Math.min(Math.max(fraction, 0), 1);
  return Math.round(10 ** (lo + clamped * (hi - lo)));
}
