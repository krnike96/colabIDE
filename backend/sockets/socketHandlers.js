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

    // Yjs Document Sync Protocol: Broadcast binary updates and sync flags
    socket.on('yjs-update', (data) => {
      socket.to(data.roomId).emit('yjs-update', data);
    });

    // Yjs Awareness Protocol: Broadcast cursor and presence updates
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