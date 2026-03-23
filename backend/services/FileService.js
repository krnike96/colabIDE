import FileRepository from '../repositories/FileRepository.js';

class FileService {
    /**
     * Creates a new file with uniqueness validation and language check.
     */
    async createFile(name, language, roomId) {
        // 1. Language Validation
        const lang = language.toLowerCase();
        const supportedLanguages = ['html', 'css', 'javascript'];
        if (!supportedLanguages.includes(lang)) {
            throw new Error('Unsupported language. Please use html, css, or javascript.');
        }

        // 2. Uniqueness Validation (Ensures no duplicate name in the same room)
        const existingFile = await FileRepository.findByNameInRoom(name, roomId);
        if (existingFile) {
            throw new Error('A file with this name already exists in this room.');
        }

        return await FileRepository.createFile({
            name,
            language: lang,
            content: '',
            RoomId: roomId
        });
    }

    /**
     * Updates file content (Called by Save button and eventually WebSockets).
     */
    async updateFileContent(fileId, content) {
        const file = await FileRepository.findById(fileId);
        if (!file) throw new Error('File not found');

        file.content = content;
        return await file.save();
    }

    /**
     * Renames a file with a check to ensure the new name isn't taken in that room.
     */
    async renameFile(fileId, newName) {
        const file = await FileRepository.findById(fileId);
        if (!file) throw new Error('File not found');

        // Check if the name is actually changing
        if (file.name === newName) return file;

        // Check if another file in the same room already has the new name
        const duplicate = await FileRepository.findByNameInRoom(newName, file.RoomId);
        if (duplicate) {
            throw new Error('A file with this name already exists in this room.');
        }

        file.name = newName;
        return await file.save();
    }

    /**
     * Fetches files for a room. If room is empty, creates default starter files.
     */
    async getRoomFiles(roomId) {
        let files = await FileRepository.getFilesByRoom(roomId);

        // If no files exist (New Room), seed the defaults
        if (files.length === 0) {
            try {
                const defaults = [
                    { name: 'index.html', content: '<h1>New Project</h1>', language: 'html', RoomId: roomId },
                    { name: 'style.css', content: 'h1 { color: blue; }', language: 'css', RoomId: roomId },
                    { name: 'script.js', content: 'console.log("Hello Colab!");', language: 'javascript', RoomId: roomId }
                ];
                files = await FileRepository.bulkCreate(defaults);
            } catch (error) {
                // Handle race condition: if another user created them simultaneously, fetch them
                files = await FileRepository.getFilesByRoom(roomId);
            }
        }
        return files;
    }

    /**
     * Removes a file from the database.
     */
    async removeFile(fileId) {
        const deleted = await FileRepository.delete(fileId);
        if (!deleted) throw new Error('File not found');
        return { message: 'File deleted successfully' };
    }
}

export default new FileService();