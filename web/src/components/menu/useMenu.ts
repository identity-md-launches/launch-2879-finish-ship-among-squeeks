import { useEffect, useRef, useState } from "react";
import { CODE_LENGTH, HAMSTER_COUNT, hamsterName, normalizeCode, type JoinOptions } from "@/shared/protocol";
import { createPrivate, friendlyError, joinCode, leaveRoom, type GameRoom } from "@/net/net";
import { connectWithRetry } from "@/net/connect";
import { sfx } from "@/game/sfx";
import { writePreference } from "@/lib/preferences";

export const TOTAL_HAMSTERS = HAMSTER_COUNT;
export const randomHamster = () => 1 + Math.floor(Math.random() * TOTAL_HAMSTERS);
export type Busy = "quick" | "create" | "join" | null;
export type MenuProps = {
  initial: { name: string; hamsterId: number; code: string; suit: number };
  error: string | null;
  onJoined: (room: GameRoom, me: JoinOptions, quick: boolean) => void;
};

export function useMenu({ initial, error: initialError, onJoined }: MenuProps) {
  const [name, setName] = useState(initial.name);
  const [hamsterId, setHamster] = useState(initial.hamsterId);
  const [suit, setSuit] = useState(initial.suit);
  const [code, setCodeRaw] = useState(initial.code);
  const [busy, setBusy] = useState<Busy>(null);
  const [error, setError] = useState(initialError);
  const [retryKind, setRetryKind] = useState<Busy>(null);
  const [codeError, setCodeError] = useState(false);
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);

  const setHamsterId = (n: number) => {
    if (Number.isInteger(n) && n >= 1 && n <= TOTAL_HAMSTERS) setHamster(n);
  };
  const step = (dir: 1 | -1) => setHamster((id) => ((id - 1 + dir + TOTAL_HAMSTERS) % TOTAL_HAMSTERS) + 1);
  const cancel = () => { controller.current?.abort(); controller.current = null; setBusy(null); };

  async function go(kind: NonNullable<Busy>) {
    if (controller.current) return;
    setCodeError(false);
    if (kind === "join" && normalizeCode(code).length !== CODE_LENGTH) {
      setError(`Enter the ${CODE_LENGTH}-letter code from your host.`);
      setCodeError(true);
      return;
    }
    const abort = new AbortController();
    controller.current = abort;
    setBusy(kind);
    setRetryKind(null);
    setError(null);
    sfx.unlock();
    try {
      const o: JoinOptions = { name: name.trim() || hamsterName(hamsterId), hamsterId, suit };
      const room = await connectWithRetry(() => kind === "join" ? joinCode(code, o) : createPrivate(o), abort.signal);
      if (abort.signal.aborted) { leaveRoom(room); return; }
      writePreference("tutorial", "seen");
      controller.current = null;
      onJoined(room, o, kind === "quick");
    } catch (e) {
      if (abort.signal.aborted) return;
      setError(e instanceof Error && e.message.startsWith("The burrow is taking") ? e.message : friendlyError(e));
      setRetryKind(kind);
      setBusy(null);
      controller.current = null;
    }
  }

  return { name, setName, hamsterId, setHamsterId, prev: () => step(-1), next: () => step(1), shuffle: () => setHamster(randomHamster()), suit, setSuit, code, dismissError: () => { setError(null); setRetryKind(null); setCodeError(false); },
    setCode: (s: string) => { setCodeRaw(normalizeCode(s)); setCodeError(false); }, busy, error, retryKind, codeError, go, cancel };
}
export type MenuApi = ReturnType<typeof useMenu>;
