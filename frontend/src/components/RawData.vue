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
      this.initializeTable(newIndex);
    },
    mode() {
      this.initializeTable();
    },
  },
  methods: {
    async initializeTable(pageIndex = this.pageIndex) {
      if (this.tableManager && this.tableManager.hot) {
        this.tableManager.hot.destroy();
      }
      this.tableManager = new TableManager(this.$refs.hotTable, pageIndex, this.mode, this.formId, this.initialData, this.testId);
      await this.tableManager.initialize();
      this.$emit("set-table-manager", this.tableManager);
    },
  },
};
</script>

<style scoped>
.hot-container {
  width: 100%;
  height: 100%;
  overflow: auto;
  min-height: 800px;
}
</style>