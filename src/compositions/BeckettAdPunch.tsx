/**
 * BeckettAdPunch — ~16s. The 1-2 punch recut of the ad.
 *
 * BeckettAd (still registered, still renders) is a montage: things happen, but
 * nothing is asked for first. This cut is built out of PAIRS instead.
 *
 *   beat one — the ask.    A simulated chat message, real quoted text, ~1s.
 *   beat two — the result. The real artifact, HARD CUT in, held about as long.
 *
 * Ask, result. Ask, result. Four times, tightening as it goes: the last pair
 * runs ~30% quicker than the first. There is no dissolve anywhere between the
 * two halves of a pair — the cut is the punch.
 *
 * WHAT IS REAL HERE
 * Every asking message is quoted verbatim from the real conversation on
 * 2026-07-26 and stamped with the real UTC clock of the record it produced.
 * Every result frame is a real capture taken by `scripts/capture.mjs` against a
 * live page, or a real commit on GitHub:
 *
 *   board-v2   bored.0xbeckett.me                        (live, read-only)
 *   t12        bored.0xbeckett.me/tickets/%2312          (#12, done — the bored UI)
 *   watchdog   0xbeckett/beckett@66390d1                 (+16, the `finishing` set)
 *   release651 0xbeckett/beckett@00a3b75                 (beckett v6.5.1)
 *   pr65-v2    BetterWright/betterwright#65              (real page, real state)
 *   pr65-files  ↳ 14 files, +474 −3
 *   t16        bored.0xbeckett.me/tickets/%2316          (this ticket, live)
 *
 * Nothing is mocked, recreated or generated. PR #65's real state on the page is
 * closed, so this cut says "filed upstream" and lets the page say the rest — a
 * merge badge it does not have is exactly the thing we will not fake.
 *
 * EFFECTS BUDGET (hard constraint)
 * Hard cuts; stepped opacity fades ≤6 frames; linear camera pans over the
 * captures; ≤10px translates; <10% zoom drift; one 5-frame accent wipe on the
 * frame edge as a result lands. No 3D, no particles, no blur, no long eases, no
 * zoom-punch stacking. If a move does not sell the beat it is not here.
 */
import { AbsoluteFill, useCurrentFrame } from "remotion";
import "../fonts";
import { chat, cyan, fonts } from "../brand";
import { lin, stepFade } from "../lib/motion";
import { Cut, Hold } from "../lib/edit";
import { Screen, Label, INSET, type Cam } from "./beckett/ad";
import { ChatBeat } from "./beckett/chat";
import { Wordmark } from "./beckett/ui";

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
        maxWidth: 1920 - INSET * 2,
        background: cyan.c2,
      }}
    />
  );
};

/**
 * The payoff half of a pair: a real capture, panned linearly, labelled once
 * with what it is and its real ref. Hard cut in — no fade from the ask.
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
 * Ends on the public URL, because that is the strongest thing the ad has: the
 * board it just showed you is a link you can open right now. Same dark surface
 * as the chat beats so the piece closes where it opened.
 */
const Close: React.FC = () => {
  const frame = useCurrentFrame();
  // the wordmark hard-cuts in with the shot — no dark frames between the last
  // artifact and the close. only the url and its rule are staged after it.
  const urlOn = stepFade(frame, 8, 6, 6);
  const subOn = stepFade(frame, 22, 6, 6);
  const rule = lin(frame, [14, 20], [0, 560]);

  return (
    <AbsoluteFill style={{ background: chat.bg, alignItems: "center", justifyContent: "center", gap: 34 }}>
      <Wordmark size={56} color={chat.name} />
      <div
        style={{
          opacity: urlOn,
          fontFamily: fonts.display.stack,
          fontWeight: 600,
          fontSize: 96,
          color: chat.text,
          lineHeight: 1,
        }}
      >
        bored.0xbeckett.me
      </div>
      <div style={{ width: rule, height: 6, background: cyan.c2 }} />
      <div
        style={{
          opacity: subOn,
          fontFamily: fonts.mono.stack,
          fontSize: 30,
          color: chat.muted,
        }}
      >
        read-only · live · 0xbeckett.me
      </div>
    </AbsoluteFill>
  );
};

/* ───────────────────────── the cut ───────────────────────── */

/**
 * The pairs. `ask` frames then `hits` frames of artifact, @30fps.
 *
 * Pace accelerates: pair one's ask holds 46 frames (1.5s, including its typing
 * beat), pair four's holds 28 (0.93s). Every artifact is held about as long as
 * the ask that bought it.
 *
 * Cameras are in SOURCE pixels of each capture; captures are 2x DPR, so `z=0.5`
 * is native CSS 1:1 and `z=1` is a 2x punch-in that is still crisp.
 */
type Pair = {
  ask: { dur: number } & Omit<React.ComponentProps<typeof ChatBeat>, "dur">;
  hits: { d: number; el: (d: number) => React.ReactNode }[];
};

const PAIRS: Pair[] = [
  /* ── 1 · the ask that became #12, and the UI it became ──────────────── */
  {
    ask: {
      dur: 46,
      who: "ro",
      glyph: "ro",
      at: "09:33",
      text: "we really should make a proper UI for bored",
      note: "→ #12",
      typing: 12,
    },
    hits: [
      {
        d: 44,
        el: (d) => (
          <Result
            src="captures/board-v2.png"
            from={{ cx: 1920, cy: 1010, z: 0.476 }}
            to={{ cx: 1750, cy: 1080, z: 0.52 }}
            dur={d}
            label="the board"
            refText="bored.0xbeckett.me · 16 tickets"
          />
        ),
      },
      {
        d: 44,
        el: (d) => (
          <Result
            src="captures/t12.png"
            srcH={3462}
            from={{ cx: 3210, cy: 760, z: 1.45 }}
            to={{ cx: 3210, cy: 1450, z: 1.45 }}
            dur={d}
            label="#12 · journal"
            refText="board + ticket detail web ui · done"
          />
        ),
      },
    ],
  },

  /* ── 2 · the bug report, and the commit that closed it ──────────────── */
  {
    ask: {
      dur: 38,
      who: "ro",
      glyph: "ro",
      at: "09:22",
      text: "the staffing watchdog can duplicate-staff a ticket during its finish window",
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
            label="the fix"
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
            label="shipped"
            refText="beckett v6.5.1 · 00a3b75"
          />
        ),
      },
    ],
  },

  /* ── 3 · go file it upstream ────────────────────────────────────────── */
  {
    ask: {
      dur: 30,
      who: "ro",
      glyph: "ro",
      at: "08:51",
      text: "yeah goahead and file a real PR",
      note: "→ BetterWright/betterwright",
    },
    hits: [
      {
        d: 36,
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
        d: 30,
        el: (d) => (
          <Result
            src="captures/pr65-files.png"
            from={{ cx: 1900, cy: 1150, z: 0.75 }}
            to={{ cx: 1900, cy: 1420, z: 0.75 }}
            dur={d}
            label="14 files · +474 −3"
            refText="named, lockable browser profiles"
          />
        ),
      },
    ],
  },

  /* ── 4 · make it a public link — and here it is, live ───────────────── */
  {
    ask: {
      dur: 28,
      who: "ro",
      glyph: "ro",
      at: "09:33",
      text: "bored.0xbeckett.me as a read only link",
      note: "→ read-only mode",
    },
    hits: [
      {
        d: 46,
        el: (d) => (
          <Result
            src="captures/t16.png"
            from={{ cx: 3109, cy: 430, z: 1.25 }}
            to={{ cx: 3109, cy: 500, z: 1.25 }}
            dur={d}
            label="live · read-only"
            refText="bored.0xbeckett.me/tickets/%2316"
          />
        ),
      },
    ],
  },
];

const CLOSE = 70;

/** Flattened shot list — the ad as the renderer sees it. */
const SHOTS: { d: number; el: (d: number) => React.ReactNode }[] = [
  ...PAIRS.flatMap((p) => [
    { d: p.ask.dur, el: (d: number) => <ChatBeat {...p.ask} dur={d} /> },
    ...p.hits,
  ]),
  { d: CLOSE, el: () => <Close /> },
];

export const AD_PUNCH_DURATION = SHOTS.reduce((n, s) => n + s.d, 0);

/** The ad's clock — one mechanical rule across the bottom, no other chrome. */
const BeatBar: React.FC<{ total: number }> = ({ total }) => {
  const frame = useCurrentFrame();
  return (
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 6, background: chat.line }}>
      <div style={{ height: "100%", width: `${lin(frame, [0, total], [0, 100])}%`, background: cyan.link }} />
    </div>
  );
};

export const BeckettAdPunch: React.FC = () => (
  <AbsoluteFill style={{ background: chat.bg }}>
    {/* Every pair is a hard cut — the `Cut`/`Hold` grammar names exactly that:
        back-to-back held shots, no dissolve. (See src/lib/edit.ts.) */}
    <Cut>
      {SHOTS.map((s, i) => (
        <Hold key={i} durationInFrames={s.d}>
          {(d) => s.el(d)}
        </Hold>
      ))}
    </Cut>
    <BeatBar total={AD_PUNCH_DURATION} />
  </AbsoluteFill>
);
