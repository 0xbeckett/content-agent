/**
 * BeckettDemo — "this is what AI should be like."
 *
 * A single Remotion composition, rendered from one command. It opens on the
 * 0xbeckett.me pixel world and pushes past the page chrome until the island fills
 * frame; turns the world into the product by walking Beckett's real pipeline
 * end-to-end (a request in Discord → filed to a worker's worktree → a real diff →
 * a signed PR that a second model red-teams → the reply landing back in the
 * channel); punctuates with one live-action fal-seedance beat (a webcam that flips
 * to the machine side); and closes on the wordmark and "lets beckett".
 *
 * Every colour + font comes from `brand.ts`. Motion is pixel-art-native: hard cuts
 * between beats, eased-in-steps ramps, quantised bobs. Reads with the sound off.
 *
 * The one metered asset (the seedance clip) is prepared by `scripts/prep-assets.ts`
 * into `public/generated/seedance.mp4` and committed, so this re-renders from a
 * clean checkout with no FAL_KEY and no re-spend.
 */
import { Series } from "remotion";
import "../fonts";
import {
  SiteToWorld,
  DiscordRequest,
  Filed,
  Worktree,
  Review,
  DiscordReply,
  LiveAction,
  Close,
} from "./beckett/scenes";

/** Scene durations in frames @ 30fps. Total drives the composition length. */
export const SCENES = [
  { c: SiteToWorld, d: 300 },
  { c: DiscordRequest, d: 175 },
  { c: Filed, d: 120 },
  { c: Worktree, d: 215 },
  { c: Review, d: 185 },
  { c: DiscordReply, d: 155 },
  { c: LiveAction, d: 150 },
  { c: Close, d: 240 },
] as const;

export const DEMO_DURATION = SCENES.reduce((n, s) => n + s.d, 0); // 1540 = 51.3s

export const BeckettDemo: React.FC = () => (
  <Series>
    {SCENES.map((s, i) => (
      <Series.Sequence key={i} durationInFrames={s.d}>
        <s.c />
      </Series.Sequence>
    ))}
  </Series>
);
