import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { getDb, adminUsers, appConfig } from "@dulceriacar/db";
import { DEFAULT_CONFIG } from "@dulceriacar/db/seed-data";

export async function runSeed() {
  const db = getDb();

  for (const entry of DEFAULT_CONFIG) {
    const [existing] = await db
      .select()
      .from(appConfig)
      .where(eq(appConfig.key, entry.key))
      .limit(1);

    if (!existing) {
      await db.insert(appConfig).values({
        key: entry.key,
        value: entry.value,
        valueType: entry.valueType,
        isPublic: entry.isPublic,
        description: entry.description,
      });
    }
  }

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (adminEmail && adminPassword) {
    const email = adminEmail.toLowerCase();
    const [existingAdmin] = await db
      .select()
      .from(adminUsers)
      .where(eq(adminUsers.email, email))
      .limit(1);

    if (!existingAdmin) {
      const passwordHash = await bcrypt.hash(adminPassword, 12);
      await db.insert(adminUsers).values({ email, passwordHash });
      console.log(`Admin user created: ${email}`);
    }
  }

  console.log("Seed completed.");
}

runSeed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
