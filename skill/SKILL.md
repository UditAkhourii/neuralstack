---
name: neuralstack
description: >
  NeuralStack — spawn a divergent-thinking whiteboard and co-think with the human
  on hard, open-ended problems. Trigger when the user says "use neuralstack",
  "neuralstack skill", "open a board", "think on a board", "brainstorm", or asks
  for genuinely novel angles on an open-ended question (research directions,
  product/strategy ideation, naming, "what should we work on", "directions for
  X"), or says the obvious answers aren't good enough. Implements a baton-pass:
  Claude spawns a NeuralStack board, the human brainstorms on the canvas, then
  Claude reads the finished board's structure and converges to an answer it could
  not have produced from the bare prompt. Do NOT use for tasks with a single
  correct answer (math, factual lookup, debugging a specific error, fixed spec).
---

# NeuralStack — co-thinking by baton-pass

NeuralStack is a divergent-reasoning canvas. A board re-asks one question from
many cognitive frames (first-principles, red-team, inversion, biological
mechanism, extreme-scale, …), scores and clusters the branches, and keeps the
survivors. The human can diverge further on the same canvas. Your job is to
**spawn the board, let the human think on it, then converge** from the board's
*structure* — not from a flat summary.

## First-time setup — get the NeuralStack API key

This skill drives the `thinklm` MCP server (the NeuralStack server), which needs
a **NeuralStack API key** to act on the user's account.

**Before anything else, check whether it's configured.** Attempt `create_board`
on a tiny throwaway topic. If the `thinklm`/NeuralStack tools are missing, or the
call returns an auth error (401 / "invalid or missing agent token"), the key
isn't set up. STOP and onboard the user:

> "To use NeuralStack thinking boards I need your NeuralStack API key.
>  1. Go to **https://thinklm.vercel.app** and sign in (or sign up).
>  2. Open **Settings → API key → Generate** and copy the fresh `tlm_…` key.
>  3. Paste it here, or set it as `THINKLM_TOKEN` in your MCP config."

When the user pastes a key, retry `create_board` to confirm it works. Tell them
the durable fix is to set it in their MCP config so they don't paste it again:

```json
{ "mcpServers": { "thinklm": {
  "command": "node", "args": ["<path>/mcp/server.js"],
  "env": { "THINKLM_API_URL": "https://thinklm.vercel.app", "THINKLM_TOKEN": "tlm_…" }
}}}
```

Never ask the user to invent a key — it can only be generated at
https://thinklm.vercel.app.

If the `thinklm` MCP server isn't installed at all, point the user to the
NeuralStack repo's `mcp/README.md` to register it, then stop.

## The baton-pass loop

1. **Decide it's worth a board.** Trigger only for open-ended / multi-unknown /
   novelty-seeking problems. For a closed question, just answer directly.

2. **Spawn the board.** Call `create_board` with a crisp topic (the user's
   question, sharpened). It returns a `preview_url` (carries a scoped ticket —
   no login, editable). If you only have an id, call `preview_url { id }`.

3. **Open it in the split-screen preview pane.** If preview tools
   (`preview_start`, `preview_eval`, …) are available, show the board *in the
   pane* — don't just paste a link:
   a. `preview_start { name: "neuralstack" }` — boots/attaches the NeuralStack
      dev server (port 3100) from `.claude/launch.json`. If launch.json or the
      config is missing, create it: runtimeExecutable `npm`, runtimeArgs
      `["run","dev"]`, port `3100`. (This only works when the session's working
      directory is the NeuralStack project so `npm run dev` launches the right
      app. If a *different* app is already bound to the preview, that's why you
      see the wrong page — start the `neuralstack` config explicitly.)
   b. Navigate the preview to the board: take the **path + query** of the
      `preview_url` (i.e. `/b/<id>?t=<ticket>`) and load it in the pane — e.g.
      `preview_eval` running `window.location.href = "/b/<id>?t=<ticket>"`.
   c. Tell the user plainly: *"See the preview — I've spawned a board and it's
      already fanning out. Add your own angles, drag, branch, and say 'done'
      when finished."*
   If preview tools are NOT available, fall back: hand over the `preview_url`
   verbatim for them to open in a browser. The board **auto-diverges on open**
   either way — they don't press anything.

4. **Wait — do not pre-empt.** Call `wait_for_board` with the id. It blocks until
   the human marks the board ready. Do **not** answer while they think; their
   divergence is the raw material.

5. **Read the structure, not just the text.** Attend to:
   - the **tree shape** — which angle branched from which;
   - **clusters** the critic grouped;
   - **SURVIVOR** leaves (highest-signal) and **TRAP** flags (attractive-but-flawed);
   - the **non-obvious-but-viable** pick and the open **provocation**;
   - anything the human added that the model wouldn't have.

6. **Converge.** Synthesize an answer that genuinely exploits the board: connect
   surviving insights across clusters, resolve/avoid the traps, push on the
   provocation. Aim for a conclusion you **could not** have written from the bare
   one-line prompt. If the board is thin, say so and offer to diverge further
   rather than padding.

7. **Write it back.** Call `submit_answer` so your conclusion lands on the human's
   canvas next to their thinking. Then present the answer in chat too.

## Honesty rule

The value of NeuralStack is the **delta**: board-informed answer minus
prompt-only answer. If the board didn't change your conclusion, say so plainly —
don't pretend the ceremony added insight it didn't.

## Quick reference (tools)

- `create_board { topic }` → `{ id, url, status }`
- `wait_for_board { id, timeout_seconds? }` → serialized board once ready
- `get_board { id }` → serialized board at any time
- `submit_answer { id, answer }` → marks board `answered`
