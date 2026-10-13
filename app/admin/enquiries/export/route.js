import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { csvCell, enquiryWhere } from "@/lib/admin/enquiries";
import { logAudit } from "@/lib/admin/audit";

export const dynamic = "force-dynamic";

const COLUMNS = [
  ["Received", (e) => e.createdAt],
  ["Status", (e) => e.status],
  ["Name", (e) => e.name],
  ["Company", (e) => e.company],
  ["Email", (e) => e.email],
  ["Phone", (e) => e.phone],
  ["Project location", (e) => e.projectLocation],
  ["Requirement", (e) => e.requirement],
  ["Solution page", (e) => e.category?.name],
  ["Message", (e) => e.message],
  ["Owner", (e) => e.assignedTo?.name],
  ["Source page", (e) => e.sourcePage],
  ["UTM source", (e) => e.utmSource],
  ["UTM medium", (e) => e.utmMedium],
  ["UTM campaign", (e) => e.utmCampaign],
];

/** CSV export of the filtered enquiry list (same filters as the list page). */
export async function GET(request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorised" }, { status: 401 });

  const params = Object.fromEntries(new URL(request.url).searchParams);
  const prisma = await getPrisma();
  const rows = await prisma.enquiry.findMany({
    where: enquiryWhere(params),
    orderBy: { createdAt: "desc" },
    take: 10000,
    include: { category: { select: { name: true } }, assignedTo: { select: { name: true } } },
  });

  const lines = [
    COLUMNS.map(([h]) => csvCell(h)).join(","),
    ...rows.map((e) => COLUMNS.map(([, get]) => csvCell(get(e))).join(",")),
  ];
  await logAudit(user, "EXPORT", "Enquiry", null, {
    rows: [null, rows.length],
    filters: [null, params],
  });

  const date = new Date().toISOString().slice(0, 10);
  // BOM so Excel opens UTF-8 (names in Hindi etc.) correctly.
  return new NextResponse("\uFEFF" + lines.join("\r\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="insta-mark-enquiries-${date}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
