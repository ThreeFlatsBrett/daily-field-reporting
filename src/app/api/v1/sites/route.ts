import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { sites } from "@/db/schema";
import { getAuthContext } from "@/lib/auth/get-tenant";
import { requireRole } from "@/lib/auth/permissions";
import { validate } from "@/lib/api/validate";
import { ok, created, handleError } from "@/lib/api/response";
import { CreateSiteSchema } from "@/types/api";

export async function GET() {
  try {
    const ctx = await getAuthContext();
    const rows = await db.select().from(sites).where(eq(sites.tenantId, ctx.tenantId));
    return ok(rows);
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await getAuthContext();
    requireRole(ctx, ["admin"]);
    const body = await validate(req, CreateSiteSchema);
    const [site] = await db.insert(sites).values({ ...body, tenantId: ctx.tenantId }).returning();
    return created(site);
  } catch (err) {
    return handleError(err);
  }
}
