import { Request, Response, NextFunction } from 'express';
import { getUserId } from '../middleware/auth';
import { prisma } from '../lib/prisma';

interface CreateWatchlistItemBody {
  symbol?: string;
  name?: string;
}

const SYMBOL_PATTERN = /^[A-Z][A-Z0-9.-]{0,9}$/;

function requireAuthenticatedUser(req: Request, res: Response): string | null {
  const userId = getUserId(req);
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return null;
  }
  return userId;
}

function normalizeSymbol(symbol: unknown): string | null {
  if (typeof symbol !== 'string') return null;

  const normalized = symbol.trim().toUpperCase();
  if (!SYMBOL_PATTERN.test(normalized)) return null;

  return normalized;
}

async function findOwnedProject(projectId: string, userId: string) {
  return prisma.project.findFirst({
    where: {
      id: projectId,
      userId,
    },
    select: { id: true },
  });
}

export const getWatchlist = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = requireAuthenticatedUser(req, res);
    if (!userId) return;

    const { projectId } = req.params;
    const project = await findOwnedProject(projectId, userId);
    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    const items = await prisma.watchlistItem.findMany({
      where: { projectId, userId },
      orderBy: { createdAt: 'desc' },
    });

    res.json(items);
  } catch (err) {
    next(err);
  }
};

export const createWatchlistItem = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = requireAuthenticatedUser(req, res);
    if (!userId) return;

    const { projectId } = req.params;
    const project = await findOwnedProject(projectId, userId);
    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    const { symbol, name } = req.body as CreateWatchlistItemBody;
    const normalizedSymbol = normalizeSymbol(symbol);
    if (!normalizedSymbol) {
      res.status(400).json({ error: 'symbol must be 1-10 characters using letters, numbers, dots, or hyphens' });
      return;
    }

    const existing = await prisma.watchlistItem.findFirst({
      where: {
        projectId,
        symbol: normalizedSymbol,
      },
      select: { id: true },
    });

    if (existing) {
      res.status(409).json({ error: 'Symbol already exists in this project watchlist' });
      return;
    }

    const item = await prisma.watchlistItem.create({
      data: {
        projectId,
        userId,
        symbol: normalizedSymbol,
        name: typeof name === 'string' && name.trim() ? name.trim() : null,
      },
    });

    res.status(201).json(item);
  } catch (err) {
    next(err);
  }
};

export const deleteWatchlistItem = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = requireAuthenticatedUser(req, res);
    if (!userId) return;

    const { projectId, id } = req.params;
    const project = await findOwnedProject(projectId, userId);
    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    const item = await prisma.watchlistItem.findFirst({
      where: {
        id,
        projectId,
        userId,
      },
      select: { id: true },
    });

    if (!item) {
      res.status(404).json({ error: 'Watchlist item not found' });
      return;
    }

    await prisma.watchlistItem.delete({ where: { id } });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
};
