import { ImageResponse } from "next/og";
import { getChallengeById } from "@/lib/db/challenges";

export const runtime = "nodejs";

const PALETTE = {
  bg: "#f4efe6",
  ink: "#2a2622",
  ember: "#d65a2e",
  turmeric: "#e8a33d",
  muted: "#6b6560",
};

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const linkFormat = searchParams.get("format") === "link";
  const challenge = await getChallengeById(id);

  if (!challenge) return new Response("Not found", { status: 404 });

  const width = linkFormat ? 1200 : 1080;
  const height = linkFormat ? 630 : 1920;

  return new ImageResponse(
    (
      <div
        style={{
          width,
          height,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          background: PALETTE.bg,
          color: PALETTE.ink,
          padding: 64,
          fontFamily: "serif",
        }}
      >
        <div style={{ fontSize: 28, color: PALETTE.ember, letterSpacing: 4, marginBottom: 16 }}>
          SHAME SHELF SUNDAY
        </div>
        <div style={{ fontSize: linkFormat ? 56 : 72, fontWeight: 700, marginBottom: 24 }}>
          {challenge.theme}
        </div>
        <div style={{ fontSize: linkFormat ? 24 : 32, color: PALETTE.muted, maxWidth: 900 }}>
          {challenge.prompt}
        </div>
        <div style={{ marginTop: 40, fontSize: 22, color: PALETTE.turmeric }}>
          {challenge.entryCount} cooks this week (est. social proof)
        </div>
        <div style={{ marginTop: "auto", fontSize: 18, color: PALETTE.muted }}>
          barefeast.app/challenge/{id}
        </div>
      </div>
    ),
    { width, height },
  );
}
