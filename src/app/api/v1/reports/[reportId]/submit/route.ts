import { NextRequest } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { dailyReports, jobs, wells, users } from "@/db/schema";
import { getAuthContext } from "@/lib/auth/get-tenant";
import { requireRole } from "@/lib/auth/permissions";
import { ok, handleError } from "@/lib/api/response";
import { NotFoundError, BadRequestError } from "@/lib/api/errors";
import { sendSubmitNotification } from "@/lib/email/send-distribution";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ reportId: string }> }) {
  try {
    const ctx = await getAuthContext();
    requireRole(ctx, ["admin", "editor"]);
    const { reportId } = await params;

    const [report] = await db.select().from(dailyReports)
      .where(and(eq(dailyReports.id, reportId), eq(dailyReports.tenantId, ctx.tenantId)))
      .limit(1);
    if (!report) throw new NotFoundError("Report not found");
    if (report.status !== "draft" && report.status !== "rejected") {
      throw new BadRequestError("Only draft or rejected reports can be submitted");
    }

    const [updated] = await db.update(dailyReports)
      .set({ status: "submitted", submittedAt: new Date(), updatedAt: new Date() })
      .where(eq(dailyReports.id, reportId))
      .returning();

    const [job] = await db.select().from(jobs).where(eq(jobs.id, report.jobId)).limit(1);
    const [well] = job ? await db.select().from(wells).where(eq(wells.id, job.wellId)).limit(1) : [];

    const admins = await db.select().from(users)
      .where(and(eq(users.tenantId, ctx.tenantId), eq(users.role, "admin")));

    await sendSubmitNotification({
      adminEmails: admins.map((a) => a.email),
      wellName: well?.name ?? "Unknown Well",
      reportDate: report.reportDate,
      tenantName: ctx.tenantId,
      reportId,
    });

    return ok(updated);
  } catch (err) {
    return handleError(err);
  }
}
