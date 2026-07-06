<template>
  <div class="file-upload-area">
    <!-- Upload trigger -->
    <el-upload
      ref="uploadRef"
      :action="uploadUrl"
      :data="{ sender }"
      name="file"
      :before-upload="beforeUpload"
      :on-progress="onProgress"
      :on-success="onSuccess"
      :on-error="onError"
      :show-file-list="false"
      :disabled="disabled"
      accept="*"
      class="upload-hidden"
    >
      <button
        :disabled="disabled"
        class="upload-trigger"
        title="上传文件（最大 500MB）"
      >
        <el-icon :size="16"><Upload /></el-icon>
        <span>文件</span>
      </button>
    </el-upload>

    <!-- Progress bar -->
    <Transition name="progress">
      <div v-if="uploading" class="progress-bar">
        <div class="progress-info">
          <el-icon :size="14"><Document /></el-icon>
          <span class="progress-name">{{ uploadingFile }}</span>
          <span class="progress-pct">{{ progress }}%</span>
        </div>
        <div class="progress-track">
          <div class="progress-fill" :class="progressStatus" :style="{ width: progress + '%' }"></div>
        </div>
        <button class="cancel-btn" @click="cancelUpload" title="取消上传">
          <el-icon :size="14"><Close /></el-icon>
        </button>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { ElMessage } from 'element-plus';

const props = defineProps({
  roomId: String,
  sender: String,
  disabled: Boolean
});

const emit = defineEmits(['uploaded']);

const uploadUrl = computed(() => `/api/upload/${encodeURIComponent(props.roomId)}`);

const uploadRef = ref(null);
const uploading = ref(false);
const uploadingFile = ref('');
const progress = ref(0);
const progressStatus = ref('');
let currentFile = null;

function beforeUpload(file) {
  const maxSize = 500 * 1024 * 1024;
  if (file.size > maxSize) {
    ElMessage.error('文件大小不能超过 500MB');
    return false;
  }
  currentFile = file;
  uploading.value = true;
  uploadingFile.value = file.name;
  progress.value = 0;
  progressStatus.value = '';
  return true;
}

function onProgress(event) {
  progress.value = Math.round(event.percent);
}

function onSuccess(response) {
  progress.value = 100;
  progressStatus.value = 'done';
  emit('uploaded', {
    id: response.id,
    fileName: response.fileName,
    filePath: response.filePath,
    fileSize: response.fileSize
  });
  ElMessage.success('文件上传成功');
  resetAfter(1500);
}

function onError(err) {
  progressStatus.value = 'fail';
  ElMessage.error('文件上传失败');
  console.error(err);
  resetAfter(2000);
}

function cancelUpload() {
  if (currentFile && uploadRef.value) {
    uploadRef.value.abort(currentFile);
  }
  ElMessage.info('已取消上传');
  resetAfter(0);
}

function resetAfter(ms) {
  setTimeout(() => {
    uploading.value = false;
    uploadingFile.value = '';
    progress.value = 0;
    progressStatus.value = '';
    currentFile = null;
  }, ms);
}
</script>

<style scoped>
.file-upload-area {
  display: flex;
  flex-direction: column;
}

.upload-hidden {
  display: inline-flex;
}

.upload-trigger {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 10px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--text-secondary);
  font-size: 13px;
  font-family: var(--font-stack);
  cursor: pointer;
  transition: color var(--transition-fast), background var(--transition-fast);
}

.upload-trigger:hover:not(:disabled) {
  color: var(--accent);
  background: var(--accent-subtle);
}

.upload-trigger:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ===== Progress ===== */
.progress-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background: var(--bg-input);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-sm);
  margin-top: 8px;
}

.progress-info {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  flex: 1;
  font-size: 12.5px;
  color: var(--text-secondary);
}

.progress-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.progress-pct {
  flex-shrink: 0;
  color: var(--text-muted);
  font-size: 11.5px;
}

.progress-track {
  width: 80px;
  height: 4px;
  background: var(--border-light);
  border-radius: 10px;
  overflow: hidden;
  flex-shrink: 0;
}

.progress-fill {
  height: 100%;
  background: var(--accent);
  border-radius: 10px;
  transition: width 200ms ease;
}

.progress-fill.done {
  background: var(--el-color-success);
}

.progress-fill.fail {
  background: var(--el-color-danger);
}

.cancel-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  flex-shrink: 0;
  transition: background var(--transition-fast), color var(--transition-fast);
}

.cancel-btn:hover {
  background: rgba(196, 102, 90, 0.1);
  color: var(--el-color-danger);
}

/* Transition */
.progress-enter-active { transition: all 200ms ease; }
.progress-leave-active { transition: all 150ms ease; }
.progress-enter-from { opacity: 0; transform: translateY(-4px); }
.progress-leave-to { opacity: 0; }
</style>
