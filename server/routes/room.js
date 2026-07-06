const express = require('express');
const bcrypt = require('bcrypt');
const { db } = require('../db');

const router = express.Router();

// GET /api/room/:id — check if room exists, return info
router.get('/room/:id', (req, res) => {
  const room = db.prepare('SELECT * FROM room WHERE id = ?').get(req.params.id);
  if (!room) {
    return res.json({ exists: false });
  }
  res.json({
    exists: true,
    partyA: room.party_a,
    partyB: room.party_b,
    hasPassword: room.password !== ''
  });
});

// POST /api/room/:id — create a new room
router.post('/room/:id', async (req, res) => {
  const { partyA, partyB, password } = req.body;
  const id = req.params.id;

  if (!partyA || !partyB) {
    return res.status(400).json({ error: '双方身份名称不能为空' });
  }

  const existing = db.prepare('SELECT id FROM room WHERE id = ?').get(id);
  if (existing) {
    return res.status(409).json({ error: '房间已存在' });
  }

  let hash = '';
  if (password && password.trim()) {
    hash = await bcrypt.hash(password, 10);
  }

  db.prepare(
    'INSERT INTO room (id, party_a, party_b, password) VALUES (?, ?, ?, ?)'
  ).run(id, partyA.trim(), partyB.trim(), hash);

  res.json({ success: true });
});

// POST /api/room/:id/verify — verify room password
router.post('/room/:id/verify', async (req, res) => {
  const { password } = req.body;
  const room = db.prepare('SELECT password FROM room WHERE id = ?').get(req.params.id);

  if (!room) {
    return res.status(404).json({ error: '房间不存在' });
  }

  // No password set — always pass
  if (room.password === '') {
    return res.json({ success: true });
  }

  if (!password) {
    return res.status(403).json({ error: '请输入密码' });
  }

  const match = await bcrypt.compare(password, room.password);
  if (!match) {
    return res.status(403).json({ error: '密码错误' });
  }

  res.json({ success: true });
});

module.exports = router;
