import { AppError } from "./errors";

export function ok(data: unknown, status = 200) {
  return Response.json({ data }, { status });
}

export function created(data: unknown) {
  return Response.json({ data }, { status: 201 });
}

export function noContent() {
  return new Response(null, { status: 204 });
}

export function badRequest(message: string) {
  return Response.json({ error: message }, { status: 400 });
}

export function unauthorized() {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}

export function forbidden() {
  return Response.json({ error: "Forbidden" }, { status: 403 });
}

export function notFound(message = "Not found") {
  return Response.json({ error: message }, { status: 404 });
}

export function handleError(err: unknown) {
  if (err instanceof AppError) {
    return Response.json({ error: err.message }, { status: err.statusCode });
  }
  console.error(err);
  return Response.json({ error: "Internal server error" }, { status: 500 });
}
