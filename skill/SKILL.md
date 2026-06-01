---
name: neuralstack
description: Spawn a shared divergent-thinking whiteboard and co-think with the human on hard, open-ended problems — then converge from the board's structure. Use whenever the user wants brainstorming, ideation, "give me options," research directions, product/strategy angles, naming, ways to attack a hard problem, or says they're stuck or the obvious answers aren't good enough — AND a human-in-the-loop board would beat answering cold. Trigger on "use neuralstack", "open a board", "think on a board", "let's brainstorm this together". Unlike pure ideation, this opens a real canvas the human edits alongside you, and you converge from what they actually built. Do NOT use for tasks with a single correct answer (math, factual lookup, debugging a specific error, following a fixed spec).
---

# NeuralStack — co-thinking by baton-pass

NeuralStack widens the search before it narrows, and it does so on a **shared canvas the human edits too**. The default failure mode in ideation is premature convergence — latching onto the first plausible answer and polishing it into something competent and forgettable. NeuralStack fights that twice: the engine fans the question out across many cognitive frames, and then the *human* adds the angles, hunches, and domain knowledge a model would never produce. Your job is to spawn that board, get out of the way while they think, and then **converge from the structure they built** — not from a flat summary you'd have written anyway.

The value of this skill is a single quantity: the **delta** between the board-informed answer and the answer you'd have given cold. If the board didn't change your conclusion, the ceremony was theater. Protect that delta — it's the whole point.

## What you drive

Everything runs through your **Bash tool**. The package is on npm — `npx` fetches it automatically, no install or MCP setup:

```
npx -y neuralstack <command>
```

| command | what it does |
|---|---|
| `login <tlm_key>` | save the user's API key (once per machine) |
| `create "<topic>"` | spawn a board → prints JSON `{ id, preview_url }` |
| `board <id>` | print the board: divergent tree + surviving insights + critic verdict |
| `wait <id>` | poll until the human marks the board ready, then print it |
| `answer <id> "<text>"` | write your converged answer back onto the canvas |
| `add <id> --frame "X" --summary "…" --full "…"` | push an agent-generated branch (BYOM) |
| `score <id>` | run the cloud critic over the board's branches |
| `mode [hosted\|byom]` | read or set who does the reasoning |

## Two reasoning modes

`create` prints the current `mode`. Respect it:

- **`hosted` (default):** NeuralStack's own models do the divergence. You just `create` and hand over the link — the board fans out on its own. Zero setup.
- **`byom` (bring your own model):** **you** — the frontier model already running this session — do the divergent reasoning, then push each branch with `add`. The cloud still runs the **critic** (`score`) so structure stays consistent. This gives the user frontier-quality divergence on the seat they already pay for, no API cost.

The user can switch anytime: if they say "use my own model" / "use frontier" → run `npx -y neuralstack mode byom`; "use default" / "use hosted" → `npx -y neuralstack mode hosted`. Then proceed.

## The core loop

Three phases. Keep them separate — mixing divergence and convergence is what strangles idea quality, and here a whole phase belongs to the human.

**Phase 1 — Diverge (spawn, no judging).** Run `create "<sharpened question>"`. The engine fans the question out across cognitive frames (first-principles, red-team, inversion, biological mechanism, extreme-scale, market lens, naive outsider…), reasons each branch in isolation, and a critic clusters and scores them. You are *not* evaluating yet. Breadth is cheap; a missed idea is expensive.

**Phase 2 — Hand off (the human diverges).** This phase is theirs, and it is the reason to use NeuralStack at all. Give them the `preview_url` verbatim and invite them in: *"I've opened a NeuralStack board — open this link, it's already fanning out. Add your own angles, drag, branch off anything that sparks, prune what's stale, and say 'done' when you're finished."* Then **wait**. Do not pre-empt them with your own answer; their divergence is your raw material, and answering early throws it away.

**Phase 3 — Converge (select with judgment).** When they say "done", run `board <id>` (or `wait <id>`). Now bring the critic back: cluster, kill the dead branches, surface the few worth pursuing, name the trap. Then write a real answer with `answer <id> "…"`.

Divergence rewards "yes, and." Convergence rewards "no, because." The human owns the middle. Doing all three at once gives you none of them.

## Running it — the exact flow

1. **Worth a board?** Only for open-ended / multi-unknown / novelty-seeking problems where a human's input changes the answer. For a closed question, just answer directly — don't spawn a board for ceremony.
2. **Spawn.** `npx -y neuralstack create "<sharpened question>"`. Parse the JSON for `id`, `mode`, `preview_url`.
   - If it prints **"No NeuralStack API key found"**, stop and onboard: *"I need your free NeuralStack API key — get one at **https://thinklm.vercel.app** → Settings → API key → Generate, then paste it here."* Run `npx -y neuralstack login tlm_xxx` once, then re-run `create`.
3. **Diverge — depends on `mode`:**
   - **hosted:** nothing to do; the board fans out on its own.
   - **byom:** *you* generate the branches. Pick ~6 of the frames below (always include one wild lens). For each, reason ~4–6 concrete sentences **strictly in that lens**, pushing past the obvious, then distill a 1–2 line summary. Push each with:
     `npx -y neuralstack add <id> --frame "<Frame>" --summary "<one-liner>" --full "<reasoning>"`
     When all branches are in, run `npx -y neuralstack score <id>` so the cloud critic clusters/scores/flags traps.
4. **Hand off.** Give the human the `preview_url` verbatim: *"I've opened a NeuralStack board — open this link. Add your own angles, drag, branch, prune, and say 'done' when finished."* Then **wait** — do not pre-empt them.
5. **Wait — don't pre-empt.** When they say "done", read the board with `board <id>` (`wait` may print `NOT_READY_YET` — call it again).
6. **Converge and write back.** Synthesize from the structure, then `npx -y neuralstack answer <id> "<your answer>"`. Present the answer in chat too.

### Frames for BYOM divergence (each re-asks the question from one distorted lens)

- **First principles** — strip to fundamentals, rebuild only from primitives.
- **Red team** — attack the claim until it breaks; then ask what would have to be true for it to survive.
- **Empirical** — the cleanest experiment/observable that would settle it.
- **Second-order** — the effects of the effects; incentives, feedback loops, unintended consequences.
- **Inversion** — guarantee the OPPOSITE outcome, then negate each finding into an insight.
- **Constraints** — the binding physical/economic/information limits that dictate the shape.
- **Historical analogue** — the closest prior art in any field, and where the analogy breaks.
- **Biological mechanism** *(wild)* — transplant a living-systems mechanism (immune response, plasticity, selection) onto the problem.
- **Market lens** — buyers, sellers, price-setters of the scarce thing here.
- **Naive outsider** *(wild)* — the unencumbered approach; which "obvious" conventions are unjustified.
- **Remove the assumption** *(wild)* — delete the one load-bearing premise; reason in that world.
- **Extreme scale** *(wild)* — push the central quantity to a limit; what new regime emerges.

## Reading the board: structure, not just text

A chat prompt gives you words; a board gives you *shape*. When you read it back, attend to the structure — it encodes thinking a flat list can't:

- **The tree** — which angle branched from which. Lineage tells you what the human was chasing.
- **Clusters** — the critic groups branches by underlying angle. The clusters *are* the map of the solution space.
- **SURVIVOR** leaves — highest-signal, kept and deepened. Start here.
- **TRAP** flags — attractive-but-flawed. Name these explicitly so you don't recommend one.
- **The non-obvious-but-viable pick** and the open **provocation** — the critic's nominations for "interesting, not safe."
- **Anything the human added** — their hunches and domain knowledge are the part you could not have generated. Weight it.

## Techniques to force breadth

If the board comes back thin, or you're seeding angles for the human, push attention into corners it wouldn't naturally go. Pick a few; don't grind all of them.

- **Vary the frame.** Re-ask from radically different vantage points — a hardware person on a software problem, a regulator, a 10-year-old, a competitor trying to make it fail.
- **Cross-domain transplant.** Force-fit a mechanism from a distant field: immune systems, ant colonies, futures markets, speedrunning. Distant domains encode patterns that transplant surprisingly well.
- **Invert it.** Ask the opposite question, then negate the answers — inversion exposes assumptions the direct question hides.
- **Push to extremes.** The $0 version, the infinite-budget version, the 1-hour vs. 10-year version. Extremes break anchoring on the reasonable middle.
- **Remove the load-bearing assumption.** Name the thing treated as fixed; ask what's possible without it.
- **Recombine.** Take two unrelated survivors and ask what their hybrid looks like. Most genuinely novel ideas come from recombination.

## Output shape (the converge)

When you present the converged answer (and write it back with `answer`):

1. **Brief** — one or two lines naming the problem and any reframe, then get to it.
2. **What the board surfaced** — the shape of the space: the clusters, with the surviving insights pulled out. Make the structure visible, not just the leaves.
3. **The converge** — the 2–4 most promising directions, *why*, the single most interesting non-obvious one named explicitly, and any trap flagged.
4. **One provocation** — a wild-card or open question so the human has somewhere to push if nothing landed.

Resist polishing every branch to the same finish. The point is range plus a real position — not a uniform wall of prose.

## Calibration

- **When to spawn vs. answer cold.** A board costs the human time and attention. Spawn one when their input genuinely changes the answer; otherwise just answer. Be honest about which this is.
- **How long to wait.** Don't rush them and don't vanish. Wait on their "done"; if you must actively block, use `wait`.
- **How weird to go.** Read the room. Serious strategy work → keep wild cards clearly flagged. Explicit play → let it run looser. Absurd ideas earn their place by seeding viable ones — say so rather than presenting a joke as a recommendation.

## Anti-patterns

- **Pre-empting the human.** Answering before they've finished diverging defeats the entire baton-pass. Wait.
- **Converging from the summary, not the structure.** If you ignore the tree/clusters/traps and just paraphrase the leaves, you've thrown away what the board was for.
- **Convergence disguised as divergence.** If every branch shares the same assumption, the space wasn't explored — it was decorated.
- **Refusing to commit.** After reading the board, take a position. "Here are the ideas, you decide" is a cop-out — converge with a real opinion.
- **Faking the delta.** If the board didn't improve on the cold answer, say so plainly. Honesty about when it *didn't* help is what makes it trustworthy when it does.
