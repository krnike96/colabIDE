import RoomRepository from '../repositories/RoomRepository.js';
import { Participant } from '../models/index.js';

class RoomService {
  async createRoom(name, adminUserId) {
    // 1. Create the Room
    const room = await RoomRepository.create({ name });

    // 2. Assign the creator as the ADMIN (Single Responsibility)
    await Participant.create({
      UserId: adminUserId,
      RoomId: room.id,
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