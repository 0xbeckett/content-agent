/**
 * BeckettAdWide — ~18s. The Beckett-as-a-whole recut of the ad (#18).
 *
 * The 1-2 punch from BeckettAdPunch landed, so it STAYS: a simulated Discord ask
 * hard-cutting into the real artifact it produced, pairs tightening as they go.
 * What changes is SCOPE. BeckettAdPunch was four beats about the tracker — it read
 * as an ad for `bored`. This cut reads as an ad for Beckett: an autonomous
 * coworker you talk to in Discord that ships real work across many surfaces.
 * `bored` is now ONE beat among five, not the spine.
 *
 * THE FIVE PAIRS (spine = a plain-language Discord ask → the shipped result):
 *   1 · open source   "open a real PR on betterwright, upstream" → PR #65, 14 files, +474 −3
 *   2 · the product   "make a proper UI for bored"              → the live board
 *   3 · self-mod      "you're double-staffing in the finish"    → fixed its own dispatcher, shipped v6.5.1
 *   4 · the web       "what's this all actually cost?"          → metrics.0xbeckett.me, proof of work
 *   5 · the browser   "post the release on X"                   → @beckposting, posting on its own
 * …then it closes on the home island — "the coworker you can fork" — not the board.
 *
 * PR #65 is the featured beat and leads: a real PR opened on someone ELSE's
 * upstream repo (BetterWright/betterwright) is the strongest non-bored proof, so
 * it gets the hook and two hits (the PR page, then its diff).
 *
 * WHAT IS REAL HERE
 * Every asking message is a short ask in ro's register; every result frame is a
 * real capture taken by `scripts/capture.mjs` against a live page (2x DPR), or a
 * real commit on GitHub. Nothing is mocked, recreated, or generated — no fal
 * spend, no invented badges.
 *
 *   pr65-v2 / pr65-files  BetterWright/betterwright#65        (real page, real state)
 *   board-v2             bored.0xbeckett.me                   (live, read-only)
 *   watchdog             0xbeckett/beckett@66390d1            (+16, the `finishing` fix)
 *   release651           0xbeckett/beckett@00a3b75            (beckett v6.5.1)
 *   metrics              metrics.0xbeckett.me                 (live proof-of-work dashboard)
 *   beckposting          x.com/beckposting                    (the browser agent's own account)
 *   island               0xbeckett.me                         (the home island — the close)
 *
 * PR #65's real state on the page is closed, so this cut says "filed upstream" and
 * lets the page say the rest — a merge badge it does not have is exactly the thing
 * we will not fake.
 *
 * EFFECTS BUDGET (hard constraint, per skills/video-editing/SKILL.md)
 * Hard cuts; stepped opacity fades ≤6 frames; linear camera pans over the
 * captures; ≤10px translates; <10% zoom drift; one 5-frame accent wipe on the
 * frame edge as a result lands. No 3D, particles, blur, long eases, or
 * zoom-punch stacking. Silent. If a move does not sell the beat it is not here.
 */
import { AbsoluteFill, useCurrentFrame } from "remotion";
import "../fonts";
import { chat, cyan, fonts, ink, lavender, palette, chrome } from "../brand";
import { lin, stepFade } from "../lib/motion";
import { Cut, Hold, readingHold } from "../lib/edit";
import { format } from "../brand";
import { Screen, Label, INSET, type Cam } from "./beckett/ad";
import { ChatBeat } from "./beckett/chat";
import { Wordmark } from "./beckett/ui";

const FPS = format.fps;

/* ───────────────────────── beat two · the result ───────────────────────── */

/**
 * A thin accent rule that wipes across the top of the frame as the artifact
 * lands. Five frames, linear, then it just sits there. This is the only
 * transition-shaped thing in the piece and it exists to mark the punch.
 */
const AccentWipe: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <div
      style={{
        position: "absolute",
        left: INSET,
        top: INSET,
        height: 6,
        width: `${lin(frame, [0, 5], [0, 100])}%`,
        maxWidth: format.width - INSET * 2,
        background: cyan.c2,
      }}
    />
  );
};

/**
 * The payoff half of a pair: a real capture, panned linearly, labelled once with
 * what it is and its real ref. Hard cut in — no fade from the ask.
 */
const Result: React.FC<{
  src: string;
  from: Cam;
  to: Cam;
  dur: number;
  srcH?: number;
  label: React.ReactNode;
  refText?: string;
}> = ({ src, from, to, dur, srcH, label, refText }) => (
  <>
    <Screen src={src} from={from} to={to} dur={dur} srcH={srcH} />
    <AccentWipe />
    <Label refText={refText}>{label}</Label>
  </>
);

/* ───────────────────────── the close ───────────────────────── */

/**
 * Closes on the home island — `0xbeckett.me` — not on the board. The capture
 * already says what this is ("the coworker you can fork · Drop a goal in Discord.
 * Beckett spins up a fleet of agents, reviews the diff, and ships it signed"), so
 * the close is that real screen, pushed in slowly, with one small CTA plate: the
 * link you can open right now. Same dark accent as the chat beats bridges the cut
 * out of the last artifact.
 */
const CLOSE = 74;
const Close: React.FC = () => {
  const frame = useCurrentFrame();
  const plateOn = stepFade(frame, 20, 6, 6);
  const rule = lin(frame, [26, 32], [0, 320]);
  return (
    <>
      {/* the home island, real, pushed in <10% toward the hero line */}
      <Screen
        src="captures/island.png"
        from={{ cx: 1920, cy: 1040, z: 0.476 }}
        to={{ cx: 1780, cy: 980, z: 0.5 }}
        dur={CLOSE}
      />
      <AccentWipe />
      {/* one CTA plate — the link, in the site's own chunky chrome */}
      <div
        style={{
          position: "absolute",
          left: INSET + 30,
          bottom: INSET + 30,
          opacity: plateOn,
          background: palette.l0,
          border: chrome.border,
          boxShadow: chrome.dropShadow,
          padding: "18px 26px",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <Wordmark size={40} color={ink.ink} />
        <div style={{ width: rule, height: 5, background: cyan.c2 }} />
        <span style={{ fontFamily: fonts.mono.stack, fontSize: 26, color: lavender.deep }}>
          0xbeckett.me · a coworker in your Discord
        </span>
      </div>
    </>
  );
};

/* ───────────────────────── the cut ───────────────────────── */

/**
 * The pairs. `ask` frames then one or more `hits` of artifact, @30fps.
 *
 * Pace accelerates: pair one's ask holds 46 frames (with its typing beat), pair
 * five's holds 28 (~40% quicker), and pair five is the tightest pair overall —
 * the last pair lands fastest. Cameras are in SOURCE pixels of each capture;
 * captures are 2x DPR, so z=0.476 fits a 3840px-wide page and z≥1 is a crisp
 * punch-in. Labels are short so each clears its `readingHold` floor while static.
 */
type Pair = {
  ask: { dur: number } & Omit<React.ComponentProps<typeof ChatBeat>, "dur">;
  hits: { d: number; el: (d: number) => React.ReactNode }[];
};

const PAIRS: Pair[] = [
  /* ── 1 · open source · file a real PR upstream (the featured beat) ──── */
  {
    ask: {
      dur: 46,
      who: "ro",
      glyph: "ro",
      at: "08:51",
      text: "open a real PR on betterwright. upstream, not a fork",
      note: "→ BetterWright/betterwright",
      typing: 12,
    },
    hits: [
      {
        d: 44,
        el: (d) => (
          <Result
            src="captures/pr65-v2.png"
            from={{ cx: 1840, cy: 700, z: 0.8 }}
            to={{ cx: 1840, cy: 820, z: 0.8 }}
            dur={d}
            label="filed upstream"
            refText="BetterWright/betterwright#65"
          />
        ),
      },
      {
        d: 40,
        el: (d) => (
          <Result
            src="captures/pr65-files.png"
            from={{ cx: 1900, cy: 1150, z: 0.75 }}
            to={{ cx: 1900, cy: 1420, z: 0.75 }}
            dur={d}
            label="14 files"
            refText="+474 −3 · named browser profiles"
          />
        ),
      },
    ],
  },

  /* ── 2 · the product · a proper UI for bored (the one tracker beat) ──── */
  {
    ask: {
      dur: 40,
      who: "ro",
      glyph: "ro",
      at: "09:33",
      text: "make a proper UI for bored",
      note: "→ #12",
    },
    hits: [
      {
        d: 48,
        el: (d) => (
          <Result
            src="captures/board-v2.png"
            from={{ cx: 1920, cy: 1010, z: 0.476 }}
            to={{ cx: 1750, cy: 1080, z: 0.52 }}
            dur={d}
            label="the board"
            refText="bored.0xbeckett.me · live"
          />
        ),
      },
    ],
  },

  /* ── 3 · self-modification · a bug in its OWN dispatcher, then shipped ─ */
  {
    ask: {
      dur: 36,
      who: "ro",
      glyph: "ro",
      at: "09:22",
      text: "you're double-staffing tickets in the finish window",
      note: "→ #11",
    },
    hits: [
      {
        d: 42,
        el: (d) => (
          <Result
            src="captures/watchdog.png"
            from={{ cx: 1800, cy: 1380, z: 0.8 }}
            to={{ cx: 1800, cy: 1600, z: 0.8 }}
            dur={d}
            label="fixed itself"
            refText="0xbeckett/beckett@66390d1 · +16"
          />
        ),
      },
      {
        d: 34,
        el: (d) => (
          <Result
            src="captures/release651.png"
            from={{ cx: 1050, cy: 990, z: 0.9 }}
            to={{ cx: 1050, cy: 1140, z: 0.9 }}
            dur={d}
            label="shipped v6.5.1"
            refText="deployed itself · 00a3b75"
          />
        ),
      },
    ],
  },

  /* ── 4 · the web · what did all this cost (proof of work) ───────────── */
  {
    ask: {
      dur: 32,
      who: "ro",
      glyph: "ro",
      at: "09:40",
      text: "what's this all actually cost?",
      note: "→ metrics",
    },
    hits: [
      {
        d: 42,
        el: (d) => (
          <Result
            src="captures/metrics.png"
            srcH={16800}
            from={{ cx: 1920, cy: 760, z: 0.476 }}
            to={{ cx: 1920, cy: 1040, z: 0.476 }}
            dur={d}
            label="proof of work"
            refText="metrics.0xbeckett.me · $2,089 · 623 commits"
          />
        ),
      },
    ],
  },

  /* ── 5 · the browser · post it on X (the fastest pair) ──────────────── */
  {
    ask: {
      dur: 28,
      who: "ro",
      glyph: "ro",
      at: "09:44",
      text: "post the release on X",
      note: "→ @beckposting",
    },
    hits: [
      {
        d: 36,
        el: (d) => (
          <Result
            src="captures/beckposting.png"
            from={{ cx: 1740, cy: 760, z: 1.25 }}
            to={{ cx: 1740, cy: 1020, z: 1.25 }}
            dur={d}
            label="posting live"
            refText="x.com/beckposting · autonomous"
          />
        ),
      },
    ],
  },
];

/** Flattened shot list — the ad as the renderer sees it. */
const SHOTS: { d: number; el: (d: number) => React.ReactNode }[] = [
  ...PAIRS.flatMap((p) => [
    { d: p.ask.dur, el: (d: number) => <ChatBeat {...p.ask} dur={d} /> },
    ...p.hits,
  ]),
  { d: CLOSE, el: () => <Close /> },
];

export const AD_WIDE_DURATION = SHOTS.reduce((n, s) => n + s.d, 0);

/**
 * Dev-time legibility guard: every text label must clear its reading floor while
 * static. Fires only in the studio/preview (never mid-render), so a label that is
 * shortened past legibility or a shot cut below its dwell shows up before render.
 */
if (process.env.NODE_ENV !== "production") {
  const checks: { label: string; dur: number }[] = [
    { label: "filed upstream", dur: 44 },
    { label: "14 files", dur: 40 },
    { label: "the board", dur: 48 },
    { label: "fixed itself", dur: 42 },
    { label: "shipped v6.5.1", dur: 34 },
    { label: "proof of work", dur: 42 },
    { label: "posting live", dur: 36 },
  ];
  for (const c of checks) {
    const floor = readingHold(c.label, FPS);
    if (c.dur < floor) {
      // eslint-disable-next-line no-console
      console.warn(`[BeckettAdWide] label "${c.label}" holds ${c.dur}f < readingHold ${floor}f`);
    }
  }
}

/** The ad's clock — one mechanical rule across the bottom, no other chrome. */
const BeatBar: React.FC<{ total: number }> = ({ total }) => {
  const frame = useCurrentFrame();
  return (
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 6, background: chat.line }}>
      <div style={{ height: "100%", width: `${lin(frame, [0, total], [0, 100])}%`, background: cyan.link }} />
    </div>
  );
};

export const BeckettAdWide: React.FC = () => (
  <AbsoluteFill style={{ background: chat.bg }}>
    {/* Every pair is a hard cut — `Cut`/`Hold` names exactly that: back-to-back
        held shots, no dissolve. (See src/lib/edit.ts.) */}
    <Cut>
      {SHOTS.map((s, i) => (
        <Hold key={i} durationInFrames={s.d}>
          {(d) => s.el(d)}
        </Hold>
      ))}
    </Cut>
    <BeatBar total={AD_WIDE_DURATION} />
  </AbsoluteFill>
);
