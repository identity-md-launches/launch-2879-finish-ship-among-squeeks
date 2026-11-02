export type ResultCardData = { name: string; hamsterId: number; suitColor: string; role: "Miner" | "Rugger"; winner: string; passes: number; run: string };
export function currentSiteAddress() {
  const url = new URL(window.location.href);
  url.search = "";
  url.hash = "";
  return url.href;
}
export function resultPost(data: ResultCardData) {
  return `${data.winner} in Among Squeeks! I played a ${data.role}. ${data.passes.toLocaleString("en-US")} real wheel passes. ${data.run}. Play free: ${currentSiteAddress()}`;
}

function wrap(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, width: number, lineHeight: number) {
  let line = "";
  for (const word of text.split(" ")) {
    if (line && ctx.measureText(`${line} ${word}`).width > width) { ctx.fillText(line, x, y); line = word; y += lineHeight; }
    else line = line ? `${line} ${word}` : word;
  }
  ctx.fillText(line, x, y);
}

export async function drawResultCard(canvas: HTMLCanvasElement, data: ResultCardData) {
  const face = new Image();
  face.src = new URL(`hamsters/${data.hamsterId}.svg`, document.baseURI).href;
  await face.decode();
  await document.fonts.ready;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is unavailable");
  canvas.width = 1200; canvas.height = 630;
  ctx.fillStyle = "#18150f"; ctx.fillRect(0, 0, 1200, 630);
  ctx.fillStyle = "#edbe65"; ctx.fillRect(0, 0, 12, 630);
  ctx.strokeStyle = "#4c422c"; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(950, 265, 190, 0, Math.PI * 2); ctx.stroke();
  for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; ctx.beginPath(); ctx.moveTo(950, 265); ctx.lineTo(950 + Math.cos(a) * 186, 265 + Math.sin(a) * 186); ctx.stroke(); }
  ctx.fillStyle = "#edbe65"; ctx.font = '700 32px "Chakra Petch", sans-serif'; ctx.fillText("Among Squeeks", 64, 70);
  ctx.fillStyle = "#fff5df"; ctx.font = '700 76px "Chakra Petch", sans-serif'; ctx.fillText(data.winner, 64, 176);
  ctx.fillStyle = "#c0b49b"; ctx.font = '400 28px Inter, sans-serif'; ctx.fillText(`Your role: ${data.role}`, 64, 226);
  // The player's original hamster face, with the suit color from the final server state.
  ctx.fillStyle = "#f3b8b0";
  for (const x of [912, 988]) { ctx.beginPath(); ctx.ellipse(x, 439, 28, 14, 0, 0, Math.PI * 2); ctx.fill(); }
  ctx.fillStyle = data.suitColor; ctx.strokeStyle = "#2a1c10"; ctx.lineWidth = 6;
  ctx.beginPath(); ctx.ellipse(950, 370, 85, 73, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = "#fff5e8"; ctx.beginPath(); ctx.ellipse(950, 387, 45, 42, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#3a2a18"; ctx.fillRect(868, 389, 164, 12);
  ctx.fillStyle = "#edbe65"; ctx.fillRect(939, 385, 22, 20);
  ctx.drawImage(face, 840, 190, 220, 220);
  ctx.fillStyle = "#fff5df"; ctx.font = '700 28px Inter, sans-serif'; ctx.textAlign = "center"; ctx.fillText(data.name, 950, 491, 330); ctx.textAlign = "left";
  ctx.fillStyle = "#edbe65"; ctx.font = '700 60px "Chakra Petch", sans-serif'; ctx.fillText(data.passes.toLocaleString("en-US"), 64, 340);
  ctx.fillStyle = "#c0b49b"; ctx.font = '400 24px Inter, sans-serif'; ctx.fillText("real wheel passes", 64, 379);
  ctx.fillStyle = "#fff5df"; ctx.font = '400 26px Inter, sans-serif'; wrap(ctx, data.run, 64, 453, 700, 34);
  ctx.strokeStyle = "#514835"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(64, 534); ctx.lineTo(1136, 534); ctx.stroke();
  ctx.fillStyle = "#c0b49b"; ctx.font = '400 22px Inter, sans-serif'; ctx.fillText("A real hamster. A very suspicious crew.", 64, 579);
  ctx.fillStyle = "#edbe65"; ctx.textAlign = "right"; ctx.fillText("Play free", 1136, 579);
}

export function downloadCard(canvas: HTMLCanvasElement): Promise<void> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) { reject(new Error("Couldn't prepare the image")); return; }
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a"); link.href = url; link.download = "among-squeeks-shift.png";
      document.body.append(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 30_000);
      resolve();
    }, "image/png");
  });
}
