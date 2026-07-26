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

export const RemotionRoot: React.FC = () => {
  return (
    <>
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
