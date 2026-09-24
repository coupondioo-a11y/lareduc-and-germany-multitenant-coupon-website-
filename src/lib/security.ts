import type { NextRequest } from "next/server";

/**
 * Reject header combinations used in request-smuggling attacks: a request
 * claiming both Content-Length and Transfer-Encoding, a body on a method that
 * shouldn't have one, or a Transfer-Encoding value other than exactly
 * "chunked".
 */
export function hasSmugglingSignature(request: NextRequest): boolean {
  const contentLength = request.headers.get("content-length");
  const transferEncoding = request.headers.get("transfer-encoding");

  if (contentLength && transferEncoding) return true;
  if (transferEncoding && transferEncoding.toLowerCase() !== "chunked") return true;
  if ((request.method === "DELETE" || request.method === "OPTIONS") && contentLength && contentLength !== "0") {
    return true;
  }
  return false;
}

/** Only middleware may set these -- strip whatever the client sent so nothing downstream trusts a forged value. */
export function stripInternalHeaders(headers: Headers): void {
  headers.delete("x-nextjs-data");
  headers.delete("x-admin-id");
}

// ponytail: in-memory, per-isolate counter -- correct for a single-region
// deploy, not across multiple edge regions/instances. Upgrade to a shared
// store (Redis/Vercel KV) if this ever runs multi-region.
const hits = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 100;

export function isRateLimited(key: string): boolean {
  const now = Date.now();
  const entry = hits.get(key);

  if (!entry || now > entry.resetAt) {
    hits.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }

  entry.count += 1;
  return entry.count > MAX_PER_WINDOW;
}
