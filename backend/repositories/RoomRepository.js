import { Room } from '../models/index.js';

class RoomRepository {
  async create(roomData) {
    return await Room.create(roomData);
  }

  async findById(id) {
    return await Room.findByPk(id);
  }

  async update(id, updateData) {
    return await Room.update(updateData, { where: { id } });
  }
}

export default new RoomRepository();