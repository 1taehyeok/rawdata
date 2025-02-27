// frontend/src/utils/table/TableManager.js
import Handsontable from "handsontable";
import { CheckboxManager } from "./CheckboxManager";
import { MergeManager } from "./MergeManager";
import { ResizeManager } from "./ResizeManager";
import { ContextMenuManager } from "./ContextMenuManager";
import { TableDataService } from "./TableDataService";
import { TableEventHandler } from "./TableEventHandler";

export class TableManager {
  constructor(container, pageIndex = 0, mode = "manage", formId, initialData = null, testId = null) {
    this.hot = null;
    this.container = container;
    this.pageIndex = pageIndex;
    this.mode = mode;
    this.formId = formId;
    this.initialData = initialData;
    this.testId = testId;
    this.checkboxManager = new CheckboxManager(this);
    this.mergeManager = new MergeManager(this);
    this.resizeManager = new ResizeManager(this);
    this.contextMenuManager = new ContextMenuManager(this);
    console.log("TableManager constructor - testId:", this.testId);
    this.dataService = new TableDataService(formId, pageIndex, this.checkboxManager, this.testId);
    this.eventHandler = new TableEventHandler(this);
  }

  async initialize() {
    const { tableData, settings, checkboxCells } = await this.dataService.loadPageData(this.formId, this.pageIndex, this.initialData);
    this.tableData = tableData;
    this.settings = settings;
    this.checkboxManager.checkboxCells = new Map(Object.entries(checkboxCells));

    const isTestMode = this.mode === "test" && !this.testId; // testId가 있으면 "수정하기" 모드로 간주
    this.hot = new Handsontable(this.container, {
      data: this.tableData,
      rowHeaders: true,
      colHeaders: true,
      columnSorting: false,
      minSpareRows: 0,
      contextMenu: isTestMode
        ? {
            items: {
              "make_checkbox": this.contextMenuManager.getConfig().items.make_checkbox,
              "remove_checkbox": this.contextMenuManager.getConfig().items.remove_checkbox,
            },
          }
        : this.contextMenuManager.getConfig(),
      mergeCells: this.settings.mergeCells || [],
      manualColumnResize: true,
      manualRowResize: true,
      colWidths: this.settings.colWidths || [],
      rowHeights: this.settings.rowHeights || [],
      readOnly: isTestMode,
      licenseKey: "non-commercial-and-evaluation",
      width: 850,
      height: 1153,
      afterChange: isTestMode ? () => this.dataService.saveTable(this.hot) : null, // "수정하기" 모드에서는 비활성화
      afterViewRender: this.mode === "manage" ? () => this.dataService.saveTable(this.hot) : null, // "manage" 모드에서만
      afterRowResize: this.resizeManager.handleRowResize.bind(this.resizeManager),
      afterColumnResize: this.resizeManager.handleColumnResize.bind(this.resizeManager),
      beforeCreateRow: this.resizeManager.preventRowAddition.bind(this.resizeManager),
      beforeCreateCol: this.resizeManager.preventColumnAddition.bind(this.resizeManager),
      cells: this.checkboxManager.getCellMeta.bind(this.checkboxManager),
      afterOnCellMouseDown: (event, coords, TD) => this.eventHandler.handleHeaderClick(event, coords, TD),
      afterInit: () => this.eventHandler.setupHeaderEvents(),
      afterDocumentKeyDown: (e) => {
        if (e.ctrlKey && e.key === "i") {
          const selected = this.hot.getSelected();
          if (selected) {
            this.hot.alter("insert_row_below", selected[0][0] + 1, 1);
          }
        }
      },
    });

    this.restoreCellAlignments();
    this.applyCheckboxRenderers();
    this.hot.render();
    console.log(`✅ 페이지 ${this.pageIndex + 1} 테이블 초기화 완료 (모드: ${this.mode})`);
  }

  applyCheckboxRenderers() {
    if (this.hot && this.checkboxManager.checkboxCells.size > 0) {
      this.checkboxManager.checkboxCells.forEach((value, key) => {
        const [row, col] = key.split('_').map(Number);
        this.hot.setCellMeta(row, col, "renderer", this.checkboxManager.checkboxRenderer.bind(this.checkboxManager));
      });
    }
  }

  restoreCellAlignments() {
    if (this.hot && this.settings.cellAlignments) {
      for (const [key, value] of Object.entries(this.settings.cellAlignments)) {
        const [row, col] = key.split("_").map(Number);
        this.hot.setCellMeta(row, col, "className", value.horizontalAlign);
        this.hot.setCellMeta(row, col, "verticalAlign", value.verticalAlign);
      }
    }
  }
}