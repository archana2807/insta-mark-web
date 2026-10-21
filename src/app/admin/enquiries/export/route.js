import { NextResponse } from "next/server";
import { getCurrentUser } from "@/server/auth/session";
import * as enquiryService from "@/server/modules/enquiries/enquiry.service";

export const dynamic = "force-dynamic";

/**
 * CSV export of the filtered enquiry list (same filters as the list page).
 * @param {Request} request
 */
export async function GET(request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorised" }, { status: 401 });

  const params = Object.fromEntries(new URL(request.url).searchParams);
  const { csv, filename } = await enquiryService.exportCsv(params, user);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
