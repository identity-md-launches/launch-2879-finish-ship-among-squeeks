import type { GameRoom } from "./net";
import { endpoint, leaveRoom } from "./net";

export const WAKE_BUDGET_MS = 90_000;
const abortError = () => new DOMException("Connection cancelled", "AbortError");

function delay(ms: number, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal.aborted) return reject(abortError());
    const onAbort = () => { clearTimeout(timer); reject(abortError()); };
    const timer = setTimeout(() => { signal.removeEventListener("abort", onAbort); resolve(); }, ms);
    signal.addEventListener("abort", onAbort, { once: true });
  });
}

/** Bound an SDK operation, and release any seat that arrives after cancellation/timeout. */
function attempt(open: () => Promise<GameRoom>, ms: number, signal: AbortSignal): Promise<GameRoom> {
  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (error?: unknown, room?: GameRoom) => {
      if (settled) { if (room) leaveRoom(room); return; }
      settled = true;
      clearTimeout(timer);
      signal.removeEventListener("abort", onAbort);
      if (error) reject(error); else resolve(room!);
    };
    const onAbort = () => finish(abortError());
    const timer = setTimeout(() => finish(new Error("Connection timed out")), ms);
    signal.addEventListener("abort", onAbort, { once: true });
    if (signal.aborted) return onAbort();
    open().then((room) => finish(undefined, room), (error) => finish(error));
  });
}

/** Wake Render before matchmaking. A network failure is retried for at most 90 seconds. */
export async function connectWithRetry(open: () => Promise<GameRoom>, signal: AbortSignal, budget = WAKE_BUDGET_MS): Promise<GameRoom> {
  const end = Date.now() + budget;
  while (Date.now() < end) {
    if (signal.aborted) throw abortError();
    try {
      const probe = new AbortController();
      const cancel = () => probe.abort();
      signal.addEventListener("abort", cancel, { once: true });
      const timer = setTimeout(cancel, Math.min(10_000, end - Date.now()));
      try {
        const response = await fetch(endpoint().replace(/^ws/, "http").replace(/\/$/, "") + "/", { signal: probe.signal, cache: "no-store" });
        if (!response.ok) throw new Error("Server is waking");
      } finally { clearTimeout(timer); signal.removeEventListener("abort", cancel); }
      if (signal.aborted) throw abortError();
      const left = end - Date.now();
      if (left <= 0) break;
      return await attempt(open, Math.min(15_000, left), signal);
    } catch (error) {
      if (signal.aborted) throw abortError();
      // A responsive server can reject an invalid/full/started room immediately.
      if (/not found|locked|already started|full|invalid room/i.test(error instanceof Error ? error.message : String(error))) throw error;
      const left = end - Date.now();
      if (left > 0) await delay(Math.min(2500, left), signal);
    }
  }
  throw new Error("The burrow is taking longer than usual. Check your connection, then try again.");
}
