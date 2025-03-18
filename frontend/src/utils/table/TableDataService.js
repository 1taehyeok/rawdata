// frontend/src/utils/table/TableDataService.js
import { debounce } from "lodash";
import { saveForm, getForm, saveTempTest } from "@/services/api";

export class TableDataService {
  constructor(formId, pageIndex, checkboxManager, mode, testId = null, tabIndex = 0) {
    this.formId = formId;
    this.pageIndex = pageIndex;
    this.tabIndex = tabIndex; // 탭 인덱스 추가
    this.checkboxManager = checkboxManager;
    this.mode = mode;
    this.testId = testId;
    this.saveTable = debounce(this._saveTable.bind(this), 100);
  }

  async _saveTable(hot) {
    if (!hot || hot.isDestroyed) return;

    const rawTableData = hot.getData() || [[]];
    const tableData = Array.isArray(rawTableData) ? rawTableData.map(row => row || []) : [[]];
    const mergeCellsPlugin = hot.getPlugin("MergeCells");
    const mergeCells = mergeCellsPlugin?.mergedCellsCollection?.mergedCells || [];
    const settings = {
      mergeCells,
      colWidths: hot.getColHeader().map((_, colIndex) => hot.getColWidth(colIndex) || 100),
      rowHeights: tableData.map((_, rowIndex) => hot.getRowHeight(rowIndex) || 23),
      cellAlignments: Object.fromEntries(
        [...Array(tableData.length || 0)].flatMap((_, row) => {
          const rowData = Array.isArray(tableData[row]) ? tableData[row] : [];
          const colCount = rowData.length || hot.countCols() || 0;
          return [...Array(colCount)].map((_, col) => {
            let meta;
            try {
              meta = hot.getCellMeta(row, col) || {};
            } catch (e) {
              console.warn(`⚠️ row ${row}, col ${col} 메타데이터 가져오기 실패:`, e);
              meta = {};
            }
            return [`${row}_${col}`, { align: meta.className || "htLeft htMiddle" }];
          });
        })
      ),
      editableCells: this.tableManager?.editableCells || {},
      customBorders: this.tableManager?.customBorders || [],
    };

    try {
      let allData;
      const tempTestId = sessionStorage.getItem("tempTestId") || this.testId;

      if (this.mode === "manage" && this.formId) {
        const response = await getForm(this.formId);
        allData = response.data;
      } else {
        allData = JSON.parse(sessionStorage.getItem("tempTestData") || "{}");
        if (!allData.tabs && this.formId) allData = (await getForm(this.formId)).data;
        else if (!allData.tabs && this.initialData) allData = { ...this.initialData };
      }

      if (!allData || typeof allData !== "object") {
        allData = { formName: "Untitled", formCode: "P702-2-05", tabs: [{ name: "일반 페이지", pages: [{}] }] };
      }
      if (!Array.isArray(allData.tabs)) allData.tabs = [{ name: "일반 페이지", pages: [{}] }];

      while (allData.tabs.length <= this.tabIndex) allData.tabs.push({ name: `탭 ${allData.tabs.length + 1}`, pages: [{}] });
      while (allData.tabs[this.tabIndex].pages.length <= this.pageIndex) allData.tabs[this.tabIndex].pages.push({ table: [[]], settings: {} });

      allData.tabs[this.tabIndex].pages[this.pageIndex] = {
        table: tableData,
        settings,
        checkboxCells: Object.fromEntries(this.checkboxManager.checkboxCells),
      };

      if (this.mode === "manage" && this.formId) {
        await saveForm(this.formId, allData);
      } else {
        sessionStorage.setItem("tempTestData", JSON.stringify(allData));
        const response = await saveTempTest(allData, tempTestId);
        if (!tempTestId) sessionStorage.setItem("tempTestId", response.data.temp_test_id);
      }
      return allData;
    } catch (error) {
      console.error(`❌ 탭 ${this.tabIndex + 1}, 페이지 ${this.pageIndex + 1} 저장 실패:`, error);
    }
  }

  async loadPageData(formId, tabIndex, pageIndex, initialData = null) {
    try {
      let data;
      if (this.mode === "manage" && formId) {
        data = (await getForm(formId)).data;
      } else {
        data = JSON.parse(sessionStorage.getItem("tempTestData") || "{}");
        if (!data.tabs && formId) data = (await getForm(formId)).data;
        else if (!data.tabs && initialData) data = { ...initialData };
      }

      if (!data || typeof data !== "object") {
        data = { formName: "Untitled", formCode: "P702-2-05", tabs: [{ name: "일반 페이지", pages: [{}] }] };
      }
      if (!Array.isArray(data.tabs)) data.tabs = [{ name: "일반 페이지", pages: [{}] }];

      const tabData = data.tabs[tabIndex] || { name: `탭 ${tabIndex + 1}`, pages: [{}] };
      const pageData = tabData.pages[pageIndex] || { table: [[""]], settings: {} };
      return {
        tableData: Array.isArray(pageData.table) ? pageData.table : [[""]],
        settings: { ...pageData.settings, customBorders: pageData.settings.customBorders || [] },
        checkboxCells: pageData.checkboxCells || {},
        editableCells: pageData.settings.editableCells || {},
      };
    } catch (error) {
      console.error(`❌ 탭 ${tabIndex + 1}, 페이지 ${pageIndex + 1} 데이터 불러오기 실패:`, error);
      return {
        tableData: [[""]],
        settings: { customBorders: [] },
        checkboxCells: {},
        editableCells: {},
      };
    }
  }
}
/*
cellAlignments: Object.fromEntries(
        [...Array(tableData.length || 0)].flatMap((_, row) => {
          const rowData = Array.isArray(tableData[row]) ? tableData[row] : [];
          const colCount = rowData.length || hot.countCols() || 0;
          return [...Array(colCount)].map((_, col) => {
            let meta;
            try {
              meta = hot.getCellMeta(row, col) || {};
            } catch (e) {
              console.warn(`⚠️ row ${row}, col ${col} 메타데이터 가져오기 실패:`, e);
              meta = {};
            }
            return [`${row}_${col}`, { align: meta.className || "htLeft htMiddle" }];
          });
        })
      ),
*/