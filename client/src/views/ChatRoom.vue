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
