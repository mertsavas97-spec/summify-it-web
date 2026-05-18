import { NextResponse } from "next/server";
import { getServiceStatus } from "@/lib/service-status";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(getServiceStatus(), {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
