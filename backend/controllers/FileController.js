import FileService from '../services/FileService.js';

class FileController {
  async create(req, res) {
    try {
      const { name, language, roomId } = req.body;
      // All validation and creation now happens in the Service
      const file = await FileService.createFile(name, language, roomId);
      res.status(201).json(file);
    } catch (error) {
      // Service throws specific errors which we catch here
      res.status(400).json({ error: error.message });
    }
  }

  async delete(req, res) {
    try {
      const { id } = req.params;
      await FileService.removeFile(id);
      res.status(200).json({ message: "Deleted successfully" });
    } catch (error) {
      res.status(error.message === 'File not found' ? 404 : 500).json({ error: error.message });
    }
  }

  async getFiles(req, res) {
    try {
      const { roomId } = req.params;
      const files = await FileService.getRoomFiles(roomId);
      res.status(200).json(files);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
}

export default new FileController();