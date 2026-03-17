import FileService from '../services/FileService.js';
import { File } from '../models/index.js';

class FileController {
  async create(req, res) {
    try {
      const { name, language, roomId } = req.body;

      // 1. Validation: Unique name in room
      const existingFile = await File.findOne({ where: { name, RoomId: roomId } });
      if (existingFile) {
        return res.status(400).json({ error: "File name already exists in this room." });
      }

      // 2. Create the file
      const file = await File.create({
        name,
        language: language.toLowerCase(),
        content: '',
        RoomId: roomId
      });

      res.status(201).json(file);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async getFiles(req, res) {
    try {
      const { roomId } = req.params;
      const files = await File.findAll({ where: { RoomId: roomId } });
      res.status(200).json(files);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async delete(req, res) {
    try {
      const { id } = req.params;
      const deleted = await File.destroy({ where: { id } });
      if (!deleted) return res.status(404).json({ error: "File not found" });
      res.status(200).json({ message: "Deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: error.message });
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
}

export default new FileController();