import type { CSSProperties } from "react";

const paths = {
  play: "m9 5 11 7-11 7V5Z",
  arrow: "M5 12h14m-6-6 6 6-6 6",
  close: "m6 6 12 12M6 18 18 6",
  help: "M9 9a3 3 0 0 1 6 0c0 2-3 2-3 4m0 3v.1M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z",
  sound: "m11 4-6 5H2v6h3l6 5V4Zm4 4a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14",
  muted: "m11 4-6 5H2v6h3l6 5V4Zm5 5 6 6m-6 0 6-6",
  wheel: "M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0ZM12 2v20M2 12h20M5 5l14 14M5 19 19 5",
  download: "M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5",
  people: "M8 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM1 21v-2a7 7 0 0 1 14 0v2m1-17a4 4 0 0 1 0 8m2 3a6 6 0 0 1 5 6",
  check: "m5 12 4 4L19 6",
} as const;

export function Icon({ name, size = 20, style }: { name: keyof typeof paths; size?: number; style?: CSSProperties }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={style}><path d={paths[name]} /></svg>;
}
