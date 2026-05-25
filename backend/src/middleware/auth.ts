import { requireAuth as clerkRequireAuth, getAuth } from '@clerk/express';
import type { Request, Response, NextFunction } from 'express';

export const requireAuth = clerkRequireAuth();

export function getCurrentUserId(req: Request): string | null {
  return getAuth(req).userId ?? null;
}

export function assertAuth(req: Request, res: Response, next: NextFunction): void {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  next();
}
