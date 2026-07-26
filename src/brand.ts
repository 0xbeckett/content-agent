/**
 * 0xbeckett.me design tokens.
 *
 * Single source of truth for palette, type and chrome. Every composition reads
 * from here — no hardcoded hex anywhere else. Mirrors `web/public/page.css` on
 * the live site.
 */

/** Ink + greys — text and borders. */
export const ink = {
  ink: "#2b2743",
  dim: "#565170",
  faint: "#8b87a3",
} as const;

/**
 * Lavender field — the primary palette. Ordered lightest → deepest as it appears
 * in the site's gradient field.
 */
export const lavender = {
  l0: "#e9e4f6",
  l1: "#f2f0fa",
  l2: "#e4ddf5",
  l3: "#d9cff0",
  l4: "#cfc8e8",
  l5: "#c4b3da",
  l6: "#b9a8e8",
  l7: "#b3aad4",
  l8: "#a392bf",
  l9: "#8d7daa",
  /** `--lv-deep` — the readable deep lavender the site uses for links + loc tags. */
  deep: "#7a68b8",
} as const;

/** Mint accents. */
export const mint = {
  m0: "#a9d6b3",
  m1: "#b7e2c1",
  m2: "#9bc9a6",
  m3: "#8fbf9b",
} as const;

/** Cyan accents. `deep` is the near-black teal used for contrast; `link` is the
 * readable mid-teal (`--cy-deep`) the site uses for links and label text. */
export const cyan = {
  c0: "#e6f4f6",
  c1: "#bfe6ee",
  c2: "#8fd8de",
  deep: "#173237",
  link: "#3f96a2",
} as const;

/**
 * The voxel-world material — the exact palette `world.js` paints the archipelago
 * with (turf, soil, cabin, trees, pond, flags). The same pastel family as the
 * palettes above; pinned here so the video's terrain colours have a single source
 * too. The site is the world, so the world's palette belongs in the brand file.
 */
export const world = {
  grassA: mint.m1,
  grassB: mint.m0,
  grassC: mint.m3,
  soilA: "#cbbadf",
  soilB: "#b9a7d1",
  core: lavender.l8,
  trunk: "#bc9f8c",
  blossom: ["#dcc9f4", "#cfb9ee", "#e9d7f8", "#f2dcf0"],
  pine: ["#9ed8c3", "#8ccab2", "#7dbda3"],
  wall: "#f7f0e0",
  wallD: "#ebe2cd",
  roof: "#b3a4dd",
  roofD: "#a090d0",
  win: "#ffe2a1",
  water: "#a9e3ea",
  waterD: "#99dae2",
  stone: "#c9c4d9",
  stoneD: "#b6b0cc",
  flower: ["#f4c9d9", "#ffe2a1", "#cfb9ee", "#ffffff"],
  flag: [cyan.c2, "#cfb9ee", "#f4c9d9", "#ffe2a1", "#9ed8c3"],
  beacon: "#8fe8f0",
  arc: "#9a86d8",
  packet: "#4ea9b3",
} as const;

/**
 * The sky, as CSS — the exact `html{background:…}` gradient stops from the site,
 * plus the nightfall stops the day cycle keyframes toward at the CTA. Used by the
 * open (morning) and close (nightfall) scenes.
 */
export const sky = {
  morning: ["#bfe6ee", "#d3e2f2", "#e4ddf5", "#d9cff0"],
  night: ["#2e2952", "#4c4480", "#6a5d99", "#4a4074"],
  scrim: "rgba(244,247,252,.62)",
} as const;

/**
 * Real-artifact chrome. The demo shows Beckett's ACTUAL surfaces — Discord,
 * GitHub, unified diffs — and the whole point is that they're true, so they wear
 * their real platform colours rather than being recoloured off-brand. Pinned here
 * so even the artifact chrome has a single source and no raw hex leaks into a
 * component.
 */
export const artifact = {
  // Discord
  discordBg: "#313338",
  discordBg2: "#2b2d31",
  discordChannel: "#1e1f22",
  discordText: "#dbdee1",
  discordMuted: "#949ba4",
  discordName: "#f2f3f5",
  discordLink: "#00a8fc",
  discordBlurple: "#5865f2",
  discordGreen: "#23a55a",
  // GitHub (light)
  ghBg: "#ffffff",
  ghText: "#1f2328",
  ghMuted: "#59636e",
  ghBorder: "#d1d9e0",
  ghCanvas: "#f6f8fa",
  ghGreen: "#1f883d",
  ghOpen: "#1a7f37",
  ghPurple: "#8250df",
  ghBlue: "#0969da",
  // Diff
  diffAddBg: "#e6ffec",
  diffAddText: "#1a7f37",
  diffDelBg: "#ffebe9",
  diffDelText: "#cf222e",
  diffHunk: "#ddf4ff",
  diffGutter: "#f6f8fa",
  // Terminal
  termBg: "#171226",
  termText: "#e6f4f6",
  termDim: "#a99fd0",
  termGreen: "#3e9e6e",
} as const;

/** Flat palette — every brand color keyed by name, for convenience. */
export const palette = {
  ...ink,
  ...lavender,
  ...mint,
  ...cyan,
} as const;

/**
 * Type stack. Fonts are bundled locally (see `src/fonts/`) and loaded via
 * `loadFonts()` so a headless render never fetches a webfont mid-render.
 *
 * - display: headings + wordmark
 * - pixel:   labels, nav, buttons, small caps-ish text
 * - body:    prose
 */
export const fonts = {
  display: {
    family: '"Pixelify Sans"',
    weight: 600,
    stack: '"Pixelify Sans", monospace',
  },
  pixel: {
    family: '"DotGothic16"',
    weight: 400,
    stack: '"DotGothic16", monospace',
  },
  body: {
    family: '"Inter"',
    weight: 400,
    stack: '"Inter", system-ui, sans-serif',
  },
} as const;

/**
 * Chunky pixel-art chrome. 2px solid ink borders, hard offset drop shadows,
 * inset highlights. No soft blurs, no decorative gradients, no rounded-everything.
 */
export const chrome = {
  border: `2px solid ${ink.ink}`,
  borderWidth: 2,
  /** Hard offset drop shadow — 0 4px 0 ink. */
  dropShadow: `0 4px 0 ${ink.ink}`,
  /** Inset highlight (top) + inset shade (bottom). */
  insetHighlight: "inset 0 3px 0 rgba(255,255,255,.55)",
  insetShade: "inset 0 -4px 0 rgba(43,39,67,.18)",
  /** All three insets/offsets composed — the full chunky-button look. */
  chunkyShadow: [
    `0 4px 0 ${ink.ink}`,
    "inset 0 3px 0 rgba(255,255,255,.55)",
    "inset 0 -4px 0 rgba(43,39,67,.18)",
  ].join(", "),
  radius: 0,
} as const;

/** Canonical render format. */
export const format = {
  width: 1920,
  height: 1080,
  fps: 30,
} as const;

export const brand = { palette, ink, lavender, mint, cyan, fonts, chrome, format } as const;
export default brand;
