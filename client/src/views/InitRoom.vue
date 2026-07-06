<template>
  <div class="init-wrapper">
    <div class="init-card">
      <!-- Header -->
      <div class="card-header">
        <h1>创建新对话</h1>
        <p class="room-badge">chat.zhangyichi.cn/<strong>{{ roomId }}</strong></p>
      </div>

      <!-- Form -->
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
            placeholder="对方如何称呼你？"
            maxlength="30"
            show-word-limit
            size="large"
          />
        </el-form-item>

        <el-form-item label="乙方身份" prop="partyB">
          <el-input
            v-model="form.partyB"
            placeholder="对方的称呼？"
            maxlength="30"
            show-word-limit
            size="large"
          />
        </el-form-item>

        <el-form-item label="房间密码" prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="留空则不设密码"
            show-password
            maxlength="50"
            size="large"
          />
          <template #extra>
            <span class="field-hint">设置密码后，进入房间需要验证</span>
          </template>
        </el-form-item>

        <el-form-item class="submit-row">
          <el-button
            type="primary"
            size="large"
            :loading="submitting"
            @click="handleSubmit"
            class="submit-btn"
          >
            创建房间
          </el-button>
        </el-form-item>
      </el-form>
    </div>
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
  try { await formRef.value.validate(); } catch { return; }

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
.init-wrapper {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.init-card {
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

.field-hint {
  font-size: 12px;
  color: var(--text-muted);
  line-height: 1.8;
}

.submit-row {
  margin-top: 8px;
}

.submit-btn {
  width: 100%;
  height: 48px;
  font-size: 16px;
  border-radius: var(--radius-md);
}
</style>
