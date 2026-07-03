import type { Request, Response, NextFunction } from "express";

declare module "express-session" {
  interface SessionData {
    adminUserId?: number;
    adminEmail?: string;
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.session.adminUserId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}
