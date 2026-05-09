import { NextRequest } from "next/server";
import { z } from "zod";
import { getAuthContext } from "@/lib/auth/get-tenant";
import { requireRole } from "@/lib/auth/permissions";
import { validate } from "@/lib/api/validate";
import { ok, handleError } from "@/lib/api/response";
import { parseDocument } from "@/lib/ai/parse-document";

const ParseDocumentSchema = z.object({
  fileContent: z.string().min(1),
  fileType: z.enum(["pdf", "xlsx", "csv", "xml", "witsml", "json", "las"]),
  jobModule: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const ctx = await getAuthContext();
    requireRole(ctx, ["admin", "editor"]);
    const body = await validate(req, ParseDocumentSchema);
    const result = await parseDocument(body.fileContent, body.fileType, body.jobModule);
    return ok(result);
  } catch (err) {
    return handleError(err);
  }
}
