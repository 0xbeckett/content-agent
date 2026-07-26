/**
 * Build the Beckett-as-a-whole ad (#18) from ONE command:
 *
 *   npm run ad:wide            # BeckettAdWide — the five-surface recut (current)
 *   npm run ad:wide -- 2.0     # …with the poster pulled from t=2.0s
 *
 * This is a thin wrapper over `scripts/build-ad.ts` pinned to the BeckettAdWide
 * composition, kept alongside it so the deliverable has a named build. There is
 * no asset-prep step: every screen the comp shows is a committed real capture
 * under `public/captures/` (regenerate with `node scripts/capture.mjs`), so this
 * runs offline from a clean checkout.
 *
 * Steps mirror build-ad.ts exactly — render (1920x1080 h264, crf 18), poster,
 * and a Discord-safe (<9MB, still 1080p) copy only if the master overshoots.
 */
import { spawn } from "node:child_process";
import { stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { compressToTarget, probeDuration, thumbnail } from "../src/lib/ffmpeg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const OUT = path.join(REPO_ROOT, "out");

const COMP = "BeckettAdWide";
/** Discord caps uploads at 10MB; leave headroom. */
const TARGET_BYTES = 9 * 1024 * 1024;
/** The first payoff — the real PR page, mid-push — sells the ad better than the
 * arbitrary midpoint. */
const POSTER_AT = 1.9;

function step(cmd: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log(`\n[ad:wide] $ ${cmd} ${args.join(" ")}`);
    const child = spawn(cmd, args, { cwd: REPO_ROOT, stdio: "inherit" });
    child.on("error", reject);
    child.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} exited ${code}`))));
  });
}

const mb = (n: number) => (n / 1024 / 1024).toFixed(2) + " MB";
const rel = (p: string) => path.relative(REPO_ROOT, p);

async function main() {
  const t0 = Date.now();
  const posterAt = Number(process.argv[2] ?? POSTER_AT);

  await step("npx", ["tsx", "scripts/render.ts", COMP, "final"]);

  const full = path.join(OUT, `${COMP}-final.mp4`);
  const poster = path.join(OUT, `${COMP}-poster.jpg`);
  const discord = path.join(OUT, `${COMP}-discord.mp4`);

  console.log(`\n[ad:wide] poster frame at t=${posterAt}s…`);
  await thumbnail(full, poster, posterAt);

  const dur = await probeDuration(full);
  const f = await stat(full);

  let delivered = full;
  if (f.size > TARGET_BYTES) {
    console.log("\n[ad:wide] compressing a Discord-safe copy (<9MB, still 1080p)…");
    await compressToTarget(full, discord, TARGET_BYTES);
    delivered = discord;
  } else {
    console.log(`\n[ad:wide] master is already ${mb(f.size)} — under the ${mb(TARGET_BYTES)} Discord budget, no second encode.`);
  }

  const d = await stat(delivered);
  const secs = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(`\n[ad:wide] ✔ done in ${secs}s · duration ${dur.toFixed(1)}s`);
  console.log(`[ad:wide]   deliverable : ${rel(delivered)}  (${mb(d.size)})`);
  console.log(`[ad:wide]   poster      : ${rel(poster)}`);
  if (delivered !== full) console.log(`[ad:wide]   master      : ${rel(full)}  (${mb(f.size)})`);

  if (dur < 15 || dur > 25) {
    console.error(`[ad:wide] WARNING: duration ${dur.toFixed(1)}s is outside the 15–25s brief.`);
    process.exit(2);
  }
  if (d.size > 10 * 1024 * 1024) {
    console.error("[ad:wide] WARNING: deliverable exceeds 10MB — tighten the budget.");
    process.exit(2);
  }
}

main().catch((e) => {
  console.error("[ad:wide] FAILED:", e);
  process.exit(1);
});
