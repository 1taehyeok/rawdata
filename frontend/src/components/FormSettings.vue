<!-- frontend/src/components/FormSettings.vue -->
<template>
  <div class="settings">
    <h2>양식 설정</h2>
    <label>
      양식 이름:
      <input v-model="formName" placeholder="양식 이름" />
    </label>
    <label>
      서식 번호:
      <input v-model="formCode" placeholder="서식 번호" />
    </label>
    <button @click="saveSettings">저장</button>
  </div>
</template>

<script>
import { getForm, updateFormName, getFormList } from "@/services/api";

export default {
  props: {
    formId: {
      type: Number,
      required: true,
    },
  },
  data() {
    return {
      formName: "",
      formCode: "",
    };
  },
  async mounted() {
    await this.loadSettings();
  },
  methods: {
    async loadSettings() {
      try {
        const formResponse = await getForm(this.formId);
        this.formName = formResponse.data.formName || "";  // form_<id>.json의 formName 사용
        this.formCode = formResponse.data.formCode || "P702-2-05";
      } catch (error) {
        console.error("설정 로드 실패:", error);
      }
    },
    async saveSettings() {
      try {
        await updateFormName(this.formId, {
          name: this.formName,
          formCode: this.formCode,
        });
        console.log("✅ 설정 저장 완료");
      } catch (error) {
        console.error("설정 저장 실패:", error);
      }
    },
  },
};
</script>

<style scoped>
.settings {
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 5px;
  margin-top: 10px;
  background: #f9f9f9;
}
label {
  display: block;
  margin: 10px 0;
}
input {
  padding: 5px;
  width: 200px;
}
button {
  padding: 8px 16px;
  margin-top: 10px;
  cursor: pointer;
}
</style>