import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { getDb, adminUsers, appConfig } from "@dulceriacar/db";
import { requireAdmin } from "../middleware/auth";

const router: IRouter = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid credentials" });
    return;
  }

  const db = getDb();
  const [user] = await db
    .select()
    .from(adminUsers)
    .where(eq(adminUsers.email, parsed.data.email.toLowerCase()))
    .limit(1);

  if (!user || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  req.session.adminUserId = user.id;
  req.session.adminEmail = user.email;
  res.json({ email: user.email });
});

router.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      res.status(500).json({ error: "Could not log out" });
      return;
    }
    res.clearCookie("connect.sid");
    res.json({ ok: true });
  });
});

router.get("/me", requireAdmin, (req, res) => {
  res.json({ email: req.session.adminEmail });
});

router.get("/config", requireAdmin, async (_req, res) => {
  const db = getDb();
  const rows = await db.select().from(appConfig).orderBy(appConfig.key);
  res.json(
    rows.map((row) => ({
      key: row.key,
      value: row.value,
      valueType: row.valueType,
      isPublic: row.isPublic,
      description: row.description,
      updatedAt: row.updatedAt,
    })),
  );
});

router.get("/config/:key", requireAdmin, async (req, res) => {
  const db = getDb();
  const [row] = await db
    .select()
    .from(appConfig)
    .where(eq(appConfig.key, req.params.key))
    .limit(1);

  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  res.json({
    key: row.key,
    value: row.value,
    valueType: row.valueType,
    isPublic: row.isPublic,
    description: row.description,
    updatedAt: row.updatedAt,
  });
});

const updateSchema = z.object({
  value: z.unknown(),
  valueType: z.enum(["string", "number", "boolean", "json"]).optional(),
  isPublic: z.boolean().optional(),
  description: z.string().optional(),
});

router.put("/config/:key", requireAdmin, async (req, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid payload" });
    return;
  }

  const db = getDb();
  const [existing] = await db
    .select()
    .from(appConfig)
    .where(eq(appConfig.key, req.params.key))
    .limit(1);

  if (!existing) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  const [updated] = await db
    .update(appConfig)
    .set({
      value: parsed.data.value,
      valueType: parsed.data.valueType ?? existing.valueType,
      isPublic: parsed.data.isPublic ?? existing.isPublic,
      description: parsed.data.description ?? existing.description,
      updatedAt: new Date(),
    })
    .where(eq(appConfig.key, req.params.key))
    .returning();

  res.json({
    key: updated.key,
    value: updated.value,
    valueType: updated.valueType,
    isPublic: updated.isPublic,
    description: updated.description,
    updatedAt: updated.updatedAt,
  });
});

export default router;
