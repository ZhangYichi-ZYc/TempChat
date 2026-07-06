<template>
  <div class="message-list" ref="listRef">
    <div
      v-for="(msg, idx) in messages"
      :key="msg.id"
      class="msg-row"
      :class="{
        'is-mine': msg.sender === mySender,
        'is-system': msg.sender === '__system__',
        'is-new': idx === messages.length - 1 && msg.sender !== '__system__'
      }"
    >
      <!-- System message -->
      <p v-if="msg.sender === '__system__'" class="sys-msg">{{ msg.content }}</p>

      <!-- Chat bubble -->
      <template v-else>
        <div class="bubble" :class="{ mine: msg.sender === mySender }">
          <!-- Sender label -->
          <span class="bubble-sender">
            {{ msg.sender === 'a' ? partyA : partyB }}
          </span>

          <!-- Text -->
          <p v-if="msg.content" class="bubble-text">{{ msg.content }}</p>

          <!-- File -->
          <a
            v-if="msg.file_name"
            :href="`/files/${msg.file_path}`"
            target="_blank"
            class="bubble-file"
          >
            <el-icon :size="16"><Document /></el-icon>
            <span class="file-name">{{ msg.file_name }}</span>
            <span class="file-size">{{ formatSize(msg.file_size) }}</span>
          </a>

          <!-- Time -->
          <time class="bubble-time">{{ formatTime(msg.created_at) }}</time>
        </div>
      </template>
    </div>
    <div ref="bottomRef"></div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

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
  let i = 0, size = bytes;
  while (size >= 1024 && i < units.length - 1) { size /= 1024; i++; }
  return `${size.toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
}

defineExpose({ scrollToBottom });
</script>

<style scoped>
.message-list {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  background: var(--bg-card);
}

/* ===== System ===== */
.sys-msg {
  text-align: center;
  font-size: 12.5px;
  color: var(--text-muted);
  padding: 8px 0;
  font-style: italic;
}

/* ===== Row ===== */
.msg-row {
  display: flex;
  margin-bottom: 2px;
}

.msg-row.is-mine {
  justify-content: flex-end;
}

/* ===== Bubble ===== */
.bubble {
  max-width: 72%;
  padding: 12px 16px;
  border-radius: var(--radius-lg);
  background: var(--bubble-other);
  color: var(--bubble-other-text);
  position: relative;
}

.bubble.mine {
  background: var(--bubble-own);
  color: var(--bubble-own-text);
  border-bottom-right-radius: 6px;
}

.bubble:not(.mine) {
  border-bottom-left-radius: 6px;
}

/* Sender label */
.bubble-sender {
  display: block;
  font-size: 11.5px;
  font-weight: 600;
  margin-bottom: 3px;
  color: var(--bubble-other-sender);
  letter-spacing: 0.02em;
}

.bubble.mine .bubble-sender {
  color: var(--bubble-own-sender);
}

/* Text */
.bubble-text {
  font-size: 15px;
  line-height: 1.6;
  word-break: break-word;
  white-space: pre-wrap;
}

/* File link — amber accent, readable on both light backgrounds */
.bubble-file {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  padding: 8px 12px;
  border-radius: var(--radius-sm);
  background: rgba(199, 125, 86, 0.08);
  color: var(--accent);
  text-decoration: none;
  font-size: 13.5px;
  font-weight: 500;
  transition: background var(--transition-fast);
}

.bubble-file:hover {
  background: rgba(199, 125, 86, 0.15);
}

.file-name {
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-size {
  font-size: 11px;
  opacity: 0.7;
  flex-shrink: 0;
}

/* Time */
.bubble-time {
  display: block;
  font-size: 10.5px;
  margin-top: 6px;
  color: var(--text-muted);
  text-align: right;
}

/* New message animation */
.is-new .bubble {
  animation: msgIn 350ms cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes msgIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
