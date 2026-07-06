<template>
  <div class="room-container">
    <!-- Loading -->
    <div v-if="state === 'loading'" class="loading-state">
      <el-icon class="loading-icon" :size="32"><Loading /></el-icon>
      <p>加载中...</p>
    </div>

    <!-- Init: room doesn't exist yet -->
    <InitRoom
      v-else-if="state === 'init'"
      :roomId="roomId"
      @created="onCreated"
    />

    <!-- Join: room exists, need to select identity -->
    <JoinRoom
      v-else-if="state === 'join'"
      :roomId="roomId"
      :partyA="partyA"
      :partyB="partyB"
      :hasPassword="hasPassword"
      @joined="onJoined"
    />

    <!-- Chat: actively in the room -->
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

const state = ref('loading');
const partyA = ref('');
const partyB = ref('');
const hasPassword = ref(false);
const sender = ref('');

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
.room-container { min-height: 100vh; }

.loading-state {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: #909399;
}

.loading-icon { animation: spin 1s linear infinite; }

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
