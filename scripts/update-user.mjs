import postgres from "postgres";
import { randomUUID } from "crypto";

const sql = postgres("postgresql://postgres:postgres@localhost:5432/daily_field_reporting");

const [tenant] = await sql`SELECT id FROM tenants LIMIT 1`;
console.log("Tenant:", tenant.id);

const rows = await sql`
  INSERT INTO users (id, tenant_id, clerk_user_id, email, name, role)
  VALUES (${randomUUID()}, ${tenant.id}, 'user_3DVSCuX6z5D3QwU105ZEFc1Mley', 'brett@3flats.ai', 'Brett', 'admin')
  ON CONFLICT (clerk_user_id) DO UPDATE SET email = 'brett@3flats.ai', name = 'Brett'
  RETURNING id, email, role, clerk_user_id
`;

console.log("User:", JSON.stringify(rows, null, 2));
await sql.end();
