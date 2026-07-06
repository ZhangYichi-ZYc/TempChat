<template>
  <div class="msg-input-row">
    <el-input
      v-model="text"
      type="textarea"
      :rows="2"
      :disabled="disabled"
      placeholder="输入消息...  Enter 发送"
      resize="none"
      class="text-input"
      @keydown.enter.exact.prevent="send"
    />
    <button
      class="send-btn"
      :disabled="disabled || !text.trim()"
      @click="send"
      title="发送 (Enter)"
    >
      <el-icon :size="18"><Promotion /></el-icon>
    </button>
  </div>
</template>

<script setup>
import { ref } from 'vue';

defineProps({ disabled: Boolean });
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
.msg-input-row {
  display: flex;
  gap: 10px;
  align-items: center;
}

.text-input {
  flex: 1;
}

.text-input :deep(.el-textarea__inner) {
  font-size: 14.5px;
  line-height: 1.6;
  border-radius: var(--radius-md);
  background: var(--bg-input);
  border-color: var(--border);
  transition: border-color var(--transition-fast);
  resize: none;
  padding: 10px 14px;
}

.text-input :deep(.el-textarea__inner:focus) {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(199, 125, 86, 0.1);
}

.send-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border: none;
  border-radius: 12px;
  background: var(--accent);
  color: #fff;
  cursor: pointer;
  flex-shrink: 0;
  transition:
    background var(--transition-fast),
    transform var(--transition-fast);
}

.send-btn:hover:not(:disabled) {
  background: var(--accent-hover);
  transform: scale(1.05);
}

.send-btn:active:not(:disabled) {
  transform: scale(0.96);
}

.send-btn:disabled {
  background: var(--border-light);
  color: var(--text-muted);
  cursor: not-allowed;
}
</style>
