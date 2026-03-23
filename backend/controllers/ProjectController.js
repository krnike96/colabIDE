import FileService from '../services/FileService.js';
import RoomRepository from '../repositories/RoomRepository.js';

class ProjectController {
    /**
     * Fetches all files for a room. If none exist, Service creates defaults.
     */
    async getProjectFiles(req, res) {
        try {
            const { id: roomId } = req.params;

            // Ensure room exists first
            const room = await RoomRepository.findById(roomId);
            if (!room) return res.status(404).json({ error: "Room not found" });

            const files = await FileService.getRoomFiles(roomId);
            res.json(files);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * Saves the content of a specific file via FileService
     */
    async saveFileContent(req, res) {
        try {
            const { fileId } = req.params;
            const { content } = req.body;

            const file = await FileService.updateFileContent(fileId, content);
            res.json({ message: "File saved successfully", file });
        } catch (error) {
            const status = error.message === 'File not found' ? 404 : 500;
            res.status(status).json({ error: error.message });
        }
    }

    /**
     * Renames a file via FileService (which handles uniqueness checks)
     */
    async renameFile(req, res) {
        try {
            const { fileId } = req.params;
            const { name } = req.body;

            const file = await FileService.renameFile(fileId, name);
            res.json({ message: "Renamed successfully", file });
        } catch (error) {
            const status = error.message.includes('exists') ? 400 : 500;
            res.status(status).json({ error: error.message });
        }
    }

    // Note: getProject and updateProject methods that used htmlContent/cssContent 
    // columns in the Room table are removed as we now use the File-based system.
}

export default new ProjectController();