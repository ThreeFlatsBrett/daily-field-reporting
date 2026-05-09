import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { partnerCompanies } from "@/db/schema";
import { getAuthContext } from "@/lib/auth/get-tenant";
import { requireRole } from "@/lib/auth/permissions";
import { validate } from "@/lib/api/validate";
import { ok, created, handleError } from "@/lib/api/response";
import { CreatePartnerCompanySchema } from "@/types/api";

export async function GET() {
  try {
    const ctx = await getAuthContext();
    const rows = await db.select().from(partnerCompanies).where(eq(partnerCompanies.tenantId, ctx.tenantId));
    return ok(rows);
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await getAuthContext();
    requireRole(ctx, ["admin"]);
    const body = await validate(req, CreatePartnerCompanySchema);
    const [company] = await db.insert(partnerCompanies).values({ ...body, tenantId: ctx.tenantId }).returning();
    return created(company);
  } catch (err) {
    return handleError(err);
  }
}
