const express = require('express');
const { db } = require('../db');

const router = express.Router();

// GET /api/messages/:roomId — paginated message history (cursor-based)
router.get('/messages/:roomId', (req, res) => {
  const { roomId } = req.params;
  const { before, limit } = req.query;
  const take = Math.min(parseInt(limit) || 50, 100);

  let messages;
  if (before) {
    messages = db.prepare(
      'SELECT id, room_id, sender, content, file_name, file_path, file_size, created_at FROM message WHERE room_id = ? AND id < ? ORDER BY id DESC LIMIT ?'
    ).all(roomId, parseInt(before), take);
  } else {
    messages = db.prepare(
      'SELECT id, room_id, sender, content, file_name, file_path, file_size, created_at FROM message WHERE room_id = ? ORDER BY id DESC LIMIT ?'
    ).all(roomId, take);
  }

  // Return in chronological order (oldest first)
  res.json({ messages: messages.reverse() });
});

module.exports = router;
