/**
 * Build the ad deliverable from ONE command:
 *
 *   npm run ad
 *
 * Unlike `build-demo.ts` there is no asset-prep step: BeckettAd has no metered
 * or generated inputs. Every screen it shows is a committed real capture under
 * `public/captures/` (regenerate with `node scripts/capture.mjs`), so this runs
 * offline from a clean checkout.
 *
 * Steps, each streaming progress to stdout (never silent under the watchdog):
 *   1. render — BeckettAd at `final` (1920x1080 h264).
 *   2. compress — a Discord-safe copy under 9MB, still full 1080p (no
 *      downscale: the target is a resolution requirement, not just a size one).
 */
import { spawn } from "node:child_process";
import { stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { compressToTarget, probeDuration } from "../src/lib/ffmpeg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const OUT = path.join(REPO_ROOT, "out");

/** Discord caps uploads at 10MB; leave headroom. */
const TARGET_BYTES = 9 * 1024 * 1024;

function step(cmd: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log(`\n[ad] $ ${cmd} ${args.join(" ")}`);
    const child = spawn(cmd, args, { cwd: REPO_ROOT, stdio: "inherit" });
    child.on("error", reject);
    child.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} exited ${code}`))));
  });
}

const mb = (n: number) => (n / 1024 / 1024).toFixed(2) + " MB";

async function main() {
  const t0 = Date.now();
  await step("npx", ["tsx", "scripts/render.ts", "BeckettAd", "final"]);

  const full = path.join(OUT, "BeckettAd-final.mp4");
  const discord = path.join(OUT, "BeckettAd-discord.mp4");

  console.log("\n[ad] compressing a Discord-safe copy (<9MB, still 1080p)…");
  await compressToTarget(full, discord, TARGET_BYTES);

  const [f, d, dur] = await Promise.all([stat(full), stat(discord), probeDuration(full)]);
  const secs = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(`\n[ad] ✔ done in ${secs}s · duration ${dur.toFixed(1)}s`);
  console.log(`[ad]   full-quality : ${path.relative(REPO_ROOT, full)}  (${mb(f.size)})`);
  console.log(`[ad]   discord-safe : ${path.relative(REPO_ROOT, discord)}  (${mb(d.size)})`);

  if (dur < 15 || dur > 30) {
    console.error(`[ad] WARNING: duration ${dur.toFixed(1)}s is outside the 15–30s brief.`);
    process.exit(2);
  }
  if (d.size > 10 * 1024 * 1024) {
    console.error("[ad] WARNING: discord copy exceeds 10MB — tighten the budget.");
    process.exit(2);
  }
}

main().catch((e) => {
  console.error("[ad] FAILED:", e);
  process.exit(1);
});
