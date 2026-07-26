/**
 * Isometric voxel engine — a deterministic 2D port of the site's `world.js`.
 *
 * The live site renders the beckett archipelago as instanced 3D voxels (three.js).
 * A headless Remotion render can't lean on WebGL reliably, and the ticket forbids
 * browser automation — so this rebuilds the same voxel LANGUAGE (mint turf over
 * lavender soil, a cabin with lit windows, blossom + pine trees, a pond, a claim
 * flag) as a pure isometric projection drawn with SVG polygons. Same palette, same
 * deterministic seeded noise, so the island reads as the one on 0xbeckett.me.
 *
 * Colours here are the raw voxel-world hexes from world.js's palette `P`, which are
 * the same pastel family as `brand.ts` (mint m0..m3, lavender l*). The brand tokens
 * remain the single source for every piece of UI *chrome*; these are the terrain
 * material, quoted from the world the brand file mirrors.
 */
import { world as VP } from "../brand";

export type Vox = { x: number; y: number; z: number; c: string };
export type Face = { pts: string; fill: string; key: number };

/* The terrain material is the site's own world palette, sourced from brand.ts. */
export { VP };

/* deterministic hash noise — the exact one world.js uses, so geometry matches. */
export function rnd(x: number, y: number, z: number): number {
  let h = (x * 374761393 + y * 668265263 + z * 2246822519) >>> 0;
  h = ((h ^ (h >>> 13)) * 1274126177) >>> 0;
  return h / 4294967295;
}

/* ── colour maths: shade a face by a scalar, keep it hard-edged ── */
function shade(hex: string, f: number): string {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.replace(/(.)/g, "$1$1") : h, 16);
  const r = Math.min(255, Math.round(((n >> 16) & 255) * f));
  const g = Math.min(255, Math.round(((n >> 8) & 255) * f));
  const b = Math.min(255, Math.round((n & 255) * f));
  return `rgb(${r},${g},${b})`;
}

/* ── grid → screen (2:1 isometric). y is up. ── */
export const HW = 1; // tile half-width (unit space; scaled by the caller)
export const QH = 0.5; // tile quarter-height
export const CH = 1; // cube vertical height
const px = (gx: number, gy: number, gz: number) => ({
  x: (gx - gz) * HW,
  y: (gx + gz) * QH - gy * CH,
});
const poly = (...pts: { x: number; y: number }[]) =>
  pts.map((p) => `${p.x.toFixed(3)},${p.y.toFixed(3)}`).join(" ");

/* ── voxel list → painter-sorted faces, interior culled, three faces per cube ──
   Top face brightest, left (south, +z) mid, right (east, +x) darkest — the same
   lit-lambert read as the site, minus the runtime lighting. */
export function buildFaces(vox: Vox[]): { faces: Face[]; bounds: Bounds } {
  const key = (x: number, y: number, z: number) => `${x}|${y}|${z}`;
  const solid = new Set<string>();
  for (const v of vox) solid.add(key(v.x, v.y, v.z));

  const faces: Face[] = [];
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  const track = (p: { x: number; y: number }) => {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  };

  for (const v of vox) {
    const { x, y, z, c } = v;
    // fully buried → skip entirely
    if (
      solid.has(key(x + 1, y, z)) && solid.has(key(x - 1, y, z)) &&
      solid.has(key(x, y + 1, z)) && solid.has(key(x, y - 1, z)) &&
      solid.has(key(x, y, z + 1)) && solid.has(key(x, y, z - 1))
    ) continue;

    const jitter = 0.94 + 0.1 * rnd(x * 3 + 7, y * 5 + 1, z * 7 + 3);
    const depthKey = x + z + y;

    // TOP (y+1 exposed)
    if (!solid.has(key(x, y + 1, z))) {
      const a = px(x, y + 1, z), b = px(x + 1, y + 1, z),
        d = px(x + 1, y + 1, z + 1), e = px(x, y + 1, z + 1);
      [a, b, d, e].forEach(track);
      faces.push({ pts: poly(a, b, d, e), fill: shade(c, 1.0 * jitter), key: depthKey });
    }
    // LEFT / south (+z exposed)
    if (!solid.has(key(x, y, z + 1))) {
      const a = px(x, y + 1, z + 1), b = px(x + 1, y + 1, z + 1),
        d = px(x + 1, y, z + 1), e = px(x, y, z + 1);
      faces.push({ pts: poly(a, b, d, e), fill: shade(c, 0.82 * jitter), key: depthKey });
    }
    // RIGHT / east (+x exposed)
    if (!solid.has(key(x + 1, y, z))) {
      const a = px(x + 1, y + 1, z), b = px(x + 1, y + 1, z + 1),
        d = px(x + 1, y, z + 1), e = px(x + 1, y, z);
      faces.push({ pts: poly(a, b, d, e), fill: shade(c, 0.66 * jitter), key: depthKey });
    }
  }
  faces.sort((p, q) => p.key - q.key);
  return { faces, bounds: { minX, maxX, minY, maxY } };
}

export type Bounds = { minX: number; maxX: number; minY: number; maxY: number };

/* ── terrain builders (simplified from world.js, same shapes & seeds) ── */
function heightAt(gx: number, gy: number, seed: number): number {
  const n =
    Math.sin(gx * 0.42 + seed) * 0.9 +
    Math.cos(gy * 0.47 + seed * 2.3) * 0.8 +
    (rnd(gx, gy, seed | 0) - 0.5) * 1.4;
  return Math.max(0, Math.min(3, Math.round(n * 0.6 + 0.9)));
}

type Tops = { gx: number; gy: number; h: number }[];

function islandBase(vox: Vox[], r: number, seed: number): Tops {
  const tops: Tops = [];
  for (let gx = -r; gx <= r; gx++)
    for (let gy = -r; gy <= r; gy++) {
      const dd = Math.sqrt(gx * gx + gy * gy);
      if (dd > r + (rnd(gx, gy, seed + 9) - 0.5) * 1.6) continue;
      const edge = Math.max(0, 1 - dd / r);
      const h = Math.round(heightAt(gx, gy, seed) * Math.min(1, edge * 2.4));
      for (let z = h; z >= h - 1; z--)
        vox.push({ x: gx, y: z, z: gy, c: (gx + gy + z) & 1 ? VP.grassA : VP.grassB });
      tops.push({ gx, gy, h });
      const depth = Math.round(r * 0.7 + 2);
      for (let d = 1; d <= depth; d++) {
        const rr = r * (1 - d / depth);
        const e = (rnd(gx + seed, gy - seed, d) - 0.5) * 2.2;
        if (dd <= rr + e) {
          const c = d <= 2 ? VP.soilA : d <= depth * 0.55 ? VP.soilB : VP.core;
          vox.push({ x: gx, y: h - 1 - d, z: gy, c });
        }
      }
    }
  return tops;
}
const topAt = (tops: Tops, gx: number, gy: number) => {
  let best = 0;
  for (const t of tops) if (t.gx === gx && t.gy === gy) best = t.h;
  return best;
};

function blossomTree(vox: Vox[], ox: number, oy: number, oz: number, seed: number) {
  for (let z = 0; z < 4; z++) vox.push({ x: ox, y: oy + z, z: oz, c: VP.trunk });
  for (let bx = -3; bx <= 3; bx++)
    for (let by = -3; by <= 3; by++)
      for (let bz = 3; bz <= 7; bz++) {
        const dz = bz - 5, rr = bx * bx + by * by + dz * dz * 1.6;
        if (rr < 8.5 && rnd(bx + seed, by, bz) > 0.18)
          vox.push({
            x: ox + bx, y: oy + bz, z: oz + by,
            c: VP.blossom[Math.abs(bx + by * 2 + bz) % VP.blossom.length],
          });
      }
}
function pineTree(vox: Vox[], ox: number, oy: number, oz: number) {
  for (let z = 0; z < 2; z++) vox.push({ x: ox, y: oy + z, z: oz, c: VP.trunk });
  ([[2, 2], [3, 2], [4, 1], [5, 1], [6, 0]] as const).forEach(([z, rr]) => {
    for (let gx = -rr; gx <= rr; gx++)
      for (let gy = -rr; gy <= rr; gy++)
        if (Math.abs(gx) + Math.abs(gy) <= rr + 0.5)
          vox.push({ x: ox + gx, y: oy + z, z: oz + gy, c: VP.pine[(z + Math.abs(gx)) % VP.pine.length] });
  });
}
function cabin(vox: Vox[], glow: Vox[], ox: number, oy: number, oz: number) {
  for (let gx = 0; gx < 5; gx++)
    for (let gy = 0; gy < 5; gy++)
      for (let gz = 0; gz < 4; gz++)
        if (gx === 0 || gx === 4 || gy === 0 || gy === 4)
          vox.push({ x: ox + gx, y: oy + gz, z: oz + gy, c: (gx + gy) & 1 ? VP.wall : VP.wallD });
  vox.push({ x: ox + 2, y: oy, z: oz + 4, c: VP.wallD });
  glow.push({ x: ox + 1, y: oy + 2, z: oz + 4, c: VP.win });
  glow.push({ x: ox + 3, y: oy + 2, z: oz + 4, c: VP.win });
  for (let inset = 0, gz = 4; inset <= 2; inset++, gz++)
    for (let rx = inset; rx <= 4 - inset; rx++)
      for (let ry = inset; ry <= 4 - inset; ry++)
        vox.push({ x: ox + rx, y: oy + gz, z: oz + ry, c: inset === 0 ? VP.roof : VP.roofD });
  vox.push({ x: ox + 1, y: oy + 6, z: oz + 1, c: VP.stoneD }); // chimney
  vox.push({ x: ox + 1, y: oy + 7, z: oz + 1, c: VP.stone });
  vox.push({ x: ox + 2, y: oy + 7, z: oz + 2, c: VP.stoneD }); // antenna mast
  vox.push({ x: ox + 2, y: oy + 8, z: oz + 2, c: VP.stoneD });
}
function pond(glow: Vox[], ox: number, oz: number) {
  for (let gx = -2; gx <= 2; gx++)
    for (let gy = -2; gy <= 2; gy++)
      if (gx * gx + gy * gy < 5)
        glow.push({ x: ox + gx, y: 0, z: oz + gy, c: (gx + gy) & 1 ? VP.water : VP.waterD });
}
function flag(vox: Vox[], glow: Vox[], ox: number, oy: number, oz: number, ci: number) {
  for (let z = 0; z < 4; z++) vox.push({ x: ox, y: oy + z, z: oz, c: VP.trunk });
  const c = VP.flag[ci % VP.flag.length];
  glow.push({ x: ox + 1, y: oy + 3, z: oz, c });
  glow.push({ x: ox + 2, y: oy + 3, z: oz, c });
  glow.push({ x: ox + 1, y: oy + 2, z: oz, c });
}

export type Island = {
  faces: Face[];
  glowFaces: Face[];
  bounds: Bounds;
  /** beacon tip in grid space, for the tether callback. */
  beacon: { gx: number; gy: number; gz: number };
};

/** The home island: cabin, blossom + pine trees, pond, flag — the site's hero. */
export function makeHomeIsland(r = 8, seed = 7): Island {
  const vox: Vox[] = [];
  const glow: Vox[] = [];
  const tops = islandBase(vox, r, seed);
  const top = (gx: number, gy: number) => topAt(tops, gx, gy) + 1;

  cabin(vox, glow, 1, top(3, 3), 2);
  pond(glow, -4, 4);
  blossomTree(vox, -5, top(-5, -4), -4, seed);
  blossomTree(vox, 5, top(5, -5), -5, seed + 4);
  pineTree(vox, -3, top(-3, -6), -6);
  flag(vox, glow, r - 2, top(r - 2, 0), 0, 0);
  // a scatter of flowers on the turf
  for (let i = 0; i < 10; i++) {
    const gx = Math.round((rnd(i * 3 + 1, seed, 11) - 0.5) * 2 * (r - 2));
    const gy = Math.round((rnd(i * 5 + 2, seed, 17) - 0.5) * 2 * (r - 2));
    if (gx * gx + gy * gy < (r - 2) * (r - 2))
      vox.push({ x: gx, y: top(gx, gy), z: gy, c: VP.flower[((gx * 7 + gy * 13) & 1023) % VP.flower.length] });
  }

  const built = buildFaces(vox);
  const glowBuilt = buildFaces(glow);
  return {
    faces: built.faces,
    glowFaces: glowBuilt.faces,
    bounds: {
      minX: Math.min(built.bounds.minX, glowBuilt.bounds.minX),
      maxX: Math.max(built.bounds.maxX, glowBuilt.bounds.maxX),
      minY: Math.min(built.bounds.minY, glowBuilt.bounds.minY),
      maxY: Math.max(built.bounds.maxY, glowBuilt.bounds.maxY),
    },
    beacon: { gx: 3, gy: top(3, 3) + 9, gz: 4 },
  };
}

/** A small federation satellite — turf, soil, one structure + claim flag. */
export function makeSatellite(kind: "blossom" | "pine", r: number, seed: number, flagIx: number): Island {
  const vox: Vox[] = [];
  const glow: Vox[] = [];
  const tops = islandBase(vox, r, seed);
  const top = (gx: number, gy: number) => topAt(tops, gx, gy) + 1;
  if (kind === "blossom") {
    blossomTree(vox, 0, top(0, 0), 0, seed);
  } else {
    pineTree(vox, 0, top(0, 0), 0);
    pineTree(vox, 2, top(2, 1), 1);
  }
  flag(vox, glow, r - 2, top(r - 2, 0), 0, flagIx);
  const built = buildFaces(vox);
  const glowBuilt = buildFaces(glow);
  return {
    faces: built.faces,
    glowFaces: glowBuilt.faces,
    bounds: built.bounds,
    beacon: { gx: 0, gy: top(0, 0), gz: 0 },
  };
}

/** Project a grid point to the same unit iso space buildFaces uses. */
export const project = (gx: number, gy: number, gz: number) => px(gx, gy, gz);
