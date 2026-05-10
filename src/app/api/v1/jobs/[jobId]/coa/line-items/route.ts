import { NextRequest } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { chartsOfAccounts, coaLineItems, jobs } from "@/db/schema";
import { getAuthContext } from "@/lib/auth/get-tenant";
import { requireRole } from "@/lib/auth/permissions";
import { created, handleError } from "@/lib/api/response";
import { NotFoundError } from "@/lib/api/errors";
import { z } from "zod";
import { validate } from "@/lib/api/validate";

type Params = { params: Promise<{ jobId: string }> };

const CreateLineItemSchema = z.object({
  category: z.string().min(1),
  description: z.string().min(1),
  afeId: z.string().uuid().optional(),
  afeAmount: z.string().optional(),
  sortOrder: z.number().int().optional(),
});

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const ctx = await getAuthContext();
    requireRole(ctx, ["admin", "editor"]);
    const { jobId } = await params;

    // Verify job + get COA
    const [job] = await db.select({ id: jobs.id }).from(jobs)
      .where(and(eq(jobs.id, jobId), eq(jobs.tenantId, ctx.tenantId))).limit(1);
    if (!job) throw new NotFoundError("Job not found");

    let [coa] = await db.select().from(chartsOfAccounts)
      .where(and(eq(chartsOfAccounts.jobId, jobId), eq(chartsOfAccounts.tenantId, ctx.tenantId)))
      .limit(1);
    if (!coa) {
      [coa] = await db.insert(chartsOfAccounts)
        .values({ tenantId: ctx.tenantId, jobId, name: "Chart of Accounts" })
        .returning();
    }

    const body = await validate(req, CreateLineItemSchema);
    const [item] = await db.insert(coaLineItems).values({
      coaId: coa.id, ...body,
    }).returning();

    return created(item);
  } catch (err) { return handleError(err); }
}
