# Changelog

Newest first, start with yyyy-mm-dd in title


## 2026-09-18 — Other pears in the game; owls fly where you look

- `torrent/src/bridge.ts`: each pear serves its room to the browser over
  loopback with no dependency — `GET /events` (SSE snapshot every 200 ms:
  self + peers with name, user, joined, pose) and `POST /pose`. A posted
  pose is gossiped as a new `pose` control message; `Remote.pose` keeps the
  last one. `pear --bridge <port>` (default 7300 — 7200 belongs to `pnpm island` — `0` off). Test: `bridge`.
- `site/src/game/others.ts`: subscribes to the bridge (retry every 10 s),
  draws one figure per peer with a name label (`figures.ts`, now shared with
  the player), lerps to gossiped poses, parks pears without a pose in a ring
  in Nonacris' square, posts the local pose at 5 Hz. `?bridge=` overrides.
- Flight: the owl's heading follows the camera every frame, not only on W.
- Springs: six more pools (Cithaeron, Corinth harbour, Knossos, Delos,
  Icaria, Hebrus source; an Acrocorinth one was tried and removed — the
  lookout stays the cart's), all thirteen linked into one ring
  around the map so repeated E tours every spring — separate loops trapped
  you in Thebes. Each pool carries a label and the E prompt says where the
  water leads; the "water remembers the way" line is gone. Checked every
  link resolves and every pool surface sits above the sea.
- Pause: ❚❚/▶ button top right, `P` or `Esc`, and a touch button. One check at
  the top of `Engine.step` decides whether the world advances; when paused the
  frame still renders under a veil, input is ignored, and the music holds
  where it is. Hiding the tab pauses too.
- Pan up = overview: Shift + middle drag upward lifts the camera above the
  player (up to 260 m, faster the higher you are) while it keeps looking at
  you, so the visible range widens; fog pushed out to 1100 so the whole map
  shows from up there. Sideways pan unchanged and still eases out on movement.

## 2026-09-18 — Changing Shores: Ovid panel, shapes anywhere, music always

- Music (`public/music/ambience.mp3`, user-supplied) loops from the first
  input; the procedural wind/water/rumble beds are gone (`audio.ts` keeps only
  the memory chime). The seaside/zoom cue is gone with them.
- Upper-left panel shows only the place name and one line from Ovid's
  *Metamorphoses* in A. S. Kline's translation (fetched verbatim from
  poetryintranslation.com: Nonacris Bk II, Parnassus Bk I, Thebes Bk III,
  Corinth/Ephyre Bk VII, Crete/Daedalus Bk VIII, Lesbos/Orpheus Bk XI;
  Eridanus Bk II for the open sea), with attribution. No objectives or hints.
- Q changes shape anywhere: land cycles human → stag → owl, water cycles
  naiad ↔ owl. Entering water as a walker makes a naiad, leaving makes a
  human. Shrines stay as landmarks; no unlocking, no `unlocked` in saves.
- Upper-right chips (memories, form) removed.

## 2026-09-18 — Changing Shores: Blender mouse scheme

- Middle button + drag orbits, Shift + middle drag pans, Ctrl + middle drag
  zooms (as does the wheel); the left button no longer touches the camera.
  Shift held for a pan does not count as "descend". Help bar and README updated.

## 2026-09-18 — Changing Shores: camera-relative steering, seaside ambience

- Drag-to-look felt wrong because the heading stayed put: after looking
  sideways, W walked sideways while the view swung back. Now walking forward
  adopts the look direction every frame (`FollowCamera.takeYaw`), so a drag
  while walking steers and a drag while standing orbits. Pan still eases out.
- `music.ts`: one looping ambience (`public/music/seaside.mp3`, user-supplied,
  not bundled) fading in when sea is within 45 m or the camera is far out /
  high (`zoom > 2.2` or `pitch > 0.7`). Starts on the first input gesture;
  a missing file stays silent.

## 2026-09-18 — Changing Shores: camera controls and the Cloudline look

- Camera (`camera.ts`, out of engine.ts): left-drag looks around the player,
  wheel-button drag pans, scroll zooms (0.35×–3.5×). Look and pan ease back
  behind the player once you move; pitch and zoom stay. `controls.ts` owns
  the mouse (preventing middle-click autoscroll and the context menu).
- Style reverse-engineered from `site/src/assets/reference*.png`: golden-hour
  gradient dome, soft sun sprite that shrinks to a moon with stars at the
  owl's dusk, 26 drifting low-poly clouds, sea sparkle points, Neutral tone
  mapping, warm key + lavender hemisphere + soft shadows (`sky.ts`). Palette:
  sage-lime meadows, lavender-grey rock, pale turquoise water; cream walls,
  terracotta roofs with ridge and chimney, dark-green shutters, emissive
  windows; round sage canopies; lamp posts; lighthouses at Corinth and Thrace.
  Tracks get two rails, instanced sleepers and trestle legs where the line
  leaves the ground; the cart is tram green with cream trim and a lantern
  (`track.ts`). `props.ts` split into builders + `dress.ts` (region dressing).
- HUD in ivory rounded panels: small-caps labels, serif region name, chips
  for memories and form, Power/Brake pedals with key hints in carts, help bar
  with the mouse controls (`App.css`, `hud.tsx`).

## 2026-09-18 — Changing Shores: the low-poly game in `site/`

From `visual-design.md`, built into the existing Vite + React scaffold (no
extra package): `three` 0.186 added with pnpm, `App.tsx` is the shell,
`hud.tsx` the overlay, `src/game/` the engine, all under the 35/300 limits
(`.oxlintrc.json` now enforces them for the site too).

- World: one height function (`terrain.ts`) from region blobs, carved by two
  rivers, seven pools, the Corinth isthmus (two seas) and a strait that makes
  Crete an island; flat-shaded non-indexed mesh, vertex colours by height and
  region tint. Six regions dressed procedurally (`props.ts`): pines, olives,
  cypresses, houses, Delphi's terrace and columns, Thebes' walls with gates,
  Corinth's piers, Daedalus' workshop; islets Delos, Paros, Icaria; Lesbos.
- Forms (`player.ts`): human (walk, jump), stag (fast, springy, high jump),
  owl (free flight, bank, glide sink, thermals on the Icarian route, dusk
  atmosphere and drifting seeds), naiad (swim in sea and pools, dive, surface).
  Non-naiads float slowly; naiads crawl on land; nobody is stranded. Fall
  recovery to the last solid footing.
- Carts (`cart.ts`): Catmull-Rom tracks at Nonacris and Corinth, arc-length
  lookup, W/S accel/brake, slope pull, drag, cornering roll; ride toward the
  far end from whichever end you board.
- Interactions (`interactions.ts`): talk (names from `src/names.ts`, the old
  pear names), board carts, follow springs (submerged passages between twin
  pools), transform at springs/shrines/groves/pools (unlock + cycle).
- Memories: one per region gated by a form (Ladon's hidden pool → naiad,
  Delphi ledge → owl, Cithaeron → stag trail, Acrocorinth → cart, Icaria →
  thermals, Mytilene → river to sea). Six found reveals Eridanus
  (`eridanus.ts`), a luminous sky tube; its source completes the journey.
- HUD/React: region, form, objective, memories, contextual E/Q prompt,
  dialogue, cart gauge, map (`M`, top-down raster of the height function),
  restart, touch joystick + buttons on coarse pointers. Procedural audio
  (`audio.ts`) starts on first input. Local save every 5 s and on pickups.
- Verified: `tsc -b`, oxlint, `vite build` clean; Node logic smoke of every
  region/memory/pool/track and all four forms; headless Chromium render with
  zero console errors (screenshot of Nonacris). Fixed on the way: carts
  reversed at the midpoint; Crete was joined to Corinth by land; Three r186
  deprecations (`Clock` → `Timer`, `PCFSoftShadowMap`).
- Left: `site/package-lock.json` from the npm scaffold is stale next to
  `pnpm-lock.yaml`; delete it. Optional dolphin and cart customisation not built.

## 2026-09-18 — feynman.network/join: Headscale, invites, usernames

- `infra/headscale/`: `compose.yaml` (headscale 0.29.3 + caddy), `config.yaml`
  (server_url feynman.network, Tailscale's public DERP map, sqlite, MagicDNS
  under `pears.feynman.network`), `Caddyfile` (TLS, `/join` → `site/join.sh`,
  rest proxied to headscale). Not deployed yet — needs a VPS and DNS.
- `site/join.sh`: the curl target. Installs tailscale (only with an invite),
  checks node ≥ 22 / pnpm, clones into `~/.feynman/prism`, runs `pnpm join`.
- `scripts/join.ts` (`pnpm join`): `tailscale up --login-server … --authkey`
  from the invite when not already on a tailnet (sudo on Linux), asks for a
  username (default: tailnet login, else OS user), saves `username` and
  `invitedBy` into identity.json, launches the pear. `--no-launch` for scripts.
- `scripts/invite.ts` (`pnpm invite`): find-or-create the Headscale user
  (`GET/POST /api/v1/user`), mint a single-use pre-auth key
  (`POST /api/v1/preauthkey`, user id as string per v0.29 swagger), print the
  code and the one-liner. `src/headscale.ts` is the client (errors carry
  status only, never bodies); `src/invite.ts` is the code format
  `feynman:<host>:<inviter pubkey>:<key>`.
- Identity file gains `username` / `invitedBy`; `saveIdentity(home, patch)`
  replaces `saveDevice`. `hello` carries `user` and `invitedBy`; the feed says
  `… connected as yoyo` and `… joined on your invite`; header shows `you:`.
- Tests: `invite` (code round-trip, malformed codes, headscale client against
  a fake fetch: call order, bearer header, single-use key, expiry, error
  hygiene). Dry-run: `pnpm join --no-launch` headless writes the username.
- Open: the invite receipt itself (inviter credit) waits for the receipts
  stage; `pnpm invite` is admin-only until tiers gate it.

## 2026-09-18 — One game: research islands in site/, roads worn in by walking

Why: two browser surfaces (the 2D islands page and the Three.js game) were
one too many. The pear's bridge now serves the graph and the game draws it.

- `src/bridge-research.ts` (new): `GET /world?problem=`, `GET /research`
  (SSE `world` events; resends when `graphVersion` ticks), `POST /explore`,
  `POST /walk`. Routed from `bridge.ts`. `state.setGraph` bumps
  `graphVersion` wherever a snapshot lands (peer, publish, absorb).
- Edges have a `kind`: `requires` gates readiness, `road` never does. New
  `trails` table counts walks between two islands (a < b); at `ROAD_AFTER`
  = 3 the pair becomes a road edge whose weight keeps growing with walks and
  pulls the two together in the layout. Existing graph files get the `kind`
  column via ALTER on open. Wire: `walk`. `presence.walk`, `restructure.onWalk`.
- `world.ts`: `title`, `kind` on bridges, `trails`.
- Removed `scripts/island.ts` and `assets/island.html` (superseded).
- `site/src/game/research.ts` (new): subscribes to `/research`, builds one
  archipelago per problem on the southwest sea (scale 0.075, centres near
  (-190,110) and (-110,195)): islets with a lighthouse (solved), tree
  (ready) or mist (blocked), causeways (stone) and roads (wood), faint trails
  fading in with walks, shoals for proposals, floating id labels; islets are
  colliders so a naiad docks rather than swims through. Arriving at a
  different island of the same problem POSTs a walk. HUD: the status panel
  shows the subproblem on an island; the minimap dots the islets.
- Tests: `bridge-research` (world, stream, walk → road, explore validation),
  `graph` (walks → road, roads never block), `world` (trails, title).
- Not done: the Stellaris-style map view on M, quality quadrant per island,
  the explore trigger in the game, walking on islets (they float; swim or
  fly), multiplayer walk gossip beyond the coordinator.

## 2026-09-18 — Islands: the graph as a browser map that grows when you walk off it

Why: a map is a query surface. Where a player steps off the edge says which
nodes to extrapolate from; the graph and the proposal queue already give the
map its land and its provisional land.

- `src/world.ts` (new, pure): snapshot → `World` (islands, bridges, sandbars,
  bounds). FNV-1a `hash`, mulberry32 `rng`, deterministic force `layout`
  (repel, attract along edges and parent links, gravity 0.05). Island radius
  from text length, shape seed from `problemId/id`; sandbars sit 180 px from
  their parent, or on the rim.
- `src/explore.ts` (new): `exploreQuery` (weighted content words, stopword
  list, longer words win ties), `proposalsFrom` (dedupe by normalized title
  against nodes and pending), `openAlexSearch` (title-and-abstract filter,
  which ANDs terms), `exploreQueries`/`explore` (domain words from the
  problem title + anchor words, shortened 3+3 → 3+2 → 2+2 → 2+1 until the
  search returns papers; relevance `search=` was too loose at any length).
- `peer.ts`: control handlers run guarded; a throw is logged to the feed
  instead of killing the pear (a ghost coordinator died on a moved sqlite).
- `scripts/island.ts` (new): bridge pear on `:7200` — `/` page, `/problems`,
  `/world?problem=`, `/events` (SSE, a world per graph broadcast), `POST
  /explore {problemId, anchors}` → `propose-subproblem` per new paper, parent
  = strongest anchor. Serves the webtorrent wavs.
- `assets/island.html` (new): canvas, wasd, camera on the player, island text
  in the HUD, ping on first landing, dashed border = bounds + 220 px; past it
  the nearest island (two if nearly as close: interpolation) is POSTed, 8 s
  cooldown.
- `data.ts`: new problem `transducer-coverage` (owner-proposed: transducer
  placement for 360° steering in the brain) with a seven-question starter
  decomposition.
- Tests: `world` (hash/rng, deterministic layout, spread bounded, mapping,
  sandbar near parent), `explore` (query, dedupe, injected search).
  Live smoke: coordinator + bridge, `/world` for both problems, `/explore`
  against OpenAlex queued sandbars.
- Not done: zoom into an island (hierarchy as level of detail), the boat
  (diegetic loading), exploration cost/tiers, cross-problem roads, erosion.

## 2026-09-18 — Problem graph in SQLite, restructured by fragments

Why: DESIGN.md asked for hierarchical decomposition plus a dependency graph
that changes as peers contribute. The tree was a flat hardcoded list.

- `src/tree.ts` (new, pure): `GraphNode`/`GraphEdge`/`Proposal`/`GraphSnapshot`
  types, `readySet` (open nodes whose requires-edges are all solved),
  `buildTree`/`flatten` for the TUI, `nextId`. An edge src → dst means "src
  requires dst"; weight is a pheromone with the same 0.05–10 bounds as
  `tools/research`.
- `src/graph.ts` (new): `Graph` over `node:sqlite` — nodes, edges, proposals;
  `seed` (idempotent from data.ts, `q1…qN`), `addNode`, `link`, `reinforce`
  (scales roads into a node, drops those at the floor), `propose`/`pending`/
  `review` (batch), `snapshot`/`absorb`.
- `src/restructure.ts` (new, coordinator only): `onFragmentSolved` (solve,
  create if unlisted, add spawns as children, report unlocks),
  `onAmplification` (reinforce/drop), `onProposal`, `onReview`; every change
  broadcasts a `graph` snapshot; `absorbBroadcasts` on election. Graph file is
  `<home>/graph.sqlite`.
- Wire: `submit-fragment.spawns?`, `propose-subproblem`, `review-proposals`,
  `graph`. Coordinator sends the graph on every new connection (scripts do not
  hello). `handleSubmitFragment` now records the sending peer as contributor.
- TUI: expanded problems render the tree (`✓ ○ ·`), `p` proposes for the
  problem under the cursor, `r` approves the whole queue (coordinator).
- Scripts: `propose`, `review`; `fragment-submit --spawns "a || b"`.
  `pear`/`test` pass `--no-warnings=ExperimentalWarning` for node:sqlite.
- Tests: `graph` (seed, ids, readiness, reinforce, batch review, absorb),
  `restructure` (spawn/unlock, unlisted node, demotion, queue, takeover).
  Smoke: two local pears + submit/propose/review scripts; sqlite inspected.
- Known: `tests/discord.test.ts` "failed worker is disclosed" fails before and
  after this change (synthesis wording), untouched here.
- Not done: tier gating of who may propose or link; cross-problem edges;
  `assignment.ts` still takes a caller-supplied list rather than `readySet`.

## 2026-09-18 — Pears name themselves from the DESIGN.md device list

- `data.ts`: `DEVICE_NAMES` (Nonacris … Tyrrhenian) replaces the
  `aman…gwern` pools. `identity.json` gains `device`, picked at random on
  first run (`pickDeviceName`, suffixed `-2, -3…` once all nineteen are
  taken) and persisted; `--name`/`--index` still pin one.
- Coordinator name stack retired: `request-name`/`assign` left the wire,
  `naming.ts` shrank to election + collision. Election is now by room
  seniority (`since`, ties by key) instead of name rank, so it no longer
  depends on who wears which name. Two pears with the same name: the newer
  one re-rolls and saves (`rename` broadcast, fixed names never yield).
- `pendingAutoJoin` gone — a pear always has a name, so `--auto-join` fires
  as soon as the room is ready. Header reads `device: Eridanus`.
- Tests: `naming` (random pick, exhaustion suffix, seniority election),
  `identity` (device persisted, re-roll saved).

## 2026-09-18 — Hyperswarm → loopback / Tailscale transport, persistent identity

Why: the DHT was the unreliable part (20–30 s connects on stale topics, phantom
peers, no relay for symmetric NAT). Tailscale gives WireGuard-encrypted,
DERP-relayed connectivity, and `tailscale status` is the tracker.

- `src/transport.ts` (new): `local` (loopback) and `tailscale` transports;
  pears listen on the first free port of `7100–7109` and dial every port of
  every visible host. Inbound is gated to loopback + Tailscale ranges.
- `src/room.ts` rewritten on `node:net`: id handshake as the first line
  (`{t:'id', key, room, port}`), room filter, crossed-dial dedupe (lower key's
  connection wins), `ready()` / `refresh()` / `close()`. The handshake reads the
  first line by hand and `unshift`s the rest so a hello in the same chunk is
  never lost. `readLines`/`writeAll`/`parseFlags` unchanged for scripts.
- `src/identity.ts` (new): persistent ed25519 keypair in
  `~/.feynman/identity.json` (`--home`, `FEYNMAN_HOME`), `sign`/`verify` via
  `node:crypto`, no new dependency. This key will sign receipts.
- `pear --local`, `pear --home`; orchestrator gives pear #i
  `torrent/.pears/<room>/<i>` (gitignored). `lifecycle` polls `refresh()` on
  the old backoff schedule.
- Scripts `message transcript agent fragment-*` ported mechanically
  (`room.on / ready / connections / close`).
- Tests: `room` (loopback pair, dedupe, room isolation, trusted addresses),
  `identity` (persistence, sign/verify, corrupt file refused). Smoke: two
  headless pears + `message` probe: aman/guillefix naming, join propagation,
  chat, clean exit, no ghosts.
- Left as is: `src/discord/hyperswarm-client.ts` and `scripts/guillefix.cjs`
  still use Hyperswarm (dependency kept for them); they no longer see pear
  rooms. Discord tests currently fail on an unfinished persona entry in
  `PEARS.md` (line 42, `"name":` without a value) — a user edit in progress.
- Next: `--setup` onboarding + Headscale pre-auth keys as invite codes;
  receipts and tiers on top of `identity.sign`.

## 2026-09-17 — One-command DeepSeek rooms

- Added `just pears [count] [room]`, plus attach, restart, and stop recipes.
- Extended the orchestrator with manual DeepSeek agents, named panes, and multiple windows for larger groups.
- Validate counts, room names, and credentials before restart; reopen existing rooms without duplicating agents.

## 2026-09-16 — Tit for Tat system from BitTorrent, Validation metrics for research fragments and coordinator assignment

**Solve Velocity & Amplification Factor:** Core mechanic to track peer productivity and research quality.
- **Solve Velocity** (fragments/hour): measures how fast a peer churns through work
- **Amplification Factor** (1.3x, etc): downstream speedup from a fragment; accumulates across submitted work
- Replaces peer-review scoring; avoids the arxiv problem where reviewer scores ≠ paper quality

**Wire protocol:** Added `submit-fragment`, `report-velocity`, `compute-provide`, `assign-fragment`, `chat` messages
- Peers announce compute capacity; coordinator tracks in ledger
- Fragments accumulated per contributor with amplification history
- Assignment algorithm weights peers by velocity (10x) + amplification (5x); round-robin distribute work
- Assignments announced so all peers see load distribution

**Discord bot as "Recorder + Stirrer":**
- Connects to Hyperswarm rooms; passively logs all fragment activity
- Commands: `!record [N]` show last N events, `!stir <msg>` inject message, `!fragment-submit`, `!announce-compute`
- Displays fragment submissions, velocity reports, compute announcements, peer joins in feed

**Display fix:** Peers now show as `hash [name]` (e.g. `a1b2c3d4 [aman]`), or just hash if name unavailable
- 5-second timeout on name requests so peers don't hang
- Both hash and name displayed on join for clarity

**Tests:** Dummy trees (problems 1–25 nodes), 3-peer scenarios, metric accumulation, scoring validation


## 2026-09-14 — Introduced context through multiple docs, featuring ousterhout coding principles, reduced cognitive complexity, 

Goal: any human or agent understands the repo in 30 seconds, and can torrent
within 30 seconds of reading README.md. Rules applied: AGENT.md (≤35-line
functions, ≤300-line files, one place for run commands, changes logged here).

### Stage 1 — repo shape

- **acoustics/ moved out** to [exanova-y/propagate-yourself](https://github.com/exanova-y/propagate-yourself)
  via `git subtree split` (history preserved; the gitignored `dataset/` was
  moved along). Zero code coupling existed, but it owned 6 of 8 Python deps.
- `pyproject.toml`: project renamed `propagate-yourself` → `feynmans-prism`;
  dropped jax, jwave, matplotlib, napari, numpy, simpleitk. Left: psycopg,
  pyyaml. `uv sync` + `just test` + `just lint` pass.
- Deleted root `package.json`, `package-lock.json`, `node_modules/` (declared
  only hyperswarm; nothing at root used it — all consumers live in `torrent/`).
- Deleted root `.gitkeep` (a stale list of directory names).
- Moved `in-short.md`, `via-egnatia.png`, `torrent-peers.png` → `docs/`.
- `tmux` installed (`brew install tmux`) so the orchestrator uses tiled panes.

### Stage 2 — torrent pruned, toolchain

- **Deleted the React/Vite web UI** (`torrent/src/*` old tree, `index.html`,
  `vite.config.ts`, `public/`, `dist/`, `tsconfig.app/node/tui.json`,
  `eslint.config.js`). Its WebSocket sidecar `server/pear.cjs` had already been
  removed, so it could never connect; `data.mjs` documented it as superseded.
  The two WebTorrent-style click sounds are kept in `torrent/assets/` for the
  DESIGN.md join/leave sound, to be wired into the TUI later.
- npm → **pnpm** (`pnpm-lock.yaml`), ESLint → **oxlint** + **Prettier**
  (`.oxlintrc.json` enforces `max-lines-per-function: 35`,
  `max-lines: 300`; `.prettierrc`). One `tsconfig.json` covering
  `src/ scripts/ tests/` — the pear is now type-checked (previously excluded).
- Dependencies removed: vite, @vitejs/plugin-react, react-dom, @types/react-dom,
  ws, @types/ws, eslint, typescript-eslint, eslint-plugin-react-hooks,
  eslint-plugin-react-refresh, @eslint/js, globals. Added: oxlint, prettier.
- Scripts: `pear room orchestrator message transcript agent lint fmt typecheck test check`.

### Stage 3 — tui.tsx (731 lines) decomposed

- `torrent/src/` now has one module per domain, acyclic in this order:
  `wire` (protocol, pure) → `room` (hyperswarm/readline transport, shared with
  scripts) → `state` (live state + Ink snapshot) → `send` → `presence`
  (join/leave/say) → `naming` (coordinator stack + election) → `peer`
  (inbound handling) → `lifecycle` (online/refresh/shutdown) → `ui/`
  (`widgets.tsx`, `keys.ts`, `App.tsx`) → `pear.tsx` (entry). Largest file
  178 lines; largest function under 35.
- Mutable cross-module values (`myName`, `isCoordinator`, cursor…) became
  fields on exported `self` / `ui` objects in `state.ts`, since ES modules
  cannot reassign imported `let`s.
- `data.mjs` + the web UI's `problems.ts` merged into **`src/data.ts`**: short
  `title` for the terminal, full Emergent Mind `statement`, all 10
  credit-assignment subproblems (was 3), tokens 50k. Expanding a problem now
  shows the statement above its subproblems.
- `scripts/*.mjs` ported to TypeScript on `room.ts`/`wire.ts` — the copy-pasted
  topic/connection/readline/`U+001F`-skip/arg-loop boilerplate (5 copies) is
  gone. `guillefix.cjs` moved to `scripts/` **verbatim** and is excluded from
  Prettier. Commands inside the scripts now spawn `pnpm pear`.
- `parseFlags` skips a lone `--` because pnpm forwards it from `pnpm run x -- args`.
- Tests (`node:test` via tsx): `wire`, `room`, `naming` (`pickCoordinator`,
  `popFreeName`, `nameRank`). `pnpm -C torrent check` is green.
- **Behaviour fix** found in the smoke test: when two pears both self-elected
  and met, the loser broadcast its hello *before* giving up its name, so the
  winner saw a plain member wearing its own name and renamed itself (room ended
  with coordinator `alex`, not `aman`). `demoteCoordinator` now nulls the name
  first. Verified: orchestrator ×3 → `aman` coordinator, `guillefix`, `alex`.
- The `stirrer` persona now announces the full problem `statement` (was the
  short title).
- Smoke-tested in tmux: naming, join propagation, `enter` expand, `m` chat,
  `message` probe, `guillefix.cjs` interop, `q`/`stop` leave zero
  `pgrep -f pear.tsx` ghosts.

### Stage 4 — docs

- `README.md` rewritten: "torrent in 30 seconds" first, then **one table with
  every run command** (torrent, python/just, research tree), then how the
  torrent works + troubleshooting (moved from `torrent/README.md`, now
  deleted), then a repo map.
- `DESIGN.md`: `@STYLE.md` → `AGENT.md`, stack line updated, image path → `docs/`.

### Concurrent work noticed (not mine, left untouched)

While this pass ran, another editor moved personas from `torrent/personas.json`
into a JSON block in `PEARS.md` (`src/personas.ts`, `scripts/agent.ts`), added
`discord.js` and `src/discord/`. As of this entry `src/discord/model.ts` and
`runner.ts` have TypeScript errors and four files fail `prettier --check`;
`pnpm -C torrent check` will stay red until that lands.

### Open (from AGENT.md, no code yet)

- OpenRouter token-cost tracking per day of development.
- W&B / Cloudflare observability.
- Discord channel for agents (in progress by the other editor).
- Join/leave sounds in the TUI (`torrent/assets/*.wav`, e.g. via `afplay`).
# 2026-09-14 — Discord research orchestration

- Added `pnpm -C torrent discord`: a channel-scoped Discord bot with per-thread
  conversations, direct persona routing, and program-chair delegation to Aman,
  Gwern, and optionally Representer.
- Added validated planning, cancellation, duplicate-event suppression, saved
  context, restart recovery, bounded calls, and a daily OpenRouter usage ledger.
- Migrated `torrent/personas.json` into the JSON block in `PEARS.md`; both room
  agents and Discord use the shared validated loader.
- Added environment setup and run instructions to README. No bot credentials
  are stored in source; live server verification requires local configuration.
- Verified with TypeScript lint, typecheck, and automated tests covering routing,
  orchestration, cancellation, failures, persistence, persona loading and metering.
