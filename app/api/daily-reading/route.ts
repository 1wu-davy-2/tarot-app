import { NextResponse } from "next/server";
import { getDailyCard } from "@/lib/daily-seed";

export async function GET() {
  const dailyCard = getDailyCard();

  return NextResponse.json(dailyCard, {
    headers: {
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
