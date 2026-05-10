import { NextRequest } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { distributionLists, jobs } from "@/db/schema";
import { getAuthContext } from "@/lib/auth/get-tenant";
import { requireRole } from "@/lib/auth/permissions";
import { ok, created, handleError } from "@/lib/api/response";
import { NotFoundError } from "@/lib/api/errors";
import { z } from "zod";
import { validate } from "@/lib/api/validate";

type Params = { params: Promise<{ jobId: string }> };

const AddRecipientSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("external_email"),
    email: z.string().email(),
    displayName: z.string().optional(),
  }),
  z.object({
    type: z.literal("internal"),
    referenceId: z.string().uuid(),
    email: z.string().email(),
    displayName: z.string(),
  }),
  z.object({
    type: z.literal("partner_company"),
    referenceId: z.string().uuid(),
    displayName: z.string(),
    email: z.string().optional(),
  }),
]);

async function verifyJob(jobId: string, tenantId: string) {
  const [job] = await db.select({ id: jobs.id }).from(jobs)
    .where(and(eq(jobs.id, jobId), eq(jobs.tenantId, tenantId))).limit(1);
  if (!job) throw new NotFoundError("Job not found");
}

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const ctx = await getAuthContext();
    const { jobId } = await params;
    await verifyJob(jobId, ctx.tenantId);
    const rows = await db.select().from(distributionLists)
      .where(eq(distributionLists.jobId, jobId))
      .orderBy(distributionLists.createdAt);
    return ok(rows);
  } catch (err) { return handleError(err); }
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const ctx = await getAuthContext();
    requireRole(ctx, ["admin", "editor"]);
    const { jobId } = await params;
    await verifyJob(jobId, ctx.tenantId);
    const body = await validate(req, AddRecipientSchema);
    const [entry] = await db.insert(distributionLists).values({
      jobId,
      type: body.type,
      email: "email" in body ? body.email : null,
      referenceId: "referenceId" in body ? body.referenceId : null,
      displayName: "displayName" in body ? (body.displayName ?? null) : null,
    }).returning();
    return created(entry);
  } catch (err) { return handleError(err); }
}
