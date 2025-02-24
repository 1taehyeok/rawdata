<template>
  <div>
    <div ref="hotTable"></div>
  </div>
</template>

<script>
import "handsontable/dist/handsontable.full.css";
import { TableManager } from "@/utils/table/TableManager";
import { getRawData } from "@/services/api"; // 추가: getRawData import

export default {
  props: {
    pageIndex: {
      type: Number,
      required: true,
    },
  },
  data() {
    return {
      tableManager: null,
    };
  },
  async mounted() {
    await this.initializeTable();
  },
  watch: {
    pageIndex() {
      this.initializeTable(); // 페이지가 바뀌면 테이블 새로 초기화
    },
  },
  methods: {
    async initializeTable() {
      if (this.tableManager) {
        this.tableManager.hot.destroy(); // 기존 테이블 제거
      }
      const response = await getRawData();
      const pageData = response.data.pages[this.pageIndex] || { table: [[]], settings: {} };
      this.tableManager = new TableManager(this.$refs.hotTable, pageData, this.pageIndex);
      await this.tableManager.initialize();
    },
  },
};
</script>