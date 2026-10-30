# Jameson’s Football — Modular Installable Web App

This is an independent static PWA project, maintained only in `Tiimmaahh/jamesons-football`.

## Edit the game

There is no `main.ts` in the current codebase. The original project used one large inline JavaScript block. The new `src/` directory splits that block by responsibility:

| File | Purpose |
| --- | --- |
| `state.js` | Shared DOM references, game state, helper functions |
| `celebrations.js` | Touchdown celebration UI and videos |
| `scoring.js` | Point choices and conversions |
| `kickoffs.js` | Kickoff and return logic |
| `formations.js` | Team placement and movement |
| `distribution.js` | Six equally weighted pass targets / QB sneak outcomes |
| `routes.js` | Pass eligibility, receiver route landmarks, smooth cuts, and running back out route |
| `drives.js` | Snaps, downs and field position |
| `returns.js` | Interceptions and fumbles |
| `simulation.js` | Play-by-play simulation and AI |
| `render.js` | Drawing the football field and players |
| `main.js` | Animation loop and input handlers |
| `styles.css` | All visual styles |

**Important:** These are source segments inside the game's existing shared closure, not independent ES modules. `build.py` concatenates them in a fixed order into `dist/game.js`. This was chosen to **preserve the existing gameplay without rewriting shared global state**. Functions can still reference functions in other source files due to the shared closure. Avoid individually adding `<script>` tags for the segments.

## Build and test

```sh
python3 build.py
node --check dist/game.js
python3 -m http.server 8000 --directory dist
```

Open `http://localhost:8000` to test. For publishing, upload the **contents of `dist/`** to the separate `jamesons-football` Vercel project, or use GitHub-connected Vercel with:

- Framework Preset: `Other`
- Build Command: `python3 build.py`
- Output Directory: `dist`

For PWA installation, deploy via HTTPS. Third-party celebration videos still require internet. The service worker precaches `game.js` and `styles.css` for offline gameplay.

## Browser regression checks

After building, install the test-only browser tools and start the static server:

```sh
npm install --no-save playwright@1.62.1
npx playwright install chromium
python3 -m http.server 8000 --bind 127.0.0.1 --directory dist
```

In another terminal run `node tests/smoke.cjs`. Optional environment variables:
`BASE_URL` tests a deployed site, `BROWSER_CHANNEL=msedge` uses installed Edge,
and `PLAYWRIGHT_MODULE` selects an existing Playwright installation.
The checks cover all three offensive plays, scoring and point choices, kickoff,
reset timing, helmets, mobile layout, icon dimensions, and offline reload/play.
Test instrumentation is injected into the test browser only; it is not published.

## Publishing and updates

Keep changes in this repository. Build and run the browser checks before pushing
to `main`; the connected Vercel project publishes that branch automatically.
Vercel must use the existing `jamesons-football` project, framework Other,
`python3 build.py`, and output directory `dist`. Generated `dist/` is not committed.
There are no runtime packages or environment secrets required by the game.

Each build derives the offline cache version from the app's contents. An installed
copy automatically refreshes when a new release finishes downloading online. Celebration videos are external and require an internet connection.

## Install on iPhone

Open the public game URL in Safari, tap Share, then Add to Home Screen, and tap
Add. If shown, leave Open as Web App enabled. Launch it from its new Home Screen
icon. Landscape orientation gives the largest field. Load once online before
playing offline.
