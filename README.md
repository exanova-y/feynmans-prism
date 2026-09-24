# feynman's prism

A distributed network of Feynmans churning on open research problems from
[Emergent Mind](https://www.emergentmind.com). Each *pear* is a peer in a
room that joins problems, chats, and (later) gets assigned fragments of the
research tree. Pears find each other over loopback and over a
[Tailscale](https://tailscale.com) tailnet (WireGuard). Looks like WebTorrent
but instead of movies there are open problems.

![](docs/torrent-peers.png)

## start a room in 30 seconds

Run every command below from the repository root. Needs Node.js ≥ 22.22 and
[pnpm](https://pnpm.io); allow extra time for the first dependency install.
No model API key, Python, or tmux is needed for a room.

**Terminal 1 — start room `lab` and join the credit-assignment problem:**

```bash
pnpm -C torrent install
pnpm -C torrent pear -- --room lab --auto-join credit-assignment
```

**Terminal 2 — join the same room on this machine:**

```bash
pnpm -C torrent pear -- --room lab --home .pears/lab/second --bridge 0 --auto-join credit-assignment
```

Expect the first pear to show `coordinator`, both to show one other peer, and
the credit-assignment problem to have one other participant. Press `enter` to
expand its subproblems. Keys: `j`/`k` move · `space` join/leave · `m` message ·
`q` quit (Ctrl-C also stops a pear).

On a **second machine**, install the dependencies and run Terminal 1's command
there instead. Both machines must be online on the same Tailscale/Headscale
network, use the same room name, and allow TCP ports `7100–7109` between them.
Check `tailscale status` if they do not connect. Add `--local` to keep a pear
on loopback; [invite setup](#joining-from-a-link) is below.

The first run writes your identity to `~/.feynman/identity.json`: a keypair and
a device name drawn at random from the DESIGN.md list (Nonacris, Eridanus,
Corinth…). A second pear on the same machine needs its own with `--home <dir>`.
The second command disables its browser bridge so the first pear keeps port 7300.

Rooms currently share chat, membership and a problem graph. Joining a problem
does not start research or donate CPU/GPU capacity. Automatic remote assignment
and contribution-based compute permissions are not implemented.

Next: [show the tree in a browser](#show-the-tree-in-a-browser) ·
[run chunking and research](#chunking-and-research) ·
[verify a run or the software](#verification) ·
[start several pears](#start-several-pears).

## show the tree in a browser

The **research tree viewer** displays paper arguments, dependencies, open
questions, source passages and review verdicts. A fresh clone has no saved
database: [create a research run first](#chunking-and-research). With a saved run:

```bash
node tools/research/cli.mjs view \
  --db tools/outputs/credit-assignment.sqlite \
  --out tools/outputs/credit-assignment.view.html
```

Open `tools/outputs/credit-assignment.view.html` in your browser (double-click
the file), or use the command for your desktop:

```bash
open tools/outputs/credit-assignment.view.html      # macOS
xdg-open tools/outputs/credit-assignment.view.html  # Linux desktop
```

The HTML is self-contained: viewing needs no server, API key or model call.
Click a node to inspect its source and review. Regenerate the HTML after changing
the database. Saved databases are ignored by git and **are not included in a
fresh clone**; create one with the next section first. If you have the earlier
`credit-assignment-passages.sqlite` run, substitute that path after `--db`.

For the **live room graph as islands**, leave Terminal 1 running and open a
third terminal:

```bash
pnpm -C site install
pnpm -C site dev
```

Open the URL Vite prints (normally http://localhost:5173). The game reads the
pear's bridge at `http://127.0.0.1:7300`; press `M` for the map. This shows the
room's seeded subproblems and peer updates. The research viewer and room graph
use separate databases; research runs are not automatically imported into rooms.

## chunking and research

This executor turns one question into a source-backed tree. It needs an installed
Feynman runtime and configured provider credentials, in addition to Node.js.
`torrent/.env.local` is for pear agents; this executor uses Feynman's model
authentication. See [runtime setup and options](tools/research/README.md).

**Check setup** — replace the path with your Feynman app directory containing
`package.json` and `node_modules`:

```bash
export FEYNMAN_RUNTIME_ROOT=/absolute/path/to/feynman/app
node tools/research/cli.mjs doctor
```

`doctor` lists configured providers and model IDs without making a model call.
Use a provider/model from that output in the command below.

**Create a new tree** — this retrieves papers and makes billable model calls;
it can take several minutes:

```bash
node tools/research/cli.mjs run \
  --db tools/outputs/credit-assignment.sqlite \
  --provider openrouter --model anthropic/claude-haiku-4.5 \
  --question-file graphs/corpus/open-problems-sept-11 --question-line 1 \
  --task-file graphs/corpus/feynman-prompt.md \
  --retrieval public --policy aco \
  --max-sources 4 --max-model-calls 8 --max-tokens 80000 \
  --max-input-chars 18000 --max-elapsed-ms 900000
```

Change `--question-line` to select another problem. Use a new database path for
each new run. To continue an existing run with its saved configuration:

```bash
node tools/research/cli.mjs resume --db tools/outputs/credit-assignment.sqlite
```

The implemented chunking and scheduling steps are:

1. Fetch paper text and retain its source snapshot and hash.
2. Split it into 1,000-character windows, advancing 800 characters each time
   (200-character overlap; offsets use UTF-16 code units). Keep the first window,
   then prioritize question-word matches and discussion/conclusion/limitation
   passages within `--max-input-chars`.
3. Ask the model to extract assumptions, conclusions, dependencies and open
   questions, each linked to a supplied passage. A separate model call reviews
   the extracted claims against those passages.
4. Ant colony optimization (`--policy aco`) selects the next eligible
   search/fetch/extract/verify/follow action. Reviewed evidence reinforces the
   traversed action paths. `--policy greedy` selects by the fixed heuristic
   instead; compare policies using separate runs.

Code: [passage selection and extraction](tools/research/evidence.mjs),
[scheduler](tools/research/scheduler.mjs). This runs in one process; the ants
are local path simulations. It does not dispatch chunks to room peers.
The configured budgets bound this executor's work; they are not a dollar cap.

## verification

**Inspect a research run** — these commands read saved results without model calls:

```bash
node tools/research/cli.mjs status --db tools/outputs/credit-assignment.sqlite
node tools/research/cli.mjs tree --db tools/outputs/credit-assignment.sqlite
node tools/research/cli.mjs answer --db tools/outputs/credit-assignment.sqlite
```

Check `status` for failures, reviewed sources, reported tokens and tokens reserved
for calls whose usage is unknown. In the browser tree, inspect each claim's exact
passage, dependency links and `supported` / `unsupported` / `uncertain` verdict.
Source offsets and graph structure are checked deterministically; semantic review
is a fallible model judgment, not proof that the research problem is solved.
In rooms, `fragment-submit` marks a node solved immediately; it does not invoke
this evidence-review pipeline.

**Check the software** — no model credentials or paid calls needed:

```bash
pnpm -C torrent check                         # lint, typecheck, peer/protocol tests
node --test tests/research-tree.test.mjs      # chunking/evidence, budgets, recovery, viewer
pnpm -C site install
pnpm -C site build                           # typecheck and build the browser game
uv sync                                     # Python tools; requires uv and Python >= 3.13
uv run python -m unittest discover -s tests   # corpus/policy tests
```

**Room smoke test:** with the two quick-start pears running, use a third terminal:

```bash
pnpm -C torrent message -- "hello from the smoke test" --room lab
```

Both feeds should show the message. Quit the coordinator with `q`: the remaining
pear should become coordinator. Quit it too. For a cross-machine check, repeat
with one pear on each machine on the same tailnet.

Last local audit (2026-09-24): torrent lint/typecheck passed; 60/61 torrent tests
passed (one Discord worker-failure test failed); research-tree tests passed 19/19;
site build passed. Python tests passed 4/7, with three errors from the missing
`graphs/corpus_ingest/rwx.md`. Two-process room discovery, chat and coordinator
failover passed. Cross-machine operation remains unverified in this checkout.

## joining from a link

Someone on the network sends you an invite code; on any laptop:

```bash
curl -fsSL https://adiabatic.garden/join | sh -s -- feynman:adiabatic.garden:<inviter>:<key>
```

That installs Tailscale if needed, clones this repo into `~/.feynman/prism`,
logs the machine into the feynman tailnet with the invite's single-use key,
asks for a username, records who invited you, and starts the pear. On a
checkout you already have, `pnpm -C torrent join -- --invite <code>` does the
same from step two. Without an invite, `pnpm -C torrent join` just sets the
username and launches; pears then only meet over loopback or a tailnet you are
already on.

To invite someone, put `HEADSCALE_URL` and `HEADSCALE_API_KEY` in
`torrent/.env.local` (see hosting below) and run
`pnpm -C torrent invite -- --user <their name>`; without `--user` the key is
for another device of your own. If `tailscale` is
running, pears on every online device of your tailnet see each other too;
`--local` keeps a pear on loopback.

## start several pears

For several interactive peers on one machine, install `tmux` (for example,
`brew install tmux` on macOS or `sudo apt install tmux` on Ubuntu), then:

```bash
pnpm -C torrent orchestrator -- 3 --room lab --join
tmux attach -t pears-lab                           # reconnect after detaching
pnpm -C torrent orchestrator -- stop --room lab     # from another terminal
```

Ctrl+B then D detaches and leaves the room running. `--join` selects a problem
for each pear. On macOS, `--terminal` opens separate Terminal windows instead.

For **model conversations**, set `OPENROUTER_API_KEY` in `torrent/.env.local`
or use your saved opencode login. Then start DeepSeek pears (requires `just`
and `tmux`; assignments make billable model calls):

```bash
just pears 3 lab          # start or reopen 3 pears in room lab
just pears-attach lab     # reconnect
just pears-restart 5 lab  # restart with 5 pears; clears conversation histories
just pears-stop lab      # stop the room
```

`just pears` defaults to 3 pears in `manual-pears`. Click a pane, type its problem,
and press Enter; subsequent lines are follow-ups. Ctrl+B then D leaves the room
running. Larger groups use up to four panes per tmux window; click the window
name in the bottom bar to switch. Pears wait for manual assignments and ignore
room chat. `PEAR_MODEL` optionally selects another `deepseek/` model. These
personas have no browsing or experiment tools; use the research executor above
for paper retrieval and evidence review.

## all commands

Run from the repo root. Room commands take `--room <name>` to select a room.

| Command | What it does |
| --- | --- |
| `pnpm -C torrent pear -- [--room r] [--name n \| --index i] [--auto-join id] [--coordinator] [--local] [--home dir] [--bridge 7300]` | one pear (Ink TUI; headless when stdin is not a TTY). `--bridge` is the loopback port the browser game reads the room from; `0` disables |
| `pnpm -C torrent orchestrator -- [N=5] [--room r] [--join] [--terminal]` | start N pears in a tmux session (`--terminal`: macOS Terminal windows); pear #i keeps its identity in `torrent/.pears/<room>/<i>` |
| `pnpm -C torrent orchestrator -- stop [--room r]` | kill the tmux session; every pear closes its sockets |
| `pnpm -C torrent join -- [--invite code] [--home dir] [--room r] [--no-launch]` | one-time setup: tailnet login with the invite, username, then the pear |
| `pnpm -C torrent invite -- [--user name] [--hours 24]` | mint an invite code (single-use Headscale pre-auth key); needs `HEADSCALE_URL`/`HEADSCALE_API_KEY` |
| `pnpm -C torrent message -- "hi" [--room r] [--as name] [--listen 12]` | one-shot message, listen for replies, exit |
| `pnpm -C torrent transcript -- [--room r] [--every 30]` | record chat to `torrent/snapshots/<room>-<time>.md`; stdin lines are sent as `[scribe]` |
| `pnpm -C torrent agent -- <persona> [--room r]` | LLM persona pear; persona ids are the keys of the JSON block in `PEARS.md`. Needs `OPENROUTER_API_KEY` (or an opencode login); `PEAR_MODEL` overrides the model |
| `pnpm -C torrent discord` | Discord program chair with direct persona conversations and bounded delegation; setup below. Still on Hyperswarm, so it does not see pear rooms until it is ported |
| `pnpm -C torrent discord:costs [YYYY-MM-DD]` | reported OpenRouter usage and costs for a UTC day; defaults to today |
| `pnpm -C torrent room` / `node torrent/scripts/guillefix.cjs <room>` | the original Hyperswarm stdin chat client (legacy; not in pear rooms any more) |
| `pnpm -C torrent fragment-submit -- <problemId> <subproblemId> "<content>" [--spawns "q \|\| q"] [--room r]` | solve a subproblem; `--spawns` lists the subproblems it uncovered, which the coordinator adds under the solved node |
| `pnpm -C torrent fragment-velocity -- <fragmentId> <factor> [--room r]` | report downstream speedup; the roads into that node are reinforced (or dropped when the factor stays below 1) |
| `pnpm -C torrent propose -- <problemId> "<text>" [--parent q3] [--room r]` | propose a subproblem; it waits in the coordinator's review queue |
| `pnpm -C torrent review -- [--approve all\|1,2] [--reject 3] [--room r]` | list the queue, or settle a batch of it |
| `pnpm -C torrent check` | `lint` (oxlint + prettier) · `typecheck` · `test` |
| `pnpm -C site dev` · `pnpm -C site build` · `pnpm -C site lint` | Changing Shores, the low-poly Three.js game and visuals site ([site/README.md](site/README.md)) |
| `uv sync` | Python deps for `graphs/` and `tools/` |
| `uv run helm-mirror run` | evaluate feynman research runs, HELM-style ([design](tools/helm_mirror/design.md)) |
| `just ingest` | gate: paper dumps → postgres `papers` table (needs `DATABASE_URL`) |
| `just policy "focused ultrasound"` | rwx-policy: probability distribution over papers + rwx decimals |
| `just run "focused ultrasound"` | ingest, then policy |
| `just test` · `just lint` | Python unittest · ruff |
| `node tools/research/cli.mjs --help` | one-question SQLite research tree ([docs](tools/research/README.md)) |
| `node tools/research/cli.mjs tree --db tools/outputs/credit-assignment.sqlite` | inspect the saved tree generated by the research command above |

Postgres for the gate: `export DATABASE_URL="postgresql://postgres@localhost:5432/propagate"`
(a local brew postgres with trust auth works).

## Discord program chair

The application being onboarded is recorded in [discord.md](discord.md). The
runtime uses the authenticated bot's Discord ID, so changing its display name
does not require changing the router. Its research role is the program chair.

1. Copy `torrent/.env.example` to `torrent/.env.local`, which is ignored by git.
   Set `DISCORD_BOT_TOKEN` from the application's **Bot** page,
   `OPENROUTER_API_KEY`, `PEAR_MODEL` to an available OpenRouter model ID, and
   `DISCORD_CHANNEL_ID` to a server text channel's ID. Discord Developer Mode
   exposes **Copy Channel ID**. An application ID is not a channel ID or token.
2. Give the bot **View Channel**, **Send Messages**, **Read Message History**,
   **Create Public Threads**, and **Send Messages in Threads** in that channel.
   Startup checks the effective permissions, including channel overrides.
3. Run one instance from the repository root:

   ```bash
   pnpm -C torrent discord
   ```

Select the bot's actual mention in Discord, then type a request:

```text
@your-bot investigate the credit assignment problem
@your-bot aman: propose a formal model
@your-bot gwern: critique Aman's assumptions
@your-bot chair: compare the two approaches
@your-bot status
@your-bot stop
```

New requests in the configured channel create a thread. Continue in that thread
to share its context; unrelated threads have separate histories. Follow-ups use
the last addressed persona; `chair:` switches back to orchestration (`noera:`
is also an alias). `representer:` and `compressor:` are available directly.
The bot posts labeled persona replies through a single Discord account.

By default every request needs a bot mention. For plain follow-ups such as
`aman: explain that bound` in existing bot threads, enable **Message Content
Intent** in the Discord Developer Portal and set `DISCORD_MESSAGE_CONTENT=1`.
See [Discord Gateway intents](https://docs.discord.com/developers/events/gateway).
The bot ignores other channels, bots, and webhook messages. Optional
`DISCORD_USER_IDS` restricts callers to comma-separated user IDs; otherwise
everyone who can participate in the configured channel can submit requests.

The chair creates a validated plan for Aman and Gwern, runs those two workers
concurrently, optionally calls Representer, and synthesizes one round. Each run
allows at most five model calls, each with a 1,200-token output limit and a
120-second request timeout. Input is bounded to 32,000 characters per call;
the output limit is not a total-token or dollar spending cap. Two conversations
can run at once, with one active run per thread. Busy requests receive a retry
message. `status` reports progress; the initiating user can `stop` a run or
`resume` its last request as a new run. Resuming can incur new charges.

Edit [PEARS.md](PEARS.md) to change personas, then restart. It is the shared
source for Discord and the Hyperswarm agent; the former `personas.json` has
been migrated there. The Discord workers are model conversations in one local
process. They do not yet browse papers, execute experiments, or dispatch to
remote Hyperswarm peers. Treat generated references as unverified.

Events and [OpenRouter-reported usage](https://openrouter.ai/docs/cookbook/administration/usage-accounting)
are appended under `torrent/snapshots/discord/`, with UTC daily ledgers and
conversation checkpoints every 30 seconds and at state changes. The logger
does not call a model automatically. Restarted active runs are marked interrupted;
send `resume` in their thread to start them again with saved context. Costs
missing from provider responses remain unknown. Cancellation stops local work,
but provider charges for interrupted requests may not appear in the ledger.
Use Ctrl-C to stop the process. Local transcript files are ignored by git.

Verification: `pnpm -C torrent check`. Live smoke: start the bot, mention it with
`aman: say hello`, check the new thread, then try a chair request, `status`, and
`stop`. Run `pnpm -C torrent discord:costs` to inspect reported usage.

## how the torrent works

There is no server and no DHT. Every pear listens on the first free port of
`7100–7109` and, on a backing-off schedule, dials every port of every host it
can see: loopback always, plus every online device of the tailnet when
`tailscale` is running (`tailscale status --json` is the tracker). The first
line on a connection is an id handshake carrying the pear's public key, its
room and its port; a pear in another room is dropped, and when two pears dial
each other both keep the connection the lower key opened. Inbound connections
are only accepted from loopback and Tailscale's own address ranges.

**Identity.** `~/.feynman/identity.json` holds an ed25519 seed and the device
name, both created on the first run (`--home` or `FEYNMAN_HOME` picks another
directory). The public key is the pear's id on the wire and will sign
contribution receipts. A corrupt file is refused rather than replaced.

**Naming.** Every pear names itself: the device name in its identity file,
drawn at random from DESIGN.md's list on the first run. When two pears meet
wearing the same name, the one that joined the room later re-rolls and saves
the new name; `--name`/`--index` pin a name that is never yielded. Names are
for humans — the wire identifies pears by public key.

**Coordinator.** One pear per room coordinates (it will own review routing and
assignment). It is the pear that has been in the room longest, ties broken by
key; every pear computes the same answer from the hellos it has seen, so there
is no election traffic. A pear that starts into an empty room coordinates
immediately; if the coordinator quits, the next most senior pear takes over.
The header shows who is coordinating.

**Messages.** Press `m`, type, `enter`. Messages go to every connected peer as a
plain line `[name] text` — the same format the upstream
[pear-to-pear](https://github.com/exanova-y/pear-to-pear) tools use, so a pear,
`message`, `transcript` and the LLM agents all share one room.
The pear's own control protocol (hellos, joins, renames) travels on the
same sockets as JSON lines prefixed with `U+001F`; every client skips those, so
humans only see chat.

**Orchestrator.** Pear #0 gets `--coordinator` so the room has one from t=0;
each pear keeps its own identity (and so its name) in `torrent/.pears/<room>/<i>`.
`--join` gives each pear a different problem. `stop` kills the tmux session,
which SIGHUPs every pear so it closes its sockets cleanly. Without tmux (or
with `--terminal`) it opens one macOS Terminal window per pear instead; quit
those with `q`.

**Problem graph.** The coordinator keeps every problem's subproblems, the
dependencies between them and the proposal queue in `<home>/graph.sqlite`
(`node:sqlite`, no native module) and broadcasts a snapshot of the problem
after each change; other pears render that snapshot, and a pear that takes
over as coordinator absorbs the last snapshot it saw before writing. The graph
is seeded once from `torrent/src/data.ts` (`q1…qN` per problem) and then grows
on its own. A submitted fragment marks its node solved, adds each `--spawns`
subproblem as a child that required it, and logs which open nodes it
unlocked. A velocity report multiplies the weight of every road into that
node by the factor; a road that decays below 0.05 is dropped, since a
dependency that never sped anything up was not one. Those two changes need no
one's approval. Human proposals (`p` in the TUI, `pnpm propose`) queue up
instead and are settled in batches (`r` as coordinator, `pnpm review`).
Expanding a problem shows the tree: `✓` solved, `○` ready, `·` blocked on an
open requirement.

**Islands.** The pear's loopback bridge (`--bridge`, port 7300) also serves
the research graph to the browser game in `site/`: `GET /world?problem=`,
`GET /research` (an event stream with every problem's world on connect and
after each change), `POST /explore` and `POST /walk`. `torrent/src/world.ts`
turns a snapshot into islands (nodes, shape hashed from the id, position from
a deterministic force layout), causeways (requires-edges), roads, trails and
shoals (pending proposals); the game scales it onto the sea southwest of
Arcadia. Walking from one island to another is a walk; three walks between
the same two wear a road in, which the layout then pulls closer. Explore
(sail off the map to search OpenAlex for new land) is served but the game
does not call it yet.

**Personas** are the JSON block in [PEARS.md](PEARS.md) (read at startup by the
LLM agents). The `stirrer` walks the problem list in `torrent/src/data.ts`, the
single source of truth for names and problems.

### hosting adiabatic.garden

The tailnet's control plane is [Headscale](https://github.com/juanfont/headscale)
behind Caddy, defined in `infra/headscale/` (Caddy also serves `/join`).
On a small VPS with ports 80 and 443 open and DNS for `adiabatic.garden`
pointing at it:

```bash
scp -r infra/headscale you@vps:feynman && ssh you@vps
cd feynman && docker compose up -d
docker compose exec headscale headscale users create <you>
docker compose exec headscale headscale apikeys create --expiration 90d   # → HEADSCALE_API_KEY
```

Back on your machine, set `HEADSCALE_URL=https://adiabatic.garden` and the API
key in `torrent/.env.local`, then `pnpm -C torrent invite -- --user <you>` and
run the printed `curl … | sh -s -- <code>` line on each of your devices. Every
device on the tailnet is visible to every pear; there is no other server. To
use another domain, change it in `Caddyfile`, `config.yaml` (`server_url`,
`dns.base_domain`) and `site/join.sh`.

### troubleshooting

- **`connecting` for a long time.** Loopback pears connect within a second;
  tailnet pears within one sweep (3 s, then backing off to 60 s). Check
  `tailscale status` shows the other device online, and that both pears use
  the same `--room`.
- **Two pears on one machine share a name or fight.** They share
  `~/.feynman/identity.json`; give the second one `--home <dir>`.
- **`EADDRINUSE`.** All ten ports `7100–7109` are taken: `pgrep -fl pear.tsx`
  finds leftover pears. Pears close their sockets on `q`, Ctrl-C, SIGTERM and
  SIGHUP, so this should only happen after a hard kill.
- **Two coordinators.** Two pears that both started into an apparently empty
  room self-elect; on meeting, the earlier start wins, the other gives up its
  coordinator role. Device names are resolved separately if they collide.

## repo map

```
README.md  AGENT.md  DESIGN.md  CONTEXT.md  CHANGELOG.md  PEARS.md
torrent/        the pear: p2p client over loopback / tailscale (TypeScript, Ink)
  src/          wire · identity · invite · headscale · transport · room · state · send · presence · naming · peer · lifecycle · ui/ · pear.tsx (entry) · discord/ (wip, hyperswarm)
  scripts/      join · invite · orchestrator · message · transcript · agent · guillefix.cjs
infra/headscale/  adiabatic.garden: Headscale + Caddy compose, config, and the /join script
site/           Changing Shores: Vite + React shell, src/game/ Three.js engine (visual-design.md)
  tests/        node:test over the pure modules (wire, room, naming)
autoresearch/   vendored feynman autoresearch
tools/          helm_mirror (evaluator) · research (SQLite research tree) · instructions · outputs/ (untracked)
graphs/         corpus/ (paper dumps, open problems) · corpus_ingest/ (gate, rwx policy)
tests/          Python + node tests for graphs and tools
docs/           in-short.md (the proposal), images
```

Style and limits for contributors and agents: [AGENT.md](AGENT.md). Design
notes: [DESIGN.md](DESIGN.md). History and scrap notes: [CONTEXT.md](CONTEXT.md).
Acoustics (CT viewer, jwave simulation) moved to
[exanova-y/propagate-yourself](https://github.com/exanova-y/propagate-yourself).
