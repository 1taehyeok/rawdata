<!-- frontend/src/components/RawData.vue -->
<template>
  <div class="hot-container">
    <div ref="hotTable"></div>
  </div>
</template>

<script>
import "handsontable/dist/handsontable.full.css";
import { TableManager } from "@/utils/table/TableManager";

export default {
  props: {
    pageIndex: { type: Number, required: true },
    tabIndex: { type: Number, required: true }, // 탭 인덱스 추가
    formId: { type: Number, default: null },
    mode: { type: String, default: "manage" },
    initialData: { type: Object, default: null },
    testId: { type: String, default: null },
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
    pageIndex(newIndex) {
      this.initializeTable(newIndex, this.tabIndex);
    },
    tabIndex(newIndex) {
      this.initializeTable(this.pageIndex, newIndex);
    },
    mode() {
      this.initializeTable();
    },
  },
  methods: {
    async initializeTable(pageIndex = this.pageIndex, tabIndex = this.tabIndex) {
      if (this.tableManager && this.tableManager.hot) {
        this.tableManager.hot.destroy();
      }
      this.tableManager = new TableManager(
        this.$refs.hotTable,
        pageIndex,
        this.mode,
        this.formId,
        this.initialData,
        this.testId,
        tabIndex // 탭 인덱스 전달 (아직 사용하지 않음)
      );
      await this.tableManager.initialize();
      this.$emit("set-table-manager", this.tableManager);
    },
  },
};
</script>

<style scoped>
.hot-container {
  width: 900px;
  height: 100%;
  overflow: auto;
  min-height: 800px;
}
</style>