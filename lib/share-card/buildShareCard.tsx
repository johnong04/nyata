/**
 * buildShareCard — the flat 1080×1350 share export as a Satori element tree
 * (design-system §8). Pure: no I/O, inline styles only, flexbox only (Satori
 * has no CSS grid). Every colour/size is a design-system §2 token literal.
 *
 * Layout (top→bottom): black classified header → ONE redaction bar frozen
 * mid-lift (the signature) → giant verdict word + score stamp → hazard panel →
 * recall citation (conditional, legal) → footer CTA.
 *
 * Flat export rule (§5/§8): no tilt/perspective/drop-shadow. Only the
 * DECLASSIFIED stamp uses rotate() — that is stamp styling, not 3d.
 */
import type { ReactElement } from "react";
import {
  deepLink,
  formatRecallDate,
  ratingToVerdict,
  toHazardRows,
  verdictColor,
  verdictColorBg,
  type ShareCardData,
} from "@/lib/share-card/verdictMeta";

// design-system §2 tokens — verbatim.
const INK = "#17140F";
const INK_70 = "#4A453D";
const INK_40 = "#8C857A";
const PAPER = "#FAF9F6";
const SURFACE_2 = "#F2F1ED";
const LINE = "#E7E4DC";
const REVEAL = "#F2A900";

const MONO = "Space Mono";
const DISPLAY = "Bricolage Grotesque";

export function buildShareCard(data: ShareCardData): ReactElement {
  const { barcode, productName, brand, verdict, recall } = data;
  const v = ratingToVerdict(verdict.rating);
  const color = verdictColor(v.token);
  const colorBg = verdictColorBg(v.token);
  const hazards = toHazardRows(verdict.flags);

  return (
    <div
      style={{
        width: 1080,
        height: 1350,
        display: "flex",
        flexDirection: "column",
        backgroundColor: PAPER,
        fontFamily: MONO,
        position: "relative",
      }}
    >
      {/* 1 — Black classified header strip */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-start",
          backgroundColor: INK,
          padding: "36px 56px 40px 56px",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontFamily: DISPLAY,
              fontWeight: 800,
              fontSize: 64,
              color: PAPER,
              letterSpacing: "-0.02em",
              lineHeight: 1,
            }}
          >
            NYATA
          </div>
          <div
            style={{
              fontFamily: MONO,
              fontSize: 22,
              letterSpacing: "0.16em",
              color: INK_40,
              marginTop: 12,
            }}
          >
            CLASSIFIED · TERSEMBUNYI
          </div>
          <div
            style={{
              fontFamily: MONO,
              fontSize: 24,
              color: PAPER,
              marginTop: 8,
            }}
          >
            {barcode}
          </div>
        </div>
        {/* DECLASSIFIED stamp — turmeric ink + border, square, rotated. */}
        <div
          style={{
            display: "flex",
            border: `4px solid ${REVEAL}`,
            color: REVEAL,
            fontFamily: MONO,
            fontWeight: 700,
            fontSize: 30,
            letterSpacing: "0.12em",
            padding: "12px 20px",
            transform: "rotate(-4deg)",
          }}
        >
          DECLASSIFIED
        </div>
      </div>

      {/* 2 — ONE redaction bar frozen mid-lift (THE SIGNATURE). The ink bar
          covers the top; below its edge a turmeric glow sliver and the product
          name emerge — the mask sweep stopped in motion. */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          position: "relative",
          padding: "40px 56px 12px 56px",
        }}
      >
        {/* revealed content beneath the bar */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            paddingTop: 116,
          }}
        >
          <div
            style={{
              fontFamily: MONO,
              fontSize: 22,
              letterSpacing: "0.16em",
              color: INK_40,
            }}
          >
            {brand.toUpperCase()}
          </div>
          <div
            style={{
              fontFamily: DISPLAY,
              fontWeight: 800,
              fontSize: 56,
              color: INK,
              letterSpacing: "-0.02em",
              lineHeight: 1.02,
              marginTop: 6,
            }}
          >
            {productName}
          </div>
        </div>
        {/* turmeric glow sliver — the light leaking from under the lifting bar */}
        <div
          style={{
            display: "flex",
            position: "absolute",
            top: 102,
            left: 56,
            width: 700,
            height: 10,
            backgroundColor: REVEAL,
          }}
        />
        {/* the ink redaction bar, frozen mid-lift over the top ~72% width */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "absolute",
            top: 32,
            left: 56,
            width: 700,
            height: 70,
            backgroundColor: INK,
          }}
        >
          <div
            style={{
              fontFamily: MONO,
              fontWeight: 700,
              fontSize: 30,
              letterSpacing: "0.2em",
              color: PAPER,
            }}
          >
            TERSEMBUNYI
          </div>
        </div>
      </div>

      {/* 3 — Giant verdict word + score stamp */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 56px 8px 56px",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontFamily: MONO,
              fontSize: 22,
              letterSpacing: "0.16em",
              color: INK_40,
            }}
          >
            VERDIK · VERDICT
          </div>
          <div
            style={{
              fontFamily: DISPLAY,
              fontWeight: 800,
              fontSize: 150,
              color,
              letterSpacing: "-0.02em",
              lineHeight: 0.9,
            }}
          >
            {v.word}
          </div>
          <div
            style={{
              fontFamily: MONO,
              fontSize: 26,
              color: INK_70,
              marginTop: 4,
            }}
          >
            {v.gloss}
          </div>
        </div>
        {/* Square score stamp — verdict-coloured ink on verdict-bg fill. */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            width: 176,
            height: 176,
            backgroundColor: colorBg,
            border: `4px solid ${color}`,
          }}
        >
          <div
            style={{
              fontFamily: MONO,
              fontWeight: 700,
              fontSize: 72,
              color,
              lineHeight: 1,
            }}
          >
            {v.score}
          </div>
          <div
            style={{
              fontFamily: MONO,
              fontSize: 28,
              color,
              marginTop: 4,
            }}
          >
            / 10
          </div>
        </div>
      </div>

      {/* summary line — BM primary (EN carried by the verdict gloss + hazard/
          recall rows; the on-screen verdict page shows the full bilingual pair). */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          padding: "0 56px 14px 56px",
        }}
      >
        <div style={{ display: "flex", fontSize: 28, color: INK, lineHeight: 1.3 }}>
          {verdict.summary_bm}
        </div>
      </div>

      {/* 4 — Hazard panel */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          padding: "0 56px 10px 56px",
        }}
      >
        <div
          style={{
            fontFamily: MONO,
            fontSize: 22,
            letterSpacing: "0.16em",
            color: INK_40,
            marginBottom: 8,
          }}
        >
          HAZARD · BAHAYA
        </div>
        {hazards.length === 0 ? (
          <div
            style={{
              display: "flex",
              backgroundColor: SURFACE_2,
              padding: "18px 24px",
              fontFamily: MONO,
              fontSize: 26,
              color: INK_40,
            }}
          >
            No flagged additives · Tiada bahan berbahaya
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {hazards.slice(0, 2).map((h, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  backgroundColor: SURFACE_2,
                  borderBottom: `2px solid ${LINE}`,
                  padding: "11px 24px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      width: 16,
                      height: 16,
                      borderRadius: 8,
                      backgroundColor: verdictColor(h.token),
                      marginRight: 20,
                    }}
                  />
                  <div
                    style={{
                      display: "flex",
                      fontFamily: MONO,
                      fontWeight: 700,
                      fontSize: 26,
                      color: INK,
                      width: 110,
                    }}
                  >
                    {h.code}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      fontFamily: MONO,
                      fontSize: 26,
                      color: INK_70,
                      flexGrow: 1,
                    }}
                  >
                    {h.name}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      fontFamily: MONO,
                      fontSize: 22,
                      color: INK_40,
                    }}
                  >
                    {h.flag}
                  </div>
                </div>
                {h.jurisdiction ? (
                  <div
                    style={{
                      display: "flex",
                      fontFamily: MONO,
                      fontSize: 20,
                      color: REVEAL,
                      marginTop: 4,
                    }}
                  >
                    ⚑ {h.jurisdiction}
                  </div>
                ) : null}
              </div>
            ))}
            {hazards.length > 2 ? (
              <div
                style={{
                  display: "flex",
                  fontFamily: MONO,
                  fontSize: 22,
                  color: INK_40,
                  marginTop: 8,
                }}
              >
                + {hazards.length - 2} more flagged · lagi {hazards.length - 2}
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* 5 — Recall citation (conditional, legal §6: quoted official source
          + date + link only, neutral). Omitted entirely when null. */}
      {recall ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            margin: "0 56px 0 56px",
            backgroundColor: "#FBE6E1", // --color-elak-bg
            borderLeft: `8px solid #D33118`, // --color-elak
            padding: "12px 28px",
          }}
        >
          <div
            style={{
              display: "flex",
              fontFamily: MONO,
              fontSize: 22,
              letterSpacing: "0.16em",
              color: "#D33118",
              marginBottom: 8,
            }}
          >
            RECALL · PENARIKAN BALIK
          </div>
          <div
            style={{
              display: "flex",
              fontFamily: MONO,
              fontSize: 26,
              color: INK,
              lineHeight: 1.3,
            }}
          >
            “{recall.title}”
          </div>
          <div
            style={{
              display: "flex",
              fontFamily: MONO,
              fontSize: 24,
              color: INK_70,
              marginTop: 8,
            }}
          >
            {recall.source} · {formatRecallDate(recall.date)}
          </div>
          <div
            style={{
              display: "flex",
              fontFamily: MONO,
              fontSize: 21,
              color: "#D33118",
              marginTop: 2,
            }}
          >
            {recall.official_url}
          </div>
        </div>
      ) : null}

      {/* 6 — Footer CTA (drives the users axis) */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: "auto",
          backgroundColor: INK,
          padding: "18px 56px",
        }}
      >
        <div
          style={{
            display: "flex",
            fontFamily: DISPLAY,
            fontWeight: 800,
            fontSize: 40,
            color: PAPER,
            letterSpacing: "-0.02em",
          }}
        >
          scan yours → nyata.app
        </div>
        <div
          style={{
            display: "flex",
            fontFamily: MONO,
            fontSize: 22,
            color: INK_40,
          }}
        >
          {deepLink(barcode)}
        </div>
      </div>
    </div>
  );
}
