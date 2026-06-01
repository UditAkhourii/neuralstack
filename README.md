# neuralstack

Spawn divergent-thinking whiteboards for Claude. NeuralStack lets Claude open a
thinking board on a hard, open-ended problem, hand it to you to brainstorm on,
then read your board's *structure* back and converge to an answer it couldn't
have produced from the bare prompt.

## Install (one command)

```bash
npx neuralstack init
```

This will:
1. Ask for your **free NeuralStack API key** (get one at https://neuralstack.dev → Settings → API key).
2. Register the MCP server in your Claude config (Claude Code + Claude Desktop).
3. Install the `neuralstack` skill into `~/.claude/skills/`.

Then **restart Claude** and say *"use neuralstack"* on any open-ended question.

Non-interactive (e.g. when an agent runs it):

```bash
npx neuralstack init --key tlm_xxx
```

## What it registers

```json
{
  "mcpServers": {
    "neuralstack": {
      "command": "npx",
      "args": ["-y", "neuralstack", "mcp"],
      "env": { "NEURALSTACK_TOKEN": "tlm_xxx" }
    }
  }
}
```

`NEURALSTACK_API_URL` defaults to `https://neuralstack.dev`; set it to
`http://localhost:3100` for local development.

## Commands

| command | purpose |
|---|---|
| `npx neuralstack init [--key tlm_…] [--url …]` | one-shot setup: MCP + skill + key |
| `npx neuralstack mcp` | run the stdio MCP server (what the config launches) |

## Tools exposed to Claude

| tool | purpose |
|---|---|
| `create_board { topic }` | spawn a board, returns id + preview URL |
| `preview_url { id }` | short-lived, login-free URL for a preview pane |
| `wait_for_board { id }` | block until the human marks the board ready |
| `get_board { id }` | read the serialized board (tree + survivors + verdict) |
| `submit_answer { id, answer }` | write the final answer back to the canvas |
