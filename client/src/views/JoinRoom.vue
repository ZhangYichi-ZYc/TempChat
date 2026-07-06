<template>
  <div class="join-wrapper">
    <div class="join-card">
      <!-- Header -->
      <div class="card-header">
        <h1>进入对话</h1>
        <p class="room-badge">chat.zhangyichi.cn/<strong>{{ roomId }}</strong></p>
      </div>

      <!-- Password gate -->
      <template v-if="showPasswordGate">
        <div class="password-section">
          <p class="gate-hint">此房间已设置密码</p>
          <el-form @submit.prevent="verifyPass">
            <el-form-item>
              <el-input
                v-model="passwordInput"
                type="password"
                placeholder="请输入房间密码"
                show-password
                size="large"
                @keyup.enter="verifyPass"
              />
            </el-form-item>
            <el-form-item>
              <el-button
                type="primary"
                size="large"
                :loading="verifying"
                @click="verifyPass"
                class="verify-btn"
              >
                验证进入
              </el-button>
            </el-form-item>
          </el-form>
        </div>
      </template>

      <!-- Identity selection -->
      <template v-else>
        <p class="select-hint">选择你的身份进入对话</p>

        <div class="identity-list">
          <button class="identity-card" @click="selectParty('a')">
            <span class="id-icon">
              <el-icon :size="22"><User /></el-icon>
            </span>
            <span class="id-name">{{ partyA }}</span>
            <span class="id-role">甲方</span>
            <el-icon class="id-arrow" :size="16"><ArrowRight /></el-icon>
          </button>

          <button class="identity-card" @click="selectParty('b')">
            <span class="id-icon">
              <el-icon :size="22"><User /></el-icon>
            </span>
            <span class="id-name">{{ partyB }}</span>
            <span class="id-role">乙方</span>
            <el-icon class="id-arrow" :size="16"><ArrowRight /></el-icon>
          </button>
        </div>
      </template>
    </div>
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

const showPasswordGate = computed(() => props.hasPassword && !passwordVerified.value);

async function verifyPass() {
  if (!passwordInput.value) { ElMessage.warning('请输入密码'); return; }
  verifying.value = true;
  try {
    await verifyPassword(props.roomId, passwordInput.value);
    passwordVerified.value = true;
  } catch (err) {
    ElMessage.error(err.response?.data?.error || '密码错误');
  } finally {
    verifying.value = false;
  }
}

function selectParty(sender) {
  emit('joined', sender);
}
</script>

<style scoped>
.join-wrapper {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.join-card {
  width: 100%;
  max-width: 420px;
  background: var(--bg-card);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  padding: 36px 32px;
}

.card-header {
  text-align: center;
  margin-bottom: 32px;
}

.card-header h1 {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.01em;
  margin-bottom: 8px;
}

.room-badge {
  font-size: 13px;
  color: var(--text-secondary);
  font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', monospace;
}

.room-badge strong {
  color: var(--accent);
  font-weight: 600;
}

/* Password section */
.password-section {
  margin-top: -8px;
}

.gate-hint {
  text-align: center;
  color: var(--text-secondary);
  font-size: 14px;
  margin-bottom: 16px;
}

.verify-btn {
  width: 100%;
  height: 48px;
  font-size: 16px;
  border-radius: var(--radius-md);
}

/* Identity cards — the signature interaction */
.select-hint {
  text-align: center;
  color: var(--text-secondary);
  font-size: 15px;
  margin-bottom: 24px;
}

.identity-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.identity-card {
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
  padding: 18px 20px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition:
    border-color var(--transition-normal),
    box-shadow var(--transition-normal),
    transform var(--transition-normal);
  font-family: var(--font-stack);
  font-size: inherit;
  color: inherit;
  -webkit-tap-highlight-color: transparent;
}

.identity-card:hover {
  border-color: var(--accent);
  box-shadow: 0 4px 16px rgba(199, 125, 86, 0.12);
  transform: translateY(-2px);
}

.identity-card:active {
  transform: translateY(0);
  box-shadow: var(--shadow-sm);
}

.id-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: var(--accent-subtle);
  color: var(--accent);
  flex-shrink: 0;
  transition: transform var(--transition-normal);
}

.identity-card:hover .id-icon {
  transform: scale(1.08);
}

.id-name {
  flex: 1;
  font-size: 17px;
  font-weight: 600;
  color: var(--text-primary);
  text-align: left;
}

.id-role {
  font-size: 12px;
  color: var(--text-muted);
  background: var(--bg-page);
  padding: 3px 10px;
  border-radius: 20px;
  flex-shrink: 0;
}

.id-arrow {
  color: var(--text-muted);
  flex-shrink: 0;
  transition: color var(--transition-normal), transform var(--transition-normal);
}

.identity-card:hover .id-arrow {
  color: var(--accent);
  transform: translateX(3px);
}
</style>
