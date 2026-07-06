<template>
  <div class="init-room-wrapper">
    <el-card class="init-card">
      <template #header>
        <div class="card-header">
          <h2>创建新对话</h2>
          <p class="room-id-label">房间: {{ roomId }}</p>
        </div>
      </template>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-position="top"
        @submit.prevent="handleSubmit"
      >
        <el-form-item label="甲方身份" prop="partyA">
          <el-input
            v-model="form.partyA"
            placeholder="例如：张三"
            maxlength="30"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="乙方身份" prop="partyB">
          <el-input
            v-model="form.partyB"
            placeholder="例如：李四"
            maxlength="30"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="房间密码（选填）" prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="留空则不设置密码"
            show-password
            maxlength="50"
          />
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            size="large"
            :loading="submitting"
            @click="handleSubmit"
            style="width: 100%"
          >
            创建房间
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { createRoom } from '../api';

const props = defineProps({ roomId: String });
const emit = defineEmits(['created']);

const formRef = ref(null);
const submitting = ref(false);

const form = reactive({
  partyA: '',
  partyB: '',
  password: ''
});

const rules = {
  partyA: [
    { required: true, message: '请输入甲方身份名称', trigger: 'blur' },
    { min: 1, max: 30, message: '1-30个字符', trigger: 'blur' }
  ],
  partyB: [
    { required: true, message: '请输入乙方身份名称', trigger: 'blur' },
    { min: 1, max: 30, message: '1-30个字符', trigger: 'blur' }
  ]
};

async function handleSubmit() {
  if (!formRef.value) return;
  try {
    await formRef.value.validate();
  } catch {
    return;
  }

  submitting.value = true;
  try {
    await createRoom(props.roomId, form.partyA, form.partyB, form.password);
    ElMessage.success('房间创建成功');
    emit('created', form.partyA, form.partyB);
  } catch (err) {
    const msg = err.response?.data?.error || '创建失败，请重试';
    ElMessage.error(msg);
  } finally {
    submitting.value = false;
  }
}
</script>

<style scoped>
.init-room-wrapper {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.init-card {
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
</style>
