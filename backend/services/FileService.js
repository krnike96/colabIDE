import FileRepository from '../repositories/FileRepository.js';

class FileService {
  async createFile(name, language, roomId) {
    // Validates supported languages (Phase 1) [cite: 6]
    const supportedLanguages = ['html', 'css', 'javascript'];
    if (!supportedLanguages.includes(language.toLowerCase())) {
      throw new Error('Unsupported language');
    }

    return await FileRepository.createFile({
      name,
      language,
      RoomId: roomId
    });
  }

  async updateContent(fileId, content) {
    // This will be called by our WebSocket sync later
    const file = await FileRepository.findById(fileId);
    if (!file) throw new Error('File not found');
    
    file.content = content;
    return await file.save();
  }

  async getRoomFiles(roomId) {
    return await FileRepository.getFilesByRoom(roomId);
  }
}

export default new FileService();