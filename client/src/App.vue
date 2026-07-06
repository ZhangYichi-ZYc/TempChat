<template>
  <div id="app-container">
    <router-view v-slot="{ Component }">
      <Transition name="page" mode="out-in">
        <component :is="Component" />
      </Transition>
    </router-view>
  </div>
</template>

<script setup>
</script>

<style>
/* ===== Design Tokens ===== */
:root {
  --bg-page: #f5f3f0;
  --bg-card: #ffffff;
  --bg-input: #f9f8f6;

  --text-primary: #1c1c1c;
  --text-secondary: #787670;
  --text-muted: #a8a59d;

  --bubble-own: #1e1e26;
  --bubble-own-text: #f0efe8;
  --bubble-other: #eae6df;
  --bubble-other-text: #1c1c1c;

  --accent: #c77d56;
  --accent-hover: #b06b44;
  --accent-subtle: #f5ede7;

  --border: #e5e2da;
  --border-light: #f0ede6;

  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.04);
  --shadow-md: 0 6px 20px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 12px 32px rgba(0, 0, 0, 0.08);

  --radius-sm: 8px;
  --radius-md: 14px;
  --radius-lg: 20px;

  --font-stack: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC',
    'Hiragino Sans GB', 'Microsoft YaHei', 'Noto Sans SC', sans-serif;

  --transition-fast: 150ms ease;
  --transition-normal: 250ms ease;
  --transition-slow: 400ms cubic-bezier(0.16, 1, 0.3, 1);
}

/* ===== Element Plus Theme Override ===== */
:root {
  --el-color-primary: #c77d56;
  --el-color-primary-light-3: #d49b7a;
  --el-color-primary-light-5: #e0b79e;
  --el-color-primary-light-7: #edd3c3;
  --el-color-primary-light-8: #f3e2d7;
  --el-color-primary-light-9: #f9f1eb;
  --el-color-primary-dark-2: #a06445;

  --el-color-success: #7b9b6a;
  --el-color-warning: #d4a853;
  --el-color-danger: #c4665a;
  --el-color-error: #c4665a;
  --el-color-info: #909399;

  --el-border-radius-base: 8px;
  --el-border-radius-small: 6px;
  --el-border-radius-round: 20px;

  --el-font-family: var(--font-stack);

  --el-bg-color: #ffffff;
  --el-bg-color-page: #f5f3f0;
  --el-bg-color-overlay: #ffffff;

  --el-text-color-primary: #1c1c1c;
  --el-text-color-regular: #3d3d3d;
  --el-text-color-secondary: #787670;
  --el-text-color-placeholder: #b5b1a8;

  --el-border-color: #e5e2da;
  --el-border-color-light: #f0ede6;
  --el-border-color-lighter: #f5f3f0;

  --el-fill-color: #f9f8f6;
  --el-fill-color-light: #f5f3f0;
  --el-fill-color-lighter: #faf9f7;

  --el-box-shadow-light: 0 1px 3px rgba(0, 0, 0, 0.04);
  --el-box-shadow: 0 6px 20px rgba(0, 0, 0, 0.06);
  --el-box-shadow-dark: 0 12px 32px rgba(0, 0, 0, 0.08);
}

/* ===== Global Reset & Base ===== */
*,
*::before,
*::after {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

body {
  font-family: var(--font-stack);
  background: var(--bg-page);
  color: var(--text-primary);
  min-height: 100vh;
  line-height: 1.5;
  font-size: 15px;
}

#app-container {
  min-height: 100vh;
}

/* ===== Page Transitions ===== */
.page-enter-active {
  transition: opacity var(--transition-slow), transform var(--transition-slow);
}
.page-leave-active {
  transition: opacity 120ms ease, transform 120ms ease;
}
.page-enter-from {
  opacity: 0;
  transform: translateY(12px);
}
.page-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

/* ===== Scrollbar ===== */
::-webkit-scrollbar {
  width: 5px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: #d5d1c8;
  border-radius: 10px;
}
::-webkit-scrollbar-thumb:hover {
  background: #b5b1a8;
}

/* ===== Focus ===== */
:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

/* ===== El-Input overrides for our design ===== */
.el-input__wrapper {
  box-shadow: 0 0 0 1px var(--border) inset !important;
  background: var(--bg-input) !important;
  transition: box-shadow var(--transition-fast) !important;
}
.el-input__wrapper:hover {
  box-shadow: 0 0 0 1px var(--text-muted) inset !important;
}
.el-input__wrapper.is-focus {
  box-shadow: 0 0 0 2px var(--accent) inset !important;
}

/* ===== El-Button: primary = filled accent ===== */
.el-button--primary {
  --el-button-bg-color: var(--accent);
  --el-button-border-color: var(--accent);
  --el-button-hover-bg-color: var(--accent-hover);
  --el-button-hover-border-color: var(--accent-hover);
  --el-button-active-bg-color: #955a37;
  --el-button-active-border-color: #955a37;
  font-weight: 600;
  letter-spacing: 0.01em;
}

/* ===== El-Button: default = subtle outline ===== */
.el-button--default {
  --el-button-bg-color: transparent;
  --el-button-border-color: var(--border);
  --el-button-text-color: var(--text-primary);
}
.el-button--default:hover {
  --el-button-border-color: var(--accent);
  --el-button-text-color: var(--accent);
  --el-button-bg-color: var(--accent-subtle);
}

/* ===== El-Card override ===== */
.el-card {
  border: 1px solid var(--border-light) !important;
  border-radius: var(--radius-lg) !important;
  box-shadow: var(--shadow-md) !important;
}
.el-card__header {
  border-bottom: 1px solid var(--border-light) !important;
  padding: 24px 28px 16px !important;
}
.el-card__body {
  padding: 28px !important;
}

/* ===== El-Tag override ===== */
.el-tag--large {
  padding: 6px 14px !important;
  font-size: 14px !important;
}

/* ===== El-Message override (toast) ===== */
.el-message {
  border-radius: var(--radius-md) !important;
  box-shadow: var(--shadow-md) !important;
  border: 1px solid var(--border-light) !important;
}

/* ===== El-Progress override ===== */
.el-progress-bar__outer {
  background: var(--border-light) !important;
  border-radius: 10px !important;
}
.el-progress-bar__inner {
  border-radius: 10px !important;
}
</style>
