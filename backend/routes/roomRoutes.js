import express from 'express';
import RoomController from '../controllers/RoomController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All room routes require a valid token
router.post('/', protect, (req, res) => RoomController.create(req, res));
router.get('/:id', protect, (req, res) => RoomController.getRoom(req, res));

export default router;