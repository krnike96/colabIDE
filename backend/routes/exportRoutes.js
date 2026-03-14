import express from 'express';
import ExportController from '../controllers/ExportController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Only protected users can export
router.get('/:roomId', protect, (req, res) => ExportController.download(req, res));

export default router;