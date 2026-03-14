import { File } from '../models/index.js';

class FileRepository {
  async createFile(fileData) {
    return await File.create(fileData);
  }

  async getFilesByRoom(roomId) {
    return await File.findAll({ where: { RoomId: roomId } });
  }

  async deleteFile(fileId) {
    return await File.destroy({ where: { id: fileId } });
  }
}

export default new FileRepository();