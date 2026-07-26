/**
 * Shared chrome — the site's chunky pixel-art UI, rebuilt as Remotion components.
 * 2px ink borders, hard `0 4px 0` offset shadows, radius 0, the three brand faces.
 * Every colour and font here comes from `brand.ts`.
 */
import { staticFile } from "remotion";
import { chrome, fonts, ink, palette, cyan } from "../../brand";

export const Logo: React.FC<{ size: number }> = ({ size }) => (
  <img src={staticFile("logo.svg")} width={size} height={size} alt="" style={{ display: "block", imageRendering: "pixelated" }} />
);

/** The `home island · morning` style nameplate (`.loc`). */
export const LocTag: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <div
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 12,
      fontFamily: fonts.pixel.stack,
      fontSize: 26,
      color: palette.l9,
      ...style,
    }}
  >
    <svg width={20} height={22} viewBox="0 0 20 22" style={{ flex: "none" }}>
      <path d="M10 1 19 6 10 11 1 6z" fill={cyan.c2} />
      <path d="M1 6v10l9 5V11z" fill="#7a68b8" />
      <path d="M19 6v10l-9 5V11z" fill={palette.l6} />
    </svg>
    {children}
  </div>
);

/** A chunky pixel-art panel (console/card body). */
export const Panel: React.FC<{
  children: React.ReactNode;
  style?: React.CSSProperties;
  bg?: string;
}> = ({ children, style, bg }) => (
  <div
    style={{
      background: bg ?? palette.l0,
      border: chrome.border,
      borderRadius: chrome.radius,
      boxShadow: chrome.dropShadow,
      ...style,
    }}
  >
    {children}
  </div>
);

export const Btn: React.FC<{
  children: React.ReactNode;
  variant?: "primary" | "ghost";
  style?: React.CSSProperties;
}> = ({ children, variant = "primary", style }) => (
  <div
    style={{
      fontFamily: fonts.pixel.stack,
      fontSize: 22,
      lineHeight: 1.2,
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      padding: "16px 24px",
      whiteSpace: "nowrap",
      border: chrome.border,
      color: variant === "primary" ? cyan.deep : ink.ink,
      background: variant === "primary" ? cyan.c2 : "#ffffff",
      boxShadow: chrome.chunkyShadow,
      ...style,
    }}
  >
    {children}
  </div>
);

/** Wordmark: voxel logo + "beckett" in the display face — the nav/footer brand. */
export const Wordmark: React.FC<{ size?: number; color?: string; gap?: number }> = ({
  size = 34,
  color = ink.ink,
  gap = 14,
}) => (
  <div style={{ display: "inline-flex", alignItems: "center", gap }}>
    <Logo size={size} />
    <span style={{ fontFamily: fonts.display.stack, fontWeight: fonts.display.weight, fontSize: size * 1.15, color }}>
      beckett
    </span>
  </div>
);

export const Pix: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <span style={{ fontFamily: fonts.pixel.stack, ...style }}>{children}</span>
);

export const Disp: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <span style={{ fontFamily: fonts.display.stack, fontWeight: fonts.display.weight, ...style }}>{children}</span>
);
