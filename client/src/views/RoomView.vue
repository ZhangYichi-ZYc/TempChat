<template>
  <div class="room-shell">
    <!-- Loading -->
    <div v-if="state === 'loading'" class="state-center">
      <el-icon class="spin" :size="28"><Loading /></el-icon>
      <p>加载中...</p>
    </div>

    <!-- Init -->
    <InitRoom
      v-else-if="state === 'init'"
      :roomId="roomId"
      @created="onCreated"
    />

    <!-- Join -->
    <JoinRoom
      v-else-if="state === 'join'"
      :roomId="roomId"
      :partyA="partyA"
      :partyB="partyB"
      :hasPassword="hasPassword"
      @joined="onJoined"
    />

    <!-- Chat -->
    <ChatRoom
      v-else-if="state === 'chat'"
      :roomId="roomId"
      :sender="sender"
      :partyA="partyA"
      :partyB="partyB"
    />

    <!-- Error -->
    <div v-else class="state-center">
      <el-result icon="error" title="加载失败" sub-title="请检查房间地址是否正确">
        <template #extra>
          <el-button @click="initRoom">重试</el-button>
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
.room-shell { min-height: 100vh; }

.state-center {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: var(--text-secondary);
}

.spin { animation: spin 1s linear infinite; }

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
