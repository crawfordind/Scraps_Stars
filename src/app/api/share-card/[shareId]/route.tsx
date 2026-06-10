import { ImageResponse } from "next/og";
import { getSavedRecipeByShareId } from "@/lib/db/recipes";
import { buildShareCardData } from "@/lib/share/cardData";
import { getDisplayHandle } from "@/lib/identity/session";
import { loadShareCardFonts, type ShareCardFontConfig } from "@/lib/share/ogFonts";

export const runtime = "nodejs";

const PALETTE = {
  bg: "#f4efe6",
  surface: "#faf7f2",
  ink: "#2a2622",
  ember: "#d65a2e",
  turmeric: "#e8a33d",
  herb: "#6e8b5b",
  muted: "#6b6560",
  kraft: "#d4c9b8",
};

function CardLayout({
  data,
  linkFormat,
  fonts,
}: {
  data: ReturnType<typeof buildShareCardData>;
  linkFormat: boolean;
  fonts: ShareCardFontConfig;
}) {
  const width = linkFormat ? 1200 : 1080;
  const height = linkFormat ? 630 : 1920;

  return (
    <div
      style={{
        width,
        height,
        display: "flex",
        flexDirection: "column",
        background: `linear-gradient(165deg, ${PALETTE.bg} 0%, ${PALETTE.surface} 45%, #e8e0d4 100%)`,
        color: PALETTE.ink,
        fontFamily: fonts.bodyFamily,
        padding: linkFormat ? 48 : 64,
        position: "relative",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          marginBottom: linkFormat ? 24 : 40,
        }}
      >
        <div
          style={{
            fontSize: linkFormat ? 28 : 36,
            background: PALETTE.ember,
            color: PALETTE.surface,
            borderRadius: 999,
            padding: "8px 18px",
            fontFamily: fonts.displayFamily,
            fontWeight: 700,
            textTransform: "lowercase",
          }}
        >
          barefeast
        </div>
        <span style={{ fontSize: linkFormat ? 16 : 20, color: PALETTE.muted, letterSpacing: 3 }}>
          FEAST CARD
        </span>
      </div>

      <div style={{ display: "flex", flex: 1, flexDirection: linkFormat ? "row" : "column", gap: 32 }}>
        {data.platedPhotoUrl && !linkFormat && (
          <div
            style={{
              width: "100%",
              height: 420,
              borderRadius: 24,
              overflow: "hidden",
              border: `3px solid ${PALETTE.kraft}`,
              display: "flex",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={data.platedPhotoUrl}
              alt=""
              width={992}
              height={420}
              style={{ objectFit: "cover", width: "100%", height: "100%" }}
            />
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "center" }}>
          <div
            style={{
              fontFamily: fonts.displayFamily,
              fontSize: linkFormat ? 52 : 72,
              fontWeight: 700,
              lineHeight: 1.05,
              marginBottom: 20,
            }}
          >
            {data.recipeName}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
            <span style={{ fontSize: linkFormat ? 32 : 40 }}>{data.chefEmoji}</span>
            <span style={{ fontSize: linkFormat ? 22 : 28, fontWeight: 600 }}>{data.chefName}</span>
            <span
              style={{
                marginLeft: 8,
                padding: "6px 14px",
                borderRadius: 999,
                border: `2px solid ${PALETTE.ember}`,
                fontSize: linkFormat ? 16 : 18,
                color: PALETTE.ember,
              }}
            >
              Tier {data.tier} · {data.tierLabel}
            </span>
          </div>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: linkFormat ? 16 : 20,
              marginBottom: 24,
            }}
          >
            {[
              { label: "Food rescued", value: `${data.impact.foodRescuedKg} kg` },
              { label: "Est. savings", value: `$${data.impact.moneySavedUsd}` },
              { label: "CO₂ avoided", value: `${data.impact.co2SavedKg} kg` },
            ].map((stat) => (
              <div
                key={stat.label}
                style={{
                  background: "rgba(214,90,46,0.1)",
                  border: `1px solid ${PALETTE.kraft}`,
                  borderRadius: 16,
                  padding: linkFormat ? "12px 16px" : "16px 20px",
                  minWidth: linkFormat ? 140 : 160,
                }}
              >
                <div style={{ fontSize: linkFormat ? 14 : 16, color: PALETTE.muted }}>{stat.label}</div>
                <div style={{ fontSize: linkFormat ? 24 : 30, fontWeight: 700 }}>
                  {stat.value}{" "}
                  <span style={{ fontSize: linkFormat ? 12 : 14, color: PALETTE.muted }}>est.</span>
                </div>
              </div>
            ))}
          </div>

          <div style={{ fontSize: linkFormat ? 20 : 24, color: PALETTE.ember, fontWeight: 600 }}>
            +{data.xpEarned} XP earned
            {data.nailedIt ? " · Nailed It ✓" : ""}
          </div>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          marginTop: linkFormat ? 16 : 32,
          borderTop: `2px solid ${PALETTE.kraft}`,
          paddingTop: 20,
        }}
      >
        <span style={{ fontSize: linkFormat ? 18 : 22, color: PALETTE.muted }}>{data.handle}</span>
        <span style={{ fontSize: linkFormat ? 16 : 18, color: PALETTE.ember }}>
          barefeast.app/r/{data.shareId}
        </span>
      </div>
    </div>
  );
}

export async function GET(req: Request, { params }: { params: Promise<{ shareId: string }> }) {
  const { shareId } = await params;
  const { searchParams } = new URL(req.url);
  const linkFormat = searchParams.get("format") === "link";

  const recipe = await getSavedRecipeByShareId(shareId);
  if (!recipe) {
    return new Response("Not found", { status: 404 });
  }

  const handle = await getDisplayHandle(recipe.userId);

  const cardData = buildShareCardData({
    shareId,
    recipe: recipe.recipe,
    chefId: recipe.chefId,
    tier: recipe.tier,
    handle: handle ?? undefined,
    platedPhotoUrl: recipe.platedPhotoUrl,
    nailedIt: recipe.nailedIt ?? false,
  });

  const fonts = await loadShareCardFonts();

  return new ImageResponse(
    <CardLayout data={cardData} linkFormat={linkFormat} fonts={fonts} />,
    {
      width: linkFormat ? 1200 : 1080,
      height: linkFormat ? 630 : 1920,
      ...(fonts.imageResponseFonts ? { fonts: fonts.imageResponseFonts } : {}),
    },
  );
}
