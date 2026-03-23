import RoomRepository from '../repositories/RoomRepository.js';
import { Participant } from '../models/index.js';

class RoomService {
  async createRoom(name, adminId) {
    if (!name) throw new Error('Room name is required');
    if (!adminId) throw new Error('Admin ID is required');

    // 1. Create the room with the adminId
    const room = await RoomRepository.create({
      name,
      adminId // This fixes the NotNull violation
    });

    // 2. Automatically add the creator as an 'ADMIN' participant
    await Participant.create({
      RoomId: room.id,
      UserId: adminId,
      role: 'ADMIN'
    });

    return room;
  }

  async getRoomDetails(roomId) {
    const room = await RoomRepository.findById(roomId);
    if (!room) throw new Error('Room not found');
    return room;
  }

  async joinRoom(roomId, userId) {
    // Check if already a participant
    const existing = await Participant.findOne({ where: { RoomId: roomId, UserId: userId } });
    if (existing) return existing;

    // Join as VIEWER by default (Interface Segregation principle)
    return await Participant.create({
      UserId: userId,
      RoomId: roomId,
      role: 'VIEWER'
    });
  }
}

export default new RoomService();