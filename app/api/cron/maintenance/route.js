import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { isDatabaseConfigured } from "@/lib/db";
import { runMaintenance } from "@/lib/maintenance";

export const dynamic = "force-dynamic";

function authorised(request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const expected = Buffer.from(`Bearer ${secret}`);
  const actual = Buffer.from(request.headers.get("authorization") ?? "");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

/** Daily job (vercel.json → crons). Vercel sends `Authorization: Bearer $CRON_SECRET`. */
export async function GET(request) {
  if (!process.env.CRON_SECRET) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 503 });
  }
  if (!authorised(request)) {
    return NextResponse.json({ error: "unauthorised" }, { status: 401 });
  }
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ skipped: "database not configured" });
  }
  try {
    const result = await runMaintenance();
    console.info("[maintenance]", JSON.stringify(result));
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("[maintenance] failed", err);
    return NextResponse.json({ ok: false, error: "maintenance failed" }, { status: 500 });
  }
}
