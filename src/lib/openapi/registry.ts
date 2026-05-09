import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

export const registry = new OpenAPIRegistry();

registry.registerComponent("securitySchemes", "bearerAuth", {
  type: "http",
  scheme: "bearer",
  bearerFormat: "JWT",
});

export const UuidSchema = registry.register("Uuid", z.string().uuid());

export const ErrorSchema = registry.register(
  "Error",
  z.object({ error: z.string() })
);
