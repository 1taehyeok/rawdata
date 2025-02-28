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
    this.dataService = new TableDataService(formId, pageIndex, this.checkboxManager, mode, testId);
    this.dataService.tableManager = this;
    this.eventHandler = new TableEventHandler(this);
  }

  async initialize() {
    const { tableData, settings, checkboxCells, editableCells } = await this.dataService.loadPageData(this.formId, this.pageIndex, this.initialData);
    this.tableData = tableData;
    this.settings = settings;
    this.checkboxManager.checkboxCells = new Map(Object.entries(checkboxCells));
    this.editableCells = editableCells || {}; // 초기화 시 저장된 값 사용

    const isTestMode = this.mode === "test" && !this.testId;
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
      readOnly: this.mode === "test" ? true : false,
      licenseKey: "non-commercial-and-evaluation",
      width: "auto",
      height: 1153,
      afterChange: isTestMode ? () => this.dataService.saveTable(this.hot) : null,
      afterViewRender: this.mode === "manage" ? () => this.dataService.saveTable(this.hot) : null,
      afterRowResize: this.resizeManager.handleRowResize.bind(this.resizeManager),
      afterColumnResize: this.resizeManager.handleColumnResize.bind(this.resizeManager),
      beforeCreateRow: this.resizeManager.preventRowAddition.bind(this.resizeManager),
      beforeCreateCol: this.resizeManager.preventColumnAddition.bind(this.resizeManager),
      cells: this.getCellMeta.bind(this),
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

  getCellMeta(row, col) {
    const cellKey = `${row}_${col}`;
    const meta = {};
    if (this.checkboxManager.checkboxCells.has(cellKey)) {
      meta.renderer = this.checkboxManager.checkboxRenderer.bind(this.checkboxManager);
    }
    if (this.mode === "test") {
      meta.readOnly = !this.editableCells[cellKey];
    }
    return meta;
  }

  applyEditableCells() {
    // 이 메서드는 이제 불필요할 수 있음 (getCellMeta에서 동적으로 처리)
    if (this.hot && this.editableCells && this.mode === "test") {
      Object.keys(this.editableCells).forEach(cellKey => {
        const [row, col] = cellKey.split('_').map(Number);
        const meta = this.hot.getCellMeta(row, col);
        meta.readOnly = !this.editableCells[cellKey];
        this.hot.setCellMetaObject(row, col, meta);
      });
    }
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
        this.hot.setCellMeta(row, col, "className", value.align);
      }
    }
  }
}