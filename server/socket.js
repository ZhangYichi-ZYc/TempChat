const { db } = require('./db');

function setupSocket(io) {
  io.on('connection', (socket) => {
    console.log(`[socket] connected: ${socket.id}`);

    socket.on('join-room', ({ roomId, sender }) => {
      if (!roomId || !sender) return;
      socket.join(roomId);
      socket.data = { roomId, sender };
      socket.to(roomId).emit('user-joined', {
        sender,
        joinedAt: new Date().toISOString()
      });
      console.log(`[socket] ${sender} joined room ${roomId}`);
    });

    socket.on('send-message', ({ roomId, sender, content }) => {
      if (!roomId || !sender || !content) return;

      const result = db.prepare(
        'INSERT INTO message (room_id, sender, content) VALUES (?, ?, ?)'
      ).run(roomId, sender, content);

      const message = {
        id: result.lastInsertRowid,
        room_id: roomId,
        sender,
        content,
        file_name: null,
        file_path: null,
        file_size: null,
        created_at: new Date().toISOString()
      };

      // Broadcast to ALL clients in the room (including sender)
      io.to(roomId).emit('new-message', message);
    });

    socket.on('file-message', ({ roomId, sender, file }) => {
      if (!roomId || !sender || !file) return;

      const message = {
        id: file.id,
        room_id: roomId,
        sender,
        content: '',
        file_name: file.fileName,
        file_path: file.filePath,
        file_size: file.fileSize,
        created_at: new Date().toISOString()
      };

      io.to(roomId).emit('new-message', message);
    });

    socket.on('disconnect', () => {
      console.log(`[socket] disconnected: ${socket.id}`);
    });
  });
}

module.exports = { setupSocket };
