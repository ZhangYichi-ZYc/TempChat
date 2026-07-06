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
router.post('/upload/:roomId', (req, res, next) => {
  let responded = false;

  // Detect client disconnect — clean up partial file
  req.on('close', () => {
    if (!responded && req.file && req.file.path) {
      try { fs.unlinkSync(req.file.path); } catch (_) { /* already gone */ }
    }
  });

  // Wrap res.json to track response sent
  const origJson = res.json.bind(res);
  res.json = function (body) {
    responded = true;
    return origJson(body);
  };

  next();
}, upload.single('file'), (req, res) => {
  const { roomId } = req.params;
  const { sender } = req.body;
  const file = req.file;

  if (!file) {
    return res.status(400).json({ error: '未选择文件' });
  }

  const relativePath = path.relative(UPLOADS_DIR, file.path);

  try {
    const result = db.prepare(
      'INSERT INTO message (room_id, sender, content, file_name, file_path, file_size) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(roomId, sender, '', file.originalname, relativePath, file.size);

    res.json({
      id: result.lastInsertRowid,
      fileName: file.originalname,
      filePath: relativePath,
      fileSize: file.size
    });
  } catch (err) {
    // DB insert failed — clean up the file
    console.error('Upload DB insert error:', err.message);
    try { fs.unlinkSync(file.path); } catch (_) {}
    res.status(500).json({ error: '保存文件失败' });
  }
});

// Multer error handler (file too large, etc.)
router.use('/upload', (err, req, res, _next) => {
  if (req.file && req.file.path) {
    try { fs.unlinkSync(req.file.path); } catch (_) {}
  }
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: '文件大小不能超过 500MB' });
    }
    return res.status(400).json({ error: '文件上传失败' });
  }
  console.error('Upload error:', err);
  res.status(500).json({ error: '服务器错误' });
});

module.exports = router;
