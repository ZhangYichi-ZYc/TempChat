# TempChat Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a URL-path-based chat app — visit `chat.zhangyichi.cn/<roomId>`, first person creates the room with two party names + optional password, subsequent visitors pick a party and enter the password. Chat supports text messages and file uploads (≤500MB).

**Architecture:** Node.js Express backend with Socket.io for real-time messaging, SQLite for persistence, Vue 3 SPA frontend with Element Plus UI. Single Express server serves both API and (in production) the Vue static build. Vite dev server proxies API calls during development.

**Tech Stack:** Node.js 20, Express 4, Socket.io 4, better-sqlite3, bcrypt, multer, Vue 3 (Composition API + `<script setup>`), Vite, Element Plus, Vue Router 4

## Global Constraints

- Node.js v20.20.2 available, npm 10.8.2
- Conda environment `TempChat` active
- Domain: chat.zhangyichi.cn
- Room URLs: `chat.zhangyichi.cn/<roomId>`
- File upload limit: 500MB (multer config)
- Password: bcrypt hashed, empty string = no password
- Identity selection: no server-side verification
- Language: Chinese (UI labels, error messages)

---

### Task 1: Project Scaffolding

**Files:**
- Create: `package.json`
- Create: `.gitignore`
- Create: `server/` directory skeleton
- Create: `client/` directory skeleton
- Create: `data/.gitkeep`, `uploads/.gitkeep`

**Interfaces:**
- Consumes: nothing
- Produces: `package.json` with all dependencies defined, project directory structure

- [ ] **Step 1: Create .gitignore**

```
node_modules/
dist/
data/*.db
uploads/*
!uploads/.gitkeep
!data/.gitkeep
.env
*.log
```

- [ ] **Step 2: Create package.json**

```json
{
  "name": "tempchat",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "node server/index.js",
    "dev:client": "cd client && npx vite",
    "build": "cd client && npx vite build",
    "start": "NODE_ENV=production node server/index.js"
  },
  "dependencies": {
    "bcrypt": "^5.1.1",
    "better-sqlite3": "^11.0.0",
    "cors": "^2.8.5",
    "express": "^4.21.0",
    "multer": "^1.4.5-lts.1",
    "socket.io": "^4.7.5"
  }
}
```

- [ ] **Step 3: Create directory structure and install dependencies**

```bash
mkdir -p server/routes client/src/views client/src/components data uploads
touch data/.gitkeep uploads/.gitkeep
npm install
```

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json .gitignore data/.gitkeep uploads/.gitkeep
git commit -m "chore: project scaffolding with dependencies"
```

---

### Task 2: Database Layer

**Files:**
- Create: `server/db.js`

**Interfaces:**
- Consumes: `package.json` (better-sqlite3)
- Produces: `initDB()` — creates tables; `db` — better-sqlite3 instance (sync API)

- [ ] **Step 1: Write server/db.js**

```js
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DATA_DIR = path.join(__dirname, '..', 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const db = new Database(path.join(DATA_DIR, 'tempchat.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initDB() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS room (
      id         TEXT PRIMARY KEY,
      party_a    TEXT NOT NULL,
      party_b    TEXT NOT NULL,
      password   TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS message (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      room_id    TEXT NOT NULL REFERENCES room(id),
      sender     TEXT NOT NULL,
      content    TEXT DEFAULT '',
      file_name  TEXT,
      file_path  TEXT,
      file_size  INTEGER,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_message_room
      ON message(room_id, created_at);
  `);
  console.log('Database initialized');
}

module.exports = { db, initDB };
```

- [ ] **Step 2: Verify — require the module in Node**

```bash
node -e "const { initDB, db } = require('./server/db'); initDB(); console.log('tables:', db.prepare(\"SELECT name FROM sqlite_master WHERE type='table'\").all()); db.close();"
```

Expected output: tables for `room` and `message` printed.

- [ ] **Step 3: Commit**

```bash
git add server/db.js
git commit -m "feat: add SQLite database layer with room and message tables"
```

---

### Task 3: Room API Routes

**Files:**
- Create: `server/routes/room.js`

**Interfaces:**
- Consumes: `server/db.js` → `{ db }`
- Produces: Express router with routes:
  - `GET /api/room/:id` → `{ exists: boolean, partyA?, partyB?, hasPassword? }`
  - `POST /api/room/:id` → body `{ partyA, partyB, password }` → `{ success: true }`
  - `POST /api/room/:id/verify` → body `{ password }` → `{ success: true }`

- [ ] **Step 1: Write server/routes/room.js**

```js
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
```

- [ ] **Step 2: Commit**

```bash
git add server/routes/room.js
git commit -m "feat: add room API routes — get, create, verify password"
```

---

### Task 4: Message API + File Upload Routes

**Files:**
- Create: `server/routes/messages.js`
- Create: `server/routes/upload.js`

**Interfaces:**
- Consumes: `server/db.js` → `{ db }`
- Produces:
  - `GET /api/messages/:roomId?before=<id>&limit=<n>` → `{ messages: [...] }`
  - `POST /api/upload/:roomId` (multipart: `file`, `sender`) → `{ id, fileName, fileSize }`
  - `GET /files/:roomId/:filename` → serves file from `uploads/`

- [ ] **Step 1: Write server/routes/messages.js**

```js
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
```

- [ ] **Step 2: Write server/routes/upload.js**

```js
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
    // Sanitize: replace non-ASCII/spaces for safety
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._一-鿿-]/g, '_');
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
```

- [ ] **Step 3: Commit**

```bash
git add server/routes/messages.js server/routes/upload.js
git commit -m "feat: add message history and file upload routes"
```

---

### Task 5: Socket.io + Express Server Entry Point

**Files:**
- Create: `server/socket.js`
- Create: `server/index.js`

**Interfaces:**
- Consumes: `server/db.js` → `{ initDB }`, `server/routes/room.js`, `server/routes/messages.js`, `server/routes/upload.js`
- Produces: Running Express + Socket.io server on port 3000

- [ ] **Step 1: Write server/socket.js**

```js
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

    socket.on('disconnect', () => {
      console.log(`[socket] disconnected: ${socket.id}`);
    });
  });
}

module.exports = { setupSocket };
```

- [ ] **Step 2: Write server/index.js**

```js
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
```

- [ ] **Step 3: Quick smoke test — start server and check it runs**

```bash
node server/index.js &
sleep 2
curl -s http://localhost:3000/api/room/testroom | head -c 100
kill %1 2>/dev/null
```

Expected: `{"exists":false}`

- [ ] **Step 4: Commit**

```bash
git add server/socket.js server/index.js
git commit -m "feat: add Socket.io layer and Express server entry point"
```

---

### Task 6: Vue 3 + Vite + Element Plus Client Scaffolding

**Files:**
- Create: `client/package.json`
- Create: `client/vite.config.js`
- Create: `client/index.html`
- Create: `client/src/main.js`

**Interfaces:**
- Consumes: nothing (standalone Vite project)
- Produces: working Vite dev server with Vue 3 + Element Plus

- [ ] **Step 1: Write client/package.json**

```json
{
  "name": "tempchat-client",
  "private": true,
  "version": "1.0.0",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "vue": "^3.5.0",
    "vue-router": "^4.4.0",
    "element-plus": "^2.8.0",
    "@element-plus/icons-vue": "^2.3.1",
    "socket.io-client": "^4.7.5",
    "axios": "^1.7.0"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^5.1.0",
    "vite": "^5.4.0"
  }
}
```

- [ ] **Step 2: Write client/vite.config.js**

```js
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3000',
      '/socket.io': {
        target: 'http://localhost:3000',
        ws: true
      },
      '/files': 'http://localhost:3000'
    }
  }
});
```

- [ ] **Step 3: Write client/index.html**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>TempChat</title>
</head>
<body>
  <div id="app"></div>
  <script type="module" src="/src/main.js"></script>
</body>
</html>
```

- [ ] **Step 4: Write client/src/main.js**

```js
import { createApp } from 'vue';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import * as ElementPlusIconsVue from '@element-plus/icons-vue';
import App from './App.vue';
import router from './router';

const app = createApp(App);

// Register all Element Plus icons globally
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component);
}

app.use(ElementPlus);
app.use(router);
app.mount('#app');
```

- [ ] **Step 5: Install client dependencies and verify Vite starts**

```bash
cd client && npm install && npx vite --host 2>&1 &
sleep 3
curl -s http://localhost:5173/ | head -c 200
kill %1 2>/dev/null
cd ..
```

Expected: HTML response with `<div id="app">`

- [ ] **Step 6: Commit**

```bash
git add client/package.json client/package-lock.json client/vite.config.js client/index.html client/src/main.js
git commit -m "feat: scaffold Vue 3 + Vite + Element Plus client"
```

---

### Task 7: Router + API Client + App Shell

**Files:**
- Create: `client/src/router.js`
- Create: `client/src/api.js`
- Create: `client/src/App.vue`

**Interfaces:**
- Consumes: `client/src/main.js` (imports router, App)
- Produces: `api.js` exports `{ getRoom, createRoom, verifyPassword, getMessages, uploadFile }`, router with `/:roomId` route, App shell with `<router-view>`

- [ ] **Step 1: Write client/src/api.js**

```js
import axios from 'axios';

const http = axios.create({ baseURL: '/api' });

export function getRoom(id) {
  return http.get(`/room/${encodeURIComponent(id)}`).then(r => r.data);
}

export function createRoom(id, partyA, partyB, password) {
  return http.post(`/room/${encodeURIComponent(id)}`, { partyA, partyB, password }).then(r => r.data);
}

export function verifyPassword(id, password) {
  return http.post(`/room/${encodeURIComponent(id)}/verify`, { password }).then(r => r.data);
}

export function getMessages(roomId, before = null, limit = 50) {
  const params = { limit };
  if (before) params.before = before;
  return http.get(`/messages/${encodeURIComponent(roomId)}`, { params }).then(r => r.data);
}

export function uploadFile(roomId, file, sender, onProgress) {
  const form = new FormData();
  form.append('file', file);
  form.append('sender', sender);
  return http.post(`/upload/${encodeURIComponent(roomId)}`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: onProgress
  }).then(r => r.data);
}
```

- [ ] **Step 2: Write client/src/router.js**

```js
import { createRouter, createWebHistory } from 'vue-router';
import RoomView from './views/RoomView.vue';

const routes = [
  {
    path: '/:roomId',
    name: 'room',
    component: RoomView,
    props: true
  },
  {
    path: '/',
    redirect: '/default'
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;
```

- [ ] **Step 3: Write client/src/App.vue**

```vue
<template>
  <div id="app-container">
    <router-view />
  </div>
</template>

<script setup>
// App shell — routing handled by vue-router
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
    'Helvetica Neue', Arial, 'Noto Sans SC', sans-serif;
  background: #f0f2f5;
  color: #333;
  min-height: 100vh;
}

#app-container {
  min-height: 100vh;
}
</style>
```

- [ ] **Step 4: Verify router resolves (requires RoomView placeholder)**

Create a minimal placeholder:

```bash
mkdir -p client/src/views
cat > client/src/views/RoomView.vue << 'VEOF'
<template>
  <div style="padding: 40px; text-align: center;">
    <h2>Room: {{ roomId }}</h2>
    <p v-if="loading">加载中...</p>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getRoom } from '../api';

const props = defineProps({ roomId: String });
const loading = ref(true);

onMounted(async () => {
  try {
    const info = await getRoom(props.roomId);
    console.log('Room info:', info);
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
});
</script>
VEOF
```

Start the backend server, then Vite, and test:

```bash
cd client
node ../server/index.js &
sleep 2
npx vite &
sleep 3
curl -s http://localhost:5173/test123
kill %1 %2 2>/dev/null
cd ..
```

Expected: HTML page with `<div id="app">` containing the Vue-rendered content.

- [ ] **Step 5: Commit**

```bash
git add client/src/router.js client/src/api.js client/src/App.vue client/src/views/RoomView.vue
git commit -m "feat: add Vue Router, API client, and App shell"
```

---

### Task 8: InitRoom View — First-time Room Setup

**Files:**
- Create: `client/src/views/InitRoom.vue`
- Modify: `client/src/views/RoomView.vue` (integrate InitRoom + JoinRoom + ChatRoom switching)

**Interfaces:**
- Consumes: `api.js` → `createRoom()`
- Produces: Form with party A name, party B name, optional password. Emits `created(partyA, partyB)` on success.

- [ ] **Step 1: Write client/src/views/InitRoom.vue**

```vue
<template>
  <div class="init-room-wrapper">
    <el-card class="init-card">
      <template #header>
        <div class="card-header">
          <h2>创建新对话</h2>
          <p class="room-id-label">房间: {{ roomId }}</p>
        </div>
      </template>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-position="top"
        @submit.prevent="handleSubmit"
      >
        <el-form-item label="甲方身份" prop="partyA">
          <el-input
            v-model="form.partyA"
            placeholder="例如：张三"
            maxlength="30"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="乙方身份" prop="partyB">
          <el-input
            v-model="form.partyB"
            placeholder="例如：李四"
            maxlength="30"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="房间密码（选填）" prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="留空则不设置密码"
            show-password
            maxlength="50"
          />
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            size="large"
            :loading="submitting"
            @click="handleSubmit"
            style="width: 100%"
          >
            创建房间
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { createRoom } from '../api';

const props = defineProps({ roomId: String });
const emit = defineEmits(['created']);

const formRef = ref(null);
const submitting = ref(false);

const form = reactive({
  partyA: '',
  partyB: '',
  password: ''
});

const rules = {
  partyA: [
    { required: true, message: '请输入甲方身份名称', trigger: 'blur' },
    { min: 1, max: 30, message: '1-30个字符', trigger: 'blur' }
  ],
  partyB: [
    { required: true, message: '请输入乙方身份名称', trigger: 'blur' },
    { min: 1, max: 30, message: '1-30个字符', trigger: 'blur' }
  ]
};

async function handleSubmit() {
  if (!formRef.value) return;
  try {
    await formRef.value.validate();
  } catch {
    return;
  }

  submitting.value = true;
  try {
    await createRoom(props.roomId, form.partyA, form.partyB, form.password);
    ElMessage.success('房间创建成功');
    emit('created', form.partyA, form.partyB);
  } catch (err) {
    const msg = err.response?.data?.error || '创建失败，请重试';
    ElMessage.error(msg);
  } finally {
    submitting.value = false;
  }
}
</script>

<style scoped>
.init-room-wrapper {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.init-card {
  width: 100%;
  max-width: 420px;
}

.card-header {
  text-align: center;
}

.card-header h2 {
  font-size: 22px;
  color: #303133;
  margin-bottom: 4px;
}

.room-id-label {
  font-size: 13px;
  color: #909399;
}
</style>
```

- [ ] **Step 2: Commit**

```bash
git add client/src/views/InitRoom.vue
git commit -m "feat: add InitRoom view — first-time room creation form"
```

---

### Task 9: JoinRoom View — Identity Selection + Password Verification

**Files:**
- Create: `client/src/views/JoinRoom.vue`

**Interfaces:**
- Consumes: `api.js` → `verifyPassword()`
- Produces: Emits `joined(sender)` where sender is `"a"` or `"b"`

- [ ] **Step 1: Write client/src/views/JoinRoom.vue**

```vue
<template>
  <div class="join-room-wrapper">
    <el-card class="join-card">
      <template #header>
        <div class="card-header">
          <h2>进入对话</h2>
          <p class="room-id-label">房间: {{ roomId }}</p>
        </div>
      </template>

      <!-- Password gate (shown first if room has password) -->
      <template v-if="showPasswordGate">
        <el-form @submit.prevent="verifyPass">
          <el-form-item label="房间密码">
            <el-input
              v-model="passwordInput"
              type="password"
              placeholder="请输入房间密码"
              show-password
              @keyup.enter="verifyPass"
            />
          </el-form-item>
          <el-form-item>
            <el-button
              type="primary"
              size="large"
              :loading="verifying"
              @click="verifyPass"
              style="width: 100%"
            >
              验证
            </el-button>
          </el-form-item>
        </el-form>
      </template>

      <!-- Identity selection (shown after password verified or if no password) -->
      <template v-else>
        <p class="select-hint">请选择你的身份</p>

        <div class="identity-options">
          <el-button
            size="large"
            class="identity-btn"
            @click="selectParty('a')"
          >
            <el-icon><User /></el-icon>
            <span>{{ partyA }}</span>
          </el-button>

          <el-button
            size="large"
            class="identity-btn"
            @click="selectParty('b')"
          >
            <el-icon><User /></el-icon>
            <span>{{ partyB }}</span>
          </el-button>
        </div>
      </template>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { ElMessage } from 'element-plus';
import { verifyPassword } from '../api';

const props = defineProps({
  roomId: String,
  partyA: String,
  partyB: String,
  hasPassword: Boolean
});

const emit = defineEmits(['joined']);

const passwordInput = ref('');
const verifying = ref(false);
const passwordVerified = ref(false);

const showPasswordGate = computed(() => {
  return props.hasPassword && !passwordVerified.value;
});

async function verifyPass() {
  if (!passwordInput.value) {
    ElMessage.warning('请输入密码');
    return;
  }
  verifying.value = true;
  try {
    await verifyPassword(props.roomId, passwordInput.value);
    passwordVerified.value = true;
  } catch (err) {
    const msg = err.response?.data?.error || '密码错误';
    ElMessage.error(msg);
  } finally {
    verifying.value = false;
  }
}

function selectParty(sender) {
  emit('joined', sender);
}
</script>

<style scoped>
.join-room-wrapper {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.join-card {
  width: 100%;
  max-width: 420px;
}

.card-header {
  text-align: center;
}

.card-header h2 {
  font-size: 22px;
  color: #303133;
  margin-bottom: 4px;
}

.room-id-label {
  font-size: 13px;
  color: #909399;
}

.select-hint {
  text-align: center;
  color: #606266;
  margin-bottom: 20px;
  font-size: 15px;
}

.identity-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.identity-btn {
  width: 100%;
  height: 56px;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
</style>
```

- [ ] **Step 2: Commit**

```bash
git add client/src/views/JoinRoom.vue
git commit -m "feat: add JoinRoom view — identity selection with password gate"
```

---

### Task 10: ChatRoom View + Message Components

**Files:**
- Modify: `client/src/views/RoomView.vue` (fully integrate state switching)
- Create: `client/src/views/ChatRoom.vue`
- Create: `client/src/components/MessageList.vue`
- Create: `client/src/components/MessageInput.vue`
- Create: `client/src/components/FileUpload.vue`

**Interfaces:**
- RoomView orchestrates: fetching room state → showing InitRoom / JoinRoom / ChatRoom
- ChatRoom: connects Socket.io, loads history, renders MessageList + MessageInput + FileUpload
- Socket.io events: `join-room`, `send-message` (emit); `new-message`, `user-joined` (listen)
- Single file `server/socket.js` also needs a small update to broadcast file messages after upload

- [ ] **Step 1: Rewrite client/src/views/RoomView.vue (full orchestrator)**

```vue
<template>
  <div class="room-container">
    <!-- Loading -->
    <div v-if="state === 'loading'" class="loading-state">
      <el-icon class="loading-icon" :size="32"><Loading /></el-icon>
      <p>加载中...</p>
    </div>

    <!-- Init: room doesn't exist -->
    <InitRoom
      v-else-if="state === 'init'"
      :roomId="roomId"
      @created="onCreated"
    />

    <!-- Join: room exists, need identity -->
    <JoinRoom
      v-else-if="state === 'join'"
      :roomId="roomId"
      :partyA="partyA"
      :partyB="partyB"
      :hasPassword="hasPassword"
      @joined="onJoined"
    />

    <!-- Chat: in the room -->
    <ChatRoom
      v-else-if="state === 'chat'"
      :roomId="roomId"
      :sender="sender"
      :partyA="partyA"
      :partyB="partyB"
    />

    <!-- Error -->
    <div v-else class="error-state">
      <el-result icon="error" title="出错了" sub-title="请检查房间地址是否正确">
        <template #extra>
          <el-button type="primary" @click="initRoom">重试</el-button>
        </template>
      </el-result>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getRoom } from '../api';
import InitRoom from './InitRoom.vue';
import JoinRoom from './JoinRoom.vue';
import ChatRoom from './ChatRoom.vue';

const props = defineProps({ roomId: String });

const state = ref('loading');   // 'loading' | 'init' | 'join' | 'chat' | 'error'
const partyA = ref('');
const partyB = ref('');
const hasPassword = ref(false);
const sender = ref('');         // "a" or "b"

async function initRoom() {
  state.value = 'loading';
  try {
    const info = await getRoom(props.roomId);
    if (!info.exists) {
      state.value = 'init';
    } else {
      partyA.value = info.partyA;
      partyB.value = info.partyB;
      hasPassword.value = info.hasPassword;
      state.value = 'join';
    }
  } catch {
    state.value = 'error';
  }
}

function onCreated(a, b) {
  partyA.value = a;
  partyB.value = b;
  hasPassword.value = false;
  state.value = 'join';
}

function onJoined(s) {
  sender.value = s;
  state.value = 'chat';
}

onMounted(initRoom);
</script>

<style scoped>
.room-container {
  min-height: 100vh;
}

.loading-state {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: #909399;
}

.loading-icon {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.error-state {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
```

- [ ] **Step 2: Write client/src/views/ChatRoom.vue**

```vue
<template>
  <div class="chat-room">
    <!-- Header -->
    <header class="chat-header">
      <div class="header-left">
        <el-tag :type="sender === 'a' ? 'primary' : 'success'" size="large">
          {{ myName }}
        </el-tag>
        <span class="header-divider">↔</span>
        <span class="other-name">{{ otherName }}</span>
      </div>
      <div class="header-right">
        <span class="room-badge">#{{ roomId }}</span>
      </div>
    </header>

    <!-- Message list -->
    <MessageList
      :messages="messages"
      :mySender="sender"
      :partyA="partyA"
      :partyB="partyB"
      ref="messageListRef"
    />

    <!-- Input area -->
    <div class="input-area">
      <MessageInput
        :disabled="!connected"
        @send="handleSendText"
        ref="messageInputRef"
      />
      <FileUpload
        :roomId="roomId"
        :sender="sender"
        :disabled="!connected"
        @uploaded="handleFileUploaded"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { io } from 'socket.io-client';
import { getMessages } from '../api';
import MessageList from '../components/MessageList.vue';
import MessageInput from '../components/MessageInput.vue';
import FileUpload from '../components/FileUpload.vue';

const props = defineProps({
  roomId: String,
  sender: String,
  partyA: String,
  partyB: String
});

const messages = ref([]);
const connected = ref(false);
const messageListRef = ref(null);
let socket = null;

const myName = computed(() => props.sender === 'a' ? props.partyA : props.partyB);
const otherName = computed(() => props.sender === 'a' ? props.partyB : props.partyA);

// Load history
async function loadHistory() {
  try {
    const res = await getMessages(props.roomId);
    messages.value = res.messages;
    await nextTick();
    scrollToBottom();
  } catch (e) {
    console.error('Failed to load messages:', e);
  }
}

// Connect Socket.io
function connectSocket() {
  socket = io('/', { transports: ['websocket', 'polling'] });

  socket.on('connect', () => {
    connected.value = true;
    socket.emit('join-room', { roomId: props.roomId, sender: props.sender });
  });

  socket.on('disconnect', () => {
    connected.value = false;
  });

  socket.on('new-message', (msg) => {
    messages.value.push(msg);
    nextTick(() => scrollToBottom());
  });

  socket.on('user-joined', ({ sender }) => {
    const name = sender === 'a' ? props.partyA : props.partyB;
    // System message for join notification
    messages.value.push({
      id: Date.now(),
      room_id: props.roomId,
      sender: '__system__',
      content: `${name} 加入了对话`,
      file_name: null,
      file_path: null,
      file_size: null,
      created_at: new Date().toISOString()
    });
    nextTick(() => scrollToBottom());
  });
}

function handleSendText(content) {
  if (!content.trim()) return;
  socket.emit('send-message', {
    roomId: props.roomId,
    sender: props.sender,
    content: content.trim()
  });
}

function handleFileUploaded(fileInfo) {
  // Server already inserted the message; emit to the room
  socket.emit('file-message', {
    roomId: props.roomId,
    sender: props.sender,
    file: fileInfo
  });
}

function scrollToBottom() {
  if (messageListRef.value) {
    messageListRef.value.scrollToBottom();
  }
}

onMounted(async () => {
  await loadHistory();
  connectSocket();
});

onBeforeUnmount(() => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
});
</script>

<style scoped>
.chat-room {
  display: flex;
  flex-direction: column;
  height: 100vh;
  max-width: 800px;
  margin: 0 auto;
  background: #fff;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.05);
}

.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  background: #fff;
  border-bottom: 1px solid #ebeef5;
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.header-divider {
  color: #c0c4cc;
}

.other-name {
  font-size: 15px;
  color: #606266;
}

.room-badge {
  font-size: 12px;
  color: #c0c4cc;
  font-family: monospace;
}

.input-area {
  flex-shrink: 0;
  border-top: 1px solid #ebeef5;
  padding: 12px 20px;
  background: #fafafa;
}
</style>
```

- [ ] **Step 3: Write client/src/components/MessageList.vue**

```vue
<template>
  <div class="message-list" ref="listRef">
    <div
      v-for="msg in messages"
      :key="msg.id"
      class="message-item"
      :class="{
        'is-mine': msg.sender === mySender,
        'is-system': msg.sender === '__system__'
      }"
    >
      <!-- System message -->
      <div v-if="msg.sender === '__system__'" class="system-msg">
        {{ msg.content }}
      </div>

      <!-- Normal message -->
      <template v-else>
        <div class="msg-bubble" :class="{ 'mine': msg.sender === mySender }">
          <div class="msg-meta">
            <span class="msg-sender">
              {{ msg.sender === 'a' ? partyA : partyB }}
            </span>
          </div>

          <!-- Text content -->
          <div v-if="msg.content" class="msg-content">{{ msg.content }}</div>

          <!-- File attachment -->
          <div v-if="msg.file_name" class="msg-file">
            <el-link
              :href="`/files/${msg.file_path}`"
              target="_blank"
              :underline="false"
              type="primary"
            >
              <el-icon><Document /></el-icon>
              {{ msg.file_name }}
              <span class="file-size">({{ formatSize(msg.file_size) }})</span>
            </el-link>
          </div>

          <div class="msg-time">{{ formatTime(msg.created_at) }}</div>
        </div>
      </template>
    </div>
    <div ref="bottomRef"></div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue';

const props = defineProps({
  messages: Array,
  mySender: String,
  partyA: String,
  partyB: String
});

const listRef = ref(null);
const bottomRef = ref(null);

function scrollToBottom() {
  bottomRef.value?.scrollIntoView({ behavior: 'smooth' });
}

function formatTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  const pad = n => String(n).padStart(2, '0');
  return `${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatSize(bytes) {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let i = 0;
  let size = bytes;
  while (size >= 1024 && i < units.length - 1) {
    size /= 1024;
    i++;
  }
  return `${size.toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
}

defineExpose({ scrollToBottom });
</script>

<style scoped>
.message-list {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.system-msg {
  text-align: center;
  font-size: 13px;
  color: #909399;
  padding: 4px 0;
}

.message-item {
  display: flex;
}

.message-item.is-mine {
  justify-content: flex-end;
}

.msg-bubble {
  max-width: 70%;
  padding: 10px 14px;
  border-radius: 12px;
  background: #f0f2f5;
}

.msg-bubble.mine {
  background: #409eff;
  color: #fff;
}

.msg-meta {
  margin-bottom: 4px;
}

.msg-sender {
  font-size: 12px;
  color: #909399;
}

.msg-bubble.mine .msg-sender {
  color: rgba(255, 255, 255, 0.8);
}

.msg-content {
  font-size: 15px;
  line-height: 1.5;
  word-break: break-word;
}

.msg-file {
  margin-top: 6px;
}

.msg-file .el-link {
  font-size: 14px;
}

.file-size {
  font-size: 11px;
  color: #909399;
  margin-left: 4px;
}

.msg-bubble.mine .file-size {
  color: rgba(255, 255, 255, 0.7);
}

.msg-time {
  font-size: 11px;
  color: #c0c4cc;
  margin-top: 4px;
  text-align: right;
}

.msg-bubble.mine .msg-time {
  color: rgba(255, 255, 255, 0.6);
}
</style>
```

- [ ] **Step 4: Write client/src/components/MessageInput.vue**

```vue
<template>
  <div class="message-input">
    <el-input
      v-model="text"
      type="textarea"
      :rows="2"
      :disabled="disabled"
      placeholder="输入消息..."
      resize="none"
      @keydown.enter.exact.prevent="send"
    />
    <el-button
      type="primary"
      :disabled="disabled || !text.trim()"
      @click="send"
      class="send-btn"
    >
      发送
    </el-button>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps({ disabled: Boolean });
const emit = defineEmits(['send']);

const text = ref('');

function send() {
  const content = text.value.trim();
  if (!content) return;
  emit('send', content);
  text.value = '';
}
</script>

<style scoped>
.message-input {
  display: flex;
  gap: 10px;
  align-items: flex-end;
}

.message-input :deep(.el-textarea__inner) {
  font-size: 14px;
}

.send-btn {
  flex-shrink: 0;
  height: 40px;
}
</style>
```

- [ ] **Step 5: Write client/src/components/FileUpload.vue**

```vue
<template>
  <div class="file-upload">
    <el-upload
      :action="uploadUrl"
      :data="{ sender }"
      :before-upload="beforeUpload"
      :on-success="onSuccess"
      :on-error="onError"
      :show-file-list="false"
      :disabled="disabled"
      accept="*"
    >
      <el-button :disabled="disabled" size="small" text>
        <el-icon><Upload /></el-icon>
        上传文件
      </el-button>
    </el-upload>
    <span class="upload-hint">最大 500MB</span>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { ElMessage } from 'element-plus';

const props = defineProps({
  roomId: String,
  sender: String,
  disabled: Boolean
});

const emit = defineEmits(['uploaded']);

const uploadUrl = computed(() => `/api/upload/${encodeURIComponent(props.roomId)}`);

function beforeUpload(file) {
  const maxSize = 500 * 1024 * 1024; // 500MB
  if (file.size > maxSize) {
    ElMessage.error('文件大小不能超过 500MB');
    return false;
  }
  return true;
}

function onSuccess(response) {
  emit('uploaded', {
    id: response.id,
    fileName: response.fileName,
    filePath: response.filePath,
    fileSize: response.fileSize
  });
  ElMessage.success('文件上传成功');
}

function onError(err) {
  ElMessage.error('文件上传失败');
  console.error(err);
}
</script>

<style scoped>
.file-upload {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 6px;
}

.upload-hint {
  font-size: 11px;
  color: #c0c4cc;
}
</style>
```

- [ ] **Step 6: Update server/socket.js to handle file messages**

The socket needs to handle a `file-message` event that gets emitted after file upload:

In `server/socket.js`, add this handler inside the `io.on('connection', ...)` block, alongside the existing `send-message` handler:

```js
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
```

- [ ] **Step 7: Commit**

```bash
git add client/src/views/RoomView.vue client/src/views/ChatRoom.vue \
        client/src/components/MessageList.vue client/src/components/MessageInput.vue \
        client/src/components/FileUpload.vue server/socket.js
git commit -m "feat: add ChatRoom view with messaging, file upload, and socket integration"
```

---

### Task 11: Integration — Build, Test, Final Polish

**Files:**
- Modify: `server/index.js` (ensure production static serving works)
- No new files

**Goal:** Verify the full stack works end-to-end in development mode.

- [ ] **Step 1: Start the backend server**

```bash
node server/index.js &
sleep 2
```

- [ ] **Step 2: Build the client and verify production serving**

```bash
cd client && npx vite build && cd ..
```

Verify the built files exist:
```bash
ls client/dist/index.html client/dist/assets/
```

- [ ] **Step 3: Test API endpoints**

```bash
# GET room (should not exist)
curl -s http://localhost:3000/api/room/testroom | python3 -m json.tool

# CREATE room
curl -s -X POST http://localhost:3000/api/room/testroom \
  -H "Content-Type: application/json" \
  -d '{"partyA":"Alice","partyB":"Bob","password":"secret123"}' | python3 -m json.tool

# GET room again (should exist)
curl -s http://localhost:3000/api/room/testroom | python3 -m json.tool

# VERIFY password
curl -s -X POST http://localhost:3000/api/room/testroom/verify \
  -H "Content-Type: application/json" \
  -d '{"password":"secret123"}' | python3 -m json.tool

# VERIFY wrong password
curl -s -X POST http://localhost:3000/api/room/testroom/verify \
  -H "Content-Type: application/json" \
  -d '{"password":"wrong"}' | python3 -m json.tool

# SPA fallback
curl -s http://localhost:3000/ | head -c 100
```

Expected: room not found → `{"exists":false}`, created → `{"success":true}`, exists → `{"exists":true,"partyA":"Alice","partyB":"Bob","hasPassword":true}`, verify → `{"success":true}`, wrong password → error, SPA → HTML with `<div id="app">`.

- [ ] **Step 4: Clean up test data and stop server**

```bash
kill %1 2>/dev/null
rm -f data/tempchat.db
```

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "feat: integration complete — full-stack chat app with rooms, messaging, file upload"
```
