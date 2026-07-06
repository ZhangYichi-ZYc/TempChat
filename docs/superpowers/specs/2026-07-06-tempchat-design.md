# TempChat — 简单聊天网页设计文档

**日期**: 2026-07-06
**域名**: chat.zhangyichi.cn

## 概述

一个基于 URL 路径的轻量聊天应用。访问 `chat.zhangyichi.cn/<roomId>` 进入不同聊天室，支持文字消息和文件上传（≤500MB），无需注册账号，通过简单的身份选择和可选密码保护隐私。

## 技术栈

| 层 | 技术 | 原因 |
|---|---|---|
| 后端 | Node.js 20 + Express | 开发环境已就绪 |
| 实时通信 | Socket.io | 消息即时推送，自动重连 |
| 数据库 | SQLite (better-sqlite3) | 零配置，单文件，足够该规模使用 |
| 前端 | Vue 3 + Vite | SPA 体验，生态丰富 |
| UI 库 | Element Plus | 组件齐全，文档完善 |
| 文件存储 | 本地文件系统 | 简单直接，后续可扩展至 S3 |
| 密码加密 | bcrypt | 行业标准 |

## URL 路由

```
chat.zhangyichi.cn/<roomId>
```

- `roomId` 为路径段，如 `/zyc`, `/team-chat` 等
- Vue Router 在前端解析 roomId
- 不存在的 roomId → 初始化页面
- 已存在的 roomId → 身份选择页面

## 页面流程

```
访问 /:roomId
  │
  ├─ 房间不存在 ──> 初始化页面
  │                 - 输入甲方身份名称
  │                 - 输入乙方身份名称
  │                 - 设置房间密码（可留空）
  │                 - 提交 → 创建房间 → 进入聊天
  │
  └─ 房间已存在 ──> 身份选择页面
                    - 选择当前用户身份（甲方/乙方）
                    - 如有密码 → 输入密码验证
                    - 验证通过 → 进入聊天
```

**关于身份安全**: 身份选择不做服务端验证，用户自由选择即可。密码只保护"进入房间"这一操作，不绑定具体身份。

## 数据模型

### Room 表
```sql
CREATE TABLE room (
  id         TEXT PRIMARY KEY,   -- URL 路径标识
  party_a    TEXT NOT NULL,      -- 甲方身份名称
  party_b    TEXT NOT NULL,      -- 乙方身份名称
  password   TEXT DEFAULT '',    -- bcrypt 哈希，空字符串=无密码
  created_at TEXT DEFAULT (datetime('now'))
);
```

### Message 表
```sql
CREATE TABLE message (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  room_id    TEXT NOT NULL REFERENCES room(id),
  sender     TEXT NOT NULL,      -- "a" 或 "b"
  content    TEXT DEFAULT '',    -- 文字内容
  file_name  TEXT,               -- 原始文件名
  file_path  TEXT,               -- 服务器存储路径
  file_size  INTEGER,            -- 字节数
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_message_room ON message(room_id, created_at);
```

## API 设计

| 端点 | 方法 | 请求体 | 响应 | 说明 |
|---|---|---|---|---|
| `/api/room/:id` | GET | — | `{ exists, partyA?, partyB?, hasPassword? }` | 查询房间状态 |
| `/api/room/:id` | POST | `{ partyA, partyB, password }` | `{ success }` | 初始化房间 |
| `/api/room/:id/verify` | POST | `{ password }` | `{ success }` | 验证房间密码 |
| `/api/messages/:roomId` | GET | query: `?before=&limit=` | `{ messages[] }` | 获取历史消息（游标分页） |
| `/api/upload/:roomId` | POST | multipart (field: `file` + `sender`) | `{ file }` | 上传文件，限制 500MB |

## WebSocket 事件

| 事件 | 方向 | 数据 | 说明 |
|---|---|---|---|
| `join-room` | client→server | `{ roomId, sender }` | 加入房间，sender 为 "a" 或 "b" |
| `send-message` | client→server | `{ roomId, sender, content }` | 发送文字消息 |
| `new-message` | server→client | `{ id, sender, content, file*, created_at }` | 广播新消息 |
| `user-joined` | server→client | `{ sender, joinedAt }` | 通知有人加入 |

## 文件上传

- 使用 `multer` 处理 multipart/form-data
- 限制 500MB（通过 multer limits）
- 存储路径: `uploads/<roomId>/<timestamp>-<originalname>`
- 前端 Element Plus Upload 组件带进度条
- 提供 `/files/<roomId>/<filename>` 下载端点

## 项目结构

```
TempChat/
├── server/
│   ├── index.js          # Express 入口
│   ├── db.js             # SQLite 初始化和查询
│   ├── socket.js         # Socket.io 事件处理
│   └── routes/
│       ├── room.js       # Room API 路由
│       └── upload.js     # 文件上传路由
├── client/
│   ├── index.html
│   ├── vite.config.js
│   └── src/
│       ├── main.js
│       ├── App.vue
│       ├── router.js
│       ├── views/
│       │   ├── InitRoom.vue    # 初始化页面
│       │   ├── JoinRoom.vue    # 身份选择页面
│       │   └── ChatRoom.vue    # 聊天页面
│       ├── components/
│       │   ├── MessageList.vue
│       │   ├── MessageInput.vue
│       │   └── FileUpload.vue
│       └── api.js              # HTTP 请求封装
├── uploads/               # 上传文件存储（gitignore）
├── data/                  # SQLite 数据库文件（gitignore）
├── package.json
└── .gitignore
```

## 部署

```nginx
server {
    server_name chat.zhangyichi.cn;

    location /api/       { proxy_pass http://127.0.0.1:3000; }
    location /socket.io/ { proxy_pass http://127.0.0.1:3000; proxy_set_header Upgrade $http_upgrade; proxy_set_header Connection "upgrade"; }
    location /files/     { proxy_pass http://127.0.0.1:3000; }
    location /           { root /path/to/client/dist; try_files $uri /index.html; }
}
```

## 注意事项

1. **无身份认证**: 身份选择完全由用户自主，密码仅保护房间访问
2. **单房间单连接**: 同一 roomId 允许多个连接（同一身份可多设备）
3. **消息持久化**: 所有消息写入 SQLite，新加入者可查看历史
4. **文件清理**: 当前不做自动清理，后续可考虑定期清理策略
5. **CORS**: 开发时需配置 Vite proxy，生产时同域无需处理
