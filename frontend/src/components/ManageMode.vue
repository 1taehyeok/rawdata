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
      <div class="tab-controls">
        <div class="tabs" @dragover.prevent @drop="onDrop">
          <div
            v-for="(tab, index) in tabs"
            :key="index"
            :class="{ 'tab-item': true, active: currentTab === index, dragging: draggedIndex === index }"
            :draggable="true"
            @dragstart="onDragStart(index)"
            @dragend="onDragEnd"
            @dragenter="onDragEnter(index)"
            @click="switchTab(index)"
          >
            <span>{{ tab.name }}</span>
            <button
              v-if="tabs.length > 1"
              class="close-btn"
              @click.stop="removeTab(index)"
            >
              ×
            </button>
          </div>
          <button class="add-tab-btn" @click="addTab">➕</button>
        </div>
      </div>
      <RawData
        :form-id="formId"
        :page-index="currentPage"
        :tab-index="currentTab"
        mode="manage"
        @set-table-manager="setTableManager"
      />
    </div>
  </div>
</template>

<script>
import FormSettings from "./FormSettings.vue";
import RawData from "./RawData.vue";
import { downloadFormPDF, movePage, copyPage, getForm, saveForm } from "@/services/api";
import { PageManager } from "@/utils/PageManager";

export default {
  components: { FormSettings, RawData },
  props: {
    formId: { type: Number, required: true },
    pageManager: { type: Object, required: true }, // 부모에서 전달된 pageManager 사용
    currentPage: { type: Number, required: true },
    totalPages: { type: Number, required: true },
  },
  emits: ["update:currentPage", "update:totalPages", "set-table-manager"],
  data() {
    return {
      currentTab: 0,
      tabs: [],
      draggedIndex: null,
      dragOverIndex: null,
    };
  },
  async created() {
    const response = await getForm(this.formId);
    this.tabs = response.data.tabs || [{ name: "일반 페이지", pages: [{}] }];
    this.pageManager.tabIndex = this.currentTab; // tabIndex 초기화
    await this.pageManager.loadFormData();
    this.$emit("update:totalPages", this.pageManager.totalPages);
  },
  watch: {
    async currentTab(newTab) {
      this.pageManager.tabIndex = newTab;
      const { totalPages } = await this.pageManager.loadFormData();
      this.$emit("update:totalPages", totalPages);
      this.$emit("update:currentPage", 0); // 탭 전환 시 페이지 초기화
    },
  },
  methods: {
    switchTab(index) {
      this.currentTab = index;
    },
    async addTab() {
      const tabName = prompt("새 탭 이름을 입력하세요:");
      if (tabName) {
        const response = await getForm(this.formId);
        const formData = response.data;
        formData.tabs.push({ name: tabName, pages: [{ table: [[]], settings: {} }] });
        await saveForm(this.formId, formData);
        this.tabs = formData.tabs;
        this.switchTab(this.tabs.length - 1);
      }
    },
    async removeTab(index) {
      if (this.tabs.length <= 1) return;
      if (confirm(`탭 "${this.tabs[index].name}"을 삭제하시겠습니까?`)) {
        const response = await getForm(this.formId);
        const formData = response.data;
        formData.tabs.splice(index, 1);
        await saveForm(this.formId, formData);
        this.tabs = formData.tabs;
        this.currentTab = Math.min(this.currentTab, this.tabs.length - 1);
        this.$emit("update:currentPage", 0);
        const { totalPages } = await this.pageManager.loadFormData();
        this.$emit("update:totalPages", totalPages);
      }
    },
    async onDrop(event) {
      event.preventDefault();
      const dropIndex = this.dragOverIndex;
      if (this.draggedIndex !== null && dropIndex !== null && this.draggedIndex !== dropIndex) {
        const response = await getForm(this.formId);
        const formData = response.data;
        const [tab] = formData.tabs.splice(this.draggedIndex, 1);
        formData.tabs.splice(dropIndex, 0, tab);
        await saveForm(this.formId, formData);
        this.tabs = formData.tabs;
        this.currentTab = dropIndex;
      }
      this.dragOverIndex = null;
    },
    onDragStart(index) {
      this.draggedIndex = index;
    },
    onDragEnd() {
      this.draggedIndex = null;
      this.dragOverIndex = null;
    },
    onDragEnter(index) {
      this.dragOverIndex = index;
    },
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
      if (!confirm(`정말로 페이지 ${this.currentPage + 1}을 삭제하시겠습니까?`)) return;
      try {
        const { currentPage, totalPages } = await this.pageManager.removePage();
        this.$emit("update:currentPage", currentPage);
        this.$emit("update:totalPages", totalPages);
      } catch (error) {
        console.error("페이지 삭제 실패:", error);
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
            this.pageManager.currentPage = targetIndex;
            this.$emit("update:currentPage", targetIndex);
            const { totalPages } = await this.pageManager.loadFormData();
            this.$emit("update:totalPages", totalPages);
          } catch (error) {
            console.error("페이지 이동 실패:", error);
          }
        }
      }
    },
    async copyPagePrompt() {
      try {
        await copyPage(this.formId, this.currentPage);
        const { totalPages } = await this.pageManager.loadFormData();
        this.$emit("update:totalPages", totalPages);
      } catch (error) {
        console.error("페이지 복사 실패:", error);
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
  margin-top: 20px;
}

/* 탭 스타일 (드래그 시각적 피드백 포함) */
.tab-controls {
  width: 100%;
  background: #f1f3f5;
  padding: 5px 10px;
  border-bottom: 1px solid #ced4da;
}
.tabs {
  display: flex;
  align-items: center;
  gap: 5px;
}
.tab-item {
  display: flex;
  align-items: center;
  padding: 5px 15px;
  background: #e9ecef;
  border: 1px solid #ced4da;
  border-radius: 5px 5px 0 0;
  cursor: move;
  user-select: none;
  transition: all 0.2s ease; /* 부드러운 전환 효과 */
}
.tab-item.active {
  background: #fff;
  border-bottom: none;
  position: relative;
  top: 1px;
}
.tab-item:hover {
  background: #dee2e6;
}
.tab-item.dragging {
  opacity: 0.5; /* 드래그 중 반투명 */
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2); /* 드래그 중 그림자 */
  transform: scale(1.05); /* 약간 확대 */
}
.tab-item span {
  margin-right: 5px;
}
.close-btn {
  background: none;
  border: none;
  color: #dc3545;
  font-size: 16px;
  cursor: pointer;
  padding: 0 5px;
}
.close-btn:hover {
  color: #a71d2a;
}
.add-tab-btn {
  padding: 5px 10px;
  background: #28a745;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
.add-tab-btn:hover {
  background: #218838;
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