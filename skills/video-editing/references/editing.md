# Editing craft, motion design & kinetic typography — reference

The depth behind `../SKILL.md`. Every number here is attributed. When the skill
says "hold a caption ≥N frames" or "ease-out for entrances", this is why.

---

## 1. Editing craft — pacing & rhythm

### Walter Murch's Rule of Six

From *In the Blink of an Eye* (Walter Murch, 1995). When a cut can't satisfy
everything, sacrifice from the **bottom up**:

| Priority | Weight |
| --- | --- |
| 1. Emotion — does the cut feel right? | **51%** |
| 2. Story — does it advance the narrative? | **23%** |
| 3. Rhythm — is it the right moment? | **10%** |
| 4. Eye-trace — does it respect where the eye is looking? | **7%** |
| 5. 2D plane / stage line (the 180° rule) | **5%** |
| 6. 3D spatial continuity | **4%** |

Emotion outweighs everything else combined. A cut that's emotionally right is
forgiven its continuity sins. Murch also cuts *on the blink* — a splice lands
cleanly at the end of a thought, where a viewer would naturally blink.
Sources: [StudioBinder](https://www.studiobinder.com/blog/walter-murch-rule-of-six/),
[No Film School](https://nofilmschool.com/2016/11/6-rules-good-cutting-according-oscar-winning-editor-walter-murch).

### Cutting on action / match cuts

- **Cut on action**: begin a motion in shot A, complete it in shot B. The eye
  tracks the movement and the splice disappears — the backbone of "invisible"
  continuity editing. ([StudioBinder](https://www.studiobinder.com/blog/what-is-a-match-on-action-cut/),
  [Wikipedia: Cutting on action](https://en.wikipedia.org/wiki/Cutting_on_action))
- **Match cut**: pair similar shapes/compositions/motions across a cut for a
  graphic or thematic link. ([Wikipedia: Match cut](https://en.wikipedia.org/wiki/Match_cut))

### Hard cut vs. dissolve — the decision

- **Hard cut = the default.** Same time/space, forward momentum, dialogue, fast
  action. Since the late 1960s the straight cut is the norm; a dissolve is now a
  deliberate effect, not a connector.
- **Dissolve / crossfade = a passage of time or a change of state** (place, mood,
  memory, dream). The longer the dissolve, the longer the implied gap. A full
  fade-to-black implies the biggest gap (end of a chapter).
Sources: [Film Editing Pro](https://www.filmeditingpro.com/the-4d-editor-techniques-for-showing-the-passage-of-time/),
[Wikipedia: Dissolve](https://en.wikipedia.org/wiki/Dissolve_(filmmaking)).

**Our corollary:** a product ad lives in one continuous "now" — ask → result →
ask → result. That is all hard cuts. A dissolve would tell the viewer time
passed; it didn't. This is why `edit.ts` ships `Cut`/`Hold` and *not* a default
transition.

### J-cuts and L-cuts (split edits)

- **J-cut = audio LEADS picture.** You hear scene B before you see it. Builds
  anticipation; smooths the entry into a new scene.
- **L-cut = audio LAGS picture.** Picture cuts to B while A's audio continues —
  reactions, lingering, dialogue that overlaps the visual cut.
Both keep dialogue from feeling like flat ping-pong cutting. Relevant only once
we add a track. ([FilmDaft](https://filmdaft.com/the-l-cut-and-j-cut-how-film-editors-use-audio-to-control-time/),
[Wikipedia: J cut](https://en.wikipedia.org/wiki/J_cut))

### Holding a frame long enough to be legible

- **Adult silent reading speed**: **238 wpm non-fiction, 260 wpm fiction**
  (Brysbaert 2019, meta-analysis of 190 studies / 18,573 participants). Typical
  range 175–300 wpm. The popular "300 wpm" is an overestimate.
  ([Brysbaert 2019, *J. Memory & Language*](https://www.sciencedirect.com/science/article/abs/pii/S0749596X19300786))
- **Character floor**: a practical minimum of ~**13 characters/second** static
  dwell — a 30-char line needs ≥**2.3 s** on screen, and must be *motionless*
  during that dwell. ([legibility.info](https://legibility.info/rules-for-text-in-videos))
- **"Read it twice"** heuristic: leave key text up long enough for a ~200 wpm
  reader to read it twice.
- **Absolute floor** ≈ **1 s** (time to notice a new cue and start reading);
  practical ceiling before it distracts ≈ 7 s. ([SSW](https://www.ssw.com.au/rules/post-production-do-you-give-enough-time-to-read-texts-in-your-videos))

### Short-form ad structure (15–30s)

- **Hook = 0–3 s**, disproportionately important. Industry-cited (not peer
  reviewed): ~65% who watch the first 3 s reach 10 s. Treat as directional.
- **Shape**: Hook (0–3s) → Build/escalation (~3s → 75–85% of runtime) → Payoff
  (last ~15–25%) → CTA / loop (last 2–5s).
- **Visual pacing**: change *something* every **3–5 s** (angle, surface, text);
  a pattern-interrupt every **5–8 s**.
Sources: [StratBoost](https://www.stratboost.ai/blogs/youtube-shorts-script-template/),
[Socialync](https://www.socialync.io/blog/short-form-video-structure-guide-2026).
The "65%" stat is repeated across marketing blogs, not primary research — do not
quote it as hard data.

---

## 2. Motion design principles for UI / product footage

### Easing — why never linear

Real objects have inertia, so linear motion reads as robotic. Canonical curves
(Material Design M1/M2 motion):

| Curve | cubic-bezier | Use |
| --- | --- | --- |
| Standard (in-out) | `0.4, 0.0, 0.2, 1` | Elements moving *within* the screen — the default |
| Decelerate (out) | `0.0, 0.0, 0.2, 1` | **Entering** — arrives fast, slows to rest |
| Accelerate (in) | `0.4, 0.0, 1, 1` | **Exiting** — starts slow, leaves fast |
| Sharp | `0.4, 0.0, 0.6, 1` | Exits that may return |

Rule: **ease-out to enter, ease-in to exit, never pure linear** for anything
physical. This is Disney's *Slow In & Slow Out*. These four map to
`EASE.inOut / EASE.out / EASE.in` in `src/lib/edit.ts`.

**Durations (Material):** mobile 300ms standard (225 enter / 195 exit, keep
< 400ms); desktop faster at **150–200ms**; scale duration to distance/size, don't
use one number for everything. **IBM Carbon**: most component motion runs
**100–300ms**, split into *productive* (fast, near-invisible) vs *expressive*
(smoother, for interrupt/celebrate). Sources:
[Material M1](https://m1.material.io/motion/duration-easing.html),
[Material M3 easing & duration](https://m3.material.io/styles/motion/easing-and-duration),
[Carbon motion](https://carbondesignsystem.com/elements/motion/overview/).
*(Carbon's exact `@carbon/motion` token ms values — fast-01 70ms … slow-02 700ms
— are widely republished but were not verified against the primary source this
pass; confirm before quoting.)*

### Disney's 12 principles that matter for UI motion

From *The Illusion of Life* (Thomas & Johnston, 1981). The load-bearing three:

- **Anticipation** — a small wind-up before the main move; primes the eye.
- **Follow-through / overlapping action** — parts overshoot and settle after the
  body stops; the basis of a tasteful entrance overshoot (`punchIn`).
- **Slow In & Slow Out** — easing itself.
Source: [NYFA summary](https://www.nyfa.edu/student-resources/12-principles-of-animation/).

### Practical techniques

- **Staggered entrances**: delay each item **50–200ms** (50 and 100ms most
  common; `motion.dev`'s `stagger(0.05)` = 50ms/item). Keep the whole cascade
  short so it lands as one gesture, not a slow list. → `stagger()` in `edit.ts`.
  ([motion.dev/docs/stagger](https://motion.dev/docs/stagger))
- **Scale + opacity (+ blur)**: fade + slight scale-up (0.96→1.0) reads as
  arriving from depth; a brief blur-to-sharp reinforces a focus pull.
- **Camera moves**: push-in (dolly), whip pan (great as a masked cut), parallax
  (layers at different rates). Motivated and sparing. → `pushIn()`.
- **Overshoot**: a few percent past target then settle — expressive entrances
  only, never high-frequency microinteractions.

### When NOT to animate

- When it delays the viewer or repeats often (productive motion is near
  invisible).
- Respect `prefers-reduced-motion`; big parallax/zoom can cause vestibular
  discomfort.
- Never animate decoration that competes with the content it sits on.

---

## 3. Typography in motion

### Kinetic type

Animate **per-word or per-line with a stagger** (same 50–150ms/unit logic as UI)
so the eye lands on one unit at a time. Non-negotiable: text is **motionless
during its readable dwell** — animate in, hold static long enough to read, animate
out. Never make someone read moving type.

### Legibility floors (real caption standards)

**BBC Subtitle Guidelines** (via secondary summaries; the primary page blocks
fetching):
- Target reading speed **160–180 wpm ≈ 15 cps**.
- ~**0.3 s per word** minimum (a 4-word line ≈ 1.2s); subtitles sit **2–5 s**,
  absolute range **1–6 s**.
- Line length ~**32–42 characters**.
([Clevercast summary](https://www.clevercast.com/bbc-subtitling-guidelines/))

**Netflix Timed Text Style Guide:**
- Reading speed: **≤17 cps children / ≤20 cps adult** (English).
- **Minimum duration 5/6 s (≈833ms)**; **maximum 7 s** per event.
- **Max 2 lines, 42 chars/line**; **≥2-frame gap** between events.
([Netflix General Requirements](https://partnerhelp.netflixstudios.com/hc/en-us/articles/215758617-Timed-Text-Style-Guide-General-Requirements))

Our `readingHold()` uses the conservative **15 cps** floor + a recognition tax.

### Safe areas

- **Legacy SMPTE (1961), still the NLE default**: action-safe **90%** (5% margin),
  title-safe **80%** (10% margin).
- **SMPTE ST 2046-1 (2008, HD)**: action-safe **93%**, title-safe **90%**.
Keep all readable text (labels, CTAs, refs) inside **title-safe**; on vertical
social also dodge the platform's own top/bottom UI bands.
([Wikipedia: Safe area](https://en.wikipedia.org/wiki/Safe_area_(television)))

### Captions over moving footage

- **Contrast**: a scrim/plate/shadow so text survives changing background
  luminance (we already ship `surface.scrim*` and the `Label` plate).
- **Position stability**: anchor captions in a fixed spot — motion behind + motion
  in the text = illegible.
- Hold each caption static for its full reading dwell even while the footage
  under it moves.

---

## Sources

All inline above. Primary anchors: Murch, *In the Blink of an Eye* (1995);
Thomas & Johnston, *The Illusion of Life* (1981); Brysbaert 2019 reading-rate
meta-analysis; Material Design & IBM Carbon motion docs; BBC & Netflix subtitle
guidelines; SMPTE safe-area standards.

**Flagged as unverified this pass:** exact `@carbon/motion` token ms values; the
"65% watch-through" ad stat (industry blog, not primary); BBC exact cps figures
(secondary summaries — primary page blocked). Confirm before quoting as hard data.
