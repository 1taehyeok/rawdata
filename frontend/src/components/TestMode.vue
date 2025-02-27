<!-- frontend/src/components/TestMode.vue -->
<template>
  <div class="manage-layout">
    <div class="manage-controls">
      <h1>{{ editMode ? `시험 데이터 수정 (ID: ${testId})` : `양식 ID: ${formId} (모드: 시험하기)` }}</h1>
      <div class="page-controls">
        <button @click="prevPage" :disabled="currentPage === 0">◀ 이전</button>
        <span>Page {{ currentPage + 1 }} / {{ totalPages }}</span>
        <button @click="nextPage" :disabled="currentPage === totalPages - 1">다음 ▶</button>
      </div>
      <button @click="saveTestData">{{ editMode ? "수정된 데이터 저장" : "시험 데이터 저장 및 PDF 변환" }}</button>
    </div>
    <div class="table-container">
      <RawData :form-id="formId" :page-index="currentPage" mode="test" :initial-data="initialData" :test-id="testId" @set-table-manager="setTableManager" />
    </div>
  </div>
</template>

<script>
import RawData from "./RawData.vue";
import { getForm, saveTest, updateTest, downloadTestPDF } from "@/services/api";

export default {
  components: { RawData },
  props: {
    formId: { type: Number, default: null },
    pageManager: { type: Object, required: true },
    currentPage: { type: Number, required: true },
    totalPages: { type: Number, required: true },
    tableManager: { type: Object, default: null },
    initialData: { type: Object, default: null },
    testId: { type: String, default: null },
  },
  emits: ["update:currentPage", "set-table-manager"],
  computed: {
    editMode() {
      return !!this.testId;
    },
  },
  mounted() {
    if (this.initialData && this.initialData.totalPages) {
      this.$emit("update:totalPages", this.initialData.totalPages);
    }
  },
  methods: {
    prevPage() {
      const newPage = this.pageManager.prevPage();
      this.$emit("update:currentPage", newPage);
    },
    nextPage() {
      const newPage = this.pageManager.nextPage();
      this.$emit("update:currentPage", newPage);
    },
    async saveTestData() {
      try {
        let formData = this.initialData || (this.formId ? (await getForm(this.formId)).data : {});
        if (this.tableManager && this.tableManager.hot) {
          const tableData = this.tableManager.hot.getData();
          const settings = this.tableManager.settings;
          const checkboxCells = Object.fromEntries(this.tableManager.checkboxManager.checkboxCells);
          if (!formData.pages) formData.pages = [];
          while (formData.pages.length < this.totalPages) formData.pages.push({ table: [[]], settings: {} });
          formData.pages[this.currentPage] = {
            table: tableData,
            settings: settings || {},
            checkboxCells,
          };
          formData.totalPages = this.totalPages;
          formData.formName = formData.formName || "Untitled";
          formData.formCode = formData.formCode || "P702-2-05";
        }
        if (this.editMode) {
          if (!this.testId) throw new Error("testId가 없습니다.");
          const response = await updateTest(this.testId, formData);
          console.log("Response from updateTest:", response.data);
          console.log(`✅ 시험 데이터 수정 완료 (ID: ${this.testId}, Rev: ${response.data.revision})`);
          downloadTestPDF(this.testId, response.data.revision);
        } else {
          const saveResponse = await saveTest(formData);
          console.log("Response from saveTest:", saveResponse.data);
          console.log(`✅ 시험 데이터 저장 완료 (ID: ${saveResponse.data.test_id}, Rev: ${saveResponse.data.revision})`);
          downloadTestPDF(saveResponse.data.test_id, saveResponse.data.revision);
        }
      } catch (error) {
        console.error("시험 데이터 저장 실패:", error);
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
  padding-right: 320px; /* 컨트롤 패널 공간 확보 */
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
  overflow: auto;
  margin-top: 20px; /* manage-controls와 겹치지 않도록 상단 여백 추가 */
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