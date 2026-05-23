import { Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { projectsStore } from '../store/projects';
import type { CreateProjectBody, ProjectStatus } from '../types/project';

const VALID_STATUSES: ProjectStatus[] = ['active', 'paused', 'completed'];

export const getProjects = (_req: Request, res: Response): void => {
  res.json(projectsStore);
};

export const getProjectById = (req: Request, res: Response): void => {
  const project = projectsStore.find((p) => p.id === req.params.id);
  if (!project) {
    res.status(404).json({ error: 'Project not found' });
    return;
  }
  res.json(project);
};

export const createProject = (req: Request, res: Response): void => {
  const { name, description, status } = req.body as CreateProjectBody;

  if (!name || typeof name !== 'string' || !name.trim()) {
    res.status(400).json({ error: 'name is required' });
    return;
  }

  if (status !== undefined && !VALID_STATUSES.includes(status)) {
    res.status(400).json({ error: `status must be one of: ${VALID_STATUSES.join(', ')}` });
    return;
  }

  const project = {
    id: randomUUID(),
    name: name.trim(),
    description: description?.trim() ?? '',
    status: (status ?? 'active') as ProjectStatus,
    createdAt: new Date().toISOString(),
  };

  projectsStore.push(project);
  res.status(201).json(project);
};
