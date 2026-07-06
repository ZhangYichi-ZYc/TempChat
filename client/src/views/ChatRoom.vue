<template>
  <div class="chat-room">
    <!-- Dark header -->
    <header class="chat-header">
      <div class="header-main">
        <span class="header-party">{{ myName }}</span>
        <span class="header-divider">·</span>
        <span class="header-party is-other">{{ otherName }}</span>
      </div>
      <span class="header-room">#{{ roomId }}</span>
    </header>

    <!-- Messages -->
    <MessageList
      :messages="messages"
      :mySender="sender"
      :partyA="partyA"
      :partyB="partyB"
      ref="msgListRef"
    />

    <!-- Input dock -->
    <footer class="input-dock">
      <MessageInput
        :disabled="!connected"
        @send="handleSendText"
      />
      <div class="dock-actions">
        <FileUpload
          :roomId="roomId"
          :sender="sender"
          :disabled="!connected"
          @uploaded="handleFileUploaded"
        />
        <span v-if="!connected" class="disconnected-badge">连接中...</span>
      </div>
    </footer>
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
const msgListRef = ref(null);
let socket = null;

const myName = computed(() => props.sender === 'a' ? props.partyA : props.partyB);
const otherName = computed(() => props.sender === 'a' ? props.partyB : props.partyA);

async function loadHistory() {
  try {
    const res = await getMessages(props.roomId);
    messages.value = res.messages;
    await nextTick();
    scrollToBottom();
  } catch (e) { console.error('Failed to load messages:', e); }
}

function connectSocket() {
  socket = io('/', { transports: ['websocket', 'polling'] });

  socket.on('connect', () => {
    connected.value = true;
    socket.emit('join-room', { roomId: props.roomId, sender: props.sender });
  });

  socket.on('disconnect', () => { connected.value = false; });

  socket.on('new-message', (msg) => {
    messages.value.push(msg);
    nextTick(() => scrollToBottom());
  });

  socket.on('user-joined', ({ sender: who }) => {
    const name = who === 'a' ? props.partyA : props.partyB;
    messages.value.push({
      id: Date.now(),
      room_id: props.roomId,
      sender: '__system__',
      content: `${name} 加入了对话`,
      file_name: null, file_path: null, file_size: null,
      created_at: new Date().toISOString()
    });
    nextTick(() => scrollToBottom());
  });
}

function handleSendText(content) {
  if (!content.trim()) return;
  socket.emit('send-message', { roomId: props.roomId, sender: props.sender, content: content.trim() });
}

function handleFileUploaded(fileInfo) {
  socket.emit('file-message', { roomId: props.roomId, sender: props.sender, file: fileInfo });
}

function scrollToBottom() {
  msgListRef.value?.scrollToBottom();
}

onMounted(async () => {
  await loadHistory();
  connectSocket();
});

onBeforeUnmount(() => {
  if (socket) { socket.disconnect(); socket = null; }
});
</script>

<style scoped>
.chat-room {
  display: flex;
  flex-direction: column;
  height: 100vh;
  max-width: 720px;
  margin: 0 auto;
  background: var(--bg-card);
  box-shadow: var(--shadow-sm);
}

/* ===== Header ===== */
.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 24px;
  background: var(--bubble-own);
  flex-shrink: 0;
}

.header-main {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
}

.header-party {
  color: var(--bubble-own-text);
}

.header-divider {
  color: rgba(240, 239, 232, 0.35);
  font-weight: 400;
}

.header-party.is-other {
  color: rgba(240, 239, 232, 0.7);
  font-weight: 400;
}

.header-room {
  font-size: 12px;
  color: rgba(240, 239, 232, 0.45);
  font-family: 'SF Mono', 'Fira Code', monospace;
}

/* ===== Input dock ===== */
.input-dock {
  flex-shrink: 0;
  padding: 14px 20px 16px;
  border-top: 1px solid var(--border-light);
  background: var(--bg-card);
}

.dock-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 4px;
}

.disconnected-badge {
  font-size: 12px;
  color: var(--text-muted);
}
</style>
