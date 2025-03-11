<!-- frontend/src/components/ManageMode.vue -->
<template>
  <div class="manage-layout">
    <div class="manage-controls">
      <h1>양식 ID: {{ formId }} (모드: 양식 관리)</h1>
      <div class="page-controls">
        <button @click="prevPage" :disabled="currentPage === 0">◀ 이전</button>
        <span>Page {{ currentPage + 1 }} / {{ totalPages }}</span>
        <button @click="nextPage" :disabled="currentPage === totalPages - 1">다음 ▶</button>
        <button @click="addPage">➕ 페이지 추가</button>
        <button @click="removePage" :disabled="totalPages <= 1">➖ 페이지 삭제</button>
        <button @click="movePagePrompt">🔄 페이지 이동</button>
        <button @click="copyPagePrompt">📋 페이지 복사</button>
      </div>
      <FormSettings :form-id="formId" />
      <button @click="downloadFormPDF">📄 PDF 다운로드</button>
    </div>
    <div class="table-container">
      <RawData :form-id="formId" :page-index="currentPage" mode="manage" @set-table-manager="setTableManager" />
    </div>
  </div>
</template>

<script>
import FormSettings from "./FormSettings.vue";
import RawData from "./RawData.vue";
import { downloadFormPDF, movePage, copyPage } from "@/services/api";

export default {
  components: { FormSettings, RawData },
  props: {
    formId: { type: Number, required: true },
    pageManager: { type: Object, required: true },
    currentPage: { type: Number, required: true },
    totalPages: { type: Number, required: true },
  },
  emits: ["update:currentPage", "update:totalPages", "set-table-manager"],
  methods: {
    prevPage() {
      const newPage = this.pageManager.prevPage();
      this.$emit("update:currentPage", newPage);
    },
    nextPage() {
      const newPage = this.pageManager.nextPage();
      this.$emit("update:currentPage", newPage);
    },
    async addPage() {
      try {
        const { currentPage, totalPages } = await this.pageManager.addPage();
        this.$emit("update:currentPage", currentPage);
        this.$emit("update:totalPages", totalPages);
      } catch (error) {
        console.error("페이지 추가 실패:", error);
      }
    },
    async removePage() {
      if (!confirm(`정말로 페이지 ${this.currentPage + 1}을 삭제하시겠습니까?`)) {
        return;
      }
      try {
        const { currentPage, totalPages } = await this.pageManager.removePage();
        this.$emit("update:currentPage", currentPage);
        this.$emit("update:totalPages", totalPages);
        console.log(`✅ 페이지 ${this.currentPage + 1} 삭제 완료`);
      } catch (error) {
        console.error("페이지 삭제 실패:", error);
        alert("페이지 삭제 중 오류가 발생했습니다.");
      }
    },
    downloadFormPDF() {
      downloadFormPDF(this.formId);
    },
    async movePagePrompt() {
      const targetPage = prompt(`현재 페이지 (${this.currentPage + 1})를 이동할 페이지 번호를 입력하세요 (1-${this.totalPages}):`);
      if (targetPage !== null) {
        const targetIndex = parseInt(targetPage, 10) - 1;
        if (!isNaN(targetIndex) && targetIndex >= 0 && targetIndex < this.totalPages) {
          try {
            await movePage(this.formId, this.currentPage, targetIndex);
            console.log(`✅ 페이지 ${this.currentPage + 1} → ${targetIndex + 1} 이동 완료`);
            this.pageManager.currentPage = targetIndex; // PageManager 상태 업데이트
            this.$emit("update:currentPage", targetIndex); // UI 동기화
            const { totalPages } = await this.pageManager.loadFormData();
            this.$emit("update:totalPages", totalPages);
          } catch (error) {
            console.error("페이지 이동 실패:", error);
            alert("페이지 이동 중 오류가 발생했습니다.");
          }
        } else {
          alert(`유효한 페이지 번호(1-${this.totalPages})를 입력하세요.`);
        }
      }
    },
    async copyPagePrompt() {
      try {
        await copyPage(this.formId, this.currentPage);
        console.log(`✅ 페이지 ${this.currentPage + 1} 복사 완료`);
        const { totalPages } = await this.pageManager.loadFormData();
        this.$emit("update:totalPages", totalPages);
      } catch (error) {
        console.error("페이지 복사 실패:", error);
        alert("페이지 복사 중 오류가 발생했습니다.");
      }
    },
    setTableManager(manager) {
      this.$emit("set-table-manager", manager);
    },
  },
};
</script>

<style scoped>
.manage-layout {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  height: 100%;
  padding-right: 320px;
}
.manage-controls {
  position: fixed; /* 상단에 고정 */
  top: 20; /* 페이지 상단에 붙임 */
  right: 20px; /* 오른쪽 여백 유지 */
  width: 300px;
  padding: 10px;
  background: #f9f9f9;
  border-radius: 0 0 5px 5px; /* 상단은 둥글지 않게, 하단만 둥글게 */
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  z-index: 1000; /* 다른 요소 위에 표시되도록 z-index 높임 */
}
.table-container {
  width: 1200px;
  height: 1200px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 5px;
  margin-top: 20px; /* manage-controls와 겹치지 않도록 상단 여백 추가 */
  overflow: auto;
}
.page-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  margin: 10px 0;
}
.page-controls button {
  padding: 5px 10px;
  cursor: pointer;
}
.page-controls button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
button {
  padding: 8px 16px;
  cursor: pointer;
}
</style>