import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import type { CreateProjectBody, ProjectStatus } from '../types/project';

const VALID_STATUSES: ProjectStatus[] = ['active', 'paused', 'completed'];

export const getProjects = async (
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const projects = await prisma.project.findMany({ orderBy: { createdAt: 'desc' } });
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
    const project = await prisma.project.findUnique({ where: { id: req.params.id } });
    if (!project) {
      res.status(404).json({ error: 'Project not found' });
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
