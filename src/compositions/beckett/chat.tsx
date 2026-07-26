/**
 * The simulated chat beat — half of every 1-2 punch in `BeckettAdPunch`.
 *
 * These are SIMULATED renders of real messages, not screenshots. The text is
 * quoted verbatim from the real conversation and the timestamp is the real UTC
 * clock on the corresponding tracker/GitHub record — but the pixels are ours.
 *
 * It has to read as chat in under a second, so the layout does that work:
 * avatar, display name, small timestamp, message. The palette is deliberately
 * the site's own dark ink (`brand.chat`) rather than Discord's blurple — this
 * is the Beckett brand having a conversation, not a Discord ripoff.
 *
 * Motion budget is the ad's, not a template's: one stepped opacity fade under 6
 * frames and one ≤10px translate. Nothing else moves.
 */
import { useCurrentFrame } from "remotion";
import { chat, chrome, fonts, ink, lavender, format } from "../../brand";
import { lin, stepFade } from "../../lib/motion";
import { Wordmark } from "./ui";

const W = format.width;

/** Left gutter every chat beat aligns to. */
const GUT = 232;
const AVATAR = 104;

/**
 * A blocky avatar. Square-with-a-notch rather than a circle — the site's chrome
 * has no rounded corners anywhere, so a perfect circle would read as someone
 * else's UI.
 */
const Avatar: React.FC<{ fill: string; glyph: string }> = ({ fill, glyph }) => (
  <div
    style={{
      width: AVATAR,
      height: AVATAR,
      flex: "none",
      background: fill,
      border: chrome.border,
      boxShadow: chrome.dropShadow,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: fonts.display.stack,
      fontWeight: 600,
      fontSize: 46,
      color: ink.ink,
      lineHeight: 1,
    }}
  >
    {glyph}
  </div>
);

/**
 * Typing dots. Three hard squares stepping on an integer cadence — no easing,
 * no pulsing opacity ramp. Used once, on the first pair only, to establish that
 * these beats are a live conversation; every later ask hard-cuts straight in.
 */
export const TypingDots: React.FC = () => {
  const frame = useCurrentFrame();
  const lit = Math.floor(frame / 5) % 3;
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "center", height: 46 }}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            width: 18,
            height: 18,
            background: i === lit ? chat.accent : chat.muted,
            opacity: i === lit ? 1 : 0.45,
          }}
        />
      ))}
    </div>
  );
};

/**
 * The thin bar across the top — enough chrome to place the beat, no more.
 *
 * Deliberately NOT a channel name: the real conversation happens in a channel
 * addressed by id, and inventing a readable `#some-channel` would be inventing
 * something. So the bar says only what is true — this is beckett, in Discord.
 */
const Bar: React.FC = () => (
  <div
    style={{
      position: "absolute",
      left: 0,
      right: 0,
      top: 0,
      height: 96,
      background: chat.bar,
      borderBottom: `2px solid ${chat.line}`,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: `0 ${GUT}px`,
    }}
  >
    <Wordmark size={34} color={chat.name} />
    <span style={{ fontFamily: fonts.mono.stack, fontSize: 26, color: chat.muted }}>discord</span>
  </div>
);

export type ChatBeatProps = {
  /** Frames this beat is on screen. */
  dur: number;
  /** Display name of the speaker, as it really appears. */
  who: string;
  /** One-glyph avatar mark. */
  glyph: string;
  /** Real UTC clock on the corresponding record, `HH:MM`. */
  at: string;
  /** The message — quoted verbatim, never invented. */
  text: string;
  /** Where this landed, e.g. the ticket ref it opened. Small, under the message. */
  note?: string;
  /** Frames of typing dots before the message lands. First pair only. */
  typing?: number;
  /** `true` renders beckett's side of the exchange (cyan mark, lowercase). */
  self?: boolean;
};

/**
 * One ask, on screen just long enough to read. The result hard-cuts in after it
 * — there is no transition out of this component by design; the cut IS the punch.
 */
export const ChatBeat: React.FC<ChatBeatProps> = ({
  dur,
  who,
  glyph,
  at,
  text,
  note,
  typing = 0,
  self = false,
}) => {
  const frame = useCurrentFrame();
  const showing = frame >= typing;
  const t = frame - typing;

  // one stepped fade (5 frames) + one small rise (10px). that is the whole budget.
  const on = stepFade(t, 0, 5, 5);
  const rise = lin(t, [0, 6], [10, 0]);
  const noteOn = stepFade(t, 8, 5, 5);

  // long asks get a size down so every beat holds the same two-line block.
  const size = text.length > 60 ? 62 : 74;

  return (
    <div style={{ position: "absolute", inset: 0, background: chat.bg }}>
      <Bar />

      <div
        style={{
          position: "absolute",
          top: 372,
          left: GUT,
          right: 200,
          display: "flex",
          gap: 34,
          alignItems: "flex-start",
        }}
      >
        <div style={{ opacity: showing ? on : 1 }}>
          <Avatar fill={self ? chat.avatarSelf : chat.avatarHuman} glyph={glyph} />
        </div>

        <div style={{ flex: 1, minWidth: 0, paddingTop: 4 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 18, opacity: showing ? on : 1 }}>
            <span
              style={{
                fontFamily: fonts.display.stack,
                fontWeight: 600,
                fontSize: 40,
                color: chat.name,
                lineHeight: 1,
              }}
            >
              {who}
            </span>
            <span style={{ fontFamily: fonts.mono.stack, fontSize: 24, color: chat.muted }}>
              today at {at}
            </span>
          </div>

          {showing ? (
            <div
              style={{
                display: "inline-block",
                marginTop: 22,
                opacity: on,
                transform: `translateY(${rise}px)`,
                background: chat.bar,
                borderLeft: `6px solid ${chat.accent}`,
                padding: "26px 36px 24px 30px",
              }}
            >
              <div
                style={{
                  fontFamily: fonts.body.stack,
                  fontSize: size,
                  lineHeight: 1.24,
                  color: chat.text,
                  maxWidth: W - GUT - AVATAR - 34 - 260,
                  textTransform: self ? "lowercase" : "none",
                }}
              >
                {text}
              </div>
              {note && (
                <div
                  style={{
                    marginTop: 22,
                    opacity: noteOn,
                    fontFamily: fonts.mono.stack,
                    fontSize: 26,
                    color: lavender.l6,
                  }}
                >
                  {note}
                </div>
              )}
            </div>
          ) : (
            <div
              style={{
                display: "inline-block",
                marginTop: 22,
                background: chat.bar,
                borderLeft: `6px solid ${chat.line}`,
                padding: "26px 44px 24px 30px",
              }}
            >
              <TypingDots />
            </div>
          )}
        </div>
      </div>

      {/* the beat's own clock — a hairline that fills while the ask is readable */}
      <div style={{ position: "absolute", left: 0, bottom: 0, height: 4, width: `${lin(frame, [0, dur], [0, 100])}%`, background: chat.accent, opacity: 0.5 }} />
    </div>
  );
};
