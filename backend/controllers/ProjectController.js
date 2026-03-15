import { Room } from '../models/index.js';

class ProjectController {
    /**
     * Fetches project content (HTML, CSS, JS) from a specific room
     */
    async getProject(req, res) {
        try {
            const { id } = req.params;
            const room = await Room.findByPk(id);

            if (!room) {
                return res.status(404).json({ error: "Room not found" });
            }

            // Return the code stored in the room model
            res.json({
                html: room.htmlContent || "",
                css: room.cssContent || "",
                js: room.jsContent || ""
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * Updates and persists project content to the database
     */
    async updateProject(req, res) {
        try {
            const { id } = req.params;
            const { html, css, js } = req.body;

            const room = await Room.findByPk(id);
            if (!room) {
                return res.status(404).json({ error: "Room not found" });
            }

            // Update the content columns in the Room table
            room.htmlContent = html;
            room.cssContent = css;
            room.jsContent = js;
            await room.save();

            res.json({ message: "Project saved successfully", room });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}

// Export a new instance to match the pattern used in AuthController and RoomController
export default new ProjectController();