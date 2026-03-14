import pino from 'pino';
const logger = pino({ transport: { target: 'pino-pretty' } });

export const setupSockets = (io) => {
  io.on('connection', (socket) => {
    logger.info(`User connected: ${socket.id}`);

    // 1. Join Room Logic
    socket.on('join-room', ({ roomId, username }) => {
      socket.join(roomId);
      logger.info(`User ${username} joined room: ${roomId}`);

      // Notify others in the room
      socket.to(roomId).emit('user-joined', { username, socketId: socket.id });
    });

    // 2. Chat Message Logic (Requirement: Room-level chat)
    socket.on('send-message', ({ roomId, message, sender }) => {
      io.to(roomId).emit('receive-message', {
        text: message,
        sender,
        timestamp: new Date()
      });
    });

    // 3. Code Sync (Simple Version - later we will integrate Yjs)
    socket.on('code-change', ({ roomId, fileId, content }) => {
      socket.to(roomId).emit('code-update', { fileId, content });
    });

    // 4. Cursor Movement (Requirement: See cursor movements)
    socket.on('cursor-move', ({ roomId, username, cursorData }) => {
      socket.to(roomId).emit('cursor-update', { username, cursorData });
    });

    socket.on('disconnect', () => {
      logger.info(`User disconnected: ${socket.id}`);
    });
  });
};