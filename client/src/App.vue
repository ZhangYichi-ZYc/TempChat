<template>
  <div id="app-container">
    <router-view />
  </div>
</template>

<script setup>
</script>

<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans SC', sans-serif;
  background: #f0f2f5;
  color: #333;
  min-height: 100vh;
}
#app-container { min-height: 100vh; }
</style>
