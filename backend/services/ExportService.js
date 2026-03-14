import archiver from 'archiver';
import fs from 'fs';
import path from 'path';
import RoomRepository from '../repositories/RoomRepository.js';
import FileRepository from '../repositories/FileRepository.js';

class ExportService {
    async exportSession(roomId, adminId) {
        // 1. Verify Room & Permissions (Basic check)
        const room = await RoomRepository.findById(roomId);
        if (!room) throw new Error('Room not found');

        // 2. Lock the room (Requirement: End Session locks room)
        await RoomRepository.update(roomId, { isLocked: true });

        // 3. Fetch all files
        const files = await FileRepository.getFilesByRoom(roomId);

        // 4. Create ZIP stream
        const archive = archiver('zip', { zlib: { level: 9 } });
        const outputPath = path.join(process.cwd(), `session_${roomId}.zip`);
        const output = fs.createWriteStream(outputPath);

        return new Promise((resolve, reject) => {
            output.on('close', () => resolve(outputPath));
            archive.on('error', (err) => reject(err));

            archive.pipe(output);

            // Add files to ZIP
            files.forEach(file => {
                archive.append(file.content, { name: `${file.name}` });
            });

            // Add Activity Report (Requirement)
            const report = `Session Report\nRoom: ${room.name}\nExported at: ${new Date().toISOString()}`;
            archive.append(report, { name: 'Session_Report.txt' });

            archive.finalize();
        });
    }
}

export default new ExportService();