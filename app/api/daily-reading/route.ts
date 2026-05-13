// Daily card endpoint (web mode) → static export compatible
import { NextResponse } from "next/server";
import { getDailyCard } from "@/lib/daily-seed";

export async function GET() {
  const dailyCard = getDailyCard();

  // Cache for 1 hour (CDN-friendly)
  return NextResponse.json(
    {
      card_index: dailyCard.card.id,
      isReversed: dailyCard.isReversed,
      date: dailyCard.date,
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    }
  );
}
