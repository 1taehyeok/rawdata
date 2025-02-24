<template>
  <div id="app">
    <h1 class="title">Rawdata 관리 시스템</h1>
    <div class="content">
      <div class="page-controls">
        <button @click="prevPage" :disabled="currentPage === 0">◀ 이전</button>
        <span>Page {{ currentPage + 1 }} / {{ pages.length }}</span>
        <button @click="nextPage" :disabled="currentPage === pages.length - 1">다음 ▶</button>
        <button @click="addPage">➕ 페이지 추가</button>
        <button @click="removePage" :disabled="pages.length <= 1">➖ 페이지 삭제</button>
      </div>
      <button class="pdf-button" @click="downloadPDF">📄 PDF 다운로드</button>
      <div class="table-container">
        <RawData :page-index="currentPage" :key="currentPage" />
      </div>
    </div>
  </div>
</template>

<script>
import RawData from "./components/RawData.vue";
import { getRawData, saveRawData, downloadPDF } from "@/services/api"; // saveRawData 추가

export default {
  components: { RawData },
  data() {
    return {
      pages: [{ table: [], settings: {} }],
      currentPage: 0,
    };
  },
  async mounted() {
    await this.loadData();
  },
  methods: {
    async loadData() {
      try {
        const response = await getRawData();
        this.pages = response.data.pages || [{ table: [], settings: {} }];
      } catch (error) {
        console.error("데이터 로드 실패:", error);
      }
    },
    prevPage() {
      if (this.currentPage > 0) this.currentPage--;
    },
    nextPage() {
      if (this.currentPage < this.pages.length - 1) this.currentPage++;
    },
    async addPage() {
      this.pages.push({ table: [[]], settings: {} });
      this.currentPage = this.pages.length - 1;
      await this.saveData(); // 추가 후 저장
    },
    async removePage() {
      if (this.pages.length > 1) {
        this.pages.splice(this.currentPage, 1);
        this.currentPage = Math.min(this.currentPage, this.pages.length - 1);
        await this.saveData(); // 삭제 후 저장
      }
    },
    async saveData() {
      try {
        await saveRawData({ pages: this.pages });
        console.log("✅ 페이지 데이터 저장 완료");
      } catch (error) {
        console.error("❌ 페이지 데이터 저장 실패:", error);
      }
    },
    downloadPDF() {
      downloadPDF();
    },
  },
};
</script>

<style scoped>
/* 기존 스타일 유지 */
</style>

<style scoped>
#app {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  height: 100vh;
}
.title {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 10px;
}
.content {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 900px;
}
.page-controls {
  margin-bottom: 10px;
  display: flex;
  gap: 10px;
  align-items: center;
}
.page-controls button {
  padding: 5px 10px;
  font-size: 14px;
  cursor: pointer;
}
.page-controls button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.pdf-button {
  margin-bottom: 10px;
  padding: 8px 12px;
  font-size: 16px;
  cursor: pointer;
}
.table-container {
  width: 794px;
  height: 1123px;
  overflow: auto;
  border: 2px solid #ddd;
  padding: 20px 10px;
  background: white;
  box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1);
}
</style>