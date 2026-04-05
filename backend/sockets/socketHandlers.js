import pino from 'pino';
import RoomService from '../services/RoomService.js';

const logger = pino({ transport: { target: 'pino-pretty' } });

export const setupSockets = (io) => {
  io.on('connection', (socket) => {
    logger.info(`User connected: ${socket.id}`);

    socket.on('join-room', async ({ roomId, username, roomPassword }) => {
      try {
        const isValid = await RoomService.validateRoomPassword(roomId, roomPassword);
        if (!isValid) {
          socket.emit('join-error', { error: 'Invalid room password' });
          return;
        }
        socket.join(roomId);
        logger.info(`User ${username} joined room: ${roomId}`);
        socket.to(roomId).emit('user-joined', { username, socketId: socket.id });
      } catch (error) {
        socket.emit('join-error', { error: error.message });
      }
    });

    // Yjs Document Sync Protocol
    socket.on('yjs-update', (data) => {
      socket.to(data.roomId).emit('yjs-update', data);
    });

    // Yjs Awareness Protocol (cursors)
    socket.on('awareness-update', (data) => {
      socket.to(data.roomId).emit('awareness-update', data);
    });

    socket.on('send-message', ({ roomId, message, sender }) => {
      io.to(roomId).emit('receive-message', {
        text: message,
        sender,
        timestamp: new Date()
      });
    });

    socket.on('disconnect', () => {
      logger.info(`User disconnected: ${socket.id}`);
    });
  });
};