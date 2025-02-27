<!-- frontend/src/components/ModeSelector.vue -->
<template>
    <div class="mode-selector">
      <h2>모드 선택</h2>
      <button @click="selectMode('manage')">양식 관리</button>
      <button @click="selectMode('test')">시험하기</button>
    </div>
  </template>
  
  <script>
  export default {
    methods: {
      selectMode(mode) {
        this.$emit("select-mode", mode);
      },
    },
  };
  </script>
  
  <style scoped>
  .mode-selector {
    text-align: center;
    padding: 20px;
  }
  button {
    padding: 10px 20px;
    margin: 0 10px;
    font-size: 16px;
    cursor: pointer;
  }
  </style>