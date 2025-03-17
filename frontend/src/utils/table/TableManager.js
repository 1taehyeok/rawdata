// frontend/src/utils/table/TableManager.js
import Handsontable from "handsontable";
import { CheckboxManager } from "./CheckboxManager";
import { MergeManager } from "./MergeManager";
import { ResizeManager } from "./ResizeManager";
import { ContextMenuManager } from "./ContextMenuManager";
import { TableDataService } from "./TableDataService";
import { TableEventHandler } from "./TableEventHandler";
import { BorderManager } from "./BorderManager"; // 새로 추가

export class TableManager {
  constructor(container, pageIndex = 0, mode = "manage", formId, initialData = null, testId = null, tabIndex = 0) {
    this.hot = null;
    this.container = container;
    this.pageIndex = pageIndex;
    this.tabIndex = tabIndex; // 탭 인덱스 추가
    this.mode = mode;
    this.formId = formId;
    this.initialData = initialData;
    this.testId = testId;
    this.checkboxManager = new CheckboxManager(this);
    this.mergeManager = new MergeManager(this);
    this.resizeManager = new ResizeManager(this);
    this.borderManager = new BorderManager(this);
    this.contextMenuManager = new ContextMenuManager(this);
    this.dataService = new TableDataService(formId, pageIndex, this.checkboxManager, mode, testId);
    this.dataService.tableManager = this;
    this.eventHandler = new TableEventHandler(this);
    this.customBorders = []; // 현재 테두리 상태를 저장
  }

  async initialize() {
    const { tableData, settings, checkboxCells, editableCells } = await this.dataService.loadPageData(this.formId, this.tabIndex, this.pageIndex, this.initialData);
    this.tableData = tableData;
    this.settings = settings;
    this.checkboxManager.checkboxCells = new Map(Object.entries(checkboxCells));
    this.editableCells = editableCells || {};
    this.customBorders = settings.customBorders || []; // 저장된 테두리 데이터 로드 (아직 저장 로직 미완성)

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
      customBorders: this.customBorders, // 초기 테두리 설정 적용
      readOnly: this.mode === "test" ? true : false,
      licenseKey: "non-commercial-and-evaluation",
      width: "auto",
      // height: 1153 제거 또는 동적 설정
      // height: () => window.innerHeight - 100, // 예: 헤더 등 여백 고려 (선택적)
      // stretchH: "all", // 열이 컨테이너에 맞게 늘어나도록
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
        if (e.key === " " && this.mode === "test") { // 스페이스 바 감지 + 시험하기 모드 제한
          e.preventDefault(); // 기본 스크롤 동작 방지
          const selected = this.hot.getSelectedLast(); // 마지막 선택된 셀 가져오기
          if (selected) {
            const [startRow, startCol] = selected;
            if (startRow >= 0 && startCol >= 0) { // 헤더 제외
              const cellKey = `${startRow}_${startCol}`;
              if (this.checkboxManager.checkboxCells.has(cellKey)) {
                this.checkboxManager.toggleCheckboxAtCell(startRow, startCol);
              }
            }
          }
        }
        if (e.ctrlKey && e.key === "i") {
          const selected = this.hot.getSelected();
          if (selected) {
            this.hot.alter("insert_row_below", selected[0][0] + 1, 1);
          }
        }
      },
      afterSelection: (row, col) => { // 새로 추가
        if (row >= 0 && col >= 0) { // 헤더 제외
          this.ensureCellVisible(row, col);
        }
      },
    });

    this.restoreCellAlignments();
    this.applyCheckboxRenderers();
    this.hot.render();
  }
  // 페이지 변경 처리 메서드
  handlePageChange(direction) {
    if (this.onPageChange) {
      this.onPageChange(direction); // 상위 컴포넌트로 이벤트 전달
    }
  }

  // 콜백 설정 메서드
  setPageChangeCallback(callback) {
    this.onPageChange = callback;
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
  // 셀이 뷰포트 안에 보이도록 스크롤 조정
  ensureCellVisible(row, col) {
    if (!this.hot) return;

    const cellOffset = this.hot.getCell(row, col)?.getBoundingClientRect();
    const viewportTop = window.scrollY;
    const viewportBottom = viewportTop + window.innerHeight;

    if (!cellOffset) return;

    // 셀이 뷰포트 밖에 있는지 확인
    if (cellOffset.top < viewportTop) {
      window.scrollTo({ top: cellOffset.top - 50, behavior: "smooth" }); // 위로 스크롤
    } else if (cellOffset.bottom > viewportBottom) {
      window.scrollTo({ top: cellOffset.bottom - window.innerHeight + 50, behavior: "smooth" }); // 아래로 스크롤
    }
  }

  applyEditableCells() {
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

  // 테두리 업데이트 메서드
  updateBorders(newBorders) {
    // 기존 테두리와 새로운 테두리를 병합 (중복 셀은 새로운 설정으로 덮어씀)
    const borderMap = new Map();
    
    // 기존 테두리 추가
    this.customBorders.forEach(border => {
      const key = `${border.row}_${border.col}`;
      borderMap.set(key, { ...border });
    });

    // 새로운 테두리로 업데이트
    newBorders.forEach(border => {
      const key = `${border.row}_${border.col}`;
      borderMap.set(key, { ...border });
    });

    // Map을 배열로 변환
    this.customBorders = Array.from(borderMap.values());

    // Handsontable 업데이트
    this.hot.updateSettings({ customBorders: this.customBorders });
  }
}