import pino from 'pino';
const logger = pino({ transport: { target: 'pino-pretty' } });

export const setupSockets = (io) => {
  io.on('connection', (socket) => {
    logger.info(`User connected: ${socket.id}`);

    socket.on('join-room', ({ roomId, username }) => {
      socket.join(roomId);
      logger.info(`User ${username} joined room: ${roomId}`);
      socket.to(roomId).emit('user-joined', { username, socketId: socket.id });
    });

    // Yjs Sync Protocol: Broadcast binary updates to everyone in the room
    socket.on('yjs-update', ({ roomId, update }) => {
      // update is a Uint8Array sent as a Buffer
      socket.to(roomId).emit('yjs-update', update);
    });

    socket.on('send-message', ({ roomId, message, sender }) => {
      io.to(roomId).emit('receive-message', {
        text: message,
        sender,
        timestamp: new Date()
      });
    });

    socket.on('cursor-move', ({ roomId, username, cursorData }) => {
      socket.to(roomId).emit('cursor-update', { username, cursorData });
    });

    socket.on('disconnect', () => {
      logger.info(`User disconnected: ${socket.id}`);
    });
  });
};