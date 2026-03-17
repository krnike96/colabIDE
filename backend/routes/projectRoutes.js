import express from 'express';
import ProjectController from '../controllers/ProjectController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/room/:id', protect, (req, res) => ProjectController.getProjectFiles(req, res));
router.put('/file/:fileId', protect, (req, res) => ProjectController.saveFileContent(req, res));
router.patch('/file/:fileId/rename', protect, (req, res) => ProjectController.renameFile(req, res));
export default router;