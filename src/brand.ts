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
} as const;

/** Mint accents. */
export const mint = {
  m0: "#a9d6b3",
  m1: "#b7e2c1",
  m2: "#9bc9a6",
  m3: "#8fbf9b",
} as const;

/** Cyan accents. `deep` is the near-black teal used for contrast. */
export const cyan = {
  c0: "#e6f4f6",
  c1: "#bfe6ee",
  c2: "#8fd8de",
  deep: "#173237",
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
