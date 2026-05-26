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

// Public GET routes — Clerk bypass in index.ts prevents 302 redirect.
// Controller still returns 401 JSON if no valid auth token is present.
router.get('/', getProjects);
router.get('/:id', getProjectById);

// All write routes and watchlist routes require full Clerk auth
router.get('/:projectId/watchlist', requireAuth as any, getWatchlist);
router.post('/', requireAuth as any, createProject);
router.post('/:projectId/watchlist', requireAuth as any, createWatchlistItem);
router.patch('/:id', requireAuth as any, updateProject);
router.delete('/:projectId/watchlist/:id', requireAuth as any, deleteWatchlistItem);
router.delete('/:id', requireAuth as any, deleteProject);

export default router;
