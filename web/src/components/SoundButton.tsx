import { useSyncExternalStore } from "react";
import { getMuted, setMuted, subscribeSound } from "@/game/sfx";
import { Icon } from "./Icon";

export function SoundButton() {
  const muted = useSyncExternalStore(subscribeSound, getMuted, () => false);
  return <button type="button" className="utility sound-button" aria-label={muted ? "Unmute sound" : "Mute sound"} aria-pressed={muted}
    onClick={() => setMuted(!muted)} title={muted ? "Sound off" : "Sound on"}><Icon name={muted ? "muted" : "sound"} /><span className="sound-label">{muted ? "Sound off" : "Sound on"}</span></button>;
}
