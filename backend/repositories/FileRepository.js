import { File } from '../models/index.js';

class FileRepository {
  async createFile(fileData) {
    return await File.create(fileData);
  }

  async getFilesByRoom(roomId) {
    return await File.findAll({ where: { RoomId: roomId } });
  }

  async findById(id) {
    return await File.findByPk(id);
  }

  async findByNameInRoom(name, roomId) {
    return await File.findOne({ where: { name, RoomId: roomId } });
  }

  async delete(id) {
    return await File.destroy({ where: { id } });
  }

  async update(id, updateData) {
    const file = await File.findByPk(id);
    if (file) {
      return await file.update(updateData);
    }
    return null;
  }

  async bulkCreate(files) {
    return await File.bulkCreate(files);
  }
}

export default new FileRepository();