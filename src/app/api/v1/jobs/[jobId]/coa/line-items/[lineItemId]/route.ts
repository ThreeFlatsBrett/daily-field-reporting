import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { coaLineItems } from "@/db/schema";
import { getAuthContext } from "@/lib/auth/get-tenant";
import { requireRole } from "@/lib/auth/permissions";
import { ok, noContent, handleError } from "@/lib/api/response";
import { NotFoundError } from "@/lib/api/errors";

type Params = { params: Promise<{ lineItemId: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const ctx = await getAuthContext();
    requireRole(ctx, ["admin", "editor"]);
    void ctx;
    const { lineItemId } = await params;
    const body = await req.json();
    const { id, coaId, createdAt, ...updateable } = body;
    void id; void coaId; void createdAt;
    const [item] = await db.update(coaLineItems)
      .set(updateable)
      .where(eq(coaLineItems.id, lineItemId))
      .returning();
    if (!item) throw new NotFoundError("Line item not found");
    return ok(item);
  } catch (err) { return handleError(err); }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const ctx = await getAuthContext();
    requireRole(ctx, ["admin", "editor"]);
    void ctx;
    const { lineItemId } = await params;
    await db.delete(coaLineItems).where(eq(coaLineItems.id, lineItemId));
    return noContent();
  } catch (err) { return handleError(err); }
}
