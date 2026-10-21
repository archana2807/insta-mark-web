import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import * as enquiryService from "@/server/modules/enquiries/enquiry.service";

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
  try {
    const result = await enquiryService.runMaintenance();
    if ("skipped" in result) return NextResponse.json(result);
    console.info("[maintenance]", JSON.stringify(result));
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("[maintenance] failed", err);
    return NextResponse.json({ ok: false, error: "maintenance failed" }, { status: 500 });
  }
}
