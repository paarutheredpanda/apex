import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { getProjects, getProjectById, createProject } from '../controllers/projectController';

const router = Router();

router.use(requireAuth);

router.get('/', getProjects);
router.post('/', createProject);
router.get('/:id', getProjectById);

export default router;
