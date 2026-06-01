# NeuralStack

**Divergent-thinking whiteboards for Claude.** NeuralStack lets Claude open a shared thinking board on a hard, open-ended problem, hand it to *you* to brainstorm on, then read the board's *structure* back and converge to an answer it couldn't have produced from the bare prompt.

Most AI ideation fails the same way: it converges too early — the first plausible answer, polished. NeuralStack fights that twice. The engine fans your question out across many cognitive frames (first-principles, red-team, inversion, biological mechanism, extreme-scale, market lens, naive outsider…), scores and clusters the branches, and keeps the survivors. Then **you** add the angles, hunches, and domain knowledge a model never would. Claude converges from what you actually built.

The whole value is the **delta**: the board-informed answer minus the answer you'd have gotten cold.

## The baton-pass

```
You ask Claude → Claude spawns a board → you get a live link
       → the board auto-diverges across frames
       → you brainstorm on the canvas (add, branch, prune)
       → you say "done"
       → Claude reads the board's structure and converges
```

Human and model never edit at the same time — it's a relay, not a shared mouse.

## Install (one command — skill-only, no MCP, no per-client config)

Tell Claude (or any agent with a shell) to run:

```bash
npx -y neuralstack@latest install-skill
```

That installs the `neuralstack` skill into `~/.claude/skills/` **and** prints instructions that walk the agent through finishing setup with you, right there in chat:

1. **API key** — Claude points you to **https://thinklm.vercel.app** (sign in → Settings → API key → Generate); you paste the `tlm_…` key and it runs `login` for you.
2. **Mode** — Claude asks how you want to think:
   - **Frontier** — the agent itself reasons, on your own Claude/Codex quota (frontier quality, no separate bill)
   - **Default** — NeuralStack's free hosted models
3. Done. Say *"use neuralstack to brainstorm X"* and it spawns a board.

> Prefer to set it up by hand? `npx -y neuralstack login tlm_xxx` then `npx -y neuralstack mode hosted|byom`.

## How Claude drives it (the CLI)

| command | what it does |
|---|---|
| `npx -y neuralstack status` | `{ key_set, mode_set, mode, url }` |
| `npx -y neuralstack login <tlm_key>` | save your API key (once per machine) |
| `npx -y neuralstack mode [hosted\|byom]` | read/set who reasons: hosted (NeuralStack) or byom (your agent) |
| `npx -y neuralstack create "<topic>"` | spawn a board → prints `{ id, mode, preview_url }` |
| `npx -y neuralstack add <id> --frame "X" --summary "…" --full "…"` | push an agent-generated branch (byom) |
| `npx -y neuralstack score <id>` | run the cloud critic over the branches |
| `npx -y neuralstack board <id>` | print the board: tree + surviving insights + critic verdict |
| `npx -y neuralstack wait <id>` | poll until you mark the board ready, then print it |
| `npx -y neuralstack answer <id> "<text>"` | write the converged answer back onto the canvas |

`NEURALSTACK_API_URL` defaults to the cloud; set it to `http://localhost:3100` for local development. The key resolves from `--key` → `$NEURALSTACK_TOKEN` → `~/.neuralstack/config.json`.

## What makes a board different from a chat

A prompt gives Claude words. A board gives it *shape* — which angle branched from which, what the critic clustered together, which leaves **survived** vs. got flagged as **traps**, the non-obvious-but-viable pick, the open provocation, and everything you added by hand. That structure is the raw material Claude converges from, and it's what a flat summary throws away.

## Links

- Web: https://thinklm.vercel.app
- Source: https://github.com/UditAkhourii/neuralstack
- npm: https://www.npmjs.com/package/neuralstack

MIT licensed.
