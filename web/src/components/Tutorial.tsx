import { useState } from "react";
import { Icon } from "./Icon";

const steps = [
  { title: "One crew. One secret Rugger.", text: "Your role is secret. Miners work together to mine a block. The Rugger tries to drain the vault.", hamster: 1 },
  { title: "Find a console. Get to work.", text: "Miners complete tasks and fix tampered consoles. Drag left to move on a phone; use WASD or arrows on a keyboard.", hamster: 5 },
  { title: "A real hamster runs the power.", text: "Squeektoshi’s real wheel powers your shift, live or replayed. When he pauses, lights go out and tasks stop.", hamster: 2 },
  { title: "Watch those red levers.", text: "Ruggers pull red levers to open the vault. In the dark, red looks green. Be careful who you trust.", hamster: 9 },
  { title: "Let the wheel do the talking.", text: "Call a meeting at the table. Compare stories with the wheel log’s power cuts and tampering, then vote or skip.", hamster: 4 },
];

export function Tutorial({ onDone, compact = false }: { onDone: () => void; compact?: boolean }) {
  const [step, setStep] = useState(0);
  const item = steps[step];
  return <section className={`tutorial ${compact ? "tutorial-inline" : ""}`} aria-label="How to play">
    <div className="tutorial-content" aria-live="polite">
      <img src={`hamsters/${item.hamster}.svg`} width="64" height="64" alt="" />
      <div><span className="small-text secondary">Your first shift · {step + 1} of {steps.length}</span><h3>{item.title}</h3><p>{item.text}</p></div>
    </div>
    <div className="tutorial-nav"><button type="button" className="text-button" onClick={onDone}>Skip tutorial</button>
      <div className="tutorial-dots" aria-hidden="true">{steps.map((_, i) => <span key={i} className={i === step ? "current" : ""} />)}</div>
      <button type="button" className="text-button" onClick={() => step === steps.length - 1 ? onDone() : setStep(step + 1)}>{step === steps.length - 1 ? "Got it" : "Next"}<Icon name={step === steps.length - 1 ? "check" : "arrow"} size={16} /></button></div>
  </section>;
}
