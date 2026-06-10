import type { Metadata } from "next";
import { getChallengeById } from "@/lib/db/challenges";
import { ChallengePageClient } from "@/components/ChallengePageClient";

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const challenge = await getChallengeById(id);
  const origin = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return {
    title: challenge ? `${challenge.theme} · Barefeast` : "Challenge",
    description: challenge?.prompt,
    openGraph: {
      title: challenge?.theme,
      description: challenge?.prompt,
      images: [{ url: `${origin}/api/share-card/challenge/${id}?format=link`, width: 1200, height: 630 }],
    },
  };
}

export default async function ChallengePage({ params }: PageProps) {
  const { id } = await params;
  return <ChallengePageClient challengeId={id} />;
}
