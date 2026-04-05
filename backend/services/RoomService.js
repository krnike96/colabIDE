import RoomRepository from '../repositories/RoomRepository.js';
import { Participant } from '../models/index.js';
import bcrypt from 'bcryptjs';

class RoomService {
  async createRoom(name, adminId, password) {
    if (!name) throw new Error('Room name is required');
    if (!adminId) throw new Error('Admin ID is required');
    if (!password) throw new Error('Room password is required');

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const room = await RoomRepository.create({
      name,
      adminId,
      password: hashedPassword
    });

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

  async getAllRooms() {
    const rooms = await RoomRepository.findAll();
    // Return only public info (hide password)
    return rooms.map(room => ({
      id: room.id,
      name: room.name,
      adminId: room.adminId
    }));
  }

  async joinRoom(roomId, userId, password) {
    const room = await RoomRepository.findById(roomId);
    if (!room) throw new Error('Room not found');

    const isValid = await bcrypt.compare(password, room.password);
    if (!isValid) throw new Error('Invalid room password');

    const existing = await Participant.findOne({ where: { RoomId: roomId, UserId: userId } });
    if (existing) return existing;

    return await Participant.create({
      UserId: userId,
      RoomId: roomId,
      role: 'VIEWER'
    });
  }

  async validateRoomPassword(roomId, password) {
    const room = await RoomRepository.findById(roomId);
    if (!room) throw new Error('Room not found');
    return await bcrypt.compare(password, room.password);
  }
}

export default new RoomService();