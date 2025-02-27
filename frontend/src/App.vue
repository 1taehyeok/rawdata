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
      this.pageManager = new PageManager(null, data); // initialData 전달
      totalPages.value = data.totalPages || 1;
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