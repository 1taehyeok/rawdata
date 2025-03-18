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
      <button @click="showAddAttachmentModal">📎 별첨 추가하기</button>
    </div>
    <div class="table-container">
      <RawData
        :form-id="formId"
        :page-index="currentPage"
        :tab-index="0"
        mode="test"
        :initial-data="initialData"
        :test-id="testId"
        @set-table-manager="setTableManager"
      />
    </div>
    <div v-if="showModal" class="modal">
      <div class="modal-content">
        <h3>별첨 추가하기</h3>
        <div v-for="(tab, index) in availableTabs" :key="index" class="tab-option">
          <input
            type="checkbox"
            :id="'tab-' + index"
            v-model="selectedTabs"
            :value="index"
          />
          <label :for="'tab-' + index">{{ tab.name }} (페이지 수: {{ tab.pages.length }})</label>
        </div>
        <div class="modal-buttons">
          <button @click="addAttachments">추가</button>
          <button @click="showModal = false">취소</button>
        </div>
      </div>
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
  emits: ["update:currentPage", "update:totalPages", "set-table-manager", "reset-to-form-list"],
  data() {
    return {
      showModal: false,
      availableTabs: [],
      selectedTabs: [],
      effectiveFormId: null, // 실제 사용할 formId
    };
  },
  computed: {
    editMode() {
      return !!this.testId;
    },
  },
  async mounted() {
    await this.initializeTestData();
  },
  methods: {
    async initializeTestData() {
      if (this.editMode && this.initialData) {
        this.effectiveFormId = this.initialData.formId || this.formId; // initialData에서 formId 가져오기
        this.pageManager.tabIndex = 0;
        const totalPages = this.initialData.totalPages || this.initialData.tabs?.[0]?.pages?.length || 1;
        this.$emit("update:totalPages", totalPages);
        sessionStorage.setItem("tempTestId", this.testId);
        sessionStorage.setItem("tempTestData", JSON.stringify({ ...this.initialData, formId: this.effectiveFormId }));
        console.log("✅ Initialized edit mode tempData:", { totalPages, formId: this.effectiveFormId });
      } else if (this.formId) {
        let tempData = JSON.parse(sessionStorage.getItem("tempTestData") || "{}");
        if (!tempData.tabs) {
          const response = await getForm(this.formId);
          const formData = response.data;
          const firstTabPages = formData.tabs[0]?.pages || [{ table: [[]], settings: {} }];
          tempData = {
            formId: this.formId, // formId 저장
            formName: formData.formName || "Untitled",
            formCode: formData.formCode || "P702-2-05",
            totalPages: firstTabPages.length,
            tabs: [
              {
                name: "일반 페이지",
                pages: firstTabPages.map(page => ({ ...page })),
              },
            ],
          };
          sessionStorage.setItem("tempTestData", JSON.stringify(tempData));
          this.pageManager.tabIndex = 0;
          this.pageManager.totalPages = tempData.totalPages;
          this.$emit("update:totalPages", tempData.totalPages);
          this.effectiveFormId = this.formId;
          console.log("✅ Initialized new tempData:", { totalPages: tempData.totalPages, formId: this.formId });
        } else {
          this.effectiveFormId = tempData.formId || this.formId; // 세션에서 formId 복원
          this.pageManager.tabIndex = 0;
          this.pageManager.totalPages = tempData.totalPages || tempData.tabs[0]?.pages?.length || 1;
          this.$emit("update:totalPages", this.pageManager.totalPages);
          console.log("✅ Loaded existing tempData:", { totalPages: this.pageManager.totalPages, formId: this.effectiveFormId });
        }
      }
    },
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
        let formData = JSON.parse(sessionStorage.getItem("tempTestData") || "{}");
        if (!formData.tabs) {
          if (this.initialData) {
            formData = { ...this.initialData, formId: this.effectiveFormId };
          } else if (this.formId) {
            const response = await getForm(this.formId);
            const originalData = response.data;
            formData = {
              formId: this.formId,
              formName: originalData.formName || "Untitled",
              formCode: originalData.formCode || "P702-2-05",
              totalPages: originalData.tabs[0]?.pages?.length || 1,
              tabs: [
                {
                  name: "일반 페이지",
                  pages: (originalData.tabs[0]?.pages || [{ table: [[]], settings: {} }]).map(page => ({ ...page })),
                },
              ],
            };
          }
        }

        if (this.tableManager && this.tableManager.hot) {
          const tableData = this.tableManager.hot.getData();
          const settings = this.tableManager.settings || {
            mergeCells: [],
            colWidths: [],
            rowHeights: [],
            cellAlignments: {},
            editableCells: {},
            customBorders: [],
          };
          const checkboxCells = Object.fromEntries(this.tableManager.checkboxManager.checkboxCells);
          while (formData.tabs[0].pages.length <= this.currentPage) {
            formData.tabs[0].pages.push({ table: [[]], settings: {} });
          }
          formData.tabs[0].pages[this.currentPage] = {
            table: tableData,
            settings,
            checkboxCells,
          };
          formData.totalPages = formData.tabs[0].pages.length;
        }

        const confirmSave = confirm("PDF로 변환하고 데이터를 저장하시겠습니까?");
        if (!confirmSave) {
          console.log("✅ 사용자가 저장을 취소함. 시험 모드 유지");
          return;
        }

        let saveResponse;
        const tempTestId = sessionStorage.getItem("tempTestId") || this.testId;

        if (this.editMode && this.testId) {
          saveResponse = await saveTest(formData, tempTestId);
          const revisionResponse = await updateTest(saveResponse.data.test_id, formData);
          saveResponse = revisionResponse;
        } else {
          saveResponse = await saveTest(formData, tempTestId);
        }

        await downloadTestPDF(saveResponse.data.test_id, saveResponse.data.revision);
        sessionStorage.removeItem("tempTestData");
        sessionStorage.removeItem("tempTestId");
        this.$emit("reset-to-form-list");
      } catch (error) {
        console.error("시험 데이터 저장 실패:", error.response ? error.response.data : error.message);
        alert("PDF 변환 또는 데이터 저장 중 오류가 발생했습니다: " + (error.response?.data || error.message));
      }
    },
    setTableManager(manager) {
      this.$emit("set-table-manager", manager);
    },
    async showAddAttachmentModal() {
      if (!this.effectiveFormId) {
        console.error("❌ formId가 지정되지 않음");
        alert("원본 양식 ID를 찾을 수 없습니다. 수정 모드에서는 별첨 추가가 제한될 수 있습니다.");
        return;
      }
      const response = await getForm(this.effectiveFormId);
      const formData = response.data;
      this.availableTabs = formData.tabs.filter((tab, index) => index !== 0);
      this.selectedTabs = [];
      this.showModal = true;
      console.log("✅ Available tabs for attachment:", this.availableTabs);
    },
    async addAttachments() {
      if (this.selectedTabs.length === 0) {
        alert("추가할 별첨을 선택하세요.");
        return;
      }

      let tempData = JSON.parse(sessionStorage.getItem("tempTestData") || "{}");
      if (!tempData.tabs) {
        await this.initializeTestData();
        tempData = JSON.parse(sessionStorage.getItem("tempTestData"));
      }

      const formData = (await getForm(this.effectiveFormId)).data;
      const newPages = [];
      this.selectedTabs.forEach(tabIndex => {
        const originalTabIndex = tabIndex + 1;
        const pages = formData.tabs[originalTabIndex].pages.map(page => ({ ...page }));
        newPages.push(...pages);
      });

      console.log("✅ Before adding pages:", { totalPages: tempData.totalPages, pagesLength: tempData.tabs[0].pages.length });
      tempData.tabs[0].pages.push(...newPages);
      tempData.totalPages = tempData.tabs[0].pages.length;
      console.log("✅ After adding pages:", { totalPages: tempData.totalPages, pagesLength: tempData.tabs[0].pages.length });

      sessionStorage.setItem("tempTestData", JSON.stringify(tempData));
      this.pageManager.totalPages = tempData.totalPages;
      this.$emit("update:totalPages", tempData.totalPages);
      this.showModal = false;
      console.log(`✅ 별첨 추가 완료: 총 ${newPages.length} 페이지 추가됨, 새로운 totalPages: ${tempData.totalPages}`);
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
  position: fixed;
  top: 20px;
  right: 20px;
  width: 300px;
  padding: 10px;
  background: #f9f9f9;
  border-radius: 0 0 5px 5px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  z-index: 1000;
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
  margin-top: 20px;
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
  margin: 5px 0;
}

/* 모달 스타일 */
.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
}

.modal-content {
  background: white;
  padding: 20px;
  border-radius: 5px;
  width: 400px;
  max-height: 80vh;
  overflow-y: auto;
}

.tab-option {
  margin: 10px 0;
}

.modal-buttons {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>