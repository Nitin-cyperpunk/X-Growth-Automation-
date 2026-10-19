import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { hash } from "bcryptjs";
import * as schema from "../lib/db/schema";

async function seed() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL is not set");
    process.exit(1);
  }

  const sql = neon(url);
  const db = drizzle(sql, { schema });

  const email = process.env.ADMIN_EMAIL || "admin@concaveinsights.com";
  const password = process.env.ADMIN_PASSWORD || "xgrowth2026";

  console.log(`Seeding admin user: ${email}`);

  const passwordHash = await hash(password, 12);

  const [user] = await db
    .insert(schema.users)
    .values({
      email,
      name: "Admin",
      passwordHash,
    })
    .onConflictDoNothing({ target: schema.users.email })
    .returning();

  if (user) {
    console.log(`Created admin user: ${user.id}`);
  } else {
    console.log("Admin user already exists, skipping.");
  }

  console.log("Seed complete.");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
