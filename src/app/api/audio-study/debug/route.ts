import { NextResponse } from "next/server";
import { getOptionalUser } from "@/lib/auth";
import { getPollyEnvCheck } from "@/server/audio/polly";

export async function GET() {
  const user = await getOptionalUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to run audio study debug." }, { status: 401 });
  }

  const check = getPollyEnvCheck();

  return NextResponse.json({
    envConfigured: check.envConfigured,
    region: check.region,
    canInitializeClient: check.canInitializeClient,
    accessKeyPresent: check.accessKeyPresent,
    secretKeyPresent: check.secretKeyPresent,
    accessKeySource: check.accessKeySource,
    secretKeySource: check.secretKeySource,
    regionSource: check.regionSource,
  });
}
