<!-- frontend/src/components/FormList.vue -->
<template>
  <div class="form-list">
    <h1>양식 목록</h1>
    <ul>
      <li v-for="form in forms" :key="form.id" class="form-item">
        <span @click="selectForm(form.id)">{{ form.name }}</span>
        <button class="small-btn" @click="copyForm(form.id)">📋</button>
        <button class="small-btn" @click="deleteForm(form.id)">🗑️</button>
      </li>
    </ul>
    <button @click="createNewForm">➕ 새 양식 생성</button>
    <div class="edit-data">
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
    };
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
    selectForm(formId) {
      this.$emit("select-form", formId);
    },triggerFileUpload() {
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
        console.log("✅ PDF 업로드 성공, 반환 데이터:", response.data); // 데이터 구조 확인
        this.$emit("edit-test", response.data.test_id, response.data.data); // 이벤트 발생
      } catch (error) {
        console.error("❌ PDF 업로드 실패:", error.response?.data || error.message);
      }
    },
  },
};
</script>

<style scoped>
.form-list {
  text-align: center;
  padding: 20px;
}
ul {
  list-style: none;
  padding: 0;
}
.form-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px;
  margin: 5px 0;
  background: #f0f0f0;
  border-radius: 5px;
  min-width: 400px;
}
.form-item span {
  cursor: pointer;
  flex-grow: 1;
  text-align: left;
}
.form-item:hover {
  background: #e0e0e0;
}
button {
  padding: 8px 16px;
  font-size: 16px;
  margin-top: 10px;
  cursor: pointer;
}
.small-btn {
  padding: 5px;
  margin-left: 10px;
  font-size: 14px;
  background: none;
  border: none;
  cursor: pointer;
}
.edit-data {
  margin-top: 20px;
}
</style>