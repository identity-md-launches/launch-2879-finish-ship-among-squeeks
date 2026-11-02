# Validation and design review

Checked on **2 November 2026** against the production static export and the existing Render game server. These are worker observations, not an independent certification. The upstream baseline is commit `0ed5afdd9dca644c275fd8f21ac522caf2da25a0`.

## Build and service checks

| Check | Actual result |
| --- | --- |
| `pnpm install --frozen-lockfile` in a matching external copy of `web/` | Passed. Source and lockfile are delivered; installed dependencies are not. |
| `pnpm typecheck` | Passed, with no TypeScript errors. |
| `pnpm build` | Passed. Vite produces relative asset URLs in `web/dist`; the export script copies the complete site to root `dist`. |
| `node test/match.test.mjs https://among-squeeks-server.onrender.com` from the unchanged server source | Passed against the deployed server, including a real run, role/task state, meeting log, and match end. The original SDK retried during final cleanup before reporting success. The frontend explicitly disables reconnect on an intentional leave. |
| `pnpm exec tsx test/wheel.test.ts` from the unchanged server source | Passed: 40 recorded runs, 240 simulated shifts, no shifts without a power cut; longest tested cut 18.5 seconds. |
| Baseline integrity | All 20 files under `server/` and `web/src/shared/` (19 source/data/config files plus the unchanged server ignore file) match the supplied upstream archive byte for byte. |

Node 24.21.0 and pnpm 11.5.1 were used. The build ran from `/tmp/among-build/web`, an external copy with the same source/configuration/lockfile, because repository dependency directories were forbidden. Browser tools and package stores also remained outside the repository. One concurrent build was terminated with exit -11; its sequential rerun passed. No server redeployment or local-server substitution was needed.

## Browser and interaction checks

Production files were served over HTTP at both `/` and `/preview/`. Fresh browser contexts were used for first-visit tests. Nothing replaced or fabricated wheel statistics.

- **Primary flow:** Chromium and WebKit at 390×844 and 1280×844 reached a real running shift. WebSocket observation confirmed exactly five `addBot` messages and one `start`; each player received a role. No page/console errors, failed requests, or horizontal overflow were observed. Play now was visible on the first screen.
- **Complete mobile match:** touch dragging sent movement to the server. The first real power cut displayed its hint, which could be dismissed. The match ended with a server-reported **349 passes** and the recorded label **“His run from Nov 2, 06:35 UTC.”** The downloaded PNG decoded as **1200×630**, 102,281 bytes. The X draft included the actual `/preview/` page address. No post was sent. Returning to the title preserved mute and tutorial dismissal, without reconnection errors.
- **Tutorial and forms:** Next, Skip, reload persistence, help opening with the keyboard, Escape, and restored trigger focus passed. Hamster, name, and suit changes survived joining. Empty room codes showed an inline error and focused the field.
- **Waking and Retry:** a controlled 503 response plus an accelerated browser clock exercised the full configured 90-second budget. The friendly error and Retry appeared; restoring the real service let Retry enter a live shift with the saved customization. Separate checks covered initial success, retry after an unsuccessful probe, overall deadline, a hanging SDK operation, cancellation, disposal of a late-arriving room, and immediate invalid-room rejection.
- **Storage unavailable:** overriding the browser's storage getter to throw still allowed tutorial dismissal, mute, and Play now at 320px, with no page errors.
- **Friends and meetings:** two independent Chromium contexts hosted/joined the same real private room, added four AI seats, started, called a meeting, exchanged a chat message, selected a vote with Enter, and confirmed it with Enter. The phone meeting had no horizontal overflow; a separate final phone check found no controls below 44px and successfully left the meeting; no page errors occurred. Axe found zero violations in the selected-vote meeting state. An initial concurrent browser run crashed; a sequential run completed. A test selector also exposed the shared Vote label, which was changed to “Confirm vote for …” before the passing run. A repeated friends check initially assumed a manual meeting would always be available despite random AI actions; the harness was corrected to wait for the actual meeting phase, and the final chat/vote/Axe run passed. A later phone check found duplicate covered controls in the accessibility query; the covered HUD groups now use both hidden and inert.
- **Accessibility automation:** Axe WCAG A/AA checks (including 2.1/2.2 tags) found zero violations in the title, help, customization, and join states. Native keyboard/focus behavior was also exercised, not inferred from Axe alone.

The optional delivered `web/test/browser.mjs` serves its own production preview and repeats the primary flow at 390 and 1280, once from a subfolder and once from root. Install Playwright separately and run the command in the README. WebKit initially reported missing TLS support and an internal browser error in the temporary test runtime. After the runtime was repaired, actual live play exposed an SDK constructor warning. The pinned pnpm patch fixes that browser constructor call without suppressing logs, and both WebKit widths subsequently passed with empty console/error reports.

The broader controlled-failure and full-match harnesses ran in the assignment's disposable `test/scratch/` area.

## Better Interface review

The supplied Better Interface workflow and the core principles of all six domains were read before implementation. Both source review and rendered inspection were performed. The source-of-truth tokens and component rules are documented in [DESIGN.md](../DESIGN.md).

| Domain | Coverage and implemented decisions | Evidence and limits |
| --- | --- | --- |
| Accessibility | Semantic controls, form labels, named native dialogs, Escape/focus restoration, visible focus, 44px minimum targets, 16px inputs, reduced motion, text alternatives for result and wheel timeline. Hidden HUD controls are explicitly hidden and inert under overlays; confirmation and quick-chat actions have distinct accessible names. | Keyboard/form checks and Axe states above; probe targets/contrast passed. Phaser is a visual movement game and is not fully playable with a screen reader. Physical assistive technology was not tested. |
| Layout | Main action on the first 390px screen; native scrolling title, bounded dialogs, phone HUD spacing, safe-area offsets, wrapping logs, vertically scrolling meetings/results. | Production viewport checks at 320, 390, 1280, 1440; inspected title/game/meeting/result screenshots. The probe measures the title, not every dynamic phase. |
| Writing | Two-word product heading; one plain description; five concise tutorial steps; explicit AI labels; actionable waiting, validation, retry, and download states. Real versus recorded runs are explained. Unknown data is labeled unavailable. | First-screen prose measured 48 words at 390 and 49 at 1440. Independent-fan disclaimer is present. No invented progress, RPM, pass count, date, or frontend address. |
| Typography | Two locally bundled fonts, six named sizes, 14px minimum interface labels, 16px form text, restrained tracking, tabular timers. No small tracked capitals above headings. | Probe measured two families/two weights and four sizes on each title viewport. Canvas world lettering and the large exported image have their own raster scale. |
| Colors | Warm background, cream text, muted supporting text, amber primary action. Text/labels accompany status colors and wheel events. Chat names use readable ink instead of dark suit colors. | Rendered title ratios: primary 16.81:1, muted 8.88:1, amber heading 10.54:1, primary-button text 9.97:1. These are measured samples, not a claim about every pixel in the game. |
| UI | Immediate play with five bots, host/join preserved, optional customization, cancellable waking, retry recovery, persistent mute, readable wheel log, guarded canvas download, explicit X draft behavior. | Live startup and full-match checks, storage failure test, connection lifecycle tests. External service availability and social-site behavior are outside the static site's control. |

### Findings fixed

References below identify the final source locations of the fixes.

| Finding | Fix |
| --- | --- |
| Fixed-height title content clipped at desktop height; repeated taglines diluted the first screen. | Native scrolling title at `web/src/globals.css:56`, shorter title content at `web/src/components/menu/MenuOffice.tsx:54`. Initial probe 14/16 became 16/16. |
| Dialog focus did not reliably return to its trigger on Escape/unmount. | Saved trigger and explicit microtask focus restoration in `web/src/components/Dialog.tsx:7`. Browser keyboard test passed after the change. |
| A dismissed empty join form could leave a stale global error. | Closing the join dialog clears its validation state in `web/src/components/menu/MenuOffice.tsx:79`; the form/error/retry sequence was rerun. |
| The phone timer inherited Tailwind's separate translate property and overlapped the left HUD. | Explicit `translate: none` for timer/code in `web/src/globals.css:279`; phone screenshots checked. |
| Dense wheel events and tiny inherited labels were hard to read on phones. | 14px normalized interface text and wrapping time/event rows in `web/src/globals.css:163` and `:187`; complete log expansion retained in `web/src/components/WheelLog.tsx`. |
| Vote confirmation nested an interactive control; hidden HUD controls remained reachable under overlays. | Native seat-choice buttons with separate, explicitly named confirmation at `web/src/components/Meeting.tsx:124`; hidden/inert HUD groups at `web/src/components/Hud.tsx:249` and `:315`. |
| Suit-colored chat names could be dark on dark surfaces. | Consistent ink text at `web/src/components/Meeting.tsx:182`; suit identity remains available separately. |
| Autostart could race Phaser role/task listeners; abandoned connection attempts could leave a room or reconnect. | Wait for scene readiness before five bot messages and Start at `web/src/components/Hud.tsx:47`; bounded attempts/late cleanup at `web/src/net/connect.ts:36`; intentional leave cleanup at `web/src/net/net.ts:22`. |
| Storage or unavailable wheel readings could disrupt first use or imply false data. | Guarded preference helpers at `web/src/lib/preferences.ts:3`; status freshness validation at `web/src/components/menu/MenuOffice.tsx:37`; live dates derive from actual sensor observations at `web/src/components/Hud.tsx:71`. |
| WebKit logged an invalid WebSocket protocol before the SDK’s successful browser fallback. | Pinned `web/patches/@colyseus__sdk@0.18.5.patch:1` selects the browser constructor directly. Frozen install and live WebKit startup at both widths passed after the fix. |
| Remaining inherited game labels used sizes outside the six-size scale. | HUD 18/24px sizes map to 20/28px; role and firing text use the named tokens in `web/src/globals.css:294`. |
| Download controls could run before art/fonts were ready. | Asynchronous canvas preparation and explicit retry/error states at `web/src/components/MatchEnd.tsx:34`; blob cleanup at `web/src/lib/resultCard.ts:55`. |

### Probe

Executed from repository root against the export:

```sh
IMD_PLAYWRIGHT=/tmp/among-tools/node_modules/playwright/index.mjs \
PLAYWRIGHT_BROWSERS_PATH=/tmp/among-browsers \
node .imd/reads/skills/design-critic/scripts/taste.mjs --out test/scratch/taste
```

The pinned `taste@1` probe passed **16/16**: render, layout, targets, contrast, casing, tracking, eyebrows, type sizes, typefaces, glyphs, slogans, repetition, copy budget, chrome, motion, and share metadata. No horizontal scrolling at 320/390/1440, missing local assets, text overlap, clipped text, or script errors. All ten measured phone controls meet the comfortable 44px size. The 390 and 1440 screenshots were inspected visually.

## Remaining limitations

- The public static URL is assigned by the IdentityMD publisher after submission. No hosting or GitHub publication command ran here. Both complete exports and the permitted full source are delivered; share drafts use the current page address.
- Real online multiplayer depends on Render and Squeekchain. The client bounds waking at 90 seconds, but cannot guarantee either service's uptime.
- Recorded runs arrive from the live server without a year. Cards preserve its original UTC label instead of guessing a year. Live-run dates explicitly say unavailable if a real observation cannot be read.
- Automated browser emulation is not a physical iPhone/Android test. Actual mobile keyboards, device sound output, native screen readers, OS high contrast, and every combination of browser zoom/game phase were not tested.
- Reduced-motion CSS and camera-shake handling were checked in source and by the probe. Essential movement/wheel animation remains part of the game. The hidden red/green lever mechanic intentionally depends on the original game rules.
- Link metadata includes a local share image with a relative URL, suitable for this address-independent export. Some social crawlers require an absolute URL; their live unfurl cannot be verified before the publisher assigns an address.

## Submission boundaries

No `.git/`, `.github/`, environment files, or repository `node_modules/` were edited or imported. No secrets, wallet/payment/login infrastructure, analytics, submodule, package cache, or dependency archive is part of the deliverable. The root `.gitignore` has an explicit **512-byte path budget** (actual size 192 bytes). The unchanged upstream `server/.gitignore` was restored with a separate **64-byte path budget** (actual size 25 bytes). Root patterns exclude dependency/cache directories at every nesting level and intentionally retain both exports. Scratch checks are outside the submission. Both exports contain 34 files and are byte-identical; relative HTML and font asset URLs were checked. The exact final Git-visible file count and uncompressed byte total are in `web/artifacts/checks.json` under `submission`. The total is below the 8,388,608-byte limit.


## Saved review evidence

- [Phone first screen, 390px](artifacts/title-390.png) and [desktop first screen, 1440px](artifacts/title-1440.png), from the final passing probe.
- [Phone wheel log](artifacts/wheel-log-390.png) and [desktop vote confirmation](artifacts/meeting-vote-1280.png), from final live-server meeting checks.
- [Phone result screen](artifacts/result-390.png) and [the actual downloaded PNG](artifacts/downloaded-shift-card.png), from the complete real match described above.
- [Machine-readable check results](artifacts/checks.json), including the four final browser startup runs, meeting checks, probe results, and submission audit.

Evidence is intentionally included through the budgeted root ignore file. Dependency/cache patterns still exclude those directories inside the evidence path as well.
