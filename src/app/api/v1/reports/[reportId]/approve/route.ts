import { NextRequest } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { dailyReports } from "@/db/schema";
import { getAuthContext } from "@/lib/auth/get-tenant";
import { requireRole } from "@/lib/auth/permissions";
import { ok, handleError } from "@/lib/api/response";
import { NotFoundError, BadRequestError } from "@/lib/api/errors";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ reportId: string }> }) {
  try {
    const ctx = await getAuthContext();
    requireRole(ctx, ["admin"]);
    const { reportId } = await params;

    const [report] = await db.select().from(dailyReports)
      .where(and(eq(dailyReports.id, reportId), eq(dailyReports.tenantId, ctx.tenantId)))
      .limit(1);
    if (!report) throw new NotFoundError("Report not found");
    if (report.status !== "submitted") {
      throw new BadRequestError("Only submitted reports can be approved");
    }

    const [updated] = await db.update(dailyReports)
      .set({ status: "approved", approvedAt: new Date(), approvedBy: ctx.userId, updatedAt: new Date() })
      .where(eq(dailyReports.id, reportId))
      .returning();

    return ok(updated);
  } catch (err) {
    return handleError(err);
  }
}
