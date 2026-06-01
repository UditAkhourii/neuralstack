#!/usr/bin/env node
// NeuralStack CLI.
//   npx neuralstack init [--key tlm_...] [--url https://neuralstack.dev]
//     → registers the MCP server in your Claude config(s) + installs the skill.
//   npx neuralstack mcp
//     → runs the stdio MCP server (this is what your Claude config launches).
import fs from "fs";
import os from "os";
import path from "path";
import readline from "readline";
import { fileURLToPath, pathToFileURL } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PKG_ROOT = path.join(__dirname, "..");
const DEFAULT_URL = "https://thinklm.vercel.app";
// Package spec the Claude config will `npx`. Until the npm publish lands, this
// runs straight from GitHub (no registry needed). After publishing, pass
// `--from neuralstack` (or set NEURALSTACK_PKG=neuralstack).
const PKG_SPEC = process.env.NEURALSTACK_PKG || "github:UditAkhourii/neuralstack";

const args = process.argv.slice(2);
const cmd = args[0] || "init";
const flag = (name) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : undefined; };

if (cmd === "mcp") {
  // Hand off to the stdio server (file:// URL required for ESM on Windows).
  await import(pathToFileURL(path.join(PKG_ROOT, "server.js")).href);
} else if (cmd === "init") {
  await init();
} else {
  console.log("Usage: neuralstack <init|mcp>");
  process.exit(1);
}

async function init() {
  const url = flag("url") || process.env.NEURALSTACK_API_URL || DEFAULT_URL;
  const pkg = flag("from") || PKG_SPEC;
  let key = flag("key") || process.env.NEURALSTACK_TOKEN;

  if (!key) {
    if (process.stdin.isTTY) {
      key = await prompt(`\nPaste your free NeuralStack API key (get one at ${url}/settings):\n> `);
    } else {
      // Non-interactive (e.g. invoked by an agent): can't prompt. Explain + exit.
      console.log(
        `\nNeuralStack needs a free API key to finish setup.\n` +
        `  1. Go to ${url} and sign in (or sign up).\n` +
        `  2. Settings → API key → Generate, copy the tlm_… key.\n` +
        `  3. Re-run: npx neuralstack init --key tlm_xxx\n`
      );
      process.exit(2);
    }
  }
  key = (key || "").trim();
  if (!/^tlm_/.test(key)) { console.error("That doesn't look like a NeuralStack key (expected tlm_…)."); process.exit(1); }

  const server = { command: "npx", args: ["-y", pkg, "mcp"], env: { NEURALSTACK_API_URL: url, NEURALSTACK_TOKEN: key } };

  const results = [];
  results.push(registerClaudeCode(server));
  results.push(registerClaudeDesktop(server));
  results.push(installSkill());

  console.log("\nNeuralStack setup:");
  for (const r of results) console.log("  " + r);
  console.log(`\n✓ Done. Restart Claude, then say "use neuralstack" to spawn a thinking board.\n`);
}

// ---- Claude Code: ~/.claude.json, top-level mcpServers (user scope) ----
function registerClaudeCode(server) {
  const p = path.join(os.homedir(), ".claude.json");
  try {
    const cfg = fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, "utf8")) : {};
    cfg.mcpServers = cfg.mcpServers || {};
    cfg.mcpServers.neuralstack = server;
    backup(p);
    fs.writeFileSync(p, JSON.stringify(cfg, null, 2));
    return "✓ Claude Code MCP registered (~/.claude.json)";
  } catch (e) { return "• Claude Code: skipped (" + e.message + ")"; }
}

// ---- Claude Desktop: platform config path ----
function registerClaudeDesktop(server) {
  const p = desktopConfigPath();
  if (!p) return "• Claude Desktop: unsupported platform, skipped";
  try {
    if (!fs.existsSync(path.dirname(p))) return "• Claude Desktop: not installed, skipped";
    const cfg = fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, "utf8")) : {};
    cfg.mcpServers = cfg.mcpServers || {};
    cfg.mcpServers.neuralstack = server;
    backup(p);
    fs.writeFileSync(p, JSON.stringify(cfg, null, 2));
    return "✓ Claude Desktop MCP registered";
  } catch (e) { return "• Claude Desktop: skipped (" + e.message + ")"; }
}

function desktopConfigPath() {
  const home = os.homedir();
  if (process.platform === "win32") return path.join(process.env.APPDATA || path.join(home, "AppData/Roaming"), "Claude", "claude_desktop_config.json");
  if (process.platform === "darwin") return path.join(home, "Library", "Application Support", "Claude", "claude_desktop_config.json");
  return path.join(home, ".config", "Claude", "claude_desktop_config.json");
}

// ---- Skill: ~/.claude/skills/neuralstack/SKILL.md ----
function installSkill() {
  const src = path.join(PKG_ROOT, "skill", "SKILL.md");
  const dstDir = path.join(os.homedir(), ".claude", "skills", "neuralstack");
  try {
    fs.mkdirSync(dstDir, { recursive: true });
    fs.copyFileSync(src, path.join(dstDir, "SKILL.md"));
    return "✓ Skill installed (~/.claude/skills/neuralstack)";
  } catch (e) { return "• Skill: skipped (" + e.message + ")"; }
}

function backup(p) { try { if (fs.existsSync(p)) fs.copyFileSync(p, p + ".bak-neuralstack"); } catch {} }

function prompt(q) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((res) => rl.question(q, (a) => { rl.close(); res(a); }));
}
