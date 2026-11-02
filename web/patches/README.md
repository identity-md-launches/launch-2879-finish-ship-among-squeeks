# Browser WebSocket constructor

`@colyseus/sdk@0.18.5` first passes a Node-style options object to the WebSocket constructor, then catches the exception and retries with browser protocols. WebKit logs “Wrong protocol for WebSocket '[object Object]'” even though that fallback connects.

The small pnpm patch selects the browser constructor directly when `window` exists, for the ESM and CommonJS builds. It preserves the transport events, wire messages, SDK version, and Node fallback. It does not suppress console errors. `pnpm-workspace.yaml` declares the patch, and `pnpm-lock.yaml` pins its hash, so a frozen install applies it reproducibly.

The original SDK is MIT-licensed by Endel Dreyer; its source notices remain intact. This patch contains only the changed constructor branches, not a vendored dependency.
