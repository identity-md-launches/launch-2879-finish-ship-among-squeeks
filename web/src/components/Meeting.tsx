import { WheelLog } from "./WheelLog";
import type { WheelLog as WheelLogData } from "@/shared/protocol";
import { useEffect, useRef, useState } from "react";
import { sfx } from "@/game/sfx";
import { CHAT_MAX, QUICK_CHAT, SKIP, type ServerMessages } from "@/shared/protocol";
import { SUITS, hex } from "@/shared/suits";
import type { GameRoom } from "@/net/net";
import type { GameSnapshot, Seat } from "@/net/useGame";
import { HamsterDev } from "./menu/HamsterDev";
import { SoundButton } from "./SoundButton";

type Line = ServerMessages["chat"] & { key: number };
type Verdict = ServerMessages["verdict"];

const STAGE = { discuss: "Discuss", vote: "Vote", result: "Result" } as const;
/** The verdict shows the tally first, then the firing. */
const TALLY_MS = 3500;

/**
 * The meeting: who called it, every Hamster at the table, chat with quick phrases, voting (or skip),
 * then the tally and the firing ("Hamster #412 was fired. They were not The Rugger.").
 */
export function Meeting({ room, game, rugMates, wheelLog, onLeave }: { room: GameRoom; game: GameSnapshot; rugMates: string[]; wheelLog: WheelLogData | null; onLeave: () => void }) {
  const meId = room.sessionId;
  const me = game.seats.find((s) => s.id === meId);
  const canAct = !!me?.alive;
  const [lines, setLines] = useState<Line[]>([]);
  const [text, setText] = useState("");
  const [picked, setPicked] = useState<string | null>(null);
  const [myVote, setMyVote] = useState<string | null>(null);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [firing, setFiring] = useState(false);
  const [chatOpen, setChatOpen] = useState(() => window.innerWidth >= 900);
  const log = useRef<HTMLDivElement>(null);
  const firingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    sfx.red(0.6);
    const offs = [
      room.onMessage("chat", (m: ServerMessages["chat"]) => setLines((l) => [...l.slice(-60), { ...m, key: Math.random() }])),
      room.onMessage("verdict", (v: Verdict) => {
        setVerdict(v);
        firingTimer.current = setTimeout(() => setFiring(true), TALLY_MS);
      }),
    ];
    return () => { offs.forEach((off) => off()); if (firingTimer.current) clearTimeout(firingTimer.current); };
  }, [room]);

  useEffect(() => {
    log.current?.scrollTo({ top: log.current.scrollHeight, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  }, [lines]);

  const seat = (id: string) => game.seats.find((s) => s.id === id);
  const caller = seat(game.meetingBy);
  const voting = game.meetingStage === "vote" && canAct && !myVote;
  const send = (t: string) => {
    const msg = t.trim().slice(0, CHAT_MAX);
    if (!msg || !canAct) return;
    room.send("chat", msg);
    setText("");
  };
  const vote = (target: string) => {
    room.send("vote", target);
    setMyVote(target);
    setPicked(null);
    sfx.green();
  };
  const pickedName = picked && picked !== SKIP ? seat(picked)?.name : null;

  // Who voted for whom (only once the verdict is in).
  const votersFor = (target: string) =>
    verdict ? Object.entries(verdict.votes).filter(([, t]) => t === target).map(([v]) => seat(v)).filter(Boolean) as Seat[] : [];

  if (firing && verdict) return <Firing game={game} verdict={verdict} />;

  return (
    <div className="meeting pointer-events-auto absolute inset-0 z-40 overflow-y-auto">
      <div className="mx-auto flex min-h-full max-w-6xl flex-col gap-3 p-3 md:flex-row md:p-6">
        {/* Table */}
        <section className="meeting-panel flex min-w-0 flex-1 flex-col rounded-2xl p-3 md:p-5">
          <div className="meeting-utilities"><SoundButton/><button type="button" className="text-button" onClick={onLeave}>Leave room</button></div>
          <header className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {caller && (
                <img src={`hamsters/${caller.hamsterId}.svg`} alt="" className="h-11 w-11 rounded-xl object-cover" style={{ boxShadow: `0 0 0 2px ${hex(SUITS[caller.suit].color)}` }} />
              )}
              <div className="leading-tight">
                <h1 className="display text-lg font-bold uppercase tracking-wider text-down md:text-2xl">
                  {game.meetingWhy === "alarm" ? "Vault alarm!" : "Emergency meeting"}
                </h1>
                <div className="text-xs text-muted">Called by {caller?.name ?? "someone"}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="display text-[10px] font-bold uppercase tracking-[0.3em] text-muted">{game.meetingStage ? STAGE[game.meetingStage] : ""}</div>
              <div className={`display text-2xl font-bold tabular-nums ${game.countdown <= 5 ? "text-down" : "text-ink"}`}>{game.countdown}s</div>
            </div>
          </header>

          <p className="mt-2 text-xs text-muted">
            {!canAct
              ? "You were fired. You can watch, but not talk or vote."
              : game.meetingStage === "discuss"
                ? "Talk it out. Voting opens when the timer ends."
                : game.meetingStage === "vote"
                  ? myVote
                    ? "Vote locked in. Waiting for the others…"
                    : "Tap a Hamster to vote them out, or skip."
                  : "The votes are in."}
          </p>

          <div className="mt-3">
            <WheelLog log={wheelLog} />
          </div>

          <div className="seat-grid mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {game.seats.map((s) => {
              const out = !s.alive;
              const selectable = voting && !out && s.id !== meId;
              const isPicked = picked === s.id;
              const mate = rugMates.includes(s.id);
              return (
                <div key={s.id} className={`seat-card rounded-xl ${out ? "opacity-35 grayscale" : ""} ${isPicked ? "ring-2 ring-down" : "ring-1 ring-white/10"}`}>
                  <button type="button" className="seat-choice" aria-disabled={!selectable} tabIndex={selectable ? 0 : -1}
                    aria-label={selectable ? `Select ${s.name} for a vote` : s.name} aria-pressed={selectable ? isPicked : undefined}
                    onClick={() => selectable && setPicked(isPicked ? null : s.id)}>
                    <span className="relative block h-11 w-11 shrink-0 overflow-hidden rounded-lg" style={{ boxShadow: `0 0 0 2px ${hex(SUITS[s.suit].color)}` }}>
                      <img src={`hamsters/${s.hamsterId}.svg`} alt="" className="h-full w-full object-cover" />
                      {out && <span className="absolute inset-0 grid place-items-center bg-black/60 text-sm font-bold text-down">Fired</span>}
                    </span>
                    <span className="min-w-0 flex-1 leading-tight">
                      <span className={`block break-words text-sm font-bold ${mate ? "text-down" : "text-ink"}`}>{s.name}{s.id === meId && <span className="ml-1 font-normal text-muted">you</span>}</span>
                      <span className="flex flex-wrap items-center gap-1 text-sm text-muted"><span className="inline-block h-2 w-2 rounded-full" style={{ background: hex(SUITS[s.suit].color) }} />{SUITS[s.suit].name}{s.id === game.meetingBy && <span>· caller</span>}{s.bot && <span>· AI</span>}</span>
                      {verdict && <span className="mt-1 flex flex-wrap gap-1">{votersFor(s.id).map((v) => <img key={v.id} src={`hamsters/${v.hamsterId}.svg`} alt={v.name} title={v.name} className="h-4 w-4 rounded-sm"/>)}</span>}
                    </span>
                    {s.voted && !verdict && <span className="text-sm font-bold text-up">Voted</span>}
                  </button>
                  {isPicked && voting && <div className="vote-confirmation"><button type="button" onClick={() => vote(s.id)} className="secondary-button" aria-label={`Confirm vote for ${s.name}`}>Confirm vote</button><button type="button" onClick={() => setPicked(null)} className="utility" aria-label="Cancel vote selection">×</button></div>}
                </div>
              );
            })}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button type="button" disabled={!voting} onClick={() => vote(SKIP)} className="ghost-btn px-5 py-2 text-sm">
              Skip vote
            </button>
            {myVote && (
              <span className="text-xs text-muted">
                You voted: <b className="text-ink">{myVote === SKIP ? "skip" : seat(myVote)?.name}</b>
              </span>
            )}
            {verdict && (
              <div className="flex items-center gap-1 text-xs text-muted">
                Skipped:
                {votersFor(SKIP).map((v) => (
                  <img key={v.id} src={`hamsters/${v.hamsterId}.svg`} alt={v.name} title={v.name} className="vote-chip h-4 w-4 rounded-sm object-cover" />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Chat */}
        <section className={`meeting-panel flex flex-col rounded-2xl md:w-[340px] ${chatOpen ? "min-h-[300px]" : ""}`}>
          <button type="button" onClick={() => setChatOpen((o) => !o)} aria-expanded={chatOpen} className="flex items-center justify-between px-4 py-3">
            <span className="display text-xs font-bold uppercase tracking-widest text-muted">Chat</span>
            <span className="text-xs text-muted md:hidden">
              {lines.length} {chatOpen ? "▾" : "▸"}
            </span>
          </button>
          {chatOpen && (
            <>
              <div ref={log} className="max-h-[38vh] flex-1 space-y-2 overflow-y-auto px-4 md:max-h-none">
                {lines.length === 0 && <p className="text-xs text-muted">No one has said anything yet.</p>}
                {lines.map((l) => {
                  const s = seat(l.from);
                  return (
                    <div key={l.key} className="chat-in flex items-start gap-2">
                      {s && <img src={`hamsters/${s.hamsterId}.svg`} alt="" className="mt-0.5 h-6 w-6 shrink-0 rounded-md object-cover" />}
                      <div className="min-w-0 text-[13px] leading-snug">
                        <b className="text-ink">{s?.name ?? "?"}</b>{" "}
                        <span className="break-words text-ink/90">{l.text}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              {canAct && game.meetingStage !== "result" && (
                <div className="border-t border-white/10 p-3">
                  <div className="mb-2 flex flex-wrap gap-1">
                    {QUICK_CHAT.map((q) => {
                      const needsName = q.includes("{name}");
                      if (needsName && !pickedName) return null;
                      const t = q.replace("{name}", pickedName ?? "");
                      return (
                        <button key={q} type="button" onClick={() => send(t)} className="rounded-full bg-white/8 px-2.5 py-1 text-[11px] ring-1 ring-white/10 hover:bg-white/15">
                          {t}
                        </button>
                      );
                    })}
                    {!pickedName && <span className="px-1 py-1 text-[10px] text-muted">Tap a Hamster for more phrases</span>}
                  </div>
                  <form
                    className="flex gap-2"
                    onSubmit={(e) => {
                      e.preventDefault();
                      send(text);
                    }}
                  >
                    <input aria-label="Message to the crew" autoComplete="off" value={text} maxLength={CHAT_MAX} onChange={(e) => setText(e.target.value)} placeholder="Say something…" className="field w-0 flex-1" />
                    <button type="submit" className="ghost-btn px-4 py-2 text-sm">
                      Send
                    </button>
                  </form>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}

/** The firing: the voted-out Hamster walks off screen while the verdict types out. */
function Firing({ game, verdict }: { game: GameSnapshot; verdict: Verdict }) {
  const s = game.seats.find((x) => x.id === verdict.fired);
  const line1 = s ? `${s.name} was fired.` : "Nobody was fired.";
  const line2 = s ? `They were ${verdict.wasRugger ? "" : "not "}The Rugger.` : "Skipped.";
  const line3 = `${verdict.ruggersLeft} Rugger${verdict.ruggersLeft === 1 ? "" : "s"} remain${verdict.ruggersLeft === 1 ? "s" : ""}.`;
  const full = `${line1}\n${line2}\n${line3}`;
  const [n, setN] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setN((k) => Math.min(full.length, k + 1)), 45);
    return () => clearInterval(t);
  }, [full]);
  useEffect(() => {
    if (s && verdict.wasRugger) sfx.win();
  }, [s, verdict.wasRugger]);
  const shown = full.slice(0, n).split("\n");

  return (
    <div className="firing pointer-events-auto absolute inset-0 z-40 grid place-items-center overflow-hidden">
      <div className="firing-exit display">EXIT</div>
      <div className="firing-floor" />
      {s && (
        <div className="fired-walk absolute top-[30%]">
          <HamsterDev hamsterId={s.hamsterId} color={SUITS[s.suit].color} className="w-[clamp(90px,14vw,150px)]" />
          <div className="fired-box display mx-auto -mt-4 w-16 rounded-sm px-1 py-0.5 text-center text-sm font-bold text-black/70">My stuff</div>
        </div>
      )}
      <div className="relative mt-[22vh] px-4 text-center">
        {shown.map((l, i) => (
          <p key={i} className={`display ${i === 0 ? "firing-headline font-bold text-white" : i === 1 ? `mt-2 firing-description ${verdict.wasRugger ? "text-down" : "text-white/80"}` : "mt-4 text-sm uppercase tracking-[0.3em] text-muted"}`}>
            {l}
          </p>
        ))}
      </div>
    </div>
  );
}
