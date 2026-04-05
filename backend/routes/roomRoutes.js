import express from 'express';
import RoomController from '../controllers/RoomController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protect, (req, res) => RoomController.create(req, res));
router.get('/', protect, (req, res) => RoomController.getAllRooms(req, res));
router.get('/:id', protect, (req, res) => RoomController.getRoom(req, res));
router.post('/join', protect, (req, res) => RoomController.joinRoom(req, res));

export default router;