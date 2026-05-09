import { NextRequest } from "next/server";
import { z, ZodSchema } from "zod";
import { BadRequestError } from "./errors";

export async function validate<T>(req: NextRequest, schema: ZodSchema<T>): Promise<T> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    throw new BadRequestError("Invalid JSON body");
  }

  const result = schema.safeParse(body);
  if (!result.success) {
    const message = result.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ");
    throw new BadRequestError(message);
  }
  return result.data;
}

export function validateParams<T>(
  params: Record<string, string>,
  schema: ZodSchema<T>
): T {
  const result = schema.safeParse(params);
  if (!result.success) {
    throw new BadRequestError("Invalid path parameters");
  }
  return result.data;
}
