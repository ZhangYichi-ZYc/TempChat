<template>
  <div class="file-upload">
    <el-upload
      :action="uploadUrl"
      :data="{ sender }"
      :before-upload="beforeUpload"
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
</template>

<script setup>
import { computed } from 'vue';
import { ElMessage } from 'element-plus';

const props = defineProps({
  roomId: String,
  sender: String,
  disabled: Boolean
});

const emit = defineEmits(['uploaded']);

const uploadUrl = computed(() => `/api/upload/${encodeURIComponent(props.roomId)}`);

function beforeUpload(file) {
  const maxSize = 500 * 1024 * 1024; // 500MB
  if (file.size > maxSize) {
    ElMessage.error('文件大小不能超过 500MB');
    return false;
  }
  return true;
}

function onSuccess(response) {
  emit('uploaded', {
    id: response.id,
    fileName: response.fileName,
    filePath: response.filePath,
    fileSize: response.fileSize
  });
  ElMessage.success('文件上传成功');
}

function onError(err) {
  ElMessage.error('文件上传失败');
  console.error(err);
}
</script>

<style scoped>
.file-upload {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 6px;
}

.upload-hint {
  font-size: 11px;
  color: #c0c4cc;
}
</style>
