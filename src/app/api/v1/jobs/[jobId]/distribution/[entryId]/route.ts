import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { distributionLists } from "@/db/schema";
import { getAuthContext } from "@/lib/auth/get-tenant";
import { requireRole } from "@/lib/auth/permissions";
import { noContent, handleError } from "@/lib/api/response";

type Params = { params: Promise<{ entryId: string }> };

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const ctx = await getAuthContext();
    requireRole(ctx, ["admin", "editor"]);
    void ctx;
    const { entryId } = await params;
    await db.delete(distributionLists).where(eq(distributionLists.id, entryId));
    return noContent();
  } catch (err) { return handleError(err); }
}
