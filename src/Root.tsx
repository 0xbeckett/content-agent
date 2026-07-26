/**
 * Composition registry.
 *
 * To add a new composition: build it under `src/compositions/`, import it here,
 * and register a `<Composition>` with a unique id. It becomes renderable via
 * `npm run render -- <id> <tier>` immediately — no other wiring needed.
 */
import { Composition } from "remotion";
import { format } from "./brand";
import { Smoke } from "./compositions/Smoke";
import { BeckettDemo, DEMO_DURATION } from "./compositions/BeckettDemo";
import { BeckettAd, AD_DURATION } from "./compositions/BeckettAd";
import { BeckettAdPunch, AD_PUNCH_DURATION } from "./compositions/BeckettAdPunch";
import { BeckettAdWide, AD_WIDE_DURATION } from "./compositions/BeckettAdWide";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* The Beckett-as-a-whole recut (#18) — the current deliverable. It widens
          the punch cut's scope past the tracker to five surfaces. BeckettAdPunch
          and BeckettAd below are the prior cuts, left registered so every earlier
          render stays reproducible byte-for-byte. */}
      <Composition
        id="BeckettAdWide"
        component={BeckettAdWide}
        durationInFrames={AD_WIDE_DURATION}
        fps={format.fps}
        width={format.width}
        height={format.height}
      />
      <Composition
        id="BeckettAdPunch"
        component={BeckettAdPunch}
        durationInFrames={AD_PUNCH_DURATION}
        fps={format.fps}
        width={format.width}
        height={format.height}
      />
      <Composition
        id="BeckettAd"
        component={BeckettAd}
        durationInFrames={AD_DURATION}
        fps={format.fps}
        width={format.width}
        height={format.height}
      />
      <Composition
        id="BeckettDemo"
        component={BeckettDemo}
        durationInFrames={DEMO_DURATION}
        fps={format.fps}
        width={format.width}
        height={format.height}
      />
      <Composition
        id="Smoke"
        component={Smoke}
        durationInFrames={5 * format.fps}
        fps={format.fps}
        width={format.width}
        height={format.height}
      />
    </>
  );
};
