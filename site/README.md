# Changing Shores

The visuals site for feynman's prism: a small low-poly Three.js exploration
game after Ovid's *Metamorphoses*, laid out in [visual-design.md](../visual-design.md).
The regions are the pears' device names — Nonacris, Corinth, Eridanus,
Mytilene — so the network and the game share one map.

```bash
pnpm install
pnpm dev        # http://localhost:5173
pnpm build      # dist/, static; deploy anywhere (Cloudflare Pages/Workers assets)
pnpm lint       # oxlint, same 35-line / 300-line limits as the torrent
```

Production: https://explore.turingsbazaar.org, served by the Cloudflare Worker
`feynmans-prism-explore`. From the repository root, with Wrangler logged into
the Cloudflare account that owns `turingsbazaar.org`:

```bash
pnpm -C site lint
pnpm dlx wrangler deploy --cwd site
```

Wrangler builds the site and uploads `site/dist/` plus the music Worker.
`public/.assetsignore` excludes local music files from the upload. The custom
domain and R2 binding are declared in `site/wrangler.jsonc`. The pear bridge remains on each visitor's
machine; multiplayer and research islands require a running pear. Browsers
may request permission to connect to the local network.

Controls: WASD/arrows move · Space jump/flap/ascend · Shift descend/dive ·
E interact · Q change shape · M map · P or Esc pause (also the ❚❚ button;
the world freezes and the music holds, hiding the tab pauses too).
Mouse, as in Blender: hold the middle button and drag to orbit, Shift +
middle drag to pan, Ctrl + middle drag or the scroll wheel to zoom. The left
button does nothing to the camera. Panning up lifts the camera into an overview that widens the higher you go. Standing still, an orbit is free; once you
walk, you walk the way you are looking, so orbiting while moving steers. An
owl always flies where the camera points. In a cart, W accelerates and S
brakes. Touch: joystick and buttons.

Music: `public/music/ambience.mp3` loops from the first input on
(`src/game/music.ts`); there are no synthesized noise beds. The file is yours
to supply (use one you hold rights to; the Age of Mythology Greek seaside
theme is the reference mood), and it is worth keeping small.

In production, `/music/ambience.mp3` streams `greece-sounds.mp3` from the
private R2 bucket `noesis`. Only that object is exposed by `worker.mjs`;
byte-range requests let browsers buffer and seek without fetching the whole
track first. Local development still uses `public/music/ambience.mp3`.
Verify streaming with `node --test site/tests/worker.test.mjs`.

Look: golden hour after the Cloudline references in `src/assets/` — gradient
sky with a soft sun that turns to a moon and stars for the owl, drifting
low-poly clouds, sparkle on a pale turquoise sea, cream walls with terracotta
roofs, green shutters and warm windows, rails on wooden sleepers with trestles,
a tram-green cart, ivory rounded panels with small-caps labels and serif
place names (`src/game/sky.ts`, `props.ts`, `track.ts`, `App.css`).

Play: start human in Nonacris. Q changes shape anywhere — on land walk, run
(stag), fly (owl); in water you are a naiad and Q toggles to the owl. Wading
into water turns you into a naiad, climbing out turns you back. One memory
hides in each of the six regions, each behind a different way of moving;
finding all six reveals Eridanus across the sky, and its source ends the
journey. Progress is saved in `localStorage` (restart button clears it).
Inhabitants take their names from `src/names.ts`.

Springs: as a naiad, press E in a pool to follow the water underground and
surface at the next spring; the thirteen pools form one ring around the map
(`POOLS` in `src/game/regions.ts`, the prompt names the destination):
Nonacris' spring → the pool behind the falls → Castalian → Thebes' fountain →
the Cithaeron spring → Pirene in Corinth → the Corinth harbour pool →
Daedalus' courtyard → the well at Knossos → Delos →
Icaria → the pool above Methymna on Lesbos → the source of the Hebrus → back
to Nonacris.

Other people: run a pear on the same machine (`pnpm -C torrent pear`) and
every device in its room appears in the game as a figure with its name —
standing in Nonacris' square if that laptop is only lending compute, moving
about in its own shape if someone is playing there. The pear serves its room
on `http://127.0.0.1:7300` (`--bridge`), the game reads it and posts your own
position back, and pears gossip positions to each other (`src/game/others.ts`,
`torrent/src/bridge.ts`). `?bridge=http://host:port` points the page elsewhere.

Research: the same pear streams the problem graph (`/research`), and each
problem appears as an archipelago in the open sea southwest of Arcadia
(`src/game/research.ts`). Subproblems are islets — a lighthouse when solved,
a tree when ready, mist when blocked on another — with stone causeways for
dependencies and shoals for proposals awaiting review. Swim or fly to one and
the panel shows its question. Walk from one islet to another and the pear
counts it; three walks between the same two wear in a wooden road, and the
layout pulls them closer. M shows the islets on the map.

The panel in the corner shows only the place and Ovid's line on it, from
A. S. Kline's translation at poetryintranslation.com (Books I, II, III, VII,
VIII, XI; the passages live in `src/game/regions.ts`). Kline licenses the
text for non-commercial reproduction with attribution, which the panel
carries; keep that in mind if the site ever turns commercial.

Layout: `src/App.tsx` is the shell, `src/hud.tsx` the overlay, and
`src/game/` the engine — `regions.ts` (all the data: where things are),
`terrain.ts` (the landscape as a height function), `props.ts` (builders and
region dressing), `player.ts` (the four forms), `cart.ts`, `interactions.ts`
(E and Q), `engine.ts` (loop, camera, atmosphere), plus `audio`, `particles`,
`eridanus`, `controls`, `save`, `noise`.
