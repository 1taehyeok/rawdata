<!-- frontend/src/components/FormList.vue -->
<template>
  <div class="form-list">
    <h1>양식 목록</h1>
    <input v-model="searchQuery" placeholder="양식 검색..." class="search-input" />
    <div class="form-list-container">
      <ul>
        <li v-for="form in filteredForms" :key="form.id" class="form-item card" @click="toggleModeOptions(form.id)">
          <div class="form-info">
            <span class="form-name">{{ form.name }}</span>
            <span class="form-date">{{ form.updatedAt ? new Date(form.updatedAt).toLocaleDateString() : '날짜 없음' }}</span>
            <div class="actions">
              <button class="small-btn" @click.stop="copyForm(form.id)" title="양식 복사">📋</button>
              <button class="small-btn danger" @click.stop="deleteForm(form.id)" title="양식 삭제">🗑️</button>
            </div>
          </div>
          <transition name="slide">
            <div v-if="selectedForm === form.id" class="mode-options">
              <button @click.stop="selectMode('manage', form.id)" class="mode-btn">🛠️ 양식 관리</button>
              <button @click.stop="selectMode('test', form.id)" class="mode-btn">✅ 시험하기</button>
            </div>
          </transition>
        </li>
      </ul>
    </div>
    <div class="button-group">
      <button @click="createNewForm">➕ 새 양식 생성</button>
      <button @click="triggerFileUpload">📝 데이터 수정하기</button>
      <input type="file" ref="fileInput" @change="uploadPdf" accept=".pdf" style="display: none;" />
    </div>
  </div>
</template>

<script>
import { getFormList, createForm, deleteForm, copyForm } from "@/services/api";

export default {
  data() {
    return {
      forms: [],
      searchQuery: "",
      selectedForm: null,
    };
  },
  computed: {
    filteredForms() {
      return this.forms.filter(form =>
        form.name.toLowerCase().includes(this.searchQuery.toLowerCase())
      );
    },
  },
  async mounted() {
    await this.loadForms();
  },
  methods: {
    async loadForms() {
      try {
        const response = await getFormList();
        this.forms = response.data.forms || [];
      } catch (error) {
        console.error("양식 목록 로드 실패:", error);
      }
    },
    async createNewForm() {
      try {
        const response = await createForm({ name: `form_${this.forms.length + 1}` });
        this.forms.push({
          id: response.data.id,
          name: `form_${response.data.id}`,
          file: `forms/form_${response.data.id}.json`,
          createdAt: new Date().toISOString(),
          description: "",
        });
      } catch (error) {
        console.error("새 양식 생성 실패:", error);
      }
    },
    async deleteForm(formId) {
      if (confirm("정말 이 양식을 삭제하시겠습니까?")) {
        try {
          await deleteForm(formId);
          this.forms = this.forms.filter(form => form.id !== formId);
          if (this.selectedForm === formId) this.selectedForm = null;
          console.log("✅ 양식 삭제 완료");
        } catch (error) {
          console.error("양식 삭제 실패:", error);
        }
      }
    },
    async copyForm(formId) {
      try {
        const response = await copyForm(formId);
        const originalForm = this.forms.find(f => f.id === formId);
        this.forms.push({
          id: response.data.id,
          name: `${originalForm.name} (복사본)`,
          file: `forms/form_${response.data.id}.json`,
          createdAt: new Date().toISOString(),
          description: originalForm.description || "",
        });
        console.log("✅ 양식 복사 완료");
      } catch (error) {
        console.error("양식 복사 실패:", error);
      }
    },
    toggleModeOptions(formId) {
      this.selectedForm = this.selectedForm === formId ? null : formId;
    },
    selectMode(mode, formId) {
      this.$emit("select-form", formId);
      this.$emit("set-mode", mode);
      this.selectedForm = null;
    },
    triggerFileUpload() {
      this.$refs.fileInput.click();
    },
    async uploadPdf(event) {
      const file = event.target.files[0];
      if (!file) return;

      const formData = new FormData();
      formData.append("file", file);

      try {
        const response = await this.$axios.post("http://localhost:8000/pdf/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        console.log("✅ PDF 업로드 성공, 반환 데이터:", response.data);
        if (!response.data.data.pages) {
          console.warn("⚠️ 반환된 data에 pages가 없음:", response.data.data);
        }
        this.$emit("edit-test", response.data.test_id, response.data.data);
      } catch (error) {
        console.error("❌ PDF 업로드 실패:", error.response?.data || error.message);
      }
    },
  },
};
</script>

<style scoped>
.form-list {
  padding: 20px;
  display: flex;
  flex-direction: column;
  height: 100%; /* 부모 높이에 맞춤 */
  width: 100%; /* 추가: 폭을 부모에 맞춤 */
  max-width: 1200px; /* 추가: 최대 폭 제한 */
  margin: 0 auto; /* 추가: 가운데 정렬 */
}

h1 {
  font-size: var(--font-size-h1);
  font-weight: 500;
  margin-bottom: 15px;
}

.search-input {
  width: 100%;
  padding: 12px;
  border: 1px solid var(--border);
  border-radius: 6px;
  margin-bottom: 20px;
  font-size: var(--font-size-base);
  box-shadow: inset 0 1px 2px var(--shadow);
}

.form-list-container {
  flex: 1; /* 남은 공간을 채움 */
  overflow-y: auto; /* 세로 스크롤 활성화 */
  max-height: 60vh; /* 고정된 최대 높이 설정 */
  margin-bottom: 20px;
}

.form-item {
  padding: 15px;
  margin: 10px 0;
  border-radius: 8px;
  cursor: pointer;
}

.form-info {
  display: flex;
  align-items: center; /* 수평 정렬 */
  gap: 15px; /* 요소 간 간격 */
}

.form-name {
  font-size: var(--font-size-base);
  font-weight: 500;
  flex: 1; /* 이름이 남은 공간을 차지하도록 */
}

.form-date {
  font-size: var(--font-size-small);
  color: var(--text-secondary);
}

.actions {
  display: flex;
  gap: 10px;
}

.small-btn {
  padding: 5px;
  background: none;
  color: var(--text-secondary);
  font-size: var(--font-size-small);
}

.small-btn.danger {
  color: var(--danger);
}

.button-group {
  display: flex;
  gap: 10px;
}

.button-group button {
  flex: 1;
  padding: 12px;
  font-size: var(--font-size-base);
}

.button-group button:nth-child(2) {
  background: var(--secondary);
}

.mode-options {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 15px;
  width: 100%;
}

.mode-btn {
  padding: 10px;
  border: none;
  border-radius: 4px;
  font-size: var(--font-size-base);
  cursor: pointer;
  transition: all 0.3s ease;
  width: 100%;
}

.mode-btn:nth-child(1) {
  background: var(--primary);
  color: white;
}

.mode-btn:nth-child(2) {
  background: var(--success);
  color: white;
}

/* 슬라이드 애니메이션 */
.slide-enter-active,
.slide-leave-active {
  transition: max-height 0.3s ease, opacity 0.2s ease;
}

.slide-enter-from,
.slide-leave-to {
  max-height: 0;
  opacity: 0;
}

.slide-enter-to,
.slide-leave-from {
  max-height: 100px;
  opacity: 1;
}

/* 반응형 디자인 */
@media (max-width: 600px) {
  .form-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 5px;
  }

  .actions {
    margin-top: 5px;
  }

  .button-group {
    flex-direction: column;
  }

  .button-group button {
    width: 100%;
  }
}
</style>