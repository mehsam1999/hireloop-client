#!/usr/bin/env node
/**
 * Tokens CLI: connect your coding agents to Tokens in one command.
 *
 *   node tokens.mjs setup --base-url https://your-tokens-domain
 *   node tokens.mjs usage
 *   node tokens.mjs models
 *   node tokens.mjs logout
 *
 * Plain JavaScript, no dependencies, Node.js 18 or newer. Read it before you run it.
 *
 * What `setup` does:
 *   1. Signs you in through your browser (you approve a short code on the Tokens website).
 *      You can pass --key to skip that.
 *   2. Finds the coding agents on this computer: OpenCode, Claude Code, Codex CLI, Crush.
 *   3. Shows exactly which files it will change, saves a backup of each, and writes the settings.
 *      A file it cannot safely edit (comments, unexpected format) is left alone and you get the
 *      settings to paste instead.
 *
 * Files written: the agents' own config files, and ~/.config/tokens/credentials.json (mode 600).
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import readline from "node:readline";
import { spawn } from "node:child_process";

export const VERSION = "1.1.0";
const MARK_START = "# >>> tokens (managed by `tokens setup`) >>>";
const MARK_END = "# <<< tokens <<<";

// ---------------------------------------------------------------------------
// Pure helpers (exported for tests)
// ---------------------------------------------------------------------------

export function parseArgs(argv) {
  const out = { _: [], flags: {} };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const eq = a.indexOf("=");
      if (eq > -1) {
        out.flags[a.slice(2, eq)] = a.slice(eq + 1);
      } else {
        const next = argv[i + 1];
        if (next !== undefined && !next.startsWith("--")) {
          out.flags[a.slice(2)] = next;
          i += 1;
        } else {
          out.flags[a.slice(2)] = true;
        }
      }
    } else {
      out._.push(a);
    }
  }
  return out;
}

/** Returns the origin without a trailing slash. http is accepted only for localhost. */
export function normalizeBase(input) {
  let url;
  try {
    url = new URL(String(input).trim());
  } catch {
    throw new Error(`"${input}" is not a valid URL. Example: https://tokens.example.com`);
  }
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  if (url.protocol !== "https:" && !(url.protocol === "http:" && local)) {
    throw new Error(
      "The base URL must start with https:// (http:// is allowed only for localhost)."
    );
  }
  return url.origin;
}

export function v1Of(base) {
  return `${String(base).replace(/\/+$/, "").replace(/\/v1$/, "")}/v1`;
}

export function hostOf(base) {
  return String(base).replace(/\/+$/, "").replace(/\/v1$/, "");
}

function isPlainObject(v) {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

export function deepMerge(target, patch) {
  const out = isPlainObject(target) ? { ...target } : {};
  for (const [k, v] of Object.entries(patch)) {
    out[k] = isPlainObject(v) && isPlainObject(out[k]) ? deepMerge(out[k], v) : v;
  }
  return out;
}

/** Parses JSON that must be a plain object. Empty text counts as {}. Returns null if not safely editable. */
export function parseJsonObject(text) {
  if (text === null || text === undefined || text.trim() === "") return {};
  try {
    const parsed = JSON.parse(text);
    return isPlainObject(parsed) ? parsed : null;
  } catch {
    return null; // comments (JSONC) or a syntax error: do not guess
  }
}

const jsonText = (obj) => `${JSON.stringify(obj, null, 2)}\n`;

/**
 * OpenCode's Anthropic package adds only `/messages` to its base URL, so both protocols use the
 * `/v1` address.
 */
export function opencodeConfig(existingText, { v1Url, apiKey, model, protocol }) {
  const existing = parseJsonObject(existingText);
  if (existing === null) return null;
  return jsonText(
    deepMerge(existing, {
      $schema: existing.$schema ?? "https://opencode.ai/config.json",
      provider: {
        tokens: {
          npm: protocol === "anthropic" ? "@ai-sdk/anthropic" : "@ai-sdk/openai-compatible",
          name: "Tokens",
          options: { baseURL: v1Url, apiKey },
          models: { [model]: { name: model } },
        },
      },
      model: `tokens/${model}`,
    })
  );
}

export function claudeSettings(existingText, { hostUrl, apiKey, model }) {
  const existing = parseJsonObject(existingText);
  if (existing === null) return null;
  return jsonText(
    deepMerge(existing, {
      env: {
        ANTHROPIC_BASE_URL: hostUrl,
        ANTHROPIC_AUTH_TOKEN: apiKey,
        ANTHROPIC_MODEL: model,
        // Without these, the opus, sonnet and haiku aliases, background tasks and subagents ask for
        // Anthropic model names the key may not be able to use.
        ANTHROPIC_DEFAULT_OPUS_MODEL: model,
        ANTHROPIC_DEFAULT_SONNET_MODEL: model,
        ANTHROPIC_DEFAULT_HAIKU_MODEL: model,
        CLAUDE_CODE_SUBAGENT_MODEL: model,
      },
    })
  );
}

export function crushConfig(existingText, { v1Url, hostUrl, apiKey, model, protocol }) {
  const existing = parseJsonObject(existingText);
  if (existing === null) return null;
  return jsonText(
    deepMerge(existing, {
      $schema: existing.$schema ?? "https://charm.land/crush.json",
      providers: {
        tokens: {
          name: "Tokens",
          type: protocol === "anthropic" ? "anthropic" : "openai-compat",
          base_url: protocol === "anthropic" ? hostUrl : v1Url,
          api_key: apiKey,
          models: [{ id: model, name: model, context_window: 128000, default_max_tokens: 8192 }],
        },
      },
    })
  );
}

/**
 * Codex reads the key from an environment variable, so neither file holds a secret. config.toml gets
 * only the provider table, never a top-level key, so the result is valid TOML whatever the rest of
 * the file contains. The block is replaced in place when run again, which also removes the
 * `[profiles.tokens]` table written by CLI 1.0: current Codex refuses `--profile tokens` while that
 * table exists. The profile itself is its own file, tokens.config.toml (codexProfile below).
 */
export function codexToml(existingText, { v1Url }) {
  const block = [
    MARK_START,
    "[model_providers.tokens]",
    'name = "Tokens"',
    `base_url = "${v1Url}"`,
    'env_key = "TOKENS_API_KEY"',
    'wire_api = "responses"',
    MARK_END,
    "",
  ].join("\n");

  const text = existingText ?? "";
  const start = text.indexOf(MARK_START);
  const end = text.indexOf(MARK_END);
  if (start > -1 && end > start) {
    const before = text.slice(0, start);
    const after = text.slice(end + MARK_END.length).replace(/^\r?\n/, "");
    if (hasOwnCodexTokensConfig(before + after)) return null;
    return before + block + after;
  }
  if (hasOwnCodexTokensConfig(text)) return null;
  return `${text}${text === "" || text.endsWith("\n") ? "" : "\n"}${text === "" ? "" : "\n"}${block}`;
}

/**
 * The user's own tables called tokens would make the file invalid, and a legacy
 * `profile = "tokens"` makes current Codex refuse `--profile tokens`. Either way: leave it alone.
 */
function hasOwnCodexTokensConfig(text) {
  return (
    /^\s*\[(model_providers|profiles)\.tokens\]/m.test(text) ||
    /^\s*profile\s*=\s*["']tokens["']/m.test(text)
  );
}

/** `codex --profile tokens` reads `<CODEX_HOME>/tokens.config.toml`; only we write this file. */
export function codexProfile(existingText, { model }) {
  const managed = existingText === null || existingText.trim() === "";
  if (!managed && !existingText.startsWith(MARK_START)) return null;
  return [
    MARK_START,
    `model = ${JSON.stringify(model)}`,
    'model_provider = "tokens"',
    MARK_END,
    "",
  ].join("\n");
}

export function barOf(percent, width = 20) {
  const filled = Math.max(0, Math.min(width, Math.round((percent / 100) * width)));
  return `${"█".repeat(filled)}${"░".repeat(width - filled)}`;
}

export function formatUsage(summary) {
  const lines = [];
  if (summary.plan) {
    const end = summary.plan.periodEnd
      ? `, renews ${new Date(summary.plan.periodEnd).toLocaleDateString()}`
      : "";
    lines.push(`Plan: ${summary.plan.name} (${summary.plan.tier}${end})`);
  } else {
    lines.push("Plan: none (pay as you go from your wallet)");
  }
  for (const w of summary.windows ?? []) {
    const money = w.unit === "usd";
    const fmt = (n) => (money ? `$${Number(n).toFixed(2)}` : String(Math.round(n)));
    const reset = w.resetsAt ? `  resets ${new Date(w.resetsAt).toLocaleString()}` : "";
    lines.push(
      `${w.label.padEnd(10)} ${barOf(w.percentUsed)} ${String(Math.round(w.percentUsed)).padStart(3)}%  ${fmt(w.used)} / ${fmt(w.limit)}${reset}`
    );
  }
  if (summary.wallet) lines.push(`Wallet:    $${Number(summary.wallet.balanceUsd).toFixed(2)}`);
  if (summary.key?.monthlySpendCapUsd)
    lines.push(`Key cap:   $${Number(summary.key.monthlySpendCapUsd).toFixed(2)} per month`);
  if (summary.key?.allowedModels) lines.push(`Key models: ${summary.key.allowedModels.join(", ")}`);
  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Files and agents
// ---------------------------------------------------------------------------

export function agentTargets(home = os.homedir(), env = process.env) {
  const codexHome = env.CODEX_HOME || path.join(home, ".codex");
  return [
    {
      id: "opencode",
      label: "OpenCode",
      file: path.join(home, ".config", "opencode", "opencode.json"),
      dir: path.join(home, ".config", "opencode"),
      build: opencodeConfig,
      bin: "opencode",
    },
    {
      id: "claude",
      label: "Claude Code",
      file: path.join(home, ".claude", "settings.json"),
      dir: path.join(home, ".claude"),
      build: claudeSettings,
      bin: "claude",
    },
    {
      id: "codex",
      label: "Codex CLI",
      file: path.join(codexHome, "config.toml"),
      dir: codexHome,
      build: codexToml,
      bin: "codex",
    },
    {
      id: "codex",
      label: "Codex CLI profile",
      file: path.join(codexHome, "tokens.config.toml"),
      dir: codexHome,
      build: codexProfile,
      bin: "codex",
    },
    {
      id: "crush",
      label: "Crush",
      file: path.join(home, ".config", "crush", "crush.json"),
      dir: path.join(home, ".config", "crush"),
      build: crushConfig,
      bin: "crush",
    },
  ];
}

function onPath(bin, env = process.env) {
  const exts = process.platform === "win32" ? (env.PATHEXT || ".EXE;.CMD;.BAT").split(";") : [""];
  for (const dir of (env.PATH || "").split(path.delimiter)) {
    if (!dir) continue;
    for (const ext of exts) {
      try {
        fs.accessSync(path.join(dir, bin + ext), fs.constants.X_OK);
        return true;
      } catch {
        // keep looking
      }
    }
  }
  return false;
}

export function detectAgents(targets) {
  return targets.filter((t) => fs.existsSync(t.dir) || onPath(t.bin));
}

function readIfExists(file) {
  try {
    return fs.readFileSync(file, "utf8");
  } catch {
    return null;
  }
}

export function writeWithBackup(file, content, now = new Date()) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  let backup = null;
  if (fs.existsSync(file)) {
    backup = `${file}.tokens-backup-${now.toISOString().replace(/[:.]/g, "-")}`;
    fs.copyFileSync(file, backup);
  }
  fs.writeFileSync(file, content);
  return backup;
}

// ---------------------------------------------------------------------------
// Credentials
// ---------------------------------------------------------------------------

export function credentialsPath(env = process.env, home = os.homedir()) {
  const base =
    env.XDG_CONFIG_HOME ||
    (process.platform === "win32" && env.APPDATA ? env.APPDATA : path.join(home, ".config"));
  return path.join(base, "tokens", "credentials.json");
}

function loadCredentials() {
  const text = readIfExists(credentialsPath());
  if (!text) return null;
  try {
    const parsed = JSON.parse(text);
    return parsed && parsed.baseUrl && parsed.apiKey ? parsed : null;
  } catch {
    return null;
  }
}

function saveCredentials(baseUrl, apiKey) {
  const file = credentialsPath();
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(
    file,
    `${JSON.stringify({ baseUrl, apiKey, savedAt: new Date().toISOString() }, null, 2)}\n`,
    { mode: 0o600 }
  );
  try {
    fs.chmodSync(file, 0o600);
  } catch {
    // not supported on this filesystem
  }
}

// ---------------------------------------------------------------------------
// Terminal
// ---------------------------------------------------------------------------

const useColor = process.stdout.isTTY && !process.env.NO_COLOR;
const paint = (code, s) => (useColor ? `\x1b[${code}m${s}\x1b[0m` : s);
const bold = (s) => paint("1", s);
const dim = (s) => paint("2", s);
const green = (s) => paint("32", s);
const red = (s) => paint("31", s);
const yellow = (s) => paint("33", s);

function say(msg = "") {
  process.stdout.write(`${msg}\n`);
}

async function ask(question, fallback = "") {
  if (!process.stdin.isTTY) return fallback;
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim() || fallback);
    });
  });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function openBrowser(url) {
  const [cmd, args] =
    process.platform === "darwin"
      ? ["open", [url]]
      : process.platform === "win32"
        ? ["rundll32", ["url.dll,FileProtocolHandler", url]]
        : ["xdg-open", [url]];
  try {
    const child = spawn(cmd, args, { stdio: "ignore", detached: true });
    child.on("error", () => {});
    child.unref();
  } catch {
    // The link is printed anyway.
  }
}

// ---------------------------------------------------------------------------
// Network
// ---------------------------------------------------------------------------

async function http(url, { method = "GET", headers = {}, body } = {}) {
  let response;
  try {
    response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        "User-Agent": `tokens-cli/${VERSION}`,
        ...headers,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(20_000),
    });
  } catch (error) {
    throw new Error(
      `Could not reach ${new URL(url).origin}: ${error instanceof Error ? error.message : error}`
    );
  }
  const text = await response.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    // not JSON
  }
  return { ok: response.ok, status: response.status, json, text };
}

async function gatewayUrls(base) {
  const res = await http(`${base}/api/gateway/config`).catch(() => null);
  if (res?.ok && res.json?.openaiBaseUrl && res.json?.anthropicBaseUrl) {
    return { v1Url: v1Of(res.json.openaiBaseUrl), hostUrl: hostOf(res.json.anthropicBaseUrl) };
  }
  return { v1Url: v1Of(base), hostUrl: hostOf(base) };
}

async function deviceLogin(base, { noBrowser }) {
  const start = await http(`${base}/api/cli/device`, {
    method: "POST",
    body: { clientLabel: `${os.platform()}, node ${process.versions.node}` },
  });
  if (!start.ok || !start.json?.deviceCode) {
    throw new Error(start.json?.error || `Could not start sign-in (HTTP ${start.status}).`);
  }
  const { deviceCode, userCode, verificationUriComplete, expiresIn, interval } = start.json;

  // Only ever open or print a link on the site we were told to use.
  const link = new URL(verificationUriComplete);
  if (link.origin !== new URL(base).origin)
    throw new Error("The server returned an unexpected sign-in link. Aborting.");

  say("");
  say(`  Open this page and approve the code ${bold(userCode)}:`);
  say(`  ${link.toString()}`);
  say(dim("  (Check that the code on the page matches the one above.)"));
  say("");
  if (!noBrowser) openBrowser(link.toString());

  const deadline = Date.now() + Math.min(Number(expiresIn) || 600, 900) * 1000;
  const wait = Math.max(2, Number(interval) || 3) * 1000;
  process.stdout.write("  Waiting for approval");
  while (Date.now() < deadline) {
    await sleep(wait);
    process.stdout.write(".");
    const poll = await http(`${base}/api/cli/token`, { method: "POST", body: { deviceCode } });
    const status = poll.json?.status;
    if (status === "approved" && poll.json.apiKey) {
      say(` ${green("approved")}`);
      return poll.json.apiKey;
    }
    if (status === "denied") throw new Error("The request was rejected on the website.");
    if (status === "expired") throw new Error("The code expired. Run the command again.");
  }
  throw new Error("Timed out waiting for approval. Run the command again.");
}

// ---------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------

async function resolveSession(flags) {
  const saved = loadCredentials();
  const rawBase = flags["base-url"] || process.env.TOKENS_BASE_URL || saved?.baseUrl;
  if (!rawBase) {
    throw new Error(
      "Tell me your Tokens website: add --base-url https://your-tokens-domain (or set TOKENS_BASE_URL)."
    );
  }
  const base = normalizeBase(rawBase);
  const apiKey =
    flags.key ||
    process.env.TOKENS_API_KEY ||
    (saved && normalizeBase(saved.baseUrl) === base ? saved.apiKey : null);
  return { base, apiKey: typeof apiKey === "string" ? apiKey : null };
}

async function listModels(v1Url, apiKey) {
  const res = await http(`${v1Url}/models`, { headers: { Authorization: `Bearer ${apiKey}` } });
  if (res.status === 401) throw new Error("That API key was not accepted.");
  if (!res.ok) throw new Error(`Could not list models (HTTP ${res.status}).`);
  return (res.json?.data ?? []).map((m) => m.id).filter(Boolean);
}

async function cmdSetup(flags) {
  const dryRun = Boolean(flags["dry-run"]);
  const yes = Boolean(flags.yes);
  // Checked first: the browser sign-in creates a key.
  const protocol = flags.protocol === undefined ? "openai" : flags.protocol;
  if (protocol !== "openai" && protocol !== "anthropic")
    throw new Error('--protocol must be "openai" or "anthropic".');
  let { base, apiKey } = await resolveSession(flags);

  say(bold(`Tokens setup`) + dim(`  ${base}`));
  if (!apiKey) apiKey = await deviceLogin(base, { noBrowser: Boolean(flags["no-browser"]) });

  const { v1Url, hostUrl } = await gatewayUrls(base);
  const models = await listModels(v1Url, apiKey);
  if (models.length === 0)
    throw new Error(
      "Your account has no models available yet. Subscribe or add funds first, then run this again."
    );

  let model = typeof flags.model === "string" ? flags.model : null;
  if (model && !models.includes(model))
    throw new Error(
      `Model "${model}" is not available to this key. Run \`tokens models\` to see the list.`
    );
  if (!model) {
    const shown = models.slice(0, 10);
    shown.forEach((m, i) => say(`  ${String(i + 1).padStart(2)}. ${m}`));
    const pick = await ask(`  Default model [1-${shown.length}, Enter = 1]: `, "1");
    model = shown[Math.max(0, Math.min(shown.length - 1, Number.parseInt(pick, 10) - 1 || 0))];
  }

  if (!dryRun) saveCredentials(base, apiKey);

  const wanted =
    typeof flags.agents === "string" ? flags.agents.split(",").map((s) => s.trim()) : null;
  const all = agentTargets();
  const targets = wanted ? all.filter((t) => wanted.includes(t.id)) : detectAgents(all);
  if (targets.length === 0) {
    say("");
    say(
      "No supported agents were found on this computer (OpenCode, Claude Code, Codex CLI, Crush)."
    );
    say(
      `Your key is saved. For other tools, open ${base}/dashboard/connect for copy-and-paste settings.`
    );
    return;
  }

  say("");
  say(bold("These files will be updated (a backup of each is kept):"));
  for (const t of targets) say(`  • ${t.label}: ${t.file}`);
  if (!yes && !dryRun) {
    const answer = (await ask("\nContinue? [Y/n] ", process.stdin.isTTY ? "y" : "n")).toLowerCase();
    if (answer.startsWith("n")) {
      say("Nothing was changed.");
      return;
    }
  }

  const ctx = { v1Url, hostUrl, apiKey, model, protocol };
  let manual = 0;
  for (const t of targets) {
    const current = readIfExists(t.file);
    const next = t.build(current, ctx);
    if (next === null) {
      manual += 1;
      say(
        `  ${yellow("skipped")} ${t.label}: ${t.file} has comments or an unexpected format, so it was not touched.`
      );
      say(`           Paste the settings from ${base}/dashboard/connect?agent=${t.id}`);
      continue;
    }
    if (dryRun) {
      say(`  ${dim("dry run")} ${t.label}: would write ${t.file}`);
      continue;
    }
    const backup = writeWithBackup(t.file, next);
    say(
      `  ${green("updated")} ${t.label}${backup ? dim(`  (backup: ${path.basename(backup)})`) : ""}`
    );
  }

  say("");
  if (targets.some((t) => t.id === "codex")) {
    say(
      bold("Codex CLI") +
        " reads the key from an environment variable. Add this to your shell profile, then run `codex --profile tokens`:"
    );
    say(
      process.platform === "win32"
        ? `  setx TOKENS_API_KEY "${apiKey}"`
        : `  export TOKENS_API_KEY="${apiKey}"`
    );
    say("");
  }
  say(
    green("Done.") + ` Try your agent now. Check what is left any time with: node tokens.mjs usage`
  );
  if (manual > 0) say(yellow(`${manual} file(s) need a manual step (see above).`));
}

async function cmdUsage(flags) {
  const { base, apiKey } = await resolveSession(flags);
  if (!apiKey) throw new Error("Not signed in. Run `node tokens.mjs setup` first (or pass --key).");
  const { v1Url } = await gatewayUrls(base);
  const res = await http(`${v1Url}/tokens/usage`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (res.status === 401)
    throw new Error("That API key was not accepted. Run `node tokens.mjs setup` again.");
  if (!res.ok || !res.json) throw new Error(`Could not load usage (HTTP ${res.status}).`);
  say(flags.json ? JSON.stringify(res.json, null, 2) : formatUsage(res.json));
}

async function cmdModels(flags) {
  const { base, apiKey } = await resolveSession(flags);
  if (!apiKey) throw new Error("Not signed in. Run `node tokens.mjs setup` first (or pass --key).");
  const { v1Url } = await gatewayUrls(base);
  for (const id of await listModels(v1Url, apiKey)) say(id);
}

function cmdLogout() {
  const file = credentialsPath();
  if (fs.existsSync(file)) {
    fs.unlinkSync(file);
    say(`Removed ${file}.`);
  } else {
    say("Nothing to remove.");
  }
  say(
    "The API key itself stays valid; revoke it under API Keys on the website if you no longer want it."
  );
}

const HELP = `tokens ${VERSION}: connect your coding agents to Tokens

Usage:
  node tokens.mjs setup  [--base-url URL] [--key KEY] [--model ID] [--agents opencode,claude,codex,crush]
                         [--protocol openai|anthropic] [--yes] [--dry-run] [--no-browser]
  node tokens.mjs usage  [--json]      what is left on your plan and wallet
  node tokens.mjs models               models your key can use
  node tokens.mjs logout               remove the saved key from this computer

--protocol applies to OpenCode and Crush, which speak both (default: openai). Claude Code always
uses Anthropic Messages and Codex CLI always uses OpenAI Responses.

Environment: TOKENS_BASE_URL, TOKENS_API_KEY
`;

export async function main(argv = process.argv.slice(2)) {
  const { _: positional, flags } = parseArgs(argv);
  const command = positional[0];
  try {
    if (flags.version || command === "version") return say(VERSION);
    if (flags.help || flags.h || !command || command === "help") return say(HELP);
    if (command === "setup") return await cmdSetup(flags);
    if (command === "usage") return await cmdUsage(flags);
    if (command === "models") return await cmdModels(flags);
    if (command === "logout") return cmdLogout();
    say(`Unknown command "${command}".\n\n${HELP}`);
    process.exitCode = 2;
  } catch (error) {
    say(red(`\nError: ${error instanceof Error ? error.message : String(error)}`));
    process.exitCode = 1;
  }
}

if (!globalThis.__TOKENS_CLI_IMPORT__) {
  void main();
}
