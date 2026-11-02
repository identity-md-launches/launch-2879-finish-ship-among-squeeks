import { useEffect, useMemo, useRef, useState } from "react";
import { WheelLog } from "./WheelLog";
import { SoundButton } from "./SoundButton";
import { Icon } from "./Icon";
import { sfx } from "@/game/sfx";
import { SUITS, hex } from "@/shared/suits";
import { downloadCard, drawResultCard, resultPost } from "@/lib/resultCard";
import type { GameRoom } from "@/net/net";
import type { GameSnapshot } from "@/net/useGame";
import type { Role, WheelLog as WheelLogData } from "@/shared/protocol";

export function MatchEnd({ room, game, ruggers, role, log, liveRunDate, onLeave }: { room: GameRoom; game: GameSnapshot; ruggers: string[] | null; role: Role | null; log: WheelLogData | null; liveRunDate: string | null; onLeave: () => void }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [cardReady, setCardReady] = useState(false);
  const [cardError, setCardError] = useState(false);
  const [generation, setGeneration] = useState(0);
  const [downloaded, setDownloaded] = useState(false);
  const [downloadError, setDownloadError] = useState(false);
  const devsWin = game.winner === "devs";
  const myRole = role ?? (ruggers ? ruggers.includes(room.sessionId) ? "rugger" : "dev" : null);
  const me = game.seats.find((s) => s.id === room.sessionId);
  const winner = devsWin ? "Miners win" : "Ruggers win";
  const data = useMemo(() => me && myRole ? {
    name: me.name, hamsterId: me.hamsterId, suitColor: hex(SUITS[me.suit].color), role: myRole === "rugger" ? "Rugger" as const : "Miner" as const,
    winner, passes: log?.passes ?? game.wheelPasses,
    run: (log?.run ?? game.wheelRun) === "Live from the wheel" ? `Live wheel · ${liveRunDate ?? "run date unavailable"}` : log?.run || game.wheelRun,
  } : null, [me, myRole, winner, log, game.wheelPasses, game.wheelRun, liveRunDate]);

  useEffect(() => { if (myRole) { if (devsWin !== (myRole === "rugger")) sfx.win(); else sfx.lose(); } }, [myRole, devsWin]);
  useEffect(() => {
    if (!canvas.current || !data) return;
    let active = true;
    setCardReady(false); setCardError(false);
    void drawResultCard(canvas.current, data).then(() => { if (active) setCardReady(true); }).catch(() => { if (active) setCardError(true); });
    return () => { active = false; };
  }, [data, generation]);

  return <section className="result-screen" aria-label="Shift result"><div className="result-content">
    <header className="result-header"><h1>{winner}</h1><SoundButton/></header>
    <p className="result-reason">{game.endWhy}</p>
    {data && <p className="result-reason">You played a {data.role}. {devsWin !== (myRole === "rugger") ? "You won this shift." : "Better luck next shift."}</p>}
    <canvas ref={canvas} width={1200} height={630} className="result-canvas" role="img" aria-label={data ? `${winner}. ${data.name}, ${data.role}. ${data.passes} real wheel passes. ${data.run}.` : "Preparing your shift card"} style={{ display: cardReady ? "block" : "none" }}/>
    {cardError ? <div className="mt-4" role="alert"><p>The image couldn’t load. You can still share your result.</p><button className="text-button" onClick={() => setGeneration((n) => n + 1)}>Retry image</button></div> : !cardReady && <p role="status" className="mt-4">Preparing your shift card…</p>}
    <div className="result-actions"><button type="button" className="primary" disabled={!cardReady} onClick={() => { if (canvas.current) void downloadCard(canvas.current).then(() => { setDownloaded(true); setDownloadError(false); }).catch(() => setDownloadError(true)); }}><Icon name="download"/>Download</button>
      {data && <a className="secondary-button" target="_blank" rel="noopener noreferrer" href={`https://x.com/intent/tweet?text=${encodeURIComponent(resultPost(data))}`}>Post on X<Icon name="arrow" size={18}/></a>}</div>
    <p className="dialog-note" role="status">{downloadError ? "The download didn’t start. Try Download again." : downloaded ? "Image downloaded. Attach it to your post on X." : "Download your card to attach it to your post."}</p>
    <WheelLog log={log} compact/>
    <h2 className="mt-4 font-bold">{ruggers ? ruggers.length === 1 ? "The Rugger was" : "The Ruggers were" : "Revealing the Ruggers…"}</h2>
    <div className="rugger-list">{game.seats.filter((s) => ruggers?.includes(s.id)).map((s) => <span key={s.id}><img src={`hamsters/${s.hamsterId}.svg`} width="36" height="36" alt=""/>{s.name}{s.bot ? " (AI)" : ""}</span>)}</div>
    <div className="result-footer">{game.hostId === room.sessionId && <button type="button" className="secondary-button" onClick={() => room.send("lobby")}>Back to lobby</button>}<button type="button" className="secondary-button" onClick={onLeave}>Back to title</button></div>
  </div></section>;
}
