import { NextRequest } from "next/server";
import { z } from "zod";
import { getAuthContext } from "@/lib/auth/get-tenant";
import { requireRole } from "@/lib/auth/permissions";
import { validate } from "@/lib/api/validate";
import { ok, handleError } from "@/lib/api/response";
import { parseTimeLog } from "@/lib/ai/parse-timelog";

const ParseTimeLogSchema = z.object({
  text: z.string().min(1),
  currentDepth: z.number().optional(),
  jobModule: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const ctx = await getAuthContext();
    requireRole(ctx, ["admin", "editor"]);
    const body = await validate(req, ParseTimeLogSchema);
    const entries = await parseTimeLog(body.text, {
      currentDepth: body.currentDepth,
      jobModule: body.jobModule,
    });
    return ok(entries);
  } catch (err) {
    return handleError(err);
  }
}
