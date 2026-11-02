# Among Squeeks design

## Overview

A warm, dimly lit hamster burrow carries the game’s identity. The existing code-drawn hamsters remain the characters; an original wheel-room illustration explains the setting. The title screen puts a large amber **Play now** button before customization. Desktop uses a two-column game title and scene; phones use a small character portrait so the action stays on the first screen.

The source of truth is `web/src/globals.css`, supported by Tailwind utilities in React components. The Phaser map retains the existing game artwork and geometry. This is one dark appearance, not a light/dark theme system.

## Colors

Actual CSS tokens from `web/src/globals.css`:

| Token | Value | Purpose |
| --- | --- | --- |
| `--bg` | `#18150f` | Page and game overlay background; dark ink on amber controls |
| `--ink` | `#fff5df` | Primary text |
| `--muted` | `#c0b49b` | Supporting text and labels |
| `--panel` | `#27231a` | Dialogs, HUD, meeting surfaces |
| `--surface-raised` | `#332d22` | Hover state and selected/action surfaces |
| `--line` | `#514835` | Structural borders and separators |
| `--mon` / `--gold` | `#edbe65` | Primary action, original amber identity |
| `--mon-hi` | `#ffdb91` | Primary hover and wheel emphasis |
| `--up` | `#a9d6ad` | Fixed consoles and positive game state |
| `--down` | `#ff9a90` | Tampering, danger, Rugger actions |
| `--focus` | `#fff5df` | Two-pixel keyboard outline, four-pixel offset |

Tailwind’s `bg`, `ink`, `muted`, `mon`, `mon-hi`, `up`, `down`, and `gold` names map to these tokens. `--mon` is a retained source name, not a separate token economy. Red/green lever colors in Phaser are intentional game mechanics; readable labels and the wheel log provide text explanations outside the hidden-information mechanic.

Measured first-screen text ratios from the rendered probe: primary text on `--bg` **16.81:1**, supporting text on `--bg` **8.88:1**, amber heading on `--bg` **10.54:1**, and primary-button ink on amber **9.97:1**. These measurements do not claim coverage of arbitrary Phaser art or every status overlay.

## Typography

- **Chakra Petch 700**, falling back to Trebuchet MS and sans-serif: the title, headings, and retained game display text. Local file: `web/public/fonts/chakra-petch-latin-700.woff2`.
- **Inter 400–700**, then system-ui and sans-serif: interface text, controls, paragraphs. Local variable font: `web/public/fonts/inter-latin.woff2`.
- Fonts include their OFL notices; there are no external font requests.

The six named sizes are **14, 16, 20, 28, 44, and 80px** (`--size-small`, `--size-body`, `--size-lead`, `--size-heading`, `--size-title`, `--size-display`). The title is 80px on desktop, 44px below 880px; phone dialog headings are 20px. The result heading is 44px, 28px on phones. Small inherited HUD sizes are normalized to 14px; inherited 18/24px labels map to 20/28px. Role reveals use 80px on desktop and 44px on phones, with firing text at 44/28px and supporting text at 20px. Canvas lettering remains governed by the original world-space rendering; the exported 1200×630 result image has its own larger raster scale.

Body line height is 1.5. Main title line height is .98 (1.05 on phones), with -.045em tracking. Headings balance; descriptions use pretty wrapping. Form inputs are at least 16px to avoid iOS input zoom. Timers and counts use tabular numerals. Body text remains selectable; selection and touch scrolling are disabled only on the game canvas.

## Layout

Spacing is built mainly from 8, 12, 16, 24, 32, and 40px gaps/insets. Header/footer width is capped at 1360px; main content at 1248px. The title/action column is capped at 440px. Desktop uses `.9fr 1.1fr` columns with 40px between them. The lower wheel status and tutorial follow those same edges.

At **55rem / 880px**, page insets shrink and the title moves to the 44px size. At **42rem / 672px**, the main layout becomes a single column with 24px insets. The large scene hides; `.mobile-crew` supplies a small portrait and play premise. The title, description, primary button, friend controls, and customization remain above the tutorial. The page uses native document scrolling, avoiding a clipped fixed-height landing page.

The game remains fixed to the viewport. On phones, identity/sound/leave occupy the top row; wheel status, block meter, and collapsed tasks sit below at the left; the shift timer sits at the right with its Tailwind translation explicitly cleared. Actions stay at the lower right with safe-area insets. Meetings use a vertically scrolling single-column crew list on phones; logs use 14px text, 44px time columns, and wrapping event descriptions. Results have a maximum 680px content width and scroll vertically. Dialogs have at most 480px width and `100dvh - 32px` height.

Rendered reflow has been checked at 320, 390, 1280, and 1440px. See `web/VALIDATION.md` for state-specific coverage and limits.

## Elevation & Depth

The site uses solid warm surfaces and one-pixel borders, not decorative card shadows. The wheel illustration uses SVG depth and light as artwork. Native dialogs sit in the browser’s top layer over a `#090806c9` backdrop. The fixed game HUD uses layered overlays: normal utilities at z20, short hints around z30, meetings at z40, and role/result views at z50. The gameplay canvas remains behind the interface.

## Shapes

Buttons and fields use an 8px radius. Dialogs and action controls use 16px; result images use 12px. Portraits are circular or use the existing rounded hamster frames. The wheel timeline has a 4px radius. Forms and action targets have room to grow vertically rather than clipping their labels.

## Components

| Component / source | Behavior and reuse |
| --- | --- |
| `MenuOffice.tsx` | Title, main actions, true API status, first-visit tutorial, customization and join flows. Unknown/stale wheel status is explicit. |
| `BurrowArt.tsx`, `HamsterDev.tsx` | Original scene geometry and existing hamster art. The scene is illustrative, not a live counter or recorded video. |
| `Icon.tsx` | Small code-drawn line icons, 1.8px stroke, `currentColor`, decorative to assistive technology. |
| `.primary` / `.secondary-button` | One amber primary emphasis per view, outlined secondary actions. Hover changes color, keyboard gets a visible outline, disabled actions are dimmed. Touch targets are at least 44px. |
| `Dialog.tsx` | Native modal dialog with named heading, Escape, backdrop dismissal, focus containment, and explicit trigger-focus restoration. Close control is at least 44px. |
| `Tutorial.tsx` | Five concise steps with hamster portraits; Next and Skip. Reused inline on first visit and in the help dialog. Never blocks Play now. |
| `SoundButton.tsx`, `sfx.ts` | Text/icon utility; pressed state means muted. Updates the master Web Audio gain and remembers the choice through guarded storage. |
| `Hud.tsx` | Real server role, wheel, tasks, timer, context-sensitive actions. Phone actions are 80×80px. The one-time power hint persists until dismissed and explains live versus recorded pauses. |
| `Meeting.tsx` | Native vote choices, separate “Confirm vote for …” controls, readable chat names, phone chat toggle, sound/leave utilities. Covered HUD controls are hidden and inert, including the underlying action row. |
| `WheelLog.tsx` | Actual server events, redundant text and color, time labels, power/tamper/fix legend. Recent events initially; a 44px expansion control reveals all events. No player attribution is inferred. |
| `MatchEnd.tsx`, `resultCard.ts` | Server-derived role/winner/passes/run label, canvas preview, download error recovery, current-address X draft, return controls. Image generation uses only same-origin hamster art. |
| `connect.ts` / waking dialog | A 90-second total budget, bounded network attempts, cancellation, late-seat cleanup, friendly Retry state. No invented progress percentage. |

All CSS transitions name their properties and last at most 150ms on new controls. Press scale is .96 when motion is allowed. Reduced motion disables CSS animation and transition; game camera shake is suppressed. Core game movement and the wheel’s mechanical animation continue as part of the requested game. No animated decorative title background is used.

## Do’s and don’ts

- Use the existing tokens and 14px-or-larger interface labels. Add explanatory text beside an unfamiliar action.
- Start a new overlay with `Dialog`, or a new scrollable result surface with the existing result layout. Keep its main action visible and preserve focus restoration.
- Keep the title’s Play now flow independent of optional customization and tutorial completion.
- Preserve the shared protocol and all server-only secrets/roles. Do not infer a role or invent wheel data while waiting for the server.
- Preserve the page’s actual root/subfolder address in share links; never hard-code a future frontend host.
- Keep required images/fonts local. Do not add wallet, payment, login, or analytics code.

Design review references: supplied Better Interface by Jakub Krehel (MIT) and the supplied Impeccable documentation method by Paul Bakaus (Apache-2.0). This document records the implemented source and measured review, rather than reproducing either guide.


The browser connection uses the existing Colyseus SDK with the small reproducible patch in `web/patches/`. It chooses the browser WebSocket signature directly, avoiding Safari’s logged protocol error before the original fallback. This does not change the visual system or the deployed wire protocol. Final Chromium and WebKit startup checks passed at phone and desktop widths.
