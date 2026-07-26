/**
 * IsoWorld — the beckett archipelago, drawn as isometric SVG voxels.
 *
 * The home island always sits at (cx, cy) scaled by `unit` px/voxel. `federation`
 * (0..1) brings in the satellite islands and the signal arcs between them — the
 * same "islands talking to each other" the live world shows. Motion is a quantised
 * bob (pixels, not smooth floats); the camera push-in is driven by the parent
 * scene through cx/cy/unit.
 */
import { useMemo } from "react";
import { AbsoluteFill } from "remotion";
import { world } from "../../brand";
import { bob, quantize } from "../../lib/motion";
import { makeHomeIsland, makeSatellite, project, type Island } from "../../lib/iso";

type Sat = { island: Island; dx: number; dy: number; scale: number; seed: number };

const IslandSvg: React.FC<{ island: Island; strokePx: number }> = ({ island, strokePx }) => {
  // seams between flat faces close with a hairline stroke of the face's own colour
  return (
    <>
      <g>
        {island.faces.map((f, i) => (
          <polygon key={i} points={f.pts} fill={f.fill} stroke={f.fill} strokeWidth={strokePx} strokeLinejoin="miter" />
        ))}
      </g>
      <g>
        {island.glowFaces.map((f, i) => (
          <polygon key={`g${i}`} points={f.pts} fill={f.fill} stroke={f.fill} strokeWidth={strokePx} strokeLinejoin="miter" />
        ))}
      </g>
    </>
  );
};

export const IsoWorld: React.FC<{
  unit: number;
  cx: number;
  cy: number;
  frame: number;
  fps: number;
  federation?: number;
  /** extra px added to every bob amplitude, for the "alive" hero beat. */
  liveliness?: number;
}> = ({ unit, cx, cy, frame, fps, federation = 0, liveliness = 1 }) => {
  const home = useMemo(() => makeHomeIsland(8, 7), []);
  const sats = useMemo<Sat[]>(
    () => [
      { island: makeSatellite("blossom", 4, 21, 1), dx: -13, dy: -5.5, scale: 0.62, seed: 21 },
      { island: makeSatellite("pine", 4, 33, 4), dx: 12.5, dy: -3.5, scale: 0.66, seed: 33 },
      { island: makeSatellite("blossom", 3, 44, 2), dx: 2, dy: -9, scale: 0.5, seed: 44 },
    ],
    [],
  );

  const center = (isl: Island) => ({
    x: (isl.bounds.minX + isl.bounds.maxX) / 2,
    y: (isl.bounds.minY + isl.bounds.maxY) / 2,
  });
  const hc = center(home);
  const stroke = 0.05; // user-space; scaled by the group → ~1px hairline

  // home island screen transform + its quantised bob
  const hbob = bob(frame, fps, 5 * liveliness, 4.4, 8);
  const hx = cx - hc.x * unit;
  const hy = cy - hc.y * unit + hbob;

  // beacon screen position (for arcs), in the home island's transformed space
  const beaconP = project(home.beacon.gx, home.beacon.gy, home.beacon.gz);
  const beaconScreen = { x: hx + beaconP.x * unit, y: hy + beaconP.y * unit };

  return (
    <AbsoluteFill>
      <svg width="100%" height="100%" style={{ overflow: "visible", display: "block" }}>
        {/* signal arcs behind the islands */}
        {federation > 0.01 &&
          sats.map((s, i) => {
            const scx = cx + s.dx * unit;
            const scy = cy + s.dy * unit + bob(frame, fps, 4, 3.6 + i, 8);
            const mx = (beaconScreen.x + scx) / 2;
            const my = Math.min(beaconScreen.y, scy) - 60 - i * 14;
            const path = `M ${beaconScreen.x} ${beaconScreen.y} Q ${mx} ${my} ${scx} ${scy}`;
            // packet travelling the arc, analytic quadratic bezier
            const t = quantize(((frame / (fps * 2.4) + i * 0.3) % 1), 24);
            const it = 1 - t;
            const bxp = it * it * beaconScreen.x + 2 * it * t * mx + t * t * scx;
            const byp = it * it * beaconScreen.y + 2 * it * t * my + t * t * scy;
            const pSz = Math.max(4, unit * 0.5);
            return (
              <g key={`arc${i}`} opacity={federation}>
                <path d={path} fill="none" stroke={world.arc} strokeWidth={2} strokeDasharray="5 7" opacity={0.5} />
                <rect
                  x={bxp - pSz / 2}
                  y={byp - pSz / 2}
                  width={pSz}
                  height={pSz}
                  fill={world.packet}
                />
              </g>
            );
          })}

        {/* satellite islands */}
        {sats.map((s, i) => {
          const sc = center(s.island);
          const u = unit * s.scale;
          const sbob = bob(frame, fps, 4, 3.6 + i, 8);
          const tx = cx + s.dx * unit - sc.x * u;
          const ty = cy + s.dy * unit - sc.y * u + sbob;
          return (
            <g key={`sat${i}`} opacity={federation} transform={`translate(${tx} ${ty}) scale(${u})`}>
              <IslandSvg island={s.island} strokePx={stroke} />
            </g>
          );
        })}

        {/* the home island */}
        <g transform={`translate(${hx} ${hy}) scale(${unit})`}>
          <IslandSvg island={home} strokePx={stroke} />
        </g>
      </svg>
    </AbsoluteFill>
  );
};

export { makeHomeIsland };
