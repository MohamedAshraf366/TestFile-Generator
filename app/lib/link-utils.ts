import { FillPattern } from "./file-utils";

/** Builds the relative API path for a download link, e.g. /api/download?bytes=...&pattern=... */
export function buildDownloadPath(
  bytes: number,
  pattern: FillPattern,
  filename?: string
): string {
  const params = new URLSearchParams();
  params.set("bytes", String(Math.max(1, Math.round(bytes))));
  params.set("pattern", pattern);
  if (filename) params.set("filename", filename);
  return `/api/download?${params.toString()}`;
}
