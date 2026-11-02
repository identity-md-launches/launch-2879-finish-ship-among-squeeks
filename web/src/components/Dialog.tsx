import { useEffect, useRef, type ReactNode } from "react";
import { Icon } from "./Icon";

/** Native dialog supplies focus containment, Escape, and focus restoration. */
export function Dialog({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const dialog = ref.current!;
    if (!trigger.current && document.activeElement instanceof HTMLElement) trigger.current = document.activeElement;
    dialog.showModal();
    return () => {
      dialog.close();
      queueMicrotask(() => { if (trigger.current?.isConnected) trigger.current.focus(); });
    };
  }, []);
  return <dialog ref={ref} className="burrow-dialog" aria-label={title} onCancel={(event) => { event.preventDefault(); onClose(); }}
    onClick={(e) => { if (e.target === e.currentTarget) { const r = e.currentTarget.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) onClose(); } }}>
    <div className="dialog-head"><h2>{title}</h2><button type="button" className="utility" aria-label={`Close ${title.toLowerCase()}`} onClick={onClose}><Icon name="close" /></button></div>
    {children}
  </dialog>;
}
