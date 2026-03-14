import express from 'express';
import FileController from '../controllers/FileController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply 'protect' middleware so only logged-in users can manage files
router.post('/', protect, (req, res) => FileController.create(req, res));
router.get('/room/:roomId', protect, (req, res) => FileController.getFiles(req, res));

export default router;