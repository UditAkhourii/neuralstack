#!/usr/bin/env node
// ThinkLM MCP server (stdio). Bridges a Claude client to the cloud ThinkLM
// HTTP API so Claude can spawn a divergent thinking board, hand it to the
// human, wait for them to finish brainstorming, read the result back, and
// write a synthesized answer. This is the "baton-pass" loop.
//
// Config via env:
//   THINKLM_API_URL  base URL of the deployed app (e.g. https://thinklm.app)
//   THINKLM_TOKEN    an agent token minted in the ThinkLM web UI (tlm_...)
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";

// NEURALSTACK_* are the canonical env vars; THINKLM_* kept as fallback.
const API = (process.env.NEURALSTACK_API_URL || process.env.THINKLM_API_URL || "https://neuralstack.vercel.app").replace(/\/$/, "");
const TOKEN = process.env.NEURALSTACK_TOKEN || process.env.THINKLM_TOKEN || "";

async function api(path, init = {}) {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${TOKEN}`,
      ...(init.headers || {}),
    },
  });
  const text = await res.text();
  let body;
  try { body = JSON.parse(text); } catch { body = { raw: text }; }
  if (!res.ok) throw new Error(body?.error || `HTTP ${res.status}`);
  return body;
}

const server = new Server({ name: "thinklm", version: "0.1.0" }, { capabilities: { tools: {} } });

const TOOLS = [
  {
    name: "create_board",
    description:
      "Spawn a new ThinkLM divergent-thinking board for a topic and hand it to the human to brainstorm on. Returns a board id and a URL the human opens. Use when a problem is open-ended, has several interacting unknowns, or benefits from human divergent input before you converge.",
    inputSchema: {
      type: "object",
      properties: { topic: { type: "string", description: "The question/topic to think about." } },
      required: ["topic"],
    },
  },
  {
    name: "preview_url",
    description:
      "Get a short-lived preview URL for a board that opens WITHOUT a login (carries a scoped ticket). Use this to show the board in a split-screen preview pane. The returned URL is editable — the human can brainstorm directly in the preview.",
    inputSchema: { type: "object", properties: { id: { type: "string" } }, required: ["id"] },
  },
  {
    name: "get_board",
    description:
      "Read the current state of a board as a structure-preserving text rendering (the divergent tree, surviving insights, critic verdict, and any human notes). Use after the human says they are done brainstorming.",
    inputSchema: {
      type: "object",
      properties: { id: { type: "string" } },
      required: ["id"],
    },
  },
  {
    name: "wait_for_board",
    description:
      "Block-poll a board until the human marks it ready (finished brainstorming), then return its serialized state. Use this to wait for the human after creating a board. Times out after timeout_seconds (default 600).",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string" },
        timeout_seconds: { type: "number", description: "Max seconds to wait (default 600)." },
      },
      required: ["id"],
    },
  },
  {
    name: "submit_answer",
    description:
      "Write your final synthesized answer back to the board (marks it 'answered' so the human sees your conclusion on the canvas).",
    inputSchema: {
      type: "object",
      properties: { id: { type: "string" }, answer: { type: "string" } },
      required: ["id", "answer"],
    },
  },
];

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const { name, arguments: args } = req.params;
  const ok = (obj) => ({ content: [{ type: "text", text: typeof obj === "string" ? obj : JSON.stringify(obj, null, 2) }] });
  try {
    if (name === "create_board") {
      const r = await api("/api/agent/boards", { method: "POST", body: JSON.stringify({ topic: args.topic }) });
      let preview = "";
      try { preview = (await api(`/api/agent/boards/${r.id}`, { method: "POST" })).preview_url; } catch {}
      return ok(
        `Board created.\nid: ${r.id}\nstatus: ${r.status}\n` +
          `URL (login required): ${r.url}\n` +
          (preview ? `Preview URL (no login, open in a preview pane, editable): ${preview}\n` : "") +
          `\nOpen the preview URL in a split-screen preview pane so the human can brainstorm in place. ` +
          `It auto-diverges on open. Then call wait_for_board (or get_board) to read their thinking once they say "done".`
      );
    }
    if (name === "preview_url") {
      const r = await api(`/api/agent/boards/${args.id}`, { method: "POST" });
      return ok(`Preview URL (open in a preview pane — no login needed, editable):\n${r.preview_url}`);
    }
    if (name === "get_board") {
      const r = await api(`/api/agent/boards/${args.id}`);
      return ok(`status: ${r.status} | ready: ${r.ready} | nodes: ${r.node_count}\n\n${r.serialized}`);
    }
    if (name === "wait_for_board") {
      const deadline = Date.now() + (args.timeout_seconds ?? 600) * 1000;
      let last;
      while (Date.now() < deadline) {
        last = await api(`/api/agent/boards/${args.id}`);
        if (last.ready) return ok(`status: ${last.status} (ready)\n\n${last.serialized}`);
        await new Promise((r) => setTimeout(r, 5000));
      }
      return ok(`Timed out waiting for the human. Last status: ${last?.status}.\n\n${last?.serialized || ""}`);
    }
    if (name === "submit_answer") {
      const r = await api(`/api/agent/boards/${args.id}`, { method: "PATCH", body: JSON.stringify({ answer: args.answer }) });
      return ok(`Answer saved. Board ${r.id} is now '${r.status}'.`);
    }
    throw new Error(`unknown tool: ${name}`);
  } catch (e) {
    return { content: [{ type: "text", text: `Error: ${e.message}` }], isError: true };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
console.error(`thinklm-mcp connected → ${API}`);
