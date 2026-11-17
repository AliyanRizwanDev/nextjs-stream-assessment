import { NextRequest, NextResponse } from "next/server";
import { getFilteredEvents } from "@/lib/mockData";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const severity = searchParams.get("severity") || "all";

  // Simulate realistic network jitter (150ms - 550ms) so out-of-order responses happen naturally
  const delay = 150 + Math.floor(Math.random() * 400);
  await new Promise((r) => setTimeout(r, delay));

  const filtered = getFilteredEvents(search, severity);

  return NextResponse.json({
    events: filtered,
    total: filtered.length,
  });
}
