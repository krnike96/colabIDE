import RoomService from '../services/RoomService.js';

class RoomController {
  async create(req, res) {
    try {
      const { name } = req.body;
      const adminId = req.user.id; // From authMiddleware
      const room = await RoomService.createRoom(name, adminId);
      res.status(201).json(room);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async getRoom(req, res) {
    try {
      const room = await RoomService.getRoomDetails(req.params.id);
      res.status(200).json(room);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  }
}

export default new RoomController();