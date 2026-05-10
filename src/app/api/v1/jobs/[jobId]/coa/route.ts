import { NextRequest } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { chartsOfAccounts, coaLineItems, jobs } from "@/db/schema";
import { getAuthContext } from "@/lib/auth/get-tenant";
import { ok, handleError } from "@/lib/api/response";
import { NotFoundError } from "@/lib/api/errors";

type Params = { params: Promise<{ jobId: string }> };

// GET — returns { coa, lineItems }. Auto-creates COA if it doesn't exist.
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const ctx = await getAuthContext();
    const { jobId } = await params;

    // Verify job belongs to tenant
    const [job] = await db.select({ id: jobs.id, name: jobs.name })
      .from(jobs)
      .where(and(eq(jobs.id, jobId), eq(jobs.tenantId, ctx.tenantId)))
      .limit(1);
    if (!job) throw new NotFoundError("Job not found");

    // Get or auto-create COA
    let [coa] = await db.select().from(chartsOfAccounts)
      .where(and(eq(chartsOfAccounts.jobId, jobId), eq(chartsOfAccounts.tenantId, ctx.tenantId)))
      .limit(1);

    if (!coa) {
      [coa] = await db.insert(chartsOfAccounts)
        .values({ tenantId: ctx.tenantId, jobId, name: `${job.name} COA` })
        .returning();
    }

    const lineItems = await db.select().from(coaLineItems)
      .where(eq(coaLineItems.coaId, coa.id))
      .orderBy(coaLineItems.sortOrder, coaLineItems.createdAt);

    return ok({ coa, lineItems });
  } catch (err) { return handleError(err); }
}
