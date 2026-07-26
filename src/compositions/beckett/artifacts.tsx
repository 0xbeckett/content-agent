/**
 * Real artifacts — the surfaces Beckett actually works through, rebuilt faithfully:
 * a Discord channel, an ops ticket, a worker's terminal + unified diff, a GitHub PR.
 * The content is the real OPS-23 story straight off the site's live console (the
 * black-hole ticket). Nothing invented — no fake dashboard, no fake metrics.
 *
 * Discord/GitHub/diff wear their real platform colours (from `brand.artifact`);
 * Beckett's own board wears the site's brand chrome. All colour + type from brand.ts.
 */
import React from "react";
import { fonts, artifact, ink, palette, cyan, mint, chrome } from "../../brand";
import { blink, typed, stepFade } from "../../lib/motion";

const MONO = '"JetBrains Mono", ui-monospace, monospace';

/* ─────────────────────────── Discord ─────────────────────────── */

type Msg = { author: string; color: string; avatar: string; startFrame: number; render: (shown: number) => React.ReactNode; text: string };

export const DiscordCard: React.FC<{ frame: number; fps: number; messages: Msg[]; width?: number }> = ({
  frame,
  fps,
  messages,
  width = 1180,
}) => {
  return (
    <div style={{ width, background: artifact.discordBg, border: `2px solid ${ink.ink}`, boxShadow: chrome.dropShadow, overflow: "hidden" }}>
      {/* channel header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 22px", background: artifact.discordBg2, borderBottom: `1px solid ${artifact.discordChannel}` }}>
        <span style={{ color: artifact.discordMuted, fontFamily: fonts.body.stack, fontSize: 26, fontWeight: 600 }}>#</span>
        <span style={{ color: artifact.discordName, fontFamily: fonts.body.stack, fontSize: 22, fontWeight: 600 }}>ops</span>
        <span style={{ color: artifact.discordMuted, fontFamily: fonts.body.stack, fontSize: 16, marginLeft: 8, borderLeft: `1px solid ${artifact.discordChannel}`, paddingLeft: 14 }}>
          the cabin · where work gets filed
        </span>
      </div>
      {/* messages */}
      <div style={{ padding: "22px 24px", display: "flex", flexDirection: "column", gap: 20, minHeight: 260 }}>
        {messages.map((m, i) => {
          if (frame < m.startFrame) return null;
          const shown = typed(frame, m.startFrame, fps, m.text.length, 46);
          const fade = stepFade(frame, m.startFrame, 6, 4);
          const isTyping = shown < m.text.length;
          return (
            <div key={i} style={{ display: "flex", gap: 16, opacity: fade }}>
              <div style={{ width: 46, height: 46, flex: "none", background: m.color, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: fonts.display.stack, fontWeight: 600, color: "#ffffff", fontSize: 22, borderRadius: 23 }}>
                {m.avatar}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 4 }}>
                  <span style={{ color: m.color, fontFamily: fonts.body.stack, fontSize: 20, fontWeight: 600 }}>{m.author}</span>
                  <span style={{ color: artifact.discordMuted, fontFamily: fonts.body.stack, fontSize: 14 }}>today at 11:14</span>
                </div>
                <div style={{ color: artifact.discordText, fontFamily: fonts.body.stack, fontSize: 21, lineHeight: 1.5 }}>
                  {m.render(shown)}
                  {isTyping && blink(frame, 8) && <span style={{ color: artifact.discordText }}>▍</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/** A @mention chip in Discord's blurple style. */
export const Mention: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span style={{ color: "#c9cdfb", background: "rgba(88,101,242,.3)", padding: "1px 4px", borderRadius: 3, fontWeight: 600 }}>{children}</span>
);
export const DLink: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span style={{ color: artifact.discordLink }}>{children}</span>
);

/* ─────────────────────── Ops ticket (Beckett's board) ─────────────────────── */

export const TicketCard: React.FC<{ frame: number; fps: number; width?: number }> = ({ frame, fps, width = 900 }) => {
  const rows: { k: string; v: React.ReactNode; at: number }[] = [
    { k: "project", v: "black-hole-opus", at: 10 },
    { k: "worker", v: <span style={{ fontFamily: MONO }}>wk_b1a</span>, at: 18 },
    { k: "effort", v: "xhigh · one worker", at: 26 },
    { k: "review", v: "adversarial — 2nd model", at: 34 },
  ];
  return (
    <div style={{ width, background: palette.l0, border: chrome.border, boxShadow: chrome.chunkyShadow, padding: "34px 40px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 22 }}>
        <span style={{ fontFamily: fonts.pixel.stack, fontSize: 18, color: cyan.deep, background: cyan.c1, border: `2px solid ${ink.ink}`, padding: "4px 12px" }}>OPS-23</span>
        <span style={{ fontFamily: fonts.pixel.stack, fontSize: 18, color: "#ffffff", background: mint.m3, border: `2px solid ${ink.ink}`, padding: "4px 12px", opacity: stepFade(frame, 4, 6, 3) }}>
          ● in progress
        </span>
      </div>
      <div style={{ fontFamily: fonts.display.stack, fontWeight: 600, fontSize: 40, color: ink.ink, lineHeight: 1.05, marginBottom: 26 }}>
        a physically accurate black hole,<br />from first principles
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "160px 1fr", rowGap: 14, columnGap: 20 }}>
        {rows.map((r, i) => (
          <React.Fragment key={i}>
            <div style={{ fontFamily: fonts.pixel.stack, fontSize: 20, color: palette.faint, opacity: stepFade(frame, r.at, 6, 3) }}>{r.k}</div>
            <div style={{ fontFamily: fonts.body.stack, fontSize: 22, color: palette.dim, opacity: stepFade(frame, r.at, 6, 3) }}>{r.v}</div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

/* ─────────────────────── Terminal + unified diff ─────────────────────── */

type TLine = { kind: "cmd" | "log" | "ok"; text: string };

const TERM_LINES: TLine[] = [
  { kind: "cmd", text: "$ git worktree add ../wk_b1a -b ops-23" },
  { kind: "log", text: "Preparing worktree (new branch 'ops-23')" },
  { kind: "log", text: "geodesic marcher ✓  accretion disk ✓  doppler beaming ✓  photon ring ✓" },
  { kind: "log", text: "3 files, zero dependencies · 60fps, phone to ultrawide" },
];

const DIFF_LINES: { t: "hunk" | "add" | "del" | "ctx"; s: string }[] = [
  { t: "hunk", s: "@@ blackhole.glsl · Schwarzschild geodesics @@" },
  { t: "ctx", s: "  vec3 pos = ro, vel = rd;" },
  { t: "del", s: "  color = sampleStolenShader(uv);" },
  { t: "add", s: "  float h2 = pow(length(cross(ro, rd)), 2.0);" },
  { t: "add", s: "  for (int i = 0; i < STEPS; i++) {" },
  { t: "add", s: "    float r = length(pos);" },
  { t: "add", s: "    vel += -1.5 * h2 * pos / pow(r, 5.0) * dt;" },
  { t: "add", s: "    pos += vel * dt;" },
  { t: "add", s: "    if (r < Rs) return horizon;   // crossed it" },
  { t: "add", s: "  }" },
];

export const TerminalDiff: React.FC<{ frame: number; fps: number; width?: number }> = ({ frame, fps, width = 1200 }) => {
  const perLine = 9; // frames between reveals
  const termShown = Math.floor(frame / perLine);
  const diffStart = TERM_LINES.length * perLine + 6;
  const diffShown = Math.floor((frame - diffStart) / 6);

  const lineColor = (k: TLine["kind"]) =>
    k === "cmd" ? cyan.c2 : k === "ok" ? artifact.termGreen : artifact.termDim;

  return (
    <div style={{ width, border: `2px solid ${ink.ink}`, boxShadow: chrome.dropShadow, overflow: "hidden" }}>
      {/* title bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 16px", background: "#241d3a", borderBottom: `1px solid #000` }}>
        <i style={{ width: 12, height: 12, background: "#f4c9d9", border: "1px solid rgba(0,0,0,.4)" }} />
        <i style={{ width: 12, height: 12, background: "#ffe2a1", border: "1px solid rgba(0,0,0,.4)" }} />
        <i style={{ width: 12, height: 12, background: cyan.c2, border: "1px solid rgba(0,0,0,.4)" }} />
        <span style={{ marginLeft: 10, fontFamily: fonts.pixel.stack, fontSize: 16, color: artifact.termDim }}>wk_b1a@loom-desk · ~/black-hole-opus (ops-23)</span>
      </div>
      <div style={{ background: artifact.termBg, padding: "20px 24px", fontFamily: MONO, fontSize: 18, lineHeight: 1.75, minHeight: 420 }}>
        {TERM_LINES.map((l, i) =>
          i <= termShown ? (
            <div key={i} style={{ color: lineColor(l.kind), whiteSpace: "pre-wrap" }}>{l.text}</div>
          ) : null,
        )}
        {/* the diff */}
        {frame >= diffStart && (
          <div style={{ marginTop: 14, border: `1px solid #3a3358` }}>
            {DIFF_LINES.map((d, i) => {
              if (i > diffShown) return null;
              const bg =
                d.t === "add" ? "rgba(35,163,90,.16)" : d.t === "del" ? "rgba(207,34,46,.16)" : d.t === "hunk" ? "rgba(88,101,242,.16)" : "transparent";
              const fg =
                d.t === "add" ? "#7ee2a3" : d.t === "del" ? "#ff9ea5" : d.t === "hunk" ? "#a9b4ff" : artifact.termDim;
              const sign = d.t === "add" ? "+" : d.t === "del" ? "-" : d.t === "hunk" ? "" : " ";
              return (
                <div key={i} style={{ background: bg, color: fg, padding: "1px 12px", whiteSpace: "pre" }}>
                  <span style={{ opacity: 0.6 }}>{sign} </span>
                  {d.s}
                </div>
              );
            })}
          </div>
        )}
        {blink(frame, 12) && <span style={{ color: cyan.c2 }}>▍</span>}
      </div>
    </div>
  );
};

/* ─────────────────────────── GitHub PR ─────────────────────────── */

export const PRCard: React.FC<{ frame: number; fps: number; width?: number }> = ({ frame, width = 1180 }) => {
  const checks = [
    { at: 24, label: "build — 3 files, zero deps", ok: true },
    { at: 34, label: "adversarial-review — 2nd model red-teams the physics · lensing holds", ok: true },
    { at: 44, label: "commits — Verified · signed", ok: true },
  ];
  const merged = frame > 66;
  return (
    <div style={{ width, background: artifact.ghBg, border: `2px solid ${ink.ink}`, boxShadow: chrome.dropShadow, overflow: "hidden", fontFamily: fonts.body.stack }}>
      {/* title */}
      <div style={{ padding: "26px 30px 20px", borderBottom: `1px solid ${artifact.ghBorder}` }}>
        <div style={{ fontSize: 34, color: artifact.ghText, fontWeight: 600, lineHeight: 1.15 }}>
          Physically accurate black hole from first principles <span style={{ color: artifact.ghMuted, fontWeight: 400 }}>#23</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 16 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8, background: merged ? artifact.ghPurple : artifact.ghOpen, color: "#fff", padding: "7px 16px", borderRadius: 20, fontSize: 18, fontWeight: 600 }}>
            {merged ? "⌥ Merged" : "⬤ Open"}
          </span>
          <span style={{ color: artifact.ghMuted, fontSize: 18 }}>
            <b style={{ color: artifact.ghText, fontWeight: 600 }}>0xbeckett</b> wants to merge 3 commits into <code style={{ background: artifact.ghCanvas, padding: "2px 6px", borderRadius: 4, fontFamily: MONO, fontSize: 15 }}>main</code> from <code style={{ background: artifact.ghCanvas, padding: "2px 6px", borderRadius: 4, fontFamily: MONO, fontSize: 15 }}>ops-23</code>
          </span>
        </div>
      </div>
      {/* checks */}
      <div style={{ padding: "22px 30px", background: artifact.ghCanvas }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 20, color: artifact.ghText, fontWeight: 600, marginBottom: 16 }}>
          <span style={{ color: artifact.ghGreen, fontSize: 24 }}>✓</span> All checks have passed
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {checks.map((c, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 18, color: artifact.ghMuted, opacity: stepFade(frame, c.at, 6, 3) }}>
              <span style={{ color: artifact.ghGreen, fontSize: 20 }}>✓</span>
              {c.label}
            </div>
          ))}
        </div>
      </div>
      {/* files + merge */}
      <div style={{ padding: "22px 30px", display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: `1px solid ${artifact.ghBorder}` }}>
        <span style={{ fontSize: 18, color: artifact.ghMuted }}>
          <b style={{ color: artifact.diffAddText }}>+214</b> <b style={{ color: artifact.diffDelText }}>−0</b> · 3 files changed
        </span>
        <span style={{ background: merged ? artifact.ghPurple : artifact.ghGreen, color: "#fff", padding: "12px 22px", borderRadius: 8, fontSize: 19, fontWeight: 600 }}>
          {merged ? "Merged ✓" : "Merge pull request"}
        </span>
      </div>
    </div>
  );
};
