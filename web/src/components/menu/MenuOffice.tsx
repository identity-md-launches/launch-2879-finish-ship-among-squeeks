import { useEffect, useRef, useState } from "react";
import { CODE_LENGTH, hamsterName } from "@/shared/protocol";
import { SUITS, hex } from "@/shared/suits";
import { readPreference, writePreference } from "@/lib/preferences";
import { SoundButton } from "../SoundButton";
import { Icon } from "../Icon";
import { Dialog } from "../Dialog";
import { Tutorial } from "../Tutorial";
import { HamsterDev } from "./HamsterDev";
import { BurrowArt } from "./BurrowArt";
import type { MenuApi } from "./useMenu";

type WheelStatus = { kind: "running"; rpm: number } | { kind: "resting" | "checking" | "unavailable" };

export function MenuOffice({ m }: { m: MenuApi }) {
  const [tutorial, setTutorial] = useState(() => readPreference("tutorial") !== "seen");
  const [help, setHelp] = useState(false);
  const [customize, setCustomize] = useState(false);
  const [join, setJoin] = useState(!!m.code);
  const [live, setLive] = useState<WheelStatus>({ kind: "checking" });
  const input = useRef<HTMLInputElement>(null);
  const doneTutorial = () => { writePreference("tutorial", "seen"); setTutorial(false); setHelp(false); };
  useEffect(() => { if (m.codeError) input.current?.focus(); }, [m.codeError]);
  useEffect(() => {
    const abort = new AbortController();
    let active = true;
    const read = async () => {
      const request = new AbortController();
      const cancel = () => request.abort();
      abort.signal.addEventListener("abort", cancel, { once: true });
      const timeout = setTimeout(cancel, 8000);
      try {
        const response = await fetch("https://api.squeekchain.com/v1/status", { signal: request.signal });
        if (!response.ok) throw new Error("Status unavailable");
        const data = await response.json();
        const measurement = data?.measurement;
        if (measurement?.freshness !== "online" || typeof measurement.rpmMilli !== "number" || !Number.isFinite(measurement.rpmMilli)) throw new Error("No fresh measurement");
        const rpm = Math.max(0, Math.round(measurement.rpmMilli / 1000));
        if (active) setLive(rpm > 0 ? { kind: "running", rpm } : { kind: "resting" });
      } catch { if (active) setLive({ kind: "unavailable" }); }
      finally { clearTimeout(timeout); abort.signal.removeEventListener("abort", cancel); }
    };
    void read();
    const timer = setInterval(read, 15000);
    return () => { active = false; abort.abort(); clearInterval(timer); };
  }, []);

  return <div className="menu-page">
    <header className="site-header"><a className="brand" href="./" aria-label="Among Squeeks home"><Icon name="wheel" size={25}/><span>Among Squeeks</span></a>
      <nav aria-label="Game utilities"><SoundButton/><button type="button" className="utility" onClick={() => setHelp(true)} aria-label="How to play"><Icon name="help"/><span className="help-label">How to play</span></button></nav>
    </header>
    <div className="menu-main">
      <div className="menu-copy">
        <h1>Among<br/><span>Squeeks</span></h1>
        <p className="menu-description">A free social deduction game,<br className="desktop-break"/> powered by a real hamster.</p>
        <div className="mobile-crew" aria-hidden="true"><img src={`hamsters/${m.hamsterId}.svg`} width="74" height="74" alt=""/><span>Mine the block.<br/>Find the Rugger.</span><Icon name="wheel" size={44}/></div>
        <div className="play-actions">
          <button type="button" className="primary play-now" disabled={!!m.busy} onClick={() => m.go("quick")}><Icon name="play" size={22}/><span>Play now</span><Icon name="arrow" size={22}/></button>
          <p className="play-note">Start with five AI hamsters.</p>
          <div className="friend-actions"><button type="button" className="secondary-button" disabled={!!m.busy} onClick={() => m.go("create")}><Icon name="people" size={18}/>Host private</button><button type="button" className="secondary-button" disabled={!!m.busy} onClick={() => setJoin(true)}>Join by code<Icon name="arrow" size={18}/></button></div>
          <button type="button" className="customize-link" onClick={() => setCustomize(true)} disabled={!!m.busy}><img src={`hamsters/${m.hamsterId}.svg`} width="30" height="30" alt=""/><span>Change your hamster</span><span aria-hidden="true">↗</span></button>
        </div>
      </div>
      <div className="menu-scene"><BurrowArt hamsterId={m.hamsterId} suit={m.suit}/><p className="scene-caption">One of these hamsters has other plans.</p></div>
      <div className="menu-bottom">
        <section className="wheel-status" aria-label="Real wheel status"><Icon name="wheel" size={32}/><div><h2>Squeektoshi’s wheel</h2><p role="status">{live.kind === "running" ? `Squeektoshi is running · ${live.rpm} RPM` : live.kind === "resting" ? "Squeektoshi is resting. Play a real recorded run." : live.kind === "checking" ? "Checking Squeektoshi’s wheel…" : "Live status unavailable. Real recorded runs are ready."}</p></div><a href="https://squeekchain.com" target="_blank" rel="noreferrer" aria-label="Visit Squeekchain" className="utility">↗</a></section>
        {tutorial && <Tutorial compact onDone={doneTutorial}/>}
      </div>
    </div>
    <footer className="site-footer"><span>Free to play. No wallet. Just hamsters.</span><span>Independent fan project. Not affiliated with Squeekchain or Among Us.</span></footer>
    {help && <Dialog title="How to play" onClose={() => setHelp(false)}><Tutorial onDone={doneTutorial}/><p className="dialog-note">Keyboard: WASD or arrows to move, E to use, Q for a red lever, F for sabotage. Phone: drag on the left to move, then use the buttons.</p></Dialog>}
    {customize && <Dialog title="Choose your hamster" onClose={() => setCustomize(false)}>
      <div className="hamster-picker"><button type="button" className="secondary-button" onClick={m.prev} aria-label="Previous hamster">‹</button><HamsterDev hamsterId={m.hamsterId} color={SUITS[m.suit].color}/><button type="button" className="secondary-button" onClick={m.next} aria-label="Next hamster">›</button></div>
      <div className="picker-label"><span>{hamsterName(m.hamsterId)}</span><button type="button" className="text-button" onClick={m.shuffle}>Surprise me</button></div>
      <label className="input-label" htmlFor="player-name">Your name <span className="secondary">(optional)</span></label><input id="player-name" className="field" autoComplete="nickname" name="nickname" maxLength={16} value={m.name} placeholder={hamsterName(m.hamsterId)} onChange={(e) => m.setName(e.target.value)}/>
      <fieldset className="suit-picker"><legend>Suit color</legend><div>{SUITS.map((s, i) => <button type="button" key={s.name} aria-label={`${s.name} suit`} aria-pressed={m.suit === i} onClick={() => m.setSuit(i)} style={{ "--suit": hex(s.color) } as React.CSSProperties}>{m.suit === i && <Icon name="check"/>}</button>)}</div></fieldset>
      <button type="button" className="primary full-width" onClick={() => setCustomize(false)}>Save hamster<Icon name="check"/></button>
    </Dialog>}
    {join && !m.busy && <Dialog title="Join your friends" onClose={() => { setJoin(false); m.dismissError(); }}><form onSubmit={(e) => { e.preventDefault(); void m.go("join"); }}>
      <label className="input-label" htmlFor="room-code">Room code</label><input ref={input} id="room-code" name="room-code" className="field code-field" autoCapitalize="characters" autoComplete="off" spellCheck={false} maxLength={CODE_LENGTH} value={m.code} onChange={(e) => m.setCode(e.target.value)} aria-invalid={m.codeError} aria-describedby="code-help"/>
      <p id="code-help" className="dialog-note">{m.codeError ? m.error : `Ask your host for the ${CODE_LENGTH}-letter code.`}</p>
      {m.error && !m.codeError && <p role="alert" className="error-text">{m.error}</p>}
      <button className="primary full-width" type="submit">{m.retryKind === "join" ? "Retry" : "Join shift"}<Icon name="arrow"/></button></form></Dialog>}
    {m.busy && <Dialog title="Waking the burrow..." onClose={m.cancel}><div className="wake-art"><HamsterDev hamsterId={m.hamsterId} color={SUITS[m.suit].color}/></div><div role="status"><p className="wake-copy">The free server may need a minute to wake up. You’ll join as soon as it’s ready.</p><p className="dialog-note">Trying for up to 90 seconds. Stay right here.</p></div><button type="button" className="secondary-button full-width" onClick={m.cancel}>Cancel</button></Dialog>}
    {m.error && !m.busy && !join && <Dialog title={m.retryKind ? "A little longer to wake" : "Connection lost"} onClose={m.dismissError}><p className="wake-copy" role="alert">{m.error}</p><button type="button" className="primary full-width" onClick={() => m.go(m.retryKind ?? "quick")}>Retry<Icon name="arrow"/></button></Dialog>}
  </div>;
}
