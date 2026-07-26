/**
 * Ad primitives — the frame the real screens live inside.
 *
 * Every shot in BeckettAd is a REAL captured surface (see `scripts/capture.mjs`):
 * the live bored board, real PRs, the real dispatcher diff. These components do
 * nothing but present those captures on-brand and move the camera across them —
 * they never draw a fake UI.
 *
 * The captures are dark (bored + GitHub both render dark); the site is pastel
 * lavender. So a screen is inset inside the site's own chunky chrome — 2px ink
 * border, hard `0 4px 0` shadow — floating over the site's sky. The brand holds
 * the frame, the product fills it.
 *
 * Motion is mechanical: linear pans, hard cuts, no bounce, no ease-out drift.
 */
import { Img, staticFile, useCurrentFrame } from "remotion";
import { chrome, fonts, ink, palette, cyan, lavender, format, surface } from "../../brand";
import { lin, stepFade } from "../../lib/motion";

const W = format.width;
const H = format.height;

/** Margin of site-lavender left visible around every screen. */
export const INSET = 46;

/** Native size of a capture: 1920x1080 CSS at 2x DPR. */
export const SRC_W = 3840;
export const SRC_H = 2160;

/**
 * Camera over a capture, in SOURCE pixels.
 * `cx`/`cy` is the source point held at the centre of the viewport; `z` is
 * source-pixels → screen-pixels (z=0.5 fits a full 3840px-wide page across the
 * frame; z=1 is a 2:1 punch-in that stays crisp because the capture is 2x).
 */
export type Cam = { cx: number; cy: number; z: number };

/**
 * A real screen, panned. `from`→`to` is traversed linearly across the shot, so
 * every shot has motion in it and none of them sit still.
 */
export const Screen: React.FC<{
  src: string;
  from: Cam;
  to: Cam;
  dur: number;
  srcW?: number;
  srcH?: number;
}> = ({ src, from, to, dur, srcW = SRC_W, srcH = SRC_H }) => {
  const frame = useCurrentFrame();
  const t = lin(frame, [0, dur], [0, 1]);
  const z = from.z + (to.z - from.z) * t;
  const cx = from.cx + (to.cx - from.cx) * t;
  const cy = from.cy + (to.cy - from.cy) * t;

  const vw = W - INSET * 2;
  const vh = H - INSET * 2;

  return (
    <div
      style={{
        position: "absolute",
        left: INSET,
        top: INSET,
        width: vw,
        height: vh,
        overflow: "hidden",
        border: chrome.border,
        boxShadow: chrome.dropShadow,
        background: ink.ink,
      }}
    >
      <Img
        src={staticFile(src)}
        style={{
          position: "absolute",
          width: srcW * z,
          height: srcH * z,
          left: vw / 2 - cx * z,
          top: vh / 2 - cy * z,
          display: "block",
          maxWidth: "none",
        }}
      />
    </div>
  );
};

/**
 * The one piece of type over a screen: what you are looking at, and its real
 * ref. Site type, site chrome, lowercase. At most a handful of words.
 */
export const Label: React.FC<{ children: React.ReactNode; refText?: string }> = ({
  children,
  refText,
}) => {
  const frame = useCurrentFrame();
  const on = stepFade(frame, 2, 6, 3);
  return (
    <div
      style={{
        position: "absolute",
        left: INSET + 30,
        bottom: INSET + 30,
        opacity: on,
        background: palette.l0,
        border: chrome.border,
        boxShadow: chrome.dropShadow,
        padding: "14px 22px",
        display: "flex",
        flexDirection: "column",
        gap: 4,
      }}
    >
      <span style={{ fontFamily: fonts.pixel.stack, fontSize: 34, color: ink.ink, lineHeight: 1.1 }}>
        {children}
      </span>
      {refText && (
        <span style={{ fontFamily: fonts.mono.stack, fontSize: 21, color: lavender.deep }}>
          {refText}
        </span>
      )}
    </div>
  );
};

/** A shot: a real screen plus its label. */
export const Shot: React.FC<{
  src: string;
  from: Cam;
  to: Cam;
  dur: number;
  srcW?: number;
  srcH?: number;
  label: React.ReactNode;
  refText?: string;
}> = ({ src, from, to, dur, srcW, srcH, label, refText }) => (
  <>
    <Screen src={src} from={from} to={to} dur={dur} srcW={srcW} srcH={srcH} />
    <Label refText={refText}>{label}</Label>
  </>
);

/** The ad's clock — a mechanical cyan bar across the very bottom. */
export const BeatBar: React.FC<{ total: number }> = ({ total }) => {
  const frame = useCurrentFrame();
  return (
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 6, background: surface.line }}>
      <div
        style={{
          height: "100%",
          width: `${lin(frame, [0, total], [0, 100])}%`,
          background: cyan.link,
        }}
      />
    </div>
  );
};

export { W, H };
