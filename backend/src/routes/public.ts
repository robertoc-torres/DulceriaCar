import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { getDb, appConfig } from "@dulceriacar/db";

const router: IRouter = Router();

router.get("/config", async (_req, res) => {
  const db = getDb();
  const rows = await db
    .select()
    .from(appConfig)
    .where(eq(appConfig.isPublic, true))
    .orderBy(appConfig.key);

  const config: Record<string, unknown> = {};
  for (const row of rows) {
    config[row.key] = row.value;
  }
  res.json(config);
});

router.get("/catalog", async (_req, res) => {
  const db = getDb();
  const [row] = await db
    .select()
    .from(appConfig)
    .where(eq(appConfig.key, "pricing.catalog"))
    .limit(1);

  if (!row) {
    res.status(404).json({ error: "Catalog not configured" });
    return;
  }

  res.json(row.value);
});

export default router;
