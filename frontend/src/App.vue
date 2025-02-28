<!-- frontend/src/App.vue -->
<template>
  <div id="app">
    <FormList v-if="!selectedForm && !editMode" @select-form="onFormSelected" @edit-test="onEditTest" />
    <div v-else-if="!mode && !editMode">
      <ModeSelector @select-mode="onModeSelected" />
    </div>
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
  </div>
</template>

<script>
import { ref } from "vue";
import FormList from "./components/FormList.vue";
import ModeSelector from "./components/ModeSelector.vue";
import ManageMode from "./components/ManageMode.vue";
import TestMode from "./components/TestMode.vue";
import { PageManager } from "@/utils/PageManager";

const currentPage = ref(0);
const totalPages = ref(1);

export default {
  components: { FormList, ModeSelector, ManageMode, TestMode },
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
    },
  },
};
</script>

<style scoped>
#app {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  
}
.content-wrapper {
  width: 100%;
  height: 100%;
  position: relative;
}
</style>