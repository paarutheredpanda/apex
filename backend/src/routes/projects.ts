import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
} from '../controllers/projectController';

const router = Router();

// PROTECTED ROUTES (Only logged-in users can read or modify their own data)
router.get('/', requireAuth as any, getProjects);
router.get('/:id', requireAuth as any, getProjectById);
router.post('/', requireAuth as any, createProject);
router.patch('/:id', requireAuth as any, updateProject);
router.delete('/:id', requireAuth as any, deleteProject);

export default router;
