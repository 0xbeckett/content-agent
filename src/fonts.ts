/**
 * Local webfont loading.
 *
 * Fonts are bundled in `public/fonts/` (OFL, see the OFL-*.txt files there) and
 * loaded from disk — a headless render must never depend on a network font fetch
 * mid-render. Importing this module registers the three brand faces and holds a
 * Remotion `delayRender()` handle until they are ready, so frames are only drawn
 * once glyphs are available.
 */
import { loadFont } from "@remotion/fonts";
import { continueRender, delayRender, staticFile } from "remotion";
import { fonts } from "./brand";

const unquote = (family: string) => family.replace(/^"|"$/g, "");

const handle = delayRender("Loading brand fonts");

export const fontsReady = Promise.all([
  loadFont({
    family: unquote(fonts.display.family),
    url: staticFile("fonts/PixelifySans.ttf"),
    weight: String(fonts.display.weight),
  }),
  loadFont({
    family: unquote(fonts.pixel.family),
    url: staticFile("fonts/DotGothic16-Regular.ttf"),
    weight: String(fonts.pixel.weight),
  }),
  loadFont({
    family: unquote(fonts.body.family),
    url: staticFile("fonts/Inter.ttf"),
    weight: String(fonts.body.weight),
  }),
])
  .then(() => continueRender(handle))
  .catch((err) => {
    // Surface the failure but still release the frame so the render doesn't hang.
    console.error("Font load failed:", err);
    continueRender(handle);
  });
