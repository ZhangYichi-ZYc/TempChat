const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const cors = require('cors');

const { initDB } = require('./db');
const roomRoutes = require('./routes/room');
const messageRoutes = require('./routes/messages');
const uploadRoutes = require('./routes/upload');
const { setupSocket } = require('./socket');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

// Middleware
app.use(cors());
app.use(express.json());

// API routes
app.use('/api', roomRoutes);
app.use('/api', messageRoutes);
app.use('/api', uploadRoutes);

// Serve uploaded files
app.use('/files', express.static(path.join(__dirname, '..', 'uploads')));

// In production, serve Vue build
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '..', 'client', 'dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Init DB and Socket.io
initDB();
setupSocket(io);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`TempChat server running on http://localhost:${PORT}`);
});
