/**
 * Smoke composition — 5 seconds that exercise the whole chain:
 * brand tokens → Remotion frames → (ffmpeg transcode, done by the render script).
 *
 * Deliberately uses all three type faces and the chunky pixel-art chrome so a
 * successful render proves fonts, palette and chrome tokens all resolve headlessly.
 */
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { chrome, fonts, lavender, mint, palette } from "../brand";
import "../fonts";

const FIELD = [
  lavender.l1, lavender.l0, lavender.l2, lavender.l3,
  lavender.l4, lavender.l2, lavender.l0, lavender.l1,
];

export const Smoke: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const enter = spring({ frame, fps, config: { damping: 18, mass: 0.7 } });
  const cardY = interpolate(enter, [0, 1], [60, 0]);
  const cardScale = interpolate(enter, [0, 1], [0.9, 1]);

  const cursorOn = Math.floor(frame / 15) % 2 === 0;
  const barGrow = interpolate(frame, [30, 90], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Stepped pixel field backdrop — flat blocks, no smooth gradient.
  const cols = 8;
  const cellW = width / cols;

  return (
    <AbsoluteFill style={{ backgroundColor: lavender.l1 }}>
      <AbsoluteFill style={{ flexDirection: "row" }}>
        {FIELD.map((c, i) => (
          <div
            key={i}
            style={{
              width: cellW,
              height,
              backgroundColor: c,
              opacity: 0.5,
            }}
          />
        ))}
      </AbsoluteFill>

      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div
          style={{
            transform: `translateY(${cardY}px) scale(${cardScale})`,
            width: 1200,
            padding: "72px 88px",
            backgroundColor: lavender.l0,
            border: chrome.border,
            borderRadius: chrome.radius,
            boxShadow: chrome.chunkyShadow,
            display: "flex",
            flexDirection: "column",
            gap: 28,
          }}
        >
          <div
            style={{
              fontFamily: fonts.pixel.stack,
              fontSize: 34,
              letterSpacing: 4,
              color: palette.dim,
            }}
          >
            CONTENT-AGENT · SMOKE TEST
          </div>

          <div
            style={{
              fontFamily: fonts.display.stack,
              fontWeight: fonts.display.weight,
              fontSize: 132,
              lineHeight: 1,
              color: palette.ink,
            }}
          >
            0xbeckett
            <span style={{ color: mint.m3 }}>{cursorOn ? "_" : " "}</span>
          </div>

          <div
            style={{
              fontFamily: fonts.body.stack,
              fontSize: 30,
              color: palette.dim,
              maxWidth: 900,
            }}
          >
            Remotion frames, ffmpeg passes, fal shots — one headless pipeline. No
            browser, no timeline, no clicking around.
          </div>

          {/* Chunky progress bar — hard edges, inset highlight. */}
          <div
            style={{
              marginTop: 12,
              height: 40,
              width: "100%",
              backgroundColor: lavender.l3,
              border: chrome.border,
              boxShadow: chrome.insetShade,
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${barGrow * 100}%`,
                backgroundColor: mint.m3,
                boxShadow: chrome.insetHighlight,
              }}
            />
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
