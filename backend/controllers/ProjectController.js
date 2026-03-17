import { Room, File } from '../models/index.js';

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

    async getProjectFiles(req, res) {
        try {
            const { id } = req.params; // this is the roomId

            // 1. Check if files already exist for this room
            const files = await File.findAll({ where: { RoomId: id } });

            // 2. If no files exist, create the default set
            if (files.length === 0) {
                const defaultFiles = await File.bulkCreate([
                    { name: 'index.html', content: '<h1>New Project</h1>', language: 'html', RoomId: id },
                    { name: 'style.css', content: '', language: 'css', RoomId: id },
                    { name: 'script.js', content: 'console.log("Hello World");', language: 'javascript', RoomId: id }
                ]);
                return res.json(defaultFiles);
            }

            // 3. Otherwise, return the existing files (Persistence fix)
            res.json(files);
        } catch (error) {
            console.error("Fetch Project Files Error:", error);
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * Saves the content of a specific file.
     */
    async saveFileContent(req, res) {
        try {
            const { fileId } = req.params;
            const { content } = req.body;

            const file = await File.findByPk(fileId);
            if (!file) return res.status(404).json({ error: "File not found" });

            file.content = content;
            await file.save();

            res.json({ message: "File saved successfully", file });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * Renames a file with a check for duplicates within the same room.
     */
    async renameFile(req, res) {
        try {
            const { fileId } = req.params;
            const { name } = req.body;

            const file = await File.findByPk(fileId);
            if (!file) return res.status(404).json({ error: "File not found" });

            // Unique Name Check: Check if another file in the same room has this name
            const duplicate = await File.findOne({
                where: { name, RoomId: file.RoomId }
            });

            if (duplicate && duplicate.id !== fileId) {
                return res.status(400).json({ error: "A file with this name already exists in this room." });
            }

            file.name = name;
            await file.save();

            res.json({ message: "Renamed successfully", file });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}

// Export a new instance to match the pattern used in AuthController and RoomController
export default new ProjectController();