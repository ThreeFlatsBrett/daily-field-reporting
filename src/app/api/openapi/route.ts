import { OpenApiGeneratorV3 } from "@asteasolutions/zod-to-openapi";
import { registry } from "@/lib/openapi/registry";

export async function GET() {
  const generator = new OpenApiGeneratorV3(registry.definitions);
  const spec = generator.generateDocument({
    openapi: "3.0.0",
    info: {
      title: "Daily Field Reporting API",
      version: "1.0.0",
      description: "Upstream O&G daily field reporting platform API",
    },
    servers: [{ url: "/api/v1" }],
  });
  return Response.json(spec);
}
