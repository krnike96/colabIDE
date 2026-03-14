import ExportService from '../services/ExportService.js';
import path from 'path';
import fs from 'fs';

class ExportController {
    async download(req, res) {
        try {
            const { roomId } = req.params;
            const adminId = req.user.id; // From authMiddleware

            const filePath = await ExportService.exportSession(roomId, adminId);

            // Send the file to the client
            res.download(filePath, `session_${roomId}.zip`, (err) => {
                if (err) {
                    res.status(500).send({ error: "Could not download the file" });
                }
                // Cleanup: delete local zip after download to save space
                fs.unlinkSync(filePath);
            });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
}

export default new ExportController();