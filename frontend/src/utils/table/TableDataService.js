// frontend/src/utils/table/TableDataService.js
import { debounce } from "lodash";
import { saveForm, getForm, saveTempTest } from "@/services/api";

export class TableDataService {
  constructor(formId, pageIndex, checkboxManager, mode, testId = null) {
    this.formId = formId;
    this.pageIndex = pageIndex;
    this.checkboxManager = checkboxManager;
    this.mode = mode; // "manage" 또는 "test" 모드 추가
    this.testId = testId;
    console.log("TableDataService constructor - formId:", this.formId, "mode:", this.mode, "testId:", this.testId);
    this.saveTable = debounce(this._saveTable.bind(this), 100);
  }

  
  // frontend/src/utils/table/TableDataService.js
  async _saveTable(hot) {
    if (!hot || hot.isDestroyed) {
      console.warn(`⚠️ 페이지 ${this.pageIndex + 1} 저장 건너뜀: Handsontable 인스턴스가 파괴됨`);
      return;
    }

    const rawTableData = hot.getData() || [[]];
    const tableData = Array.isArray(rawTableData)
      ? rawTableData.map(row => (row === undefined || row === null ? [] : row))
      : [[]];
    console.log("rawTableData 상태:", rawTableData);
    console.log("필터링된 tableData 상태:", tableData);

    const mergeCellsPlugin = hot.getPlugin("MergeCells");
    const mergeCells = mergeCellsPlugin?.mergedCellsCollection?.mergedCells || [];
    console.log("mergeCells 상태:", mergeCells);

    const settings = {
      mergeCells: mergeCells,
      colWidths: hot.getColHeader().map((_, colIndex) => hot.getColWidth(colIndex) || 100),
      rowHeights: tableData.map((_, rowIndex) => hot.getRowHeight(rowIndex) || 23),
      cellAlignments: Object.fromEntries(
        [...Array(tableData.length || 0)].flatMap((_, row) => {
          const rowData = Array.isArray(tableData[row]) ? tableData[row] : [];
          console.log(`row ${row} 데이터:`, rowData);
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
    };

    try {
      let allData;
      const tempTestId = sessionStorage.getItem("tempTestId") || this.testId; // testId 재사용 가능

      if (this.mode === "manage" && this.formId) {
        const response = await getForm(this.formId);
        allData = response.data;
      } else { // "시험하기" 및 "데이터 수정하기" 모드 공통 로직
        allData = JSON.parse(sessionStorage.getItem("tempTestData") || "{}");
        if (!allData.pages && this.formId) {
          allData = (await getForm(this.formId)).data;
        } else if (!allData.pages && this.initialData) {
          allData = { ...this.initialData };
        }
      }

      if (!allData || typeof allData !== "object") {
        allData = { pages: [], totalPages: 1, formName: "Untitled", formCode: "P702-2-05" };
      }
      if (!Array.isArray(allData.pages)) {
        allData.pages = [];
      }
      console.log("최종 allData 상태:", allData);

      while (allData.pages.length <= this.pageIndex) allData.pages.push({ table: [[]], settings: {} });
      allData.pages[this.pageIndex] = {
        table: tableData,
        settings,
        checkboxCells: this.checkboxManager ? Object.fromEntries(this.checkboxManager.checkboxCells) : {},
      };
      allData.totalPages = allData.pages.length;

      if (this.mode === "manage" && this.formId) {
        await saveForm(this.formId, allData);
        console.log(`✅ 페이지 ${this.pageIndex + 1} 저장 완료 (formId: ${this.formId})`);
      } else {
        sessionStorage.setItem("tempTestData", JSON.stringify(allData));
        const response = await saveTempTest(allData, tempTestId);
        if (!tempTestId) {
          sessionStorage.setItem("tempTestId", response.data.temp_test_id);
        }
        console.log(`✅ 페이지 ${this.pageIndex + 1} 임시 저장 완료 (temp_test_id: ${response.data.temp_test_id})`);
      }
      return allData;
    } catch (error) {
      console.error(`❌ 페이지 ${this.pageIndex + 1} 저장 실패:`, error);
    }
  }

  async loadPageData(formId, pageIndex, initialData = null) {
    try {
      let data;
      if (this.mode === "manage" && formId) {
        data = (await getForm(formId)).data;
      } else {
        data = JSON.parse(sessionStorage.getItem("tempTestData") || "{}");
        if (!data.pages && formId) {
          data = (await getForm(formId)).data;
          sessionStorage.setItem("tempTestData", JSON.stringify(data));
        } else if (!data.pages && initialData) {
          data = { ...initialData };
          sessionStorage.setItem("tempTestData", JSON.stringify(data));
        }
      }
  
      if (!data || typeof data !== "object") {
        data = { pages: [], totalPages: 1, formName: "Untitled", formCode: "P702-2-05" };
      }
      if (!Array.isArray(data.pages)) {
        data.pages = [];
      }
      console.log("loadPageData에서 최종 반환된 data 상태:", data);
  
      const pageData = data.pages[pageIndex] || { table: [[""]], settings: {} };
      return {
        tableData: pageData.table && Array.isArray(pageData.table) ? pageData.table : [[""]],
        settings: pageData.settings || {},
        checkboxCells: pageData.checkboxCells || {},
        editableCells: pageData.settings.editableCells || {},
      };
    } catch (error) {
      console.error(`❌ 페이지 ${pageIndex + 1} 데이터 불러오기 실패:`, error);
      return { tableData: [[""]], settings: {}, checkboxCells: {}, editableCells: {} };
    }
  }
}