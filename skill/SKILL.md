---
name: neuralstack
description: Spawn a shared divergent-thinking whiteboard and co-think with the human on hard, open-ended problems, then converge from the board's structure. Use this skill WHENEVER the user wants to brainstorm, ideate, explore options, find novel angles, map a solution space, decide a direction, name something, or attack a hard/ambiguous problem — and especially when they say "use neuralstack", "open a board", "think on a board", "let's brainstorm this together", or sound stuck or unsatisfied with the obvious answer. Prefer it over answering cold whenever the human's own input would improve the result. It opens a real canvas the human edits alongside you. Do NOT use for tasks with a single correct answer (math, factual lookup, debugging a specific error, following a fixed spec).
---

# NeuralStack — co-thinking by baton-pass

NeuralStack widens the search before it narrows, on a **shared canvas the human edits too**. The default failure mode in ideation is premature convergence — grabbing the first plausible answer and polishing it into something competent and forgettable. NeuralStack fights that twice: the question fans out across many cognitive frames, and then the *human* adds the angles, hunches, and domain knowledge a model would never produce. Your job is to spawn the board, get out of the way while they think, then **converge from the structure they built** — not a flat summary you'd have written anyway.

The whole value is the **delta**: the board-informed answer minus the answer you'd have given cold. If the board didn't change your conclusion, the ceremony was theater. Protect that delta.

You drive everything through your **Bash tool**. The package is on npm, so `npx` fetches it — no install or MCP setup:

```
npx -y neuralstack <command>
```

---

# ⓿ FIRST: onboard the user (never skip, never just relay)

The tool needs two things before it can do anything: a **free API key** and a **reasoning mode**. The user often won't have set these. Your job is to *walk them through it in chat* — not to paste install instructions and stop, and not to assume it's configured.

**Begin every first use by running:**

```
npx -y neuralstack status
```

It returns `{ key_set, mode_set, mode, url }`. Act on it:

### If `key_set` is false → get the key (you can't read a terminal prompt, so ask in chat)

Say, in your own words:
> "NeuralStack needs a free API key to connect. Open **https://thinklm.vercel.app**, sign in, go to **Settings → API key → Generate**, and paste the `tlm_…` key here."

Wait for them to paste it. Then run `npx -y neuralstack login <their_key>`. Never invent a key — it only exists on that site.

### If `mode_set` is false → let them choose who does the thinking

Ask, clearly laying out the trade:
> "How do you want the divergent reasoning done?
> **1) Frontier (your own agent)** — *I* do the reasoning myself using your current Claude/Codex seat. Frontier-model quality, and it draws on the quota you already pay for (no separate bill).
> **2) Default (NeuralStack hosted)** — NeuralStack's own hosted models do it on its free quota. Zero cost to you, solid quality."

On their answer: `npx -y neuralstack mode byom` (frontier) or `npx -y neuralstack mode hosted` (default).

Only once **both** `key_set` and `mode_set` are true do you proceed. They can switch later anytime — "use my own model" → `mode byom`; "use the default" → `mode hosted`.

> Why this gate matters: a board spawned without a key just errors, and silently defaulting the mode robs the user of the frontier option they're entitled to. Doing this once, conversationally, up front is what makes the rest feel like magic.

---

# The co-thinking loop

Three phases. Keep them separate — mixing divergence and convergence strangles idea quality, and one whole phase belongs to the human.

### 1 · Decide it's worth a board
Spawn one only for open-ended / multi-unknown / novelty-seeking problems where the human's input changes the answer. For a closed question, just answer — don't spawn a board for ceremony.

### 2 · Diverge (depends on `mode`, which `create` prints)
```
npx -y neuralstack create "<the question, sharpened>"
```
Parse the JSON: `{ id, mode, preview_url }`.

- **hosted** → nothing more to do; the board fans out on its own.
- **byom (frontier)** → *you* generate the branches. Pick ~6 of the frames below (always include at least one wild lens). For each: reason ~4–6 concrete, specific sentences **strictly inside that lens**, pushing past the obvious take (assume the obvious one is already taken by another branch), then distill a 1–2 line summary. Push each:
  ```
  npx -y neuralstack add <id> --frame "<Frame>" --summary "<one-liner>" --full "<reasoning>"
  ```
  When all branches are in, run `npx -y neuralstack score <id>` so the **cloud critic** clusters, scores, and flags traps — keeping board structure consistent regardless of which model diverged.

### 3 · Hand off — the human diverges (the reason this exists)
Give them the `preview_url` verbatim and invite them in:
> "I've opened a NeuralStack board — open this link, it's already fanning out. Add your own angles, drag, branch off anything that sparks, prune what's stale, and say 'done' when you're finished."

Then **wait**. Do **not** pre-empt with your own answer; their divergence is your raw material, and answering early throws it away.

### 4 · Read it back, then converge
When they say "done":
```
npx -y neuralstack board <id>     # (or: wait <id> — may print NOT_READY_YET, just call again)
```
Then write a real answer and put it back on the canvas:
```
npx -y neuralstack answer <id> "<your converged answer>"
```
Present the answer in chat too.

---

# Reading the board: structure, not just text

A prompt gives you words; a board gives you *shape*. Attend to what a flat list can't encode:

- **The tree** — which angle branched from which. Lineage shows what the human was chasing.
- **Clusters** — the critic's grouping by underlying angle. The clusters *are* the map of the space.
- **SURVIVOR** leaves — highest-signal, kept. Start here.
- **TRAP** flags — attractive-but-flawed. Name them so you don't recommend one.
- **The non-obvious-but-viable pick** and the open **provocation** — the critic's "interesting, not safe" nominations.
- **Anything the human added** — their hunches and domain knowledge are the part you could not have generated. Weight it heavily.

# Frames for BYOM divergence (each re-asks the question from one distorted lens)

- **First principles** — strip to fundamentals, rebuild only from primitives.
- **Red team** — attack the claim until it breaks; then ask what must be true for it to survive.
- **Empirical** — the cleanest experiment/observable that would settle it.
- **Second-order** — the effects of the effects: incentives, feedback loops, unintended consequences.
- **Inversion** — guarantee the OPPOSITE outcome, then negate each finding into an insight.
- **Constraints** — the binding physical/economic/information limits that dictate the shape.
- **Historical analogue** — the closest prior art in any field, and where the analogy breaks.
- **Biological mechanism** *(wild)* — transplant a living-systems mechanism (immune response, plasticity, selection).
- **Market lens** — the buyers, sellers, and price-setters of the scarce thing here.
- **Naive outsider** *(wild)* — the unencumbered approach; which "obvious" conventions are unjustified.
- **Remove the assumption** *(wild)* — delete the one load-bearing premise; reason in that world.
- **Extreme scale** *(wild)* — push the central quantity to a limit; what new regime emerges.

# Output shape (the converge)

1. **Brief** — one or two lines naming the problem and any reframe, then get to it.
2. **What the board surfaced** — the shape of the space: the clusters with the surviving insights pulled out. Make the structure visible, not just the leaves.
3. **The converge** — the 2–4 most promising directions, *why*, the single most interesting non-obvious one named explicitly, and any trap flagged.
4. **One provocation** — a wild-card or open question so the human has somewhere to push if nothing landed.

Resist polishing every branch to the same finish. Range plus a real position beats a uniform wall of prose.

# Calibration

- **Spawn vs. answer cold.** A board costs the human time. Spawn when their input genuinely changes the answer; otherwise just answer, and say which you're doing.
- **Waiting.** Don't rush them, don't vanish. Wait on their "done"; if you must actively block, use `wait`.
- **Weirdness.** Read the room — serious strategy work keeps wild cards clearly flagged; explicit play runs looser. Absurd ideas earn their place by seeding viable ones; say so rather than presenting a joke as a recommendation.

# Anti-patterns

- **Skipping onboarding / just relaying install text.** If you only paste "next steps" and stop, the user is stranded. Run `status` and actively walk them through key + mode.
- **Pre-empting the human.** Answering before they've finished diverging defeats the baton-pass. Wait.
- **Converging from the summary, not the structure.** Ignoring the tree/clusters/traps and paraphrasing the leaves throws away what the board was for.
- **Convergence disguised as divergence.** If every branch shares one assumption, the space was decorated, not explored.
- **Refusing to commit.** After reading the board, take a position. "Here are the ideas, you decide" is a cop-out.
- **Faking the delta.** If the board didn't beat the cold answer, say so plainly. Honesty about when it *didn't* help is what makes it trustworthy when it does.

# Command reference

| command | purpose |
|---|---|
| `npx -y neuralstack status` | `{ key_set, mode_set, mode, url }` — run this first |
| `npx -y neuralstack login <tlm_key>` | save the user's API key (once per machine) |
| `npx -y neuralstack mode [hosted\|byom]` | read or set who reasons (default vs frontier) |
| `npx -y neuralstack create "<topic>"` | spawn a board → `{ id, mode, preview_url }` |
| `npx -y neuralstack add <id> --frame "X" --summary "…" --full "…"` | push an agent-generated branch (byom) |
| `npx -y neuralstack score <id>` | run the cloud critic over the branches |
| `npx -y neuralstack board <id>` | print the board (tree + survivors + verdict) |
| `npx -y neuralstack wait <id>` | poll until the human marks it ready |
| `npx -y neuralstack answer <id> "<text>"` | write the converged answer back to the canvas |
