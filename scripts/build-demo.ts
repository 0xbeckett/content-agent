/**
 * Build the whole deliverable from ONE command:
 *
 *   npm run demo
 *
 * Steps, each streaming progress to stdout (never silent under the watchdog):
 *   1. prep — ensure the fal seedance clip is present (cache-aware; no re-spend).
 *   2. render — the BeckettDemo composition at `final` (1920x1080 h264, veryfast).
 *   3. compress — a Discord-safe copy under 9MB (server caps uploads at 10MB).
 *
 * Prints both delivery paths + sizes at the end.
 */
import { spawn } from "node:child_process";
import { stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { compressToTarget, probeDuration } from "../src/lib/ffmpeg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const OUT = path.join(REPO_ROOT, "out");

function step(cmd: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log(`\n[demo] $ ${cmd} ${args.join(" ")}`);
    const child = spawn(cmd, args, { cwd: REPO_ROOT, stdio: "inherit" });
    child.on("error", reject);
    child.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} exited ${code}`))));
  });
}

const mb = (n: number) => (n / 1024 / 1024).toFixed(2) + " MB";

async function main() {
  const t0 = Date.now();
  await step("npx", ["tsx", "scripts/prep-assets.ts"]);
  await step("npx", ["tsx", "scripts/render.ts", "BeckettDemo", "final"]);

  const full = path.join(OUT, "BeckettDemo-final.mp4");
  const discord = path.join(OUT, "BeckettDemo-discord.mp4");

  console.log("\n[demo] compressing a Discord-safe copy (<9MB)…");
  await compressToTarget(full, discord, 9 * 1024 * 1024, { scaleWidth: 1280 });

  const [f, d, dur] = await Promise.all([stat(full), stat(discord), probeDuration(full)]);
  const secs = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(`\n[demo] ✔ done in ${secs}s · duration ${dur.toFixed(1)}s`);
  console.log(`[demo]   full-quality : ${path.relative(REPO_ROOT, full)}  (${mb(f.size)})`);
  console.log(`[demo]   discord-safe : ${path.relative(REPO_ROOT, discord)}  (${mb(d.size)})`);
  if (d.size > 9 * 1024 * 1024) {
    console.error("[demo] WARNING: discord copy exceeds 9MB — tighten the budget.");
    process.exit(2);
  }
}

main().catch((e) => {
  console.error("[demo] FAILED:", e);
  process.exit(1);
});
