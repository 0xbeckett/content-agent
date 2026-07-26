/**
 * The sky — the site's `html{background:…}` gradient, with a `night` knob that
 * blends toward the nightfall stops the day cycle keyframes at the CTA. Every
 * stop comes from `brand.sky`.
 */
import { AbsoluteFill } from "remotion";
import { sky } from "../../brand";

function mix(a: string, b: string, t: number): string {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  const r = Math.round((((pa >> 16) & 255) * (1 - t) + ((pb >> 16) & 255) * t));
  const g = Math.round((((pa >> 8) & 255) * (1 - t) + ((pb >> 8) & 255) * t));
  const bl = Math.round(((pa & 255) * (1 - t) + (pb & 255) * t));
  return `rgb(${r},${g},${bl})`;
}

export const Sky: React.FC<{ night?: number }> = ({ night = 0 }) => {
  const stops = sky.morning.map((c, i) => mix(c, sky.night[i], night));
  const at = [0, 34, 58, 100];
  const grad = `linear-gradient(180deg, ${stops
    .map((c, i) => `${c} ${at[i]}%`)
    .join(", ")})`;
  return <AbsoluteFill style={{ background: grad }} />;
};
