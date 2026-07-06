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
