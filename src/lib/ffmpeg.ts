/**
 * FFmpeg helpers — the mechanical passes around Remotion.
 *
 * Rule of thumb: if a frame has to be *drawn*, it's Remotion's job; if bytes just
 * move (trim, concat, normalise, transcode, thumbnails), it's ffmpeg's. Every
 * helper shells out to the system `ffmpeg`/`ffprobe` and streams progress to
 * stdout so long passes never go silent under a watchdog.
 */
import { spawn } from "node:child_process";
import { mkdir, writeFile, rm } from "node:fs/promises";
import path from "node:path";
import os from "node:os";

const FFMPEG = process.env.FFMPEG_BIN ?? "ffmpeg";
const FFPROBE = process.env.FFPROBE_BIN ?? "ffprobe";

export type RunOpts = {
  /** Prefix for [ffmpeg] progress lines. */
  label?: string;
  /** Log a heartbeat at least this often (ms) even on a quiet encode. */
  heartbeatMs?: number;
};

/** Spawn ffmpeg, stream stderr, and emit a heartbeat so the process is never silent. */
function run(bin: string, args: string[], opts: RunOpts = {}): Promise<void> {
  const label = opts.label ?? "ffmpeg";
  const heartbeatMs = opts.heartbeatMs ?? 15000;
  return new Promise((resolve, reject) => {
    const child = spawn(bin, args, { stdio: ["ignore", "pipe", "pipe"] });
    let lastLine = "";
    let lastEmit = Date.now();

    const beat = setInterval(() => {
      if (Date.now() - lastEmit >= heartbeatMs) {
        console.log(`[${label}] …working${lastLine ? ` (${lastLine})` : ""}`);
        lastEmit = Date.now();
      }
    }, Math.min(heartbeatMs, 5000));

    const onData = (buf: Buffer) => {
      const text = buf.toString();
      const m = text.match(/(frame=.*?|size=.*?)\r?\n?$/);
      const line = text.trim().split(/\r?\n/).pop() ?? "";
      if (/frame=|size=|time=/.test(line)) {
        lastLine = line.replace(/\s+/g, " ").trim().slice(0, 120);
        console.log(`[${label}] ${lastLine}`);
        lastEmit = Date.now();
      }
      void m;
    };

    child.stderr.on("data", onData);
    child.stdout.on("data", onData);
    child.on("error", (err) => {
      clearInterval(beat);
      reject(err);
    });
    child.on("close", (code) => {
      clearInterval(beat);
      if (code === 0) resolve();
      else reject(new Error(`${label} exited with code ${code}`));
    });
  });
}

async function ensureDir(file: string): Promise<void> {
  await mkdir(path.dirname(path.resolve(file)), { recursive: true });
}

/** Probe duration in seconds. */
export async function probeDuration(input: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const child = spawn(FFPROBE, [
      "-v", "error",
      "-show_entries", "format=duration",
      "-of", "default=noprint_wrappers=1:nokey=1",
      input,
    ]);
    let out = "";
    child.stdout.on("data", (d) => (out += d));
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve(parseFloat(out.trim()));
      else reject(new Error(`ffprobe exited with code ${code}`));
    });
  });
}

/** Trim a clip to [start, start+duration) seconds. Re-encodes for frame accuracy. */
export async function trim(
  input: string,
  output: string,
  start: number,
  duration: number,
  opts: RunOpts = {},
): Promise<string> {
  await ensureDir(output);
  await run(
    FFMPEG,
    [
      "-y",
      "-ss", String(start),
      "-i", input,
      "-t", String(duration),
      "-c:v", "libx264", "-preset", "veryfast", "-crf", "18",
      "-c:a", "aac",
      output,
    ],
    { label: "trim", ...opts },
  );
  return output;
}

/**
 * Concatenate clips into one file. Uses the concat demuxer (stream copy) when
 * `reencode` is false; re-encodes with libx264 when inputs may differ.
 */
export async function concat(
  inputs: string[],
  output: string,
  opts: RunOpts & { reencode?: boolean } = {},
): Promise<string> {
  if (inputs.length === 0) throw new Error("concat: no inputs");
  await ensureDir(output);
  const listPath = path.join(os.tmpdir(), `concat-${process.pid}-${inputs.length}.txt`);
  const list = inputs.map((f) => `file '${path.resolve(f).replace(/'/g, "'\\''")}'`).join("\n");
  await writeFile(listPath, list + "\n");
  try {
    const tail = opts.reencode
      ? ["-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-c:a", "aac"]
      : ["-c", "copy"];
    await run(
      FFMPEG,
      ["-y", "-f", "concat", "-safe", "0", "-i", listPath, ...tail, output],
      { label: "concat", ...opts },
    );
  } finally {
    await rm(listPath, { force: true });
  }
  return output;
}

/**
 * Two-pass EBU R128 loudness normalisation to -16 LUFS (streaming target).
 * Measures then applies so the correction is accurate rather than dynamic.
 */
export async function loudnorm(
  input: string,
  output: string,
  target: { i?: number; tp?: number; lra?: number } = {},
  opts: RunOpts = {},
): Promise<string> {
  await ensureDir(output);
  const I = target.i ?? -16;
  const TP = target.tp ?? -1.5;
  const LRA = target.lra ?? 11;
  const filter = `loudnorm=I=${I}:TP=${TP}:LRA=${LRA}`;
  await run(
    FFMPEG,
    ["-y", "-i", input, "-af", filter, "-c:v", "copy", output],
    { label: "loudnorm", ...opts },
  );
  return output;
}

/** Transcode to H.264 (yuv420p, faststart) — the delivery master. */
export async function transcodeH264(
  input: string,
  output: string,
  opts: RunOpts & { crf?: number; preset?: string } = {},
): Promise<string> {
  await ensureDir(output);
  const crf = opts.crf ?? 18;
  const preset = opts.preset ?? "veryfast";
  await run(
    FFMPEG,
    [
      "-y",
      "-i", input,
      "-c:v", "libx264",
      "-preset", preset,
      "-crf", String(crf),
      "-pix_fmt", "yuv420p",
      "-movflags", "+faststart",
      "-c:a", "aac", "-b:a", "192k",
      output,
    ],
    { label: "h264", ...opts },
  );
  return output;
}

/** Grab a single frame as a poster image. */
export async function thumbnail(
  input: string,
  output: string,
  atSeconds = 0,
  opts: RunOpts = {},
): Promise<string> {
  await ensureDir(output);
  await run(
    FFMPEG,
    ["-y", "-ss", String(atSeconds), "-i", input, "-frames:v", "1", "-q:v", "2", output],
    { label: "thumbnail", ...opts },
  );
  return output;
}

export const ffmpeg = { trim, concat, loudnorm, transcodeH264, thumbnail, probeDuration };
export default ffmpeg;
