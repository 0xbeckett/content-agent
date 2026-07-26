/**
 * Capture the REAL product surfaces the ad is built from.
 *
 *   node scripts/capture.mjs
 *
 * Every frame of BeckettAd is a real screen a person can go click on right now:
 * the live bored board, the two real PRs, the real dispatcher-watchdog diff, and
 * the v6.5.1 release commit. Nothing here is mocked or recreated — this script
 * drives a real Chromium at the real URLs and writes PNGs into
 * `public/captures/`, which are committed so the comp re-renders from a clean
 * checkout with no network.
 *
 * Shots are captured tall (fullPage where it helps) at 2x DPR so the composition
 * can pan/scroll inside them and still be crisp at 1080p.
 *
 * Playwright is not a project dependency — it is resolved from the global npm
 * root. This is an asset-prep step (same shape as prep-assets.ts), not part of
 * the render path.
 */
import { createRequire } from "node:module";
import { execSync } from "node:child_process";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(REPO_ROOT, "public", "captures");

function loadPlaywright() {
  const require = createRequire(import.meta.url);
  const roots = [];
  try {
    roots.push(execSync("npm root -g", { encoding: "utf8" }).trim());
  } catch {}
  for (const r of roots) {
    try {
      return require(path.join(r, "playwright"));
    } catch {}
  }
  try {
    return require("playwright");
  } catch {}
  throw new Error(
    "playwright not found. Install it globally (`npm i -g playwright`) — it is an " +
      "asset-prep tool, not a render dependency.",
  );
}

/** The real surfaces. `wait` is extra settle time for client-rendered apps. */
const SHOTS = [
  {
    name: "board",
    url: "https://bored.0xbeckett.me/",
    w: 1920,
    h: 1080,
    wait: 4000,
  },
  {
    name: "board-tall",
    url: "https://bored.0xbeckett.me/",
    w: 1920,
    h: 1080,
    wait: 4000,
    fullPage: true,
  },
  {
    name: "ticket",
    url: "https://bored.0xbeckett.me/",
    w: 1920,
    h: 1080,
    wait: 4000,
    // open the real ticket detail panel for THIS ticket
    click: "Cut the fast ad comp",
    afterClickWait: 2500,
  },
  {
    name: "pr65",
    url: "https://github.com/BetterWright/betterwright/pull/65",
    w: 1920,
    h: 1080,
    wait: 2500,
  },
  {
    name: "pr65-files",
    url: "https://github.com/BetterWright/betterwright/pull/65/files",
    w: 1920,
    h: 1080,
    wait: 3500,
  },
  {
    name: "pr7",
    url: "https://github.com/frgmt0/bored/pull/7",
    w: 1920,
    h: 1080,
    wait: 2500,
  },
  {
    name: "watchdog",
    url: "https://github.com/0xbeckett/beckett/commit/66390d1c39d02821c6f440aa60fff30310a0995a",
    w: 1920,
    h: 1080,
    wait: 3000,
  },
  {
    name: "release651",
    url: "https://github.com/0xbeckett/beckett/commit/00a3b75edb53fec1d856c34b8e6c698e4be0c126",
    w: 1920,
    h: 1080,
    wait: 3000,
  },

  /* ── BeckettAdPunch (the 1-2 punch recut) ──────────────────────────────
   * bored ships shareable ticket URLs (`/tickets/%23<n>`), so the ticket
   * detail no longer needs a synthetic click — each pair's payoff is a real
   * addressable page. Named `-v2` so the older shots above stay pinned and
   * BeckettAd keeps re-rendering byte-for-byte. */
  {
    name: "board-v2",
    url: "https://bored.0xbeckett.me/",
    w: 1920,
    h: 1080,
    wait: 5000,
  },
  {
    name: "board-v2-tall",
    url: "https://bored.0xbeckett.me/",
    w: 1920,
    h: 1080,
    wait: 5000,
    fullPage: true,
  },
  // #12 — the bored web UI ticket, the payoff for "make a proper UI for bored"
  {
    name: "t12",
    url: "https://bored.0xbeckett.me/tickets/%2312",
    w: 1920,
    h: 1080,
    wait: 5000,
    fullPage: true,
  },
  // #11 — the watchdog re-staff fix ticket
  {
    name: "t11",
    url: "https://bored.0xbeckett.me/tickets/%2311",
    w: 1920,
    h: 1080,
    wait: 5000,
  },
  // #16 — this very ticket, live on the read-only public link
  {
    name: "t16",
    url: "https://bored.0xbeckett.me/tickets/%2316",
    w: 1920,
    h: 1080,
    wait: 5000,
  },
  { name: "pr65-v2", url: "https://github.com/BetterWright/betterwright/pull/65", w: 1920, h: 1080, wait: 3500 },
  { name: "pr7-v2", url: "https://github.com/frgmt0/bored/pull/7", w: 1920, h: 1080, wait: 3500 },
];

async function main() {
  const { chromium } = loadPlaywright();
  await mkdir(OUT_DIR, { recursive: true });

  // `node scripts/capture.mjs board-v2 t12` re-takes only those shots. Without
  // a filter every shot is re-taken — which also re-dates the ones an already
  // shipped comp depends on, so prefer naming what you actually need.
  const only = new Set(process.argv.slice(2));
  const shots = only.size ? SHOTS.filter((s) => only.has(s.name)) : SHOTS;
  if (only.size && shots.length !== only.size) {
    throw new Error(`unknown shot(s): ${[...only].filter((n) => !SHOTS.some((s) => s.name === n)).join(", ")}`);
  }

  const browser = await chromium.launch();
  try {
    for (const s of shots) {
      const ctx = await browser.newContext({
        viewport: { width: s.w, height: s.h },
        deviceScaleFactor: 2,
        colorScheme: "dark",
      });
      const page = await ctx.newPage();
      console.log(`[capture] ${s.name} ← ${s.url}`);
      await page.goto(s.url, { waitUntil: "networkidle", timeout: 60000 }).catch(() => {});
      await page.waitForTimeout(s.wait ?? 2000);

      if (s.click) {
        await page
          .locator(`text=${s.click}`)
          .first()
          .click({ timeout: 15000 })
          .catch((e) => console.log(`[capture]   click miss: ${e.message.split("\n")[0]}`));
        await page.waitForTimeout(s.afterClickWait ?? 2000);
      }

      const file = path.join(OUT_DIR, `${s.name}.png`);
      await page.screenshot({ path: file, fullPage: !!s.fullPage });
      console.log(`[capture]   → ${path.relative(REPO_ROOT, file)}`);
      await ctx.close();
    }
  } finally {
    await browser.close();
  }
  console.log("[capture] ✔ done");
}

main().catch((e) => {
  console.error("[capture] FAILED:", e);
  process.exit(1);
});
