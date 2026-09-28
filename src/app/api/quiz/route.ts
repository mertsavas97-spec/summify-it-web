import { NextRequest, NextResponse } from "next/server";
import { analyzeLimiter } from "@/lib/rateLimit";
import { generateQuizQuestionsFromAnalysis, type GenerateQuizInput } from "@/server/ai/generateQuizQuestions";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const { allowed } = analyzeLimiter(ip);
  if (!allowed) {
    return NextResponse.json({ ok: false, error: "Rate limit exceeded" }, { status: 429 });
  }

  let body: GenerateQuizInput;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  // Basic validation
  if (!body.title || typeof body.title !== "string") {
    return NextResponse.json({ ok: false, error: "Missing title" }, { status: 400 });
  }
  if (!body.summary || typeof body.summary !== "string") {
    return NextResponse.json({ ok: false, error: "Missing summary" }, { status: 400 });
  }
  if (!Array.isArray(body.keyInsights)) {
    return NextResponse.json({ ok: false, error: "Missing keyInsights" }, { status: 400 });
  }
  if (!Array.isArray(body.risksOrWarnings)) {
    return NextResponse.json({ ok: false, error: "Missing risksOrWarnings" }, { status: 400 });
  }
  if (!Array.isArray(body.learnCards)) {
    return NextResponse.json({ ok: false, error: "Missing learnCards" }, { status: 400 });
  }
  if (typeof body.count !== "number" || body.count < 1 || body.count > 20) {
    return NextResponse.json({ ok: false, error: "Invalid count (1-20)" }, { status: 400 });
  }
  if (body.provider !== "groq" && body.provider !== "gemini") {
    return NextResponse.json({ ok: false, error: "Invalid provider" }, { status: 400 });
  }

  // Size guards
  if (body.summary.length > 8000) body.summary = body.summary.slice(0, 8000);
  if (body.keyInsights.length > 20) body.keyInsights = body.keyInsights.slice(0, 20);
  if (body.risksOrWarnings.length > 10) body.risksOrWarnings = body.risksOrWarnings.slice(0, 10);
  if (body.learnCards.length > 40) body.learnCards = body.learnCards.slice(0, 40);
  for (const c of body.learnCards) {
    if (c.content && c.content.length > 2000) c.content = c.content.slice(0, 2000);
  }

  const questions = await generateQuizQuestionsFromAnalysis(body);

  if (!questions || questions.length === 0) {
    return NextResponse.json({ ok: false, error: "Quiz generation failed" }, { status: 502 });
  }

  return NextResponse.json({ ok: true, questions });
}