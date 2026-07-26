/**
 * Thin fal.ai wrapper with content-addressed caching.
 *
 * `generateImage` / `generateVideo` call fal, download the result into
 * `assets/generated/`, and record it in a committed manifest keyed by a hash of
 * (model, prompt, opts). A second call with identical inputs returns the cached
 * file without spending credits — a cache hit is always logged.
 *
 * FAL_KEY is read from the environment. It is never printed or persisted.
 *
 * This module shells out to the network + filesystem; it runs under Node (via the
 * render/prep scripts), NOT inside a Remotion browser render. Compositions consume
 * the downloaded files through `staticFile()` / the returned path.
 */
import { createHash } from "node:crypto";
import { createWriteStream } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { fileURLToPath } from "node:url";
import { fal } from "@fal-ai/client";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..", "..");
const GENERATED_DIR = path.join(REPO_ROOT, "assets", "generated");
const MANIFEST_PATH = path.join(GENERATED_DIR, "cache.json");

/** Default models. Override per-call via opts.model. */
export const DEFAULT_IMAGE_MODEL = "fal-ai/flux/schnell";
export const DEFAULT_VIDEO_MODEL = "fal-ai/ltx-video";

export type GenerateOpts = {
  /** fal model id; falls back to the kind's default. */
  model?: string;
  /** Any extra fal input params (image_size, num_inference_steps, seed, …). */
  [key: string]: unknown;
};

export type CacheEntry = {
  key: string;
  kind: "image" | "video";
  model: string;
  prompt: string;
  /** Opts excluding `model` — model is captured separately in the hash. */
  opts: Record<string, unknown>;
  /** Path relative to the repo root, e.g. assets/generated/<key>.png. */
  file: string;
  /** Origin URL returned by fal (for provenance; not re-fetched on cache hit). */
  sourceUrl: string;
  createdAt: string;
};

export type GenerateResult = {
  /** Absolute path to the downloaded file. */
  path: string;
  /** Path relative to repo root — hand this to staticFile() after copying to public/. */
  relPath: string;
  /** True when served from cache (no credits spent). */
  cached: boolean;
  entry: CacheEntry;
};

type Manifest = { entries: Record<string, CacheEntry> };

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`).join(",")}}`;
}

/** Content hash of (model, prompt, opts) — the cache key. */
export function cacheKey(model: string, prompt: string, opts: Record<string, unknown>): string {
  const payload = stableStringify({ model, prompt, opts });
  return createHash("sha256").update(payload).digest("hex").slice(0, 16);
}

async function readManifest(): Promise<Manifest> {
  if (!existsSync(MANIFEST_PATH)) return { entries: {} };
  try {
    return JSON.parse(await readFile(MANIFEST_PATH, "utf8")) as Manifest;
  } catch {
    return { entries: {} };
  }
}

async function writeManifest(manifest: Manifest): Promise<void> {
  await mkdir(GENERATED_DIR, { recursive: true });
  // Stable key ordering keeps the committed manifest diff-friendly.
  const ordered: Manifest = { entries: {} };
  for (const k of Object.keys(manifest.entries).sort()) ordered.entries[k] = manifest.entries[k];
  await writeFile(MANIFEST_PATH, JSON.stringify(ordered, null, 2) + "\n");
}

async function download(url: string, dest: string): Promise<void> {
  await mkdir(path.dirname(dest), { recursive: true });
  const res = await fetch(url);
  if (!res.ok || !res.body) throw new Error(`Download failed (${res.status}) for ${url}`);
  await pipeline(Readable.fromWeb(res.body as any), createWriteStream(dest));
}

function extFromUrl(url: string, fallback: string): string {
  const clean = url.split("?")[0];
  const ext = path.extname(clean);
  return ext && ext.length <= 5 ? ext : fallback;
}

function ensureKey(): void {
  if (!process.env.FAL_KEY) {
    throw new Error("FAL_KEY is not set in the environment.");
  }
}

/** Pull the first media URL out of a fal result, across the common response shapes. */
function extractUrl(data: any, kind: "image" | "video"): string {
  const candidates =
    kind === "image"
      ? [data?.images?.[0]?.url, data?.image?.url, data?.url]
      : [data?.video?.url, data?.videos?.[0]?.url, data?.url];
  const url = candidates.find((u: unknown) => typeof u === "string" && u.length > 0);
  if (!url) throw new Error(`No ${kind} URL in fal response: ${JSON.stringify(data).slice(0, 200)}`);
  return url as string;
}

async function generate(
  kind: "image" | "video",
  prompt: string,
  opts: GenerateOpts,
  defaultModel: string,
  defaultExt: string,
): Promise<GenerateResult> {
  const { model: modelOpt, ...rest } = opts;
  const model = modelOpt ?? defaultModel;
  const key = cacheKey(model, prompt, rest);

  const manifest = await readManifest();
  const hit = manifest.entries[key];
  if (hit && existsSync(path.join(REPO_ROOT, hit.file))) {
    console.log(`[fal] cache HIT ${key} (${kind}) — ${hit.file} — no credits spent`);
    return {
      path: path.join(REPO_ROOT, hit.file),
      relPath: hit.file,
      cached: true,
      entry: hit,
    };
  }

  ensureKey();
  console.log(`[fal] cache MISS ${key} (${kind}) — generating via ${model}…`);

  const result: any = await fal.subscribe(model, {
    input: { prompt, ...rest },
    logs: false,
  });
  const sourceUrl = extractUrl(result?.data ?? result, kind);
  const ext = extFromUrl(sourceUrl, defaultExt);
  const relPath = path.join("assets", "generated", `${key}${ext}`);
  const dest = path.join(REPO_ROOT, relPath);
  await download(sourceUrl, dest);

  const entry: CacheEntry = {
    key,
    kind,
    model,
    prompt,
    opts: rest,
    file: relPath,
    sourceUrl,
    createdAt: new Date().toISOString(),
  };
  manifest.entries[key] = entry;
  await writeManifest(manifest);
  console.log(`[fal] generated ${key} → ${relPath}`);

  return { path: dest, relPath, cached: false, entry };
}

/** Generate (or fetch from cache) a still image. */
export function generateImage(prompt: string, opts: GenerateOpts = {}): Promise<GenerateResult> {
  return generate("image", prompt, opts, DEFAULT_IMAGE_MODEL, ".png");
}

/**
 * Generate (or fetch from cache) a video clip.
 *
 * NOTE: video generation spends metered credits and is intentionally NOT invoked
 * anywhere in the pipeline yet — that lands in a later branch with its own cap.
 */
export function generateVideo(prompt: string, opts: GenerateOpts = {}): Promise<GenerateResult> {
  return generate("video", prompt, opts, DEFAULT_VIDEO_MODEL, ".mp4");
}

export const paths = { GENERATED_DIR, MANIFEST_PATH, REPO_ROOT };
