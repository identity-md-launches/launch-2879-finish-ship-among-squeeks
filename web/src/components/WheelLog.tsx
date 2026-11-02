import { useState } from "react";
import { STATION_BY_ID } from "@/shared/stations";
import type { WheelLog as Log, WheelLogEntry } from "@/shared/protocol";

const fmt = (ms: number) => `${Math.floor(ms / 60000)}:${String(Math.floor(ms / 1000) % 60).padStart(2, "0")}`;
const taskName = (id: string) => STATION_BY_ID.get(id)?.task ?? id;
function line(e: WheelLogEntry) {
  if (e.kind === "out") return { tone: "text-ink", text: `Power out for ${Math.max(1, Math.round(e.ms / 1000))}s. He really stopped.` };
  if (e.kind === "fix") return { tone: "text-up", text: `${taskName(e.station)} console fixed.` };
  return { tone: "text-down", text: `${taskName(e.station)} tampered ${e.dark ? "in the dark" : "with the lights on"}.` };
}

/** A readable, complete text alternative to the anonymous server timeline. */
export function WheelLog({ log, compact = false }: { log: Log | null; compact?: boolean }) {
  const [expanded, setExpanded] = useState(false);
  if (!log) return <section className="wheel-log" aria-label="Wheel log"><h2>Wheel log</h2><p className="wheel-empty">Waiting for the wheel log…</p></section>;
  const span = Math.max(log.now, 1);
  const pos = (at: number) => `${Math.min(100, (at / span) * 100)}%`;
  const limit = compact ? 3 : 6;
  const entries = expanded ? log.entries : log.entries.slice(-limit);
  return <section className="wheel-log" aria-label="Wheel log">
    <div className="wheel-log-header"><h2>Wheel log</h2><span>{log.passes.toLocaleString("en-US")} real wheel passes</span></div>
    <p className="wheel-log-meta">{log.run}</p>
    <div className="wheel-track" aria-hidden="true">
      {log.entries.map((e, i) => e.kind === "out" ? <span key={i} className="log-out absolute inset-y-0" style={{ left: pos(e.at), width: `${Math.max(.6, e.ms / span * 100)}%` }}/> : <span key={i} className={`${e.kind === "tamper" ? "log-tamper" : "log-fix"} absolute inset-y-0 w-1`} style={{ left: pos(e.at) }}/>)}</div>
    <div className="wheel-legend" aria-hidden="true"><span><i className="log-out"/>Power out</span><span><i className="log-tamper"/>Tampered</span><span><i className="log-fix"/>Fixed</span></div>
    {entries.length ? <ol className="wheel-entries">{entries.map((e, i) => { const { tone, text } = line(e); return <li key={`${e.at}-${i}`} className={tone}><time>{fmt(e.at)}</time><span>{text}</span></li>; })}</ol> : <p className="wheel-empty">No power cuts or console changes recorded yet.</p>}
    {log.entries.length > limit && <button type="button" className="text-button" aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>{expanded ? "Show recent events" : `Show all ${log.entries.length} events`}</button>}
    {!compact && <p className="wheel-log-meta">Shift time, not clock time. The log names no players.</p>}
  </section>;
}
