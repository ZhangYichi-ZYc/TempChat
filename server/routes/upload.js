const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { db } = require('../db');

const UPLOADS_DIR = path.join(__dirname, '..', '..', 'uploads');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(UPLOADS_DIR, req.params.roomId);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    // Sanitize: replace non-safe chars for filesystem safety
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._一-鿿\-]/g, '_');
    cb(null, `${timestamp}-${safeName}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 } // 500MB
});

const router = express.Router();

// POST /api/upload/:roomId — upload a file
router.post('/upload/:roomId', upload.single('file'), (req, res) => {
  const { roomId } = req.params;
  const { sender } = req.body;
  const file = req.file;

  if (!file) {
    return res.status(400).json({ error: '未选择文件' });
  }

  // Build a relative path for serving
  const relativePath = path.relative(UPLOADS_DIR, file.path);

  const result = db.prepare(
    'INSERT INTO message (room_id, sender, content, file_name, file_path, file_size) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(roomId, sender, '', file.originalname, relativePath, file.size);

  res.json({
    id: result.lastInsertRowid,
    fileName: file.originalname,
    filePath: relativePath,
    fileSize: file.size
  });
});

module.exports = router;
