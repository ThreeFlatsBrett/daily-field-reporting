import { NextRequest } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { dailyReports, jobs } from "@/db/schema";
import { getAuthContext } from "@/lib/auth/get-tenant";
import { requireRole } from "@/lib/auth/permissions";
import { validate } from "@/lib/api/validate";
import { ok, created, handleError } from "@/lib/api/response";
import { CreateReportSchema } from "@/types/api";
import { BadRequestError } from "@/lib/api/errors";

export async function GET() {
  try {
    const ctx = await getAuthContext();
    const rows = await db.select().from(dailyReports)
      .where(eq(dailyReports.tenantId, ctx.tenantId));
    return ok(rows);
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await getAuthContext();
    requireRole(ctx, ["admin", "editor"]);
    const body = await validate(req, CreateReportSchema);

    const [job] = await db.select().from(jobs)
      .where(and(eq(jobs.id, body.jobId), eq(jobs.tenantId, ctx.tenantId)))
      .limit(1);
    if (!job) throw new BadRequestError("Job not found");

    const [report] = await db.insert(dailyReports).values({
      tenantId: ctx.tenantId,
      jobId: body.jobId,
      reportDate: body.reportDate,
      status: "draft",
    }).returning();

    return created(report);
  } catch (err) {
    return handleError(err);
  }
}
