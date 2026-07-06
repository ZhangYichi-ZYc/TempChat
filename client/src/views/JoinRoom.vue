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
