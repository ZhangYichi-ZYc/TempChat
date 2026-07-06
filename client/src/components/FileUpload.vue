<template>
  <div class="file-upload-area">
    <div class="upload-trigger-row">
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
      >
        <el-button :disabled="disabled" size="small" text>
          <el-icon><Upload /></el-icon>
          上传文件
        </el-button>
      </el-upload>
      <span class="upload-hint">最大 500MB</span>
    </div>

    <!-- Upload progress bar -->
    <div v-if="uploading" class="upload-progress">
      <div class="progress-header">
        <el-icon><Document /></el-icon>
        <span class="upload-filename">{{ uploadingFile }}</span>
        <span class="progress-percent">{{ progress }}%</span>
      </div>
      <el-progress
        :percentage="progress"
        :status="progressStatus"
        :stroke-width="6"
      />
    </div>
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
const uploading = ref(false);
const uploadingFile = ref('');
const progress = ref(0);
const progressStatus = ref('');

function beforeUpload(file) {
  const maxSize = 500 * 1024 * 1024;
  if (file.size > maxSize) {
    ElMessage.error('文件大小不能超过 500MB');
    return false;
  }
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
  progressStatus.value = 'success';
  emit('uploaded', {
    id: response.id,
    fileName: response.fileName,
    filePath: response.filePath,
    fileSize: response.fileSize
  });
  ElMessage.success('文件上传成功');
  setTimeout(() => {
    uploading.value = false;
    uploadingFile.value = '';
    progress.value = 0;
    progressStatus.value = '';
  }, 1500);
}

function onError(err) {
  progressStatus.value = 'exception';
  ElMessage.error('文件上传失败');
  console.error(err);
  setTimeout(() => {
    uploading.value = false;
    uploadingFile.value = '';
    progress.value = 0;
    progressStatus.value = '';
  }, 2000);
}
</script>

<style scoped>
.file-upload-area {
  margin-top: 6px;
}

.upload-trigger-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.upload-hint {
  font-size: 11px;
  color: #c0c4cc;
}

.upload-progress {
  margin-top: 8px;
  padding: 8px 12px;
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 6px;
}

.progress-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
  font-size: 13px;
}

.upload-filename {
  flex: 1;
  color: #606266;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.progress-percent {
  color: #909399;
  font-size: 12px;
  flex-shrink: 0;
}
</style>
