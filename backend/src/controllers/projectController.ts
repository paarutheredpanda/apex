import { Request, Response, NextFunction } from 'express';
import { getAuth } from '@clerk/express';
import { prisma } from '../lib/prisma';
import type { CreateProjectBody, UpdateProjectBody, ProjectStatus } from '../types/project';

const VALID_STATUSES: ProjectStatus[] = ['active', 'paused', 'completed'];

// For write routes: MANDATORY authentication
function requireUserId(req: Request, res: Response): string | null {
  try {
    const auth = getAuth(req as any);
    if (!auth || !auth.userId) {
      res.status(401).json({ error: "Unauthorized" });
      return null;
    }
    return auth.userId;
  } catch {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }
}

// FIXED: For read routes: OPTIONAL authentication
function getOptionalUserId(req: Request): string | null {
  try {
    const auth = getAuth(req as any);
    return auth?.userId ?? null;
  } catch {
    return null; // Gracefully fall back to null if no one is logged in
  }
}

export const getProjects = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = getOptionalUserId(req);

    // If logged in: fetch only user's projects. If logged out: fetch all public projects.
    const projects = await prisma.project.findMany({
      where: userId ? { userId } : {},
      orderBy: { createdAt: 'desc' },
    });
    res.json(projects);
  } catch (err) {
    next(err);
  }
};

export const getProjectById = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = getOptionalUserId(req);

    const project = await prisma.project.findUnique({
      where: { id: req.params.id },
    });

    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    // If the project belongs to a specific user, and an unauthenticated visitor is trying to view it,
    // you can choose to hide it. Otherwise, let it pass. Adjust this condition to your preference.
    if (userId && project.userId !== userId) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    res.json(project);
  } catch (err) {
    next(err);
  }
};

export const createProject = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;

    const { name, description, status } = req.body as CreateProjectBody;

    if (!name || typeof name !== 'string' || !name.trim()) {
      res.status(400).json({ error: 'name is required' });
      return;
    }

    if (status !== undefined && !VALID_STATUSES.includes(status)) {
      res.status(400).json({ error: `status must be one of: ${VALID_STATUSES.join(', ')}` });
      return;
    }

    const project = await prisma.project.create({
      data: {
        userId,
        name: name.trim(),
        description: description?.trim() ?? '',
        status: status ?? 'active',
      },
    });

    res.status(201).json(project);
  } catch (err) {
    next(err);
  }
};

export const updateProject = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;

    const project = await prisma.project.findUnique({ where: { id: req.params.id } });
    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }
    if (project.userId !== userId) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const { name, description, status } = req.body as UpdateProjectBody;

    if (name !== undefined && (typeof name !== 'string' || !name.trim())) {
      res.status(400).json({ error: 'name must be a non-empty string' });
      return;
    }

    if (status !== undefined && !VALID_STATUSES.includes(status)) {
      res.status(400).json({ error: `status must be one of: ${VALID_STATUSES.join(', ')}` });
      return;
    }

    const updated = await prisma.project.update({
      where: { id: req.params.id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(description !== undefined && { description: description.trim() }),
        ...(status !== undefined && { status }),
      },
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
};

export const deleteProject = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;

    const project = await prisma.project.findUnique({ where: { id: req.params.id } });
    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }
    if (project.userId !== userId) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    await prisma.project.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
};