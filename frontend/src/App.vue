<!-- frontend/src/App.vue -->
<template>
  <div id="app">
    <header class="app-header">
      <div class="header-left">
        <h1>Raw Data Automation</h1>
      </div>
      <div class="header-right">
        <button v-if="selectedForm || mode || editMode" @click="resetToFormList" class="small-btn">
          ← 양식 목록으로
        </button>
      </div>
    </header>
    <main class="container">
      <FormList v-if="!mode && !editMode" @select-form="onFormSelected" @edit-test="onEditTest" @set-mode="onModeSelected" />
      <div v-else class="content-wrapper">
        <ManageMode
          v-if="mode === 'manage' && !editMode"
          :form-id="selectedForm"
          :page-manager="pageManager"
          v-model:current-page="currentPage"
          v-model:total-pages="totalPages"
          @set-table-manager="setTableManager"
        />
        <TestMode
          v-if="mode === 'test' || editMode"
          :form-id="editMode ? null : selectedForm"
          :page-manager="pageManager"
          v-model:current-page="currentPage"
          :total-pages="totalPages"
          :table-manager="tableManager"
          :initial-data="editData"
          :test-id="editTestId"
          @set-table-manager="setTableManager"
          @reset-to-form-list="resetToFormList"
        />
      </div>
    </main>
  </div>
</template>

<script>
import { ref } from "vue";
import FormList from "./components/FormList.vue";
import ManageMode from "./components/ManageMode.vue";
import TestMode from "./components/TestMode.vue";
import { PageManager } from "@/utils/PageManager";

const currentPage = ref(0);
const totalPages = ref(1);

export default {
  components: { FormList, ManageMode, TestMode },
  data() {
    return {
      selectedForm: null,
      mode: null,
      pageManager: null,
      tableManager: null,
      editMode: false,
      editData: null,
      editTestId: null,
    };
  },
  setup() {
    return { currentPage, totalPages };
  },
  mounted() {
    this.checkSessionForTestMode();
  },
  methods: {
    onFormSelected(formId) {
      this.selectedForm = formId;
      this.pageManager = new PageManager(formId);
      this.loadFormData();
    },
    onModeSelected(mode) {
      this.mode = mode;
    },
    async loadFormData() {
      try {
        const { currentPage: newCurrentPage, totalPages: newTotalPages } = await this.pageManager.loadFormData();
        currentPage.value = newCurrentPage;
        totalPages.value = newTotalPages;
      } catch (error) {
        console.error("Failed to load form data:", error);
      }
    },
    setTableManager(manager) {
      this.tableManager = manager;
    },
    onEditTest(testId, data) {
      this.editMode = true;
      this.editData = data;
      this.editTestId = testId;
      this.mode = "test";
      this.pageManager = new PageManager(null, data);
      totalPages.value = data.totalPages || 1;
    },
    resetToFormList() {
      this.selectedForm = null;
      this.mode = null;
      this.editMode = false;
      this.editData = null;
      this.editTestId = null;
      currentPage.value = 0;
      this.pageManager = null;
      sessionStorage.removeItem("tempTestId"); // 추가
      sessionStorage.removeItem("tempTestData"); // 추가
      console.log("✅ 양식 리스트로 이동");
    },
    checkSessionForTestMode() {
      const tempTestId = sessionStorage.getItem("tempTestId");
      const tempTestData = sessionStorage.getItem("tempTestData");
      if (tempTestId && tempTestData) {
        const proceed = confirm("이전에 진행 중이던 시험 데이터가 있습니다. 시험하기 모드로 이동하시겠습니까?\n(확인: 이동, 취소: 데이터 삭제 후 양식 리스트로)");
        if (proceed) {
          this.editMode = true;
          this.editData = JSON.parse(tempTestData);
          this.editTestId = tempTestId;
          this.mode = "test";
          this.pageManager = new PageManager(null, this.editData);
          totalPages.value = this.editData.totalPages || 1;
          console.log("✅ 시험하기 모드로 이동");
        } else {
          sessionStorage.removeItem("tempTestId");
          sessionStorage.removeItem("tempTestData");
          console.log("✅ 세션 데이터 삭제 후 양식 리스트 유지");
        }
      }
      else if(tempTestData){
          sessionStorage.removeItem("tempTestId");
          sessionStorage.removeItem("tempTestData");
      }
    },
  },
};
</script>

<style scoped>
#app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.app-header {
  background: var(--surface);
  padding: 15px 20px;
  box-shadow: 0 2px 4px var(--shadow);
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: sticky;
  top: 0;
  z-index: 1000;
}

.header-left h1 {
  margin: 0;
  font-weight: 500;
}

.header-right .small-btn {
  padding: 5px 10px;
  font-size: var(--font-size-small);
  background: var(--secondary);
  color: white;
}

main.container {
  flex: 1;
  padding: 20px;
  width: 100%;
  box-sizing: border-box;
}

.content-wrapper {
  width: 100%;
  min-height: 0;
  overflow: visible;
  position: static;
  transition: opacity 0.2s ease; /* 전환 애니메이션 추가 */
}
</style>