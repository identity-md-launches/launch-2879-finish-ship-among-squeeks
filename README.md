# Among Squeeks

A free multiplayer social deduction game powered by **Squeektoshi**, the real hamster behind [Squeekchain](https://squeekchain.com). A crew mines a block while a secret Rugger tries to drain the vault. No wallet, token, login, payment, or analytics.

**Play now** starts a private shift with you and five AI hamsters, with no setup. **Host private** and **Join by code** let friends play together. Customize your hamster if you like; the first-shift guide is optional.

## Website and source

- **Static website:** the ready-to-host export is in [`dist/`](dist/index.html), with an identical canonical build in [`web/dist/`](web/dist/index.html). The IdentityMD publisher assigns the public site address after submission. No public frontend address was supplied or created during this task; the server address below is not the game page. Share links use the address of whichever page you are actually playing on, including its hosting subfolder.
- **Live game server:** <https://among-squeeks-server.onrender.com>. This existing server was tested, not redeployed.
- **Starting source:** [haileymarshall/among-squeeks, commit 0ed5afdd9dca644c275fd8f21ac522caf2da25a0](https://github.com/haileymarshall/among-squeeks/tree/0ed5afdd9dca644c275fd8f21ac522caf2da25a0). The complete permitted source, including `server/`, is included for the submission's GitHub publication. No remote GitHub push was performed from this workspace.

## How to play

1. Select **Play now**. The free server may take a minute to wake; the client keeps trying for up to 90 seconds. You can cancel or retry if it takes longer.
2. Your secret role appears before the shift. **Miners** complete tasks and fix consoles. **Ruggers** fake tasks, pull red levers, use vents, and sabotage the burrow.
3. Move near a console and use its action button. Miners fill the Block meter; Ruggers open the vault by tampering with enough consoles, then hold its lever to drain it. Miners can hit the alarm.
4. Call a meeting at the table. The emergency button has an initial 15-second cooldown. Compare the wheel log with everyone's story, chat, then vote or skip. The wheel log names no players. AI seats are labeled in the lobby and meetings.
5. Miners win by mining the block or firing every Rugger. Ruggers win by draining the vault, matching the miners in number, or outlasting the shift.
6. At the end, **Download** saves your hamster's result card as a PNG. **Post on X** opens a draft with your result and the current site address. Attach the downloaded image yourself; nothing is posted automatically.

**Keyboard:** WASD or arrows to move; E to use; Q for a red lever; F for sabotage. Buttons also work with Tab, Enter, and Space. **Phone:** drag on the left side to move and use the action buttons. Expand **Tasks** to see your list. Meetings and results scroll vertically.

The sound button is available on the title, in the game, and on results. Mute, your saved hamster, tutorial dismissal, and the first-power-cut hint are stored only in your browser. Storage failures are caught; play still works when storage is blocked.

## The real wheel

| What Squeektoshi does | What happens in the shift |
| --- | --- |
| Runs | His real RPM powers the burrow. |
| Pauses | Power cuts out, tasks stop, miners can barely see, and a red lever looks green. |
| Reaches 85+ RPM | Tasks run 30% faster. |
| Finishes the run | The shift ends; an unfinished block loses. |

The title keeps its real `GET https://api.squeekchain.com/v1/status` call, polling every 15 seconds. A failed or stale reading is labeled unavailable, never presented as sleeping or as a fabricated RPM.

The unchanged server chooses a live wheel feed when available; otherwise it replays a real recorded run from `server/src/runs.json`. Those measurements originally come from `GET https://api.squeekchain.com/v1/measurement/runs` via `server/scripts/make-runs.mjs`. Pauses are real, capped at 20 seconds by the original game rules. Wheel timings are device-signed, not certified on-chain.

Result-card pass counts and recorded-run labels come from the server's final wheel log (or its synchronized state while that log arrives). Recorded labels include the original month, day, time, and UTC; the server does not send a year, so the client does not guess one. For a live run, the card uses the real status API's observation date; if unavailable, it says so instead of substituting the player's clock. Meeting logs have a readable text alternative and can expand to show every event.

## Install, run, and rebuild

Tested with Node 24 and the project's pinned pnpm 11.5.1. Keep the existing Vite, React, TypeScript, Phaser, Tailwind, and Colyseus stack.

```sh
cd web
pnpm install --frozen-lockfile
pnpm typecheck
pnpm build
pnpm preview --host 0.0.0.0
```

Preview the production site at `http://localhost:3100`. `pnpm build` runs TypeScript, writes `web/dist`, and copies the same export to repository-root `dist` for the publisher. Both exports are included in the submission. Vite's `base` is `./`; bundles, fonts, hamster art, favicon, and share image are local and use relative URLs. Serve the files through HTTP, at the root or a subfolder such as `/preview/`; no route rewrites or frontend backend are required. Online multiplayer and fresh wheel status still require the external services.

The lockfile includes a small [Colyseus browser-constructor patch](web/patches/README.md) for Safari/WebKit. It avoids the SDK’s Node-only WebSocket argument before connecting, keeping the same SDK version and protocol. Keep `web/patches/` when rebuilding.

Production defaults to `https://among-squeeks-server.onrender.com` in `web/src/net/net.ts`. `VITE_SERVER_URL` remains supported as a build-time override. Environment files were not imported or edited, respecting the assignment's prohibition. The original public server address needs no secret or private configuration.

For local development, use two terminals:

```sh
cd server
pnpm install --frozen-lockfile
pnpm dev
```

```sh
cd web
pnpm install --frozen-lockfile
pnpm dev
```

Development defaults to the current hostname on port 2567, so a phone on the same network can join the local server. To preview a production build against that local server explicitly:

```sh
cd web
VITE_SERVER_URL=http://localhost:2567 pnpm build
pnpm preview
```

Rebuild without that override before publishing. Do not change `web/src/shared/` or the deployed server's protocol when making client changes.

## Testing notes

Worker checks were performed on 2 November 2026. Details, six-domain design coverage, fixes, evidence, and limitations are recorded in [`web/VALIDATION.md`](web/VALIDATION.md); implemented design tokens and components are in [`DESIGN.md`](DESIGN.md).

- Production build and standalone typecheck passed.
- The unchanged `node test/match.test.mjs https://among-squeeks-server.onrender.com` in `server/` passed against the live server. Its SDK retried during final cleanup before exiting successfully; intentional exits in the frontend explicitly disable that reconnection behavior.
- Fresh Chromium and WebKit profiles at 390px and 1280px reached real running shifts with exactly five AI additions and one Start message, a received role, no JavaScript/console errors, no failed requests, and no sideways scrolling. Root and `/preview/` hosting both worked.
- A full live mobile match verified touch movement, the remembered first-power-cut hint, a final wheel log, a valid 1200×630 PNG download, a current-address X draft, and returning to the title. The measured match ended with 349 server-reported passes from `Nov 2, 06:35 UTC`.
- The pinned `taste@1` probe passed all 16 checks at its measured widths (320, 390, 1440), including contrast, first-screen copy, targets, motion, and sharing metadata. Axe found no WCAG A/AA violations in the title, help, customization, and join states tested.
- A two-browser friends room passed host/join, adding four AI seats, meeting chat, keyboard vote confirmation, and phone overflow checks. Axe found no violations in the tested meeting state. Play also worked at 320px with localStorage blocked.
- WebKit initially lacked runtime TLS support. After repairing the external browser tooling, it exposed the SDK constructor issue described above. With the pinned browser patch, both mobile and desktop WebKit checks passed without console errors. Physical phones remain unverified.
- Reachability, timeouts, cancellation, late seat cleanup, and invalid-code handling were also tested with controlled service failures; these tests do not alter or fabricate wheel measurements.

Dependencies and browser tooling were installed in temporary directories outside the repository. Builds used a matching external working copy to avoid adding any `node_modules` paths to the submission. No local server fallback was needed for the live acceptance match.

Optional repeatable browser smoke test (after building, with Playwright installed separately):

```sh
npm install --prefix /tmp/among-checks playwright
/tmp/among-checks/node_modules/.bin/playwright install chromium
PLAYWRIGHT_MODULE=file:///tmp/among-checks/node_modules/playwright/index.mjs node web/test/browser.mjs
```

The test serves its own bounded preview, checks root/subfolder startup at both widths, and closes it afterward. Results/screenshots default to `/tmp/among-squeeks-checks`; set `CHECK_OUTPUT` to another scratch directory if needed. Add `--webkit` when WebKit and its system libraries are installed. This test contacts the real game server and starts two short private sessions. Run the original wheel-data unit tests with `cd server && pnpm exec tsx test/wheel.test.ts`.

## Credits

An independent fan project, not affiliated with Squeekchain or Among Us. All hamster artwork is the original repository's code-drawn art; the new burrow scene, icons, result card, and share image are drawn in code. Inter and Chakra Petch are bundled locally with their SIL Open Font Licenses in `web/public/fonts/`.

The interface review used the supplied, pinned Better Interface guidance (Jakub Krehel, MIT) and its Impeccable documentation reference (Paul Bakaus, Apache-2.0). This documentation describes the implementation; it does not copy either guide.
