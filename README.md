# Payload — Test File Generator

A Next.js + Tailwind CSS app that gives you a stable HTTPS link for a test
file at any exact byte size — for probing upload limits, benchmarking
bandwidth, or wiring into a script with `curl`.

## How it works

`GET /api/download` streams a freshly generated file matching your query
params — nothing is pre-stored on the server, so the "file" only exists for
the duration of the request.

Query params:
- `bytes` — exact size in bytes (or use `size` + `unit`, e.g. `size=10&unit=MB`)
- `pattern` — `zero` (default), `random`, or `text`
- `filename` — optional, sets the downloaded file's name

```bash
curl -OJ "http://localhost:3000/api/download?bytes=10485760&pattern=zero&filename=10mb.bin"
```

Max size per link is 1 TB. The route also supports HTTP Range requests
(`Accept-Ranges: bytes`, `206 Partial Content`), so large files can be
pulled across multiple requests instead of one long-lived connection —
useful since serverless hosts (Vercel, etc.) cap how long a single request
can stay open. For a single sustained transfer at very large sizes, self-host
on a long-running server instead of serverless.

## Features

- Drag-controlled log-scale size ruler (1 B → 2 GB) that live-updates the link
- One-click size presets (1 KB → 1 GB), each with its own download link
- Custom size builder: unit picker, three fill patterns, filename, and a
  ready-to-copy link + curl snippet

## Getting started

```bash
npm install
npm run dev
```

This starts the dev server over **real local HTTPS** (`https://localhost:3000`),
so every generated link is a genuine `https://` URL, not just `http://localhost`.
Next.js generates a local certificate authority + certificate via `mkcert` on
first run (using `--experimental-https`) — your browser will ask you to trust
it once, and `curl` needs `-k` (or `--cacert` pointed at the generated CA)
since it's self-signed rather than publicly trusted.

Prefer plain HTTP locally? Run `npm run dev:http` instead.

## Build & deploy

```bash
npm run build
npm run start
```

`next start` serves plain HTTP — on a real deployment (Vercel, a Node host
behind Caddy/nginx/a load balancer, etc.) HTTPS is handled by the platform
automatically, which is the normal setup for production. Requires a Node.js
server either way (the API route streams responses), so a static export
(`next export`) will not work since `/api/download` needs a server.

## Stack

Next.js (App Router) · TypeScript · Tailwind CSS v4 · Node.js API route with
the Web Streams API for chunked, low-memory file generation.
