import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
} from '../controllers/projectController';
import {
  getWatchlist,
  createWatchlistItem,
  deleteWatchlistItem,
} from '../controllers/watchlistController';

const router = Router();

// PROTECTED ROUTES (Only logged-in users can read or modify their own data)
router.get('/', requireAuth as any, getProjects);
router.get('/:id', requireAuth as any, getProjectById);
router.get('/:projectId/watchlist', requireAuth as any, getWatchlist);
router.post('/', requireAuth as any, createProject);
router.post('/:projectId/watchlist', requireAuth as any, createWatchlistItem);
router.patch('/:id', requireAuth as any, updateProject);
router.delete('/:projectId/watchlist/:id', requireAuth as any, deleteWatchlistItem);
router.delete('/:id', requireAuth as any, deleteProject);

export default router;
