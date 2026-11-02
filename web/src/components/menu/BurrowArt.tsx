import { HamsterDev } from "./HamsterDev";
import { SUITS } from "@/shared/suits";

/** Original burrow illustration, composed from the project's hamster art and SVG geometry. */
export function BurrowArt({ hamsterId, suit }: { hamsterId: number; suit: number }) {
  return <div className="burrow-art" role="img" aria-label="A hamster mining crew beside Squeektoshi’s enormous wheel, with a red lever hiding nearby.">
    <svg className="burrow-room" viewBox="0 0 600 560" aria-hidden="true">
      <defs>
        <radialGradient id="wheel-light"><stop stopColor="#70501d" stopOpacity=".5"/><stop offset="1" stopColor="#18150f" stopOpacity="0"/></radialGradient>
        <linearGradient id="floor-light" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#29251a"/><stop offset="1" stopColor="#18150f"/></linearGradient>
      </defs>
      <circle cx="314" cy="240" r="260" fill="url(#wheel-light)"/>
      <path d="M58 115V74h104m270 0h103v210M37 315v57h65" fill="none" stroke="#393328" strokeWidth="8"/>
      <path d="M58 115V74h104m270 0h103v210" fill="none" stroke="#746347" strokeWidth="2"/>
      <rect x="180" y="21" width="230" height="39" rx="6" fill="#242119" stroke="#4c4330"/>
      <text x="295" y="47" textAnchor="middle" fill="#bcae8c" fontSize="16" fontFamily="sans-serif" letterSpacing="3">THE WHEEL ROOM</text>
      <path d="M80 422 20 551h560l-70-129Z" fill="url(#floor-light)"/>
      <path d="M80 422h430M65 454h462M49 491h499M164 422l-30 129m145-129-5 129m123-129 33 129" fill="none" stroke="#373125"/>
      <path d="m231 349-29 83m161-83 29 83" stroke="#726047" strokeWidth="15"/>
      <circle cx="297" cy="235" r="172" fill="#191810" stroke="#443d29" strokeWidth="18"/>
      <circle cx="297" cy="235" r="161" fill="none" stroke="#bc923e" strokeWidth="3"/>
      <circle cx="297" cy="235" r="150" fill="none" stroke="#51442d" strokeWidth="14" strokeDasharray="3 18"/>
      <g stroke="#4c422c" strokeWidth="7">{Array.from({ length: 8 }, (_, i) => <path key={i} d="M297 235V91" transform={`rotate(${i * 45} 297 235)`}/>)}</g>
      <circle cx="297" cy="235" r="23" fill="#a27b35" stroke="#e7bd64" strokeWidth="3"/>
      <circle cx="297" cy="235" r="10" fill="#211e16"/>
      <rect x="36" y="310" width="106" height="114" rx="9" fill="#36352a" stroke="#6b654b" strokeWidth="3"/>
      <rect x="49" y="322" width="80" height="45" rx="4" fill="#141e18"/>
      <path d="M56 350h12l7-13 9 20 9-16 8 9h21" fill="none" stroke="#9cbc90" strokeWidth="3"/>
      <circle cx="57" cy="386" r="5" fill="#a1ba7f"/><path d="M77 385h40m-40 11h29" stroke="#75725a" strokeWidth="3"/>
      <rect x="455" y="326" width="106" height="113" rx="10" fill="#353329" stroke="#686047" strokeWidth="3"/>
      <rect x="470" y="341" width="76" height="77" rx="5" fill="#24251d" stroke="#71664b" strokeWidth="2"/>
      <circle cx="508" cy="379" r="23" fill="none" stroke="#9f8a57" strokeWidth="5"/>
      <path d="M508 356v46m-23-23h46" stroke="#9f8a57" strokeWidth="4"/>
      <path d="M456 417v-50l-19-26" stroke="#aaa38c" strokeWidth="8"/>
      <path d="m431 341 13-8" stroke="#e37362" strokeWidth="16" strokeLinecap="round"/>
      <g fill="#b5a06b"><circle cx="154" cy="464" r="4"/><circle cx="455" cy="487" r="4"/><circle cx="96" cy="492" r="3"/></g>
      <path d="m207 499 9 5m201-47 10 7" stroke="#b5a06b" strokeWidth="4"/>
    </svg>
    <div className="art-hamster art-wheel-hamster"><HamsterDev hamsterId={1} color={0xcfa064}/></div>
    <div className="art-hamster art-crew-one"><HamsterDev hamsterId={5} color={0x74a48e}/></div>
    <div className="art-hamster art-crew-two"><HamsterDev hamsterId={9} color={0xba7b70}/></div>
    <div className="art-hamster art-you"><HamsterDev hamsterId={hamsterId} color={SUITS[suit]?.color ?? SUITS[0].color}/></div>
    <span className="art-you-label">You</span>
  </div>;
}
