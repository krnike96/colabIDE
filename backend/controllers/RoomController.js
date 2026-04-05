import RoomService from '../services/RoomService.js';

class RoomController {
  async create(req, res) {
    try {
      const { name, password } = req.body;
      const adminId = req.user.id;
      const room = await RoomService.createRoom(name, adminId, password);
      res.status(201).json(room);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async getAllRooms(req, res) {
    try {
      const rooms = await RoomService.getAllRooms();
      res.status(200).json(rooms);
    } catch (error) {
      res.status(500).json({ error: error.message });
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

  async joinRoom(req, res) {
    try {
      const { roomId, password } = req.body;
      const userId = req.user.id;
      const participant = await RoomService.joinRoom(roomId, userId, password);
      res.status(200).json({ message: 'Joined successfully', role: participant.role });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
}

export default new RoomController();