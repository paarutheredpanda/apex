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

// REMOVED: router.use(requireAuth as any); <--- No longer blocking everything!

// PUBLIC ROUTES (Anyone can access these in a browser tab)
router.get('/', getProjects);       // GET /projects
router.get('/:id', getProjectById); // GET /projects/:id

// PROTECTED ROUTES (Only logged-in users can modify data)
router.post('/', requireAuth as any, createProject);
router.patch('/:id', requireAuth as any, updateProject);
router.delete('/:id', requireAuth as any, deleteProject);

export default router;