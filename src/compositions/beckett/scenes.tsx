/**
 * The scenes of the BeckettDemo, in order. Each reads from brand tokens only and
 * moves in the pixel-art idiom (hard cuts between beats, eased-in-steps ramps,
 * quantised bobs). The pastel sky is continuous under every product beat, so the
 * artifact cards float in the same world the piece opened in — the site, closer.
 */
import { AbsoluteFill, OffthreadVideo, staticFile, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { fonts, ink, palette, cyan, lavender, mint, chrome, format } from "../../brand";
import { easeInSteps, lin, stepFade, quantize, bob } from "../../lib/motion";
import { IsoWorld } from "./IsoWorld";
import { Sky } from "./Sky";
import { Btn, LocTag, Logo, Wordmark, Disp, Pix } from "./ui";
import { DiscordCard, Mention, DLink, TicketCard, TerminalDiff, PRCard } from "./artifacts";

const W = format.width;
const H = format.height;

/* A soft white wash where copy sits — the site's `.scrim`, as an overlay. */
const Scrim: React.FC<{ opacity?: number }> = ({ opacity = 1 }) => (
  <AbsoluteFill
    style={{
      opacity,
      background:
        "radial-gradient(80% 60% at 30% 38%, rgba(244,247,252,.72), rgba(244,247,252,.28) 55%, transparent 78%)",
      pointerEvents: "none",
    }}
  />
);

/* Section label in the site's loc style, top-left, for the product beats. */
const SectionLoc: React.FC<{ children: React.ReactNode; enter: number }> = ({ children, enter }) => (
  <div style={{ position: "absolute", top: 70, left: 96, opacity: enter, transform: `translateY(${(1 - enter) * -10}px)` }}>
    <LocTag>{children}</LocTag>
  </div>
);

/* Card entrance: stepped slide-up + hard fade. */
function cardEnter(frame: number) {
  return {
    y: easeInSteps(frame, [0, 20], [46, 0], 6),
    opacity: stepFade(frame, 0, 14, 5),
  };
}

/* A product beat: continuous sky + scrim + loc + a centred artifact card. */
const Stage: React.FC<{ loc: React.ReactNode; children: React.ReactNode; caption?: React.ReactNode }> = ({
  loc,
  children,
  caption,
}) => {
  const frame = useCurrentFrame();
  const enter = stepFade(frame, 0, 12, 4);
  const c = cardEnter(frame);
  return (
    <AbsoluteFill>
      <Sky />
      <Scrim opacity={0.9} />
      <SectionLoc enter={enter}>{loc}</SectionLoc>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div style={{ transform: `translateY(${c.y}px)`, opacity: c.opacity, display: "flex", flexDirection: "column", alignItems: "center", gap: 26 }}>
          {children}
          {caption && (
            <div style={{ fontFamily: fonts.pixel.stack, fontSize: 24, color: palette.dim, opacity: stepFade(frame, 22, 10, 4), textAlign: "center" }}>
              {caption}
            </div>
          )}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* ───────────────────────── 1 · SITE → WORLD ───────────────────────── */

export const SiteToWorld: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const pushStart = 96, pushEnd = 205, fedStart = 210, fedEnd = 290;
  const unit = lin(frame, [pushStart, pushEnd], [24, 52]);
  const cx = lin(frame, [pushStart, pushEnd], [W * 0.62, W * 0.5]);
  const cy = lin(frame, [pushStart, pushEnd], [H * 0.74, H * 0.5]);
  const federation = easeInSteps(frame, [fedStart, fedEnd], [0, 1], 5);

  // page chrome leaves quickly and in steps as we get closer
  const chromeOut = 1 - stepFade(frame, pushStart, 52, 5);
  const chromeY = easeInSteps(frame, [pushStart, pushStart + 52], [0, -70], 5);
  const heroLocIn = stepFade(frame, 8, 14, 4);
  const worldLocIn = stepFade(frame, fedStart, 22, 4);

  return (
    <AbsoluteFill>
      <Sky />
      <IsoWorld unit={unit} cx={cx} cy={cy} frame={frame} fps={fps} federation={federation} liveliness={1} />
      <Scrim opacity={0.55 * chromeOut} />

      {/* nav */}
      <div
        style={{
          position: "absolute", top: 0, left: 0, right: 0, opacity: chromeOut,
          transform: `translateY(${chromeY}px)`,
          padding: "26px 56px", display: "flex", alignItems: "center", justifyContent: "space-between",
          background: "linear-gradient(rgba(248,250,254,.9),rgba(248,250,254,.62))",
          borderBottom: `1px solid rgba(43,39,67,.16)`, backdropFilter: "blur(6px)",
        }}
      >
        <Wordmark size={30} />
        <div style={{ display: "flex", gap: 40, fontFamily: fonts.pixel.stack, fontSize: 20, color: palette.dim }}>
          <span>How it works</span>
          <span>Federation</span>
          <span>Coworker as a Service</span>
          <span>GitHub</span>
        </div>
        <Btn variant="primary" style={{ fontSize: 18, padding: "12px 18px" }}>Join the Discord</Btn>
      </div>

      {/* hero copy */}
      <div style={{ position: "absolute", top: H * 0.26, left: 96, maxWidth: 760, opacity: chromeOut, transform: `translateY(${chromeY}px)` }}>
        <div style={{ opacity: heroLocIn, marginBottom: 22 }}>
          <LocTag>home island · morning</LocTag>
        </div>
        <div style={{ fontFamily: fonts.display.stack, fontWeight: 600, fontSize: 92, lineHeight: 1.02, color: ink.ink }}>
          The coworker
          <br />
          <span style={{ background: `linear-gradient(96deg, ${cyan.link}, ${lavender.deep})`, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>
            you can fork.
          </span>
        </div>
        <div style={{ marginTop: 26, fontFamily: fonts.body.stack, fontSize: 26, color: palette.dim, maxWidth: 620, lineHeight: 1.55 }}>
          Drop a goal in Discord. Beckett spins up a fleet of agents, reviews the diff, and ships it signed.
        </div>
        <div style={{ marginTop: 34, display: "flex", gap: 16 }}>
          <Btn variant="primary">Fork it on GitHub »</Btn>
          <Btn variant="ghost">Join the Discord</Btn>
        </div>
      </div>

      {/* world nameplate (after the push) */}
      <div style={{ position: "absolute", top: 92, left: "50%", transform: "translateX(-50%)", opacity: worldLocIn }}>
        <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", gap: 4, background: "rgba(255,255,255,.94)", border: chrome.border, boxShadow: chrome.dropShadow, padding: "10px 18px" }}>
          <span style={{ fontFamily: fonts.pixel.stack, fontSize: 24, color: ink.ink }}>beckett · prime</span>
          <span style={{ fontFamily: fonts.pixel.stack, fontSize: 16, color: lavender.deep }}>home island · this beckett</span>
        </div>
      </div>

      {/* the thesis, quietly, as the world settles */}
      <div style={{ position: "absolute", bottom: 70, left: "50%", transform: "translateX(-50%)", opacity: stepFade(frame, fedStart + 20, 24, 4) }}>
        <span style={{ fontFamily: fonts.pixel.stack, fontSize: 26, color: cyan.deep, letterSpacing: 1 }}>
          the site was always a world. one island is a whole coworker.
        </span>
      </div>
    </AbsoluteFill>
  );
};

/* ───────────────────────── 2 · DISCORD REQUEST ───────────────────────── */

export const DiscordRequest: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const c = cardEnter(frame);
  return (
    <AbsoluteFill>
      <Sky />
      <Scrim opacity={0.9} />
      <SectionLoc enter={stepFade(frame, 0, 12, 4)}>the cabin · ops channel</SectionLoc>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div style={{ transform: `translateY(${c.y}px)`, opacity: c.opacity }}>
          <DiscordCard
            frame={frame}
            fps={fps}
            messages={[
              {
                author: "jason", color: cyan.link, avatar: "j", startFrame: 14,
                text: "@beckett build me a physically accurate black hole. from first principles. no stolen shaders.",
                render: (n) => {
                  const full = "@beckett build me a physically accurate black hole. from first principles. no stolen shaders.";
                  const shown = full.slice(0, n);
                  const rest = shown.replace("@beckett", "");
                  return (
                    <>
                      {shown.startsWith("@beckett") ? <Mention>@beckett</Mention> : null}
                      {shown.startsWith("@beckett") ? rest : shown}
                    </>
                  );
                },
              },
              {
                author: "beckett", color: lavender.deep, avatar: "b", startFrame: 92,
                text: "bet. Schwarzschild geodesics, hand-written GLSL. one worker, xhigh effort.",
                render: (n) => "bet. Schwarzschild geodesics, hand-written GLSL. one worker, xhigh effort.".slice(0, n),
              },
            ]}
          />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* ───────────────────────── 3 · FILED ───────────────────────── */

export const Filed: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <Stage loc="the board · filed" caption="a real ticket, spawned to a worker in its own worktree">
      <TicketCard frame={frame} fps={fps} />
    </Stage>
  );
};

/* ───────────────────────── 4 · WORKTREE / BUILD ───────────────────────── */

export const Worktree: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <Stage loc="the worktree · building" caption="hand-written GLSL, zero dependencies — a real diff">
      <TerminalDiff frame={frame} fps={fps} />
    </Stage>
  );
};

/* ───────────────────────── 5 · PR / REVIEW ───────────────────────── */

export const Review: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <Stage loc="the review · shipping" caption="a second model red-teams the diff before it merges — signed">
      <PRCard frame={frame} fps={fps} />
    </Stage>
  );
};

/* ───────────────────────── 6 · REPLY ───────────────────────── */

export const DiscordReply: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const c = cardEnter(frame);
  return (
    <AbsoluteFill>
      <Sky />
      <Scrim opacity={0.9} />
      <SectionLoc enter={stepFade(frame, 0, 12, 4)}>the cabin · it reports back</SectionLoc>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div style={{ transform: `translateY(${c.y}px)`, opacity: c.opacity }}>
          <DiscordCard
            frame={frame}
            fps={fps}
            messages={[
              {
                author: "beckett", color: lavender.deep, avatar: "b", startFrame: 12,
                text: "deploy → black-hole-opus.0xbeckett.me · live",
                render: (n) => {
                  const shown = "deploy → black-hole-opus.0xbeckett.me · live".slice(0, n);
                  const i = shown.indexOf("black-hole");
                  if (i < 0) return shown;
                  const url = "black-hole-opus.0xbeckett.me";
                  const before = shown.slice(0, i);
                  const link = shown.slice(i, i + url.length);
                  const after = shown.slice(i + url.length);
                  return (<>{before}<DLink>{link}</DLink>{after}</>);
                },
              },
              {
                author: "beckett", color: lavender.deep, avatar: "b", startFrame: 74,
                text: "shipped ✓  an actual black hole, from scratch, before lunch.",
                render: (n) => {
                  const shown = "shipped ✓  an actual black hole, from scratch, before lunch.".slice(0, n);
                  return shown.startsWith("shipped ✓")
                    ? (<><span style={{ color: mint.m3, fontWeight: 700 }}>shipped ✓</span>{shown.slice("shipped ✓".length)}</>)
                    : shown;
                },
              },
            ]}
          />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* ───────────────────────── 7 · LIVE ACTION (fal seedance) ───────────────────────── */

export const LiveAction: React.FC = () => {
  const frame = useCurrentFrame();
  const c = cardEnter(frame);
  const vw = 1440, vh = 810;
  return (
    <AbsoluteFill>
      <Sky />
      <Scrim opacity={0.7} />
      <SectionLoc enter={stepFade(frame, 0, 12, 4)}>the same moment · both sides</SectionLoc>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div style={{ transform: `translateY(${c.y}px)`, opacity: c.opacity, display: "flex", flexDirection: "column", alignItems: "center", gap: 22 }}>
          <div style={{ width: vw, height: vh, border: chrome.border, boxShadow: chrome.chunkyShadow, overflow: "hidden", background: ink.ink }}>
            <OffthreadVideo
              src={staticFile("generated/seedance.mp4")}
              muted
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", imageRendering: "auto" }}
            />
          </div>
          <div style={{ fontFamily: fonts.pixel.stack, fontSize: 26, color: cyan.deep, opacity: stepFade(frame, 20, 12, 4) }}>
            you, and the machine that showed up. this is what AI should be like.
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* ───────────────────────── 8 · CLOSE ───────────────────────── */

export const Close: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const night = easeInSteps(frame, [0, 60], [0.15, 0.9], 6);
  const markBob = bob(frame, fps, 10, 6, 8);
  const markIn = stepFade(frame, 10, 20, 5);
  const letsIn = stepFade(frame, 40, 24, 5);
  const subIn = stepFade(frame, 74, 20, 4);
  const fadeOut = 1 - stepFade(frame, durationInFrames - 14, 14, 5);

  // a scatter of stars for the nightfall close
  const stars = Array.from({ length: 46 }, (_, i) => ({
    x: quantize(((i * 73) % 100) / 100, 40) * W,
    y: quantize(((i * 141) % 45) / 100, 24) * H,
    s: 2 + ((i * 37) % 3),
    tw: (Math.floor(frame / 10) + i) % 3 === 0 ? 0.35 : 0.9,
  }));

  return (
    <AbsoluteFill style={{ opacity: fadeOut }}>
      <Sky night={night} />
      {stars.map((s, i) => (
        <div key={i} style={{ position: "absolute", left: s.x, top: s.y, width: s.s, height: s.s, background: cyan.c0, opacity: night * s.tw }} />
      ))}
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 30 }}>
        <div style={{ opacity: markIn, transform: `translateY(${markBob}px)`, filter: "drop-shadow(0 0 24px rgba(143,232,240,.5))" }}>
          <Logo size={170} />
        </div>
        <div style={{ opacity: letsIn, display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
          <Wordmark size={40} color={lavender.l1} />
          <Disp style={{ fontSize: 132, color: lavender.l1, lineHeight: 1 }}>lets beckett</Disp>
        </div>
        <Pix style={{ fontSize: 26, color: palette.l6, opacity: subIn }}>
          the federation is small and weird. perfect time to show up.
        </Pix>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
