import { NextRequest } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { dailyReports, jobs, wells, users } from "@/db/schema";
import { getAuthContext } from "@/lib/auth/get-tenant";
import { requireRole } from "@/lib/auth/permissions";
import { validate } from "@/lib/api/validate";
import { ok, handleError } from "@/lib/api/response";
import { NotFoundError, BadRequestError } from "@/lib/api/errors";
import { RejectReportSchema } from "@/types/api";
import { sendRejectionNotification } from "@/lib/email/send-distribution";

export async function POST(req: NextRequest, { params }: { params: Promise<{ reportId: string }> }) {
  try {
    const ctx = await getAuthContext();
    requireRole(ctx, ["admin"]);
    const { reportId } = await params;
    const body = await validate(req, RejectReportSchema);

    const [report] = await db.select().from(dailyReports)
      .where(and(eq(dailyReports.id, reportId), eq(dailyReports.tenantId, ctx.tenantId)))
      .limit(1);
    if (!report) throw new NotFoundError("Report not found");
    if (report.status !== "submitted") {
      throw new BadRequestError("Only submitted reports can be rejected");
    }

    const [updated] = await db.update(dailyReports)
      .set({ status: "rejected", rejectionNote: body.rejectionNote, updatedAt: new Date() })
      .where(eq(dailyReports.id, reportId))
      .returning();

    const [job] = await db.select().from(jobs).where(eq(jobs.id, report.jobId)).limit(1);
    const [well] = job ? await db.select().from(wells).where(eq(wells.id, job.wellId)).limit(1) : [];
    const [submitter] = await db.select().from(users).where(eq(users.id, ctx.userId)).limit(1);

    if (submitter) {
      await sendRejectionNotification({
        editorEmail: submitter.email,
        wellName: well?.name ?? "Unknown Well",
        reportDate: report.reportDate,
        rejectionNote: body.rejectionNote,
        reportId,
      });
    }

    return ok(updated);
  } catch (err) {
    return handleError(err);
  }
}
