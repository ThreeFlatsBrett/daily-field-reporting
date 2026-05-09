import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { vendors } from "@/db/schema";
import { getAuthContext } from "@/lib/auth/get-tenant";
import { requireRole } from "@/lib/auth/permissions";
import { validate } from "@/lib/api/validate";
import { ok, created, handleError } from "@/lib/api/response";
import { CreateVendorSchema } from "@/types/api";

export async function GET() {
  try {
    const ctx = await getAuthContext();
    const rows = await db.select().from(vendors).where(eq(vendors.tenantId, ctx.tenantId));
    return ok(rows);
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await getAuthContext();
    requireRole(ctx, ["admin"]);
    const body = await validate(req, CreateVendorSchema);
    const [vendor] = await db.insert(vendors).values({ ...body, tenantId: ctx.tenantId }).returning();
    return created(vendor);
  } catch (err) {
    return handleError(err);
  }
}
