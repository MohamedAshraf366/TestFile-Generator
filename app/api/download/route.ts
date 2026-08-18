import { NextRequest } from "next/server";
import crypto from "node:crypto";

// Node runtime required: we stream large buffers with crypto.randomBytes,
// which isn't available on the Edge runtime.
export const runtime = "nodejs";

type Pattern = "zero" | "random" | "text";

const MIN_BYTES = 1;
const MAX_BYTES = 1024 ** 4; // 1 TiB safety cap per request
const CHUNK = 1024 * 1024; // 1 MiB per stream pull

const UNIT_MULTIPLIER: Record<string, number> = {
  B: 1,
  KB: 1024,
  MB: 1024 ** 2,
  GB: 1024 ** 3,
  TB: 1024 ** 4,
};

const TEXT_LINE = Buffer.from(
  "0123456789 ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz\n",
  "utf-8"
);

function parseBytes(searchParams: URLSearchParams): number | null {
  const bytesParam = searchParams.get("bytes");
  if (bytesParam !== null) {
    const n = Number(bytesParam);
    return Number.isFinite(n) && n >= 0 ? Math.round(n) : null;
  }
  const size = searchParams.get("size");
  const unit = (searchParams.get("unit") || "B").toUpperCase();
  const multiplier = UNIT_MULTIPLIER[unit];
  if (size !== null && multiplier) {
    const n = Number(size);
    return Number.isFinite(n) && n >= 0 ? Math.round(n * multiplier) : null;
  }
  return null;
}

function sanitizeFilename(name: string): string {
  return name.replace(/["\r\n]/g, "").trim().slice(0, 200) || "testfile.bin";
}

/** Builds a chunk of `size` bytes starting at absolute offset `offset` within the full file. */
function buildChunk(size: number, offset: number, pattern: Pattern): Buffer {
  if (pattern === "random") return crypto.randomBytes(size);
  if (pattern === "text") {
    const buf = Buffer.alloc(size);
    let c = offset % TEXT_LINE.length;
    for (let i = 0; i < size; i++) {
      buf[i] = TEXT_LINE[c];
      c = (c + 1) % TEXT_LINE.length;
    }
    return buf;
  }
  return Buffer.alloc(size); // "zero" — already zero-filled
}

function makeStream(rangeStart: number, rangeEnd: number, pattern: Pattern) {
  let position = rangeStart;
  return new ReadableStream<Uint8Array>({
    pull(controller) {
      if (position > rangeEnd) {
        controller.close();
        return;
      }
      const size = Math.min(CHUNK, rangeEnd - position + 1);
      controller.enqueue(buildChunk(size, position, pattern));
      position += size;
    },
  });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const bytes = parseBytes(searchParams);
  const patternParam = searchParams.get("pattern") || "zero";

  if (!["zero", "random", "text"].includes(patternParam)) {
    return Response.json(
      { error: "`pattern` must be one of: zero, random, text." },
      { status: 400 }
    );
  }
  const pattern = patternParam as Pattern;

  if (bytes === null) {
    return Response.json(
      {
        error:
          "Provide a `bytes` query parameter (or `size` + `unit`, e.g. size=10&unit=MB).",
      },
      { status: 400 }
    );
  }
  if (bytes < MIN_BYTES || bytes > MAX_BYTES) {
    return Response.json(
      { error: `\`bytes\` must be between ${MIN_BYTES} and ${MAX_BYTES} (1 TiB).` },
      { status: 400 }
    );
  }

  const defaultExt = pattern === "text" ? "txt" : "bin";
  const filename = sanitizeFilename(
    searchParams.get("filename") || `testfile-${bytes}bytes.${defaultExt}`
  );
  const contentType =
    pattern === "text" ? "text/plain; charset=utf-8" : "application/octet-stream";

  const baseHeaders: Record<string, string> = {
    "Content-Type": contentType,
    "Content-Disposition": `attachment; filename="${filename}"`,
    "Cache-Control": "no-store",
    "Accept-Ranges": "bytes",
  };

  // Large files (above the platform's response-duration budget) rely on
  // Range requests: a client/download manager fetches successive byte
  // windows across multiple requests instead of one long-lived connection.
  const rangeHeader = req.headers.get("range");
  if (rangeHeader) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader.trim());
    if (!match || (match[1] === "" && match[2] === "")) {
      return new Response(null, {
        status: 416,
        headers: { "Content-Range": `bytes */${bytes}` },
      });
    }
    let start = match[1] === "" ? undefined : parseInt(match[1], 10);
    let end = match[2] === "" ? undefined : parseInt(match[2], 10);

    if (start === undefined) {
      // suffix range: last N bytes
      const suffixLength = end ?? 0;
      start = Math.max(0, bytes - suffixLength);
      end = bytes - 1;
    } else if (end === undefined || end > bytes - 1) {
      end = bytes - 1;
    }

    if (start >= bytes || start > end) {
      return new Response(null, {
        status: 416,
        headers: { "Content-Range": `bytes */${bytes}` },
      });
    }

    const length = end - start + 1;
    return new Response(makeStream(start, end, pattern), {
      status: 206,
      headers: {
        ...baseHeaders,
        "Content-Length": String(length),
        "Content-Range": `bytes ${start}-${end}/${bytes}`,
      },
    });
  }

  return new Response(makeStream(0, bytes - 1, pattern), {
    headers: {
      ...baseHeaders,
      "Content-Length": String(bytes),
    },
  });
}
