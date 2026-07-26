/**
 * Optional fal smoke test — proves generate + cache round-trips WITHOUT spending
 * video credits. Runs one cheap image generation, then a second identical call
 * that must be served from cache (no credits spent).
 *
 *   npx tsx scripts/fal-smoke.ts
 *
 * NOT part of `npm run render`; run it manually. Video generation is never
 * invoked here.
 */
import { generateImage } from "../src/lib/fal";

async function main() {
  const prompt =
    "chunky pixel-art lavender key emblem, flat colors, 2px ink outline, no gradient";
  const opts = { image_size: "square", num_inference_steps: 4 };

  console.log("--- first call (expect MISS + generate) ---");
  const a = await generateImage(prompt, opts);
  console.log("cached:", a.cached, "→", a.relPath);

  console.log("--- second call (expect HIT, no spend) ---");
  const b = await generateImage(prompt, opts);
  console.log("cached:", b.cached, "→", b.relPath);

  if (!b.cached) {
    console.error("FAIL: second identical call was not served from cache");
    process.exit(1);
  }
  console.log("\n✔ fal cache round-trip OK");
}

main().catch((e) => {
  console.error("fal-smoke FAILED:", e);
  process.exit(1);
});
