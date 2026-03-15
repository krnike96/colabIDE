import express from 'express';
import ProjectController from '../controllers/ProjectController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * GET: Load project content (HTML, CSS, JS)
 * URL: /api/projects/:id
 */
router.get('/:id', protect, (req, res) => ProjectController.getProject(req, res));

/**
 * PUT: Save project content to the database
 * URL: /api/projects/:id
 */
router.put('/:id', protect, (req, res) => ProjectController.updateProject(req, res));

export default router;