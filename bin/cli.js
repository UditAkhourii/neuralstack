#!/usr/bin/env node
// NeuralStack CLI — the whole tool, driven over npx (no MCP needed).
//
//   npx neuralstack login <tlm_key>        store your API key (once)
//   npx neuralstack create "<topic>"       spawn a board → prints preview URL
//   npx neuralstack board <id>             print the board (tree + survivors)
//   npx neuralstack wait <id>              poll until the human marks it ready
//   npx neuralstack answer <id> "<text>"   write the converged answer back
//   npx neuralstack install-skill          copy the skill into ~/.claude/skills
//
// Key resolution: --key flag → $NEURALSTACK_TOKEN → ~/.neuralstack/config.json
import fs from "fs";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PKG_ROOT = path.join(__dirname, "..");
const DEFAULT_URL = "https://thinklm.vercel.app";
const CFG_DIR = path.join(os.homedir(), ".neuralstack");
const CFG_FILE = path.join(CFG_DIR, "config.json");

const argv = process.argv.slice(2);
const cmd = argv[0];
const rest = argv.slice(1);
const flag = (n) => { const i = argv.indexOf(`--${n}`); return i >= 0 ? argv[i + 1] : undefined; };

function loadCfg() { try { return JSON.parse(fs.readFileSync(CFG_FILE, "utf8")); } catch { return {}; } }
function saveCfg(c) { fs.mkdirSync(CFG_DIR, { recursive: true }); fs.writeFileSync(CFG_FILE, JSON.stringify(c, null, 2)); }
function getKey() { return flag("key") || process.env.NEURALSTACK_TOKEN || loadCfg().token || ""; }
function getUrl() { return flag("url") || process.env.NEURALSTACK_API_URL || loadCfg().url || DEFAULT_URL; }

async function api(p, init = {}) {
  const res = await fetch(`${getUrl().replace(/\/$/, "")}${p}`, {
    ...init,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${getKey()}`, ...(init.headers || {}) },
  });
  const text = await res.text();
  let body; try { body = JSON.parse(text); } catch { body = { raw: text }; }
  if (!res.ok) { console.error(`Error: ${body?.error || res.status}`); process.exit(1); }
  return body;
}

function needKey() {
  if (getKey()) return;
  console.error(
    `No NeuralStack API key found.\n` +
    `  1. Get a free key at ${DEFAULT_URL} → Settings → API key.\n` +
    `  2. Run: npx neuralstack login tlm_xxx\n`
  );
  process.exit(2);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  switch (cmd) {
    case "login": {
      const key = rest[0] || flag("key");
      if (!key || !/^tlm_/.test(key)) { console.error("Usage: neuralstack login tlm_xxx"); process.exit(1); }
      const c = loadCfg(); c.token = key.trim(); c.url = getUrl(); saveCfg(c);
      console.log(`✓ Saved. NeuralStack is ready (${c.url}).`);
      break;
    }
    case "create": {
      needKey();
      const topic = rest.join(" ").trim();
      if (!topic) { console.error('Usage: neuralstack create "your question"'); process.exit(1); }
      const b = await api("/api/agent/boards", { method: "POST", body: JSON.stringify({ topic }) });
      let preview = "";
      try { preview = (await api(`/api/agent/boards/${b.id}`, { method: "POST" })).preview_url; } catch {}
      console.log(JSON.stringify({ id: b.id, preview_url: preview || b.url, open_url: b.url }, null, 2));
      break;
    }
    case "board": case "get": {
      needKey();
      const id = rest[0]; if (!id) { console.error("Usage: neuralstack board <id>"); process.exit(1); }
      const r = await api(`/api/agent/boards/${id}`);
      console.log(`status: ${r.status} | ready: ${r.ready} | nodes: ${r.node_count}\n\n${r.serialized}`);
      break;
    }
    case "wait": {
      needKey();
      const id = rest[0]; if (!id) { console.error("Usage: neuralstack wait <id>"); process.exit(1); }
      const timeout = Number(flag("timeout") || 280) * 1000; // stay under shell timeouts
      const deadline = Date.now() + timeout;
      let last;
      while (Date.now() < deadline) {
        last = await api(`/api/agent/boards/${id}`);
        if (last.ready) { console.log(`READY\n\n${last.serialized}`); return; }
        await sleep(5000);
      }
      console.log(`NOT_READY_YET (status: ${last?.status}). Call wait again, or board <id> to read current state.`);
      break;
    }
    case "answer": {
      needKey();
      const id = rest[0]; const text = rest.slice(1).join(" ");
      if (!id || !text) { console.error('Usage: neuralstack answer <id> "your answer"'); process.exit(1); }
      const r = await api(`/api/agent/boards/${id}`, { method: "PATCH", body: JSON.stringify({ answer: text }) });
      console.log(`✓ Answer saved. Board ${r.id} is now '${r.status}'.`);
      break;
    }
    case "install-skill": {
      const dst = path.join(os.homedir(), ".claude", "skills", "neuralstack");
      fs.mkdirSync(dst, { recursive: true });
      fs.copyFileSync(path.join(PKG_ROOT, "skill", "SKILL.md"), path.join(dst, "SKILL.md"));
      console.log(`✓ Skill installed at ${dst}\nRestart Claude, then say "use neuralstack".`);
      break;
    }
    default:
      console.log(`NeuralStack CLI
  login <tlm_key>        save your API key (get one at ${DEFAULT_URL})
  create "<topic>"       spawn a thinking board → prints preview URL
  board <id>             print the board (divergent tree + survivors)
  wait <id>              poll until the human finishes brainstorming
  answer <id> "<text>"   write the converged answer back
  install-skill          install the Claude skill`);
  }
})().catch((e) => { console.error("Error:", e.message); process.exit(1); });
