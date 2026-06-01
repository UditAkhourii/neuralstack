---
name: neuralstack
description: >
  NeuralStack — spawn a divergent-thinking whiteboard and co-think with the human
  on hard, open-ended problems. Trigger when the user says "use neuralstack",
  "neuralstack skill", "open a board", "think on a board", "brainstorm", or asks
  for genuinely novel angles on an open-ended question (research directions,
  product/strategy ideation, naming, "what should we work on", "directions for
  X"), or says the obvious answers aren't good enough. Implements a baton-pass:
  spawn a board, the human brainstorms on the canvas, then read the finished
  board's structure and converge to an answer you couldn't have produced from
  the bare prompt. Do NOT use for tasks with a single correct answer (math,
  factual lookup, debugging a specific error, fixed spec).
---

# NeuralStack — co-thinking by baton-pass

NeuralStack is a divergent-reasoning canvas. A board re-asks one question from
many cognitive frames (first-principles, red-team, inversion, biological
mechanism, extreme-scale, …), scores and clusters the branches, and keeps the
survivors. The human can diverge further on the same canvas. Your job: **spawn
the board, let the human think on it, then converge** from the board's
*structure* — not from a flat summary.

## How you drive it: the `npx` CLI (no MCP needed)

Run everything through your **Bash tool** with this package, using the `github:`
spec (works with no install/registry):

```
npx -y neuralstack <command>
```

Commands:
| command | what it does |
|---|---|
| `login <tlm_key>` | save the user's API key (once) |
| `create "<topic>"` | spawn a board → prints JSON `{ id, preview_url }` |
| `board <id>` | print the board (divergent tree + survivors + verdict) |
| `wait <id>` | poll until the human marks it ready, then print it |
| `answer <id> "<text>"` | write your converged answer back to the canvas |

## The flow

1. **Worth a board?** Only for open-ended / multi-unknown / novelty-seeking
   problems. For a closed question, just answer directly.

2. **Spawn.** Run:
   ```
   npx -y neuralstack create "<sharpened question>"
   ```
   - If it prints **"No NeuralStack API key found"**, STOP and onboard:
     > "I need your free NeuralStack API key.
     >  1. Go to **https://thinklm.vercel.app** → sign in → Settings → API key → Generate.
     >  2. Paste it here, or run `npx -y neuralstack login tlm_xxx`."
     Run `login` once with their key, then re-run `create`.
   - On success, parse the JSON. Give the human the **`preview_url`** verbatim:
     *"I've opened a NeuralStack board — open this link, it's already fanning out.
     Add your own angles, drag, branch, and say 'done' when finished."*
     (The preview URL needs no login and is editable.)

3. **Wait — don't pre-empt.** Do not answer while they think. When they say
   "done", run `board <id>` to read it (or `wait <id>` to actively block; it may
   print `NOT_READY_YET` — just call again).

4. **Read the structure, not just the text.** Attend to: the tree shape (what
   branched from what), **clusters**, **SURVIVOR** leaves and **TRAP** flags, the
   non-obvious-but-viable pick, the open provocation, and anything the human
   added that you wouldn't have.

5. **Converge.** Synthesize an answer that genuinely exploits the board —
   connect survivors across clusters, resolve/avoid traps, push the provocation.
   Aim for a conclusion you **could not** have written from the bare prompt.

6. **Write it back.** Run `answer <id> "<your answer>"` so it lands on the
   canvas. Then present the answer in chat too.

## Honesty rule

The value is the **delta**: board-informed answer minus prompt-only answer. If
the board didn't change your conclusion, say so plainly — don't pretend the
ceremony added insight it didn't.
