<template>
  <div class="message-input">
    <el-input
      v-model="text"
      type="textarea"
      :rows="2"
      :disabled="disabled"
      placeholder="输入消息..."
      resize="none"
      @keydown.enter.exact.prevent="send"
    />
    <el-button
      type="primary"
      :disabled="disabled || !text.trim()"
      @click="send"
      class="send-btn"
    >
      发送
    </el-button>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps({ disabled: Boolean });
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
.message-input {
  display: flex;
  gap: 10px;
  align-items: flex-end;
}

.message-input :deep(.el-textarea__inner) {
  font-size: 14px;
}

.send-btn {
  flex-shrink: 0;
  height: 40px;
}
</style>
