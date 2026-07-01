# Nyata — Design System (v1, locked)

> Source of truth for every UI plan.
>
> **Concept: "The Redacted Label" — a declassified food-safety exposé.**
> The product is a government safety document being *un-redacted* in real time. Hidden ingredients
> sit under black **redaction bars** stamped `TERSEMBUNYI` (hidden); a scan wipes them away to reveal
> the verdict underneath. Hidden→revealed is the core interaction, not decoration — it's *Nyata* made
> literal (Nyata = "revealed"). Voice: forensic whistleblower, an exposé you can defend.
>
> The 4 mockups are inspiration for layout/flow only; this concept supersedes their clean-card look.
>
> **Build rule:** customize Aceternity components (`npx shadcn@latest add @aceternity/<name>` or shadcn
> MCP) — never hand-code what a registry component does. shadcn = primitives, Aceternity = polish/motion.
> Bespoke only: camera reticle, the redaction-bar primitive, the share-image renderer.

---

## 1. The signature: the redaction bar

The one memorable element. Everywhere hidden/paywalled/pre-scan info exists, it sits under a solid
`--ink` bar with a mono label. Reveal = the bar wipes (mask sweep) → truth underneath, lit by the
turmeric `--reveal` glow.
- Pre-scan hero, locked premium risks, unrevealed hazards → redacted by default.
- Powered by `svg-mask-effect` / `canvas-reveal-effect` / `text-reveal-card` (Aceternity).
- The share card freezes ONE bar mid-lift → any Nyata card is recognizable at a glance in a feed.
- `prefers-reduced-motion`: bar cross-fades out instead of sweeping. Never blocks content.

## 2. Color tokens (Tailwind v4 `@theme` in `app/globals.css`)

```css
@theme {
  /* Ink is load-bearing: it's REDACTION, not just buttons. Also = text, CTAs, active, premium. */
  --color-ink:        #17140F;  /* redaction bars, text, buttons, active tab, premium cards */
  --color-ink-70:     #4A453D;  /* secondary text */
  --color-ink-40:     #8C857A;  /* muted / captions / eyebrows */
  --color-paper:      #FAF9F6;  /* app background (warm near-white document stock) */
  --color-card:       #FFFFFF;  /* raised surfaces, verdict card */
  --color-surface-2:  #F2F1ED;  /* stat tiles, secondary fills, inactive chips */
  --color-line:       #E7E4DC;  /* form rules / dividers (document ruling) */

  /* Verdict semantics — ONLY inside verdict badges / ratings / recall blocks */
  --color-selamat:    #1E874B;  --color-selamat-bg: #E7F2EA;  /* SAFE  */
  --color-waspada:    #E08A00;  --color-waspada-bg: #FBF0DC;  /* CAUTION */
  --color-elak:       #D33118;  --color-elak-bg:    #FBE6E1;  /* AVOID / recall */

  /* The reveal glow — what's UNDER the bar when it lifts. Never a verdict state, never a CTA fill. */
  --color-reveal:     #F2A900;  /* turmeric; scan-reveal + declassified-stamp accent only */
}
```
Rules: ink = redaction + all chrome. Verdict trio lives only in badges/ratings/recall alerts →
semantics and brand never collide. Turmeric = reveal glow + stamp ink only. All text passes WCAG AA.

## 3. Verdict vocabulary (distinctive core — bilingual)

| State | Word (display) | EN gloss | Color | Risk score |
|---|---|---|---|---|
| Safe | **SELAMAT** | safe | selamat | 0–3.9 |
| Caution | **WASPADA** | be wary | waspada | 4–6.9 |
| Avoid | **ELAK** | avoid | elak | 7–10 |

Higher score = worse. Every verdict shows word + score + EN gloss, delivered as a **stamped
classification** (circular/rect official stamp, turmeric or verdict ink). Method steps reuse the
bilingual pairing: **Imbas** (Scan) · **Hurai** (Decode) · **Putus** (Decide).

## 4. Typography (`next/font/google`) — document typography

Mono is promoted: this is a document, so evidence data leads with it.

| Role | Face | Weights | Usage |
|---|---|---|---|
| Display | **Bricolage Grotesque** | 700/800 | wordmark, headlines, verdict words |
| Body | **Instrument Sans** | 400/500/600 | UI copy, summaries (BM + EN) |
| Data/document | **Space Mono** | 400/700 | ingredient rows, E-numbers, barcodes, batch #, source citations, redaction labels, eyebrows, prices |

Scale (rem, mobile-first): display `clamp(2.5,10vw,3.25)` · h1 `2` · h2 `1.5` · body `1` · sm `0.875` · mono `0.8125`.
Verdict word breaks scale: `clamp(3.5rem,16vw,5rem)`, tracking `-0.02em`. Eyebrows: mono, uppercase,
`0.16em` tracking, ink-40 (e.g. `DIGITAL WHISTLEBLOWER · PEMBERI MAKLUMAT`, `CLASSIFIED · TERSEMBUNYI`).

## 5. Shape, texture & elevation

- **Document texture:** faint form-ruling / dot-grid under key surfaces (`background-dots` or
  `background-grid-with-dots`, very low opacity) → reads as official stationery. Restraint: atmosphere, not noise.
- Radius: cards `1rem` · buttons/inputs `0.75rem` · tiles `1rem` · chips/pills `full`. Redaction bars &
  stamps are **square/`0`** (documents are ruled, not rounded) — the one hard-edge family, deliberate contrast.
- Separation: soft shadow + surface-2 fill first; hairline `--line` as form-ruling where it reads as document.
- Elevation: cards `0 1px 2px rgba(23,20,15,.05), 0 8px 24px rgba(23,20,15,.06)`; verdict card lifts most.
- Spacing: 4px base (`1/2/3/4/6/8/12` → 4…48).

## 6. Component → Aceternity mapping (customize, don't rebuild)

| Nyata UI | Aceternity component | Notes |
|---|---|---|
| **Redaction-bar reveal (signature)** | `svg-mask-effect` / `canvas-reveal-effect` / `text-reveal-card` | bar wipes → truth + turmeric glow |
| **Bottom tab bar** (5 tabs, center Scan) | `floating-dock` | ink/paper; Scan = raised center |
| **Scan "Analyzing" sequence** | `multi-step-loader` | "reading label → cross-ref MOH → checking additives" |
| **AI cross-ref line / summaries** | `text-generate-effect` | streaming forensic voice under lifted bar |
| **Verdict reveal glow** | `background-gradient` | turmeric `--reveal` behind the card |
| **Product detail hero (tilt)** | `3d-card` | on-screen only; NOT the flat share export |
| **Zoom into real label** | `lens` | magnify the ingredient panel — subject-true |
| **Landing hero headline** | `hero-highlight` + `pointer-highlight` | highlight "really / sebenarnya" |
| **EN⇄BM headline swap** | `flip-words` / `container-text-flip` | "eating / makan" |
| **Recall alert ticker (top)** | `sticky-banner` | red marquee, official-source only |
| **"12k users scanned" proof** | `animated-tooltip` + `stats-with-number-ticker` | avatar stack + count-up |
| **The Nyata Method (3 steps)** | `card-hover-effect` | numbered 1/2/3 (real sequence) |
| **AI Breakdown stat tiles** | `bento-grid` + `glowing-effect` | Additives / Sodium |
| **Feed cards** | `card-hover-effect` / `focus-cards` | product + rating stamp + flagged count |
| **Filter chips** (Feed/Newest/Recalled) | `tabs` | animated |
| **Premium card** (Go Premium, RM9) | `background-gradient` | animated border; risks start redacted |
| **Share "Post to Story" CTA** | `stateful-button` | idle → generating → done |
| Buttons / card / input / badge / tabs base | `@shadcn/*` primitives | recolor to tokens |

## 7. Motion

- **The un-redaction** (once per scan, signature): redaction bar wipes off (mask sweep), verdict word
  stamps in (scale `0.96→1` spring), turmeric `--reveal` glow blooms, ~450ms. The one orchestrated moment.
- Elsewhere: 150ms hover/press micro; feed items fade-up staggered 40ms.
- `prefers-reduced-motion` → reveals become instant cross-fades. Non-negotiable floor.
- Lib: `motion` (installed). Aceternity ships its own motion — keep it, don't stack extra.

## 8. Verdict card — hero share asset

Export **1080×1350 (4:5)**, rendered **HTML-to-image server-side** (flat, crisp — no 3d-card in export).
Layout: black classified header strip (wordmark + barcode mono + `DECLASSIFIED` stamp) → **one redaction
bar frozen mid-lift** → giant verdict word + score stamp → hazard panel (mono rows: E-number · name · flag)
→ recall citation block (elak accent, quoted official source + date + link) → footer CTA "scan yours →
nyata.app". Every value from tokens above. The frozen bar = the shareable signature.

## 9. Copy voice + legal (load-bearing — specs §6)

- Investigative but defensible: "listed in MOH recall dated X," never a self-authored brand accusation.
- Recalls: official-source only, always link, neutral factual language. Halal: "verify with JAKIM" unless JAKIM data.
- Bilingual BM/EN throughout. Active voice, sentence case; an action keeps its word through the flow
  ("Unlock" → "Unlocked"). Errors direct, empty states invite a scan. Redaction labels in BM (`TERSEMBUNYI`).

## 10. Base install (once, at scaffold)

```bash
npx shadcn@latest add @aceternity/svg-mask-effect @aceternity/canvas-reveal-effect \
  @aceternity/text-reveal-card @aceternity/floating-dock @aceternity/multi-step-loader \
  @aceternity/text-generate-effect @aceternity/background-gradient @aceternity/3d-card \
  @aceternity/lens @aceternity/hero-highlight @aceternity/pointer-highlight @aceternity/flip-words \
  @aceternity/sticky-banner @aceternity/animated-tooltip @aceternity/stats-with-number-ticker \
  @aceternity/card-hover-effect @aceternity/bento-grid @aceternity/glowing-effect @aceternity/tabs \
  @aceternity/stateful-button
# shadcn primitives: button card input badge (recolor to tokens)
```
