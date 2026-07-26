/**
 * BeckettAd — ~19s. An ad, not a showreel.
 *
 * The arc is the product's real arc: an ask lands → the ticket appears on the
 * board → a worker runs → a real diff → a release → PRs → the deployed URL.
 *
 * Every screen in the middle of this piece is a REAL capture of a live surface,
 * taken by `scripts/capture.mjs` and committed under `public/captures/`:
 *
 *   board / board-tall  bored.0xbeckett.me                     (live, read-only)
 *   ticket              bored.0xbeckett.me → ticket #15         (this ticket)
 *   watchdog            0xbeckett/beckett@66390d1               (+16, dispatcher.ts)
 *   release651          0xbeckett/beckett@00a3b75               (release v6.5.1)
 *   pr65-files          BetterWright/betterwright#65            (14 files, +474 −3)
 *   pr7                 frgmt0/bored#7                          (merged)
 *
 * Nothing is mocked, recreated or generated — no fal, no seedance, no live
 * action. Every frame is something a person can go click on right now.
 *
 * The site holds the frame: the pastel sky and the isometric island open and
 * close the piece, and every screen sits inside the site's chunky ink chrome.
 * Cuts are hard, pans are linear — mechanical and confident, never bouncy.
 */
import { AbsoluteFill, Series, useCurrentFrame, useVideoConfig } from "remotion";
import "../fonts";
import { fonts, ink, lavender, sky as skyTokens } from "../brand";
import { lin, stepFade, typed, blink, easeInSteps } from "../lib/motion";
import { IsoWorld } from "./beckett/IsoWorld";
import { Sky } from "./beckett/Sky";
import { LocTag, Wordmark, Disp } from "./beckett/ui";
import { Shot, BeatBar, INSET, W, H } from "./beckett/ad";

/* ───────────────────────── open · the ask lands ───────────────────────── */

const ASK = "he wants an ad, not a showreel";

const Ask: React.FC<{ dur: number }> = ({ dur }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const n = typed(frame, 8, fps, ASK.length, 30);
  const shown = ASK.slice(0, n);
  const done = n >= ASK.length;

  // the island drifts up into frame — the site, always underneath the work
  const cy = lin(frame, [0, dur], [H * 0.86, H * 0.80]);
  const unit = lin(frame, [0, dur], [26, 29]);

  return (
    <AbsoluteFill>
      <Sky />
      <IsoWorld unit={unit} cx={W * 0.5} cy={cy} frame={frame} fps={fps} federation={0} />
      <div style={{ position: "absolute", top: 132, left: INSET + 60, opacity: stepFade(frame, 0, 8, 3) }}>
        <LocTag>discord · the ask lands</LocTag>
      </div>
      <div
        style={{
          position: "absolute",
          top: 210,
          left: INSET + 60,
          right: INSET + 60,
          fontFamily: fonts.display.stack,
          fontWeight: 600,
          fontSize: 104,
          lineHeight: 1.06,
          color: ink.ink,
        }}
      >
        {shown}
        {!done && blink(frame, 7) && <span style={{ color: lavender.deep }}>▍</span>}
      </div>
      <div
        style={{
          position: "absolute",
          top: 372,
          left: INSET + 60,
          fontFamily: fonts.mono.stack,
          fontSize: 26,
          color: lavender.deep,
          opacity: stepFade(frame, dur - 22, 8, 3),
        }}
      >
        bored.0xbeckett.me · #15
      </div>
    </AbsoluteFill>
  );
};

/* ───────────────────────── close · the wordmark ───────────────────────── */

const Close: React.FC<{ dur: number }> = ({ dur }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const night = easeInSteps(frame, [0, dur * 0.7], [0, 0.42], 5);
  const unit = lin(frame, [0, dur], [30, 34]);
  const markIn = stepFade(frame, 6, 12, 4);
  const subIn = stepFade(frame, 26, 12, 4);

  return (
    <AbsoluteFill>
      <Sky night={night} />
      <IsoWorld
        unit={unit}
        cx={W * 0.5}
        cy={H * 0.78}
        frame={frame}
        fps={fps}
        federation={easeInSteps(frame, [4, dur * 0.8], [0, 1], 5)}
      />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "flex-start", flexDirection: "column", paddingTop: 190, gap: 22 }}>
        <div style={{ opacity: markIn }}>
          <Wordmark size={54} color={ink.ink} />
        </div>
        <Disp style={{ fontSize: 116, color: ink.ink, lineHeight: 1, opacity: markIn }}>lets beckett</Disp>
        <span style={{ fontFamily: fonts.mono.stack, fontSize: 30, color: lavender.deep, opacity: subIn }}>
          0xbeckett.me
        </span>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* ───────────────────────── the cut ───────────────────────── */

/**
 * The shot list. `d` is frames @30fps — every beat lands in well under 2s.
 * Cameras are in SOURCE pixels of each 3840x2160 capture (see `beckett/ad.tsx`).
 */
const SHOTS = [
  { d: 60, el: (d: number) => <Ask dur={d} /> },

  // the board — real state, #15 sitting in progress
  {
    d: 36,
    el: (d: number) => (
      <Shot
        src="captures/board.png"
        from={{ cx: 1900, cy: 520, z: 0.5 }}
        to={{ cx: 1860, cy: 470, z: 0.56 }}
        dur={d}
        label="the board"
        refText="bored.0xbeckett.me"
      />
    ),
  },
  // punch onto this very ticket
  {
    d: 30,
    el: (d: number) => (
      <Shot
        src="captures/board.png"
        from={{ cx: 1570, cy: 350, z: 1.14 }}
        to={{ cx: 1600, cy: 336, z: 1.26 }}
        dur={d}
        label="#15 · in progress"
        refText="cut the fast ad comp"
      />
    ),
  },
  // the ticket, staffed
  {
    d: 33,
    el: (d: number) => (
      <Shot
        src="captures/ticket.png"
        from={{ cx: 3230, cy: 380, z: 1.45 }}
        to={{ cx: 3230, cy: 455, z: 1.45 }}
        dur={d}
        label="staffed"
        refText="human gate · awaiting a verdict"
      />
    ),
  },
  // its journal, live
  {
    d: 42,
    el: (d: number) => (
      <Shot
        src="captures/ticket.png"
        from={{ cx: 3230, cy: 1150, z: 1.45 }}
        to={{ cx: 3230, cy: 1900, z: 1.45 }}
        dur={d}
        label="journal · live"
        refText="#15 · run parked"
      />
    ),
  },
  // a real fix, on a real commit
  {
    d: 30,
    el: (d: number) => (
      <Shot
        src="captures/watchdog.png"
        from={{ cx: 950, cy: 580, z: 1.0 }}
        to={{ cx: 950, cy: 665, z: 1.0 }}
        dur={d}
        label="the fix"
        refText="0xbeckett/beckett@66390d1 · verified"
      />
    ),
  },
  {
    d: 42,
    el: (d: number) => (
      <Shot
        src="captures/watchdog.png"
        from={{ cx: 2100, cy: 1250, z: 0.85 }}
        to={{ cx: 2100, cy: 1800, z: 0.85 }}
        dur={d}
        label="+16"
        refText="src/dispatch/dispatcher.ts"
      />
    ),
  },
  // shipped
  {
    d: 36,
    el: (d: number) => (
      <Shot
        src="captures/release651.png"
        from={{ cx: 950, cy: 580, z: 1.0 }}
        to={{ cx: 950, cy: 665, z: 1.0 }}
        dur={d}
        label="shipped"
        refText="beckett v6.5.1 · 00a3b75"
      />
    ),
  },
  // opened upstream
  {
    d: 33,
    el: (d: number) => (
      <Shot
        src="captures/pr65-files.png"
        from={{ cx: 1330, cy: 520, z: 0.7 }}
        to={{ cx: 1330, cy: 640, z: 0.7 }}
        dur={d}
        label="upstream"
        refText="BetterWright/betterwright#65"
      />
    ),
  },
  {
    d: 39,
    el: (d: number) => (
      <Shot
        src="captures/pr65-files.png"
        from={{ cx: 1300, cy: 1000, z: 0.8 }}
        to={{ cx: 1300, cy: 1700, z: 0.8 }}
        dur={d}
        label="14 files · +474 −3"
        refText="named, lockable browser profiles"
      />
    ),
  },
  // merged
  {
    d: 36,
    el: (d: number) => (
      <Shot
        src="captures/pr7.png"
        from={{ cx: 1330, cy: 520, z: 0.73 }}
        to={{ cx: 1330, cy: 655, z: 0.73 }}
        dur={d}
        label="merged"
        refText="frgmt0/bored#7"
      />
    ),
  },
  // everything already done, flying past
  {
    d: 42,
    el: (d: number) => (
      <Shot
        src="captures/board-tall.png"
        srcH={3254}
        from={{ cx: 3080, cy: 850, z: 1.2 }}
        to={{ cx: 3080, cy: 2050, z: 1.2 }}
        dur={d}
        label="12 done"
        refText="this week"
      />
    ),
  },
  // the deploy, live
  {
    d: 30,
    el: (d: number) => (
      <Shot
        src="captures/board.png"
        from={{ cx: 1150, cy: 300, z: 0.8 }}
        to={{ cx: 1320, cy: 300, z: 0.8 }}
        dur={d}
        label="live"
        refText="bored.0xbeckett.me"
      />
    ),
  },

  { d: 72, el: (d: number) => <Close dur={d} /> },
] as const;

export const AD_DURATION = SHOTS.reduce((n, s) => n + s.d, 0);

export const BeckettAd: React.FC = () => (
  <AbsoluteFill style={{ background: skyTokens.morning[2] }}>
    <Series>
      {SHOTS.map((s, i) => (
        <Series.Sequence key={i} durationInFrames={s.d}>
          {s.el(s.d)}
        </Series.Sequence>
      ))}
    </Series>
    <BeatBar total={AD_DURATION} />
  </AbsoluteFill>
);
