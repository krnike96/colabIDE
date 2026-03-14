import { io } from 'socket.io-client';

// We need to install the client first: npm install socket.io-client
const socket = io('http://localhost:5000');

socket.on('connect', () => {
  console.log('✅ Connected to Server! ID:', socket.id);

  // Test Joining a Room
  socket.emit('join-room', { roomId: 'room-123', username: 'Tester' });
});

socket.on('user-joined', (data) => {
  console.log('👤 Notification:', data.username, 'has joined the room.');
});

socket.on('connect_error', (err) => {
  console.log('❌ Connection Error:', err.message);
});