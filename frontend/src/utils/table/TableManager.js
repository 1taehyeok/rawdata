import Handsontable from "handsontable";
import { debounce } from "lodash";
import { getRawData, saveRawData } from "@/services/api";
import { CheckboxManager } from "./CheckboxManager";
import { MergeManager } from "./MergeManager";
import { ResizeManager } from "./ResizeManager";
import { ContextMenuManager } from "./ContextMenuManager";

export class TableManager {
  constructor(container, initialData = {}, pageIndex = 0) {
    this.hot = null;
    this.container = container;
    this.pageIndex = pageIndex; // 페이지 인덱스
    this.tableData = initialData.table || [[]];
    this.settings = initialData.settings || {};
    this.checkboxManager = new CheckboxManager(this);
    this.mergeManager = new MergeManager(this);
    this.resizeManager = new ResizeManager(this);
    this.contextMenuManager = new ContextMenuManager(this);
  }

  async initialize() {
    try {
      const response = await getRawData();
      const pageData = response.data.pages[this.pageIndex] || { table: [[]], settings: {} };
      this.tableData = pageData.table || [[]];
      this.settings = pageData.settings || {};
      this.checkboxManager.checkboxCells = new Map(Object.entries(pageData.checkboxCells || {}));

      // Handsontable 초기화
      this.hot = new Handsontable(this.container, {
        data: this.tableData,
        rowHeaders: true,
        colHeaders: true,
        minSpareRows: 0,
        contextMenu: this.contextMenuManager.getConfig(),
        mergeCells: this.settings.mergeCells || [],
        manualColumnResize: true,
        manualRowResize: true,
        colWidths: this.settings.colWidths || [],
        rowHeights: this.settings.rowHeights || [],
        licenseKey: "non-commercial-and-evaluation",
        afterViewRender: this.saveTable.bind(this), // 변경 시 저장
        afterRowResize: this.resizeManager.handleRowResize.bind(this.resizeManager),
        beforeCreateRow: this.resizeManager.preventRowAddition.bind(this.resizeManager),
        cells: this.checkboxManager.getCellMeta.bind(this.checkboxManager),
      });

      this.restoreCellAlignments();
      console.log(`✅ 페이지 ${this.pageIndex + 1} 테이블 초기화 완료`);
    } catch (error) {
      console.error(`❌ 페이지 ${this.pageIndex + 1} 데이터 불러오기 실패:`, error);
    }
  }

  restoreCellAlignments() {
    if (this.settings.cellAlignments) {
      for (const [key, value] of Object.entries(this.settings.cellAlignments)) {
        const [row, col] = key.split("_").map(Number);
        this.hot.setCellMeta(row, col, "className", value.horizontalAlign);
        this.hot.setCellMeta(row, col, "verticalAlign", value.verticalAlign);
      }
    }
  }

  saveTable = debounce(async () => {
    if (!this.hot) return;

    const tableData = this.hot.getData();
    const settings = {
      mergeCells: this.hot.getPlugin("MergeCells").mergedCellsCollection.mergedCells,
      colWidths: this.hot.getColHeader().map((_, colIndex) => this.hot.getColWidth(colIndex)),
      rowHeights: this.hot.getData().map((_, rowIndex) => this.hot.getRowHeight(rowIndex)),
      cellAlignments: Object.fromEntries(
        [...Array(tableData.length)].flatMap((_, row) =>
          [...Array(tableData[row].length)].map((_, col) => {
            const meta = this.hot.getCellMeta(row, col);
            return [`${row}_${col}`, { horizontalAlign: meta.className || "htLeft", verticalAlign: meta.verticalAlign || "middle" }];
          })
        )
      ),
    };

    try {
      // 전체 데이터 가져오기
      const response = await getRawData();
      const allData = response.data;
      
      // 현재 페이지 데이터 업데이트
      allData.pages[this.pageIndex] = {
        table: tableData,
        settings,
        checkboxCells: Object.fromEntries(this.checkboxManager.checkboxCells),
      };

      // 업데이트된 전체 데이터 저장
      await saveRawData(allData);
      console.log(`✅ 페이지 ${this.pageIndex + 1} 저장 완료`);
    } catch (error) {
      console.error(`❌ 페이지 ${this.pageIndex + 1} 저장 실패:`, error);
    }
  }, 100);
}