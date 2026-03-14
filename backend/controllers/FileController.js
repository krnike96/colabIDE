import FileService from '../services/FileService.js';

class FileController {
  async create(req, res) {
    try {
      const { name, language, roomId } = req.body;
      const file = await FileService.createFile(name, language, roomId);
      res.status(201).json(file);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async getFiles(req, res) {
    try {
      const files = await FileService.getRoomFiles(req.params.roomId);
      res.status(200).json(files);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async delete(req, res) {
    try {
      const result = await FileService.removeFile(req.params.id);
      res.status(200).json(result);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  }
}

export default new FileController();