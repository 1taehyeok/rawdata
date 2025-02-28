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

  async _saveTable(hot) {
    if (!hot || hot.isDestroyed) {
      console.warn(`⚠️ 페이지 ${this.pageIndex + 1} 저장 건너뜀: Handsontable 인스턴스가 파괴됨`);
      return;
    }
  
    const rawTableData = hot.getData() || [[]];
    // undefined 행 제거 또는 기본값 대체
    const tableData = rawTableData.map(row => (row === undefined || row === null ? [] : row));
    console.log("rawTableData 상태:", rawTableData);
    console.log("필터링된 tableData 상태:", tableData);
  
    const mergeCellsPlugin = hot.getPlugin("MergeCells");
    const mergeCells = mergeCellsPlugin?.mergedCellsCollection?.mergedCells || [];
    console.log("mergeCells 상태:", mergeCells);
  
    const settings = {
      mergeCells: mergeCells,
      colWidths: hot.getColHeader().map((_, colIndex) => hot.getColWidth(colIndex)),
      rowHeights: tableData.map((_, rowIndex) => hot.getRowHeight(rowIndex) || 23), // rowHeights도 안전성 확보
      cellAlignments: Object.fromEntries(
        [...Array(tableData.length || 0)].flatMap((_, row) =>
          [...Array(tableData[row]?.length || 0)].map((_, col) => {
            const meta = hot.getCellMeta(row, col);
            return [`${row}_${col}`, { align: meta.className || "htLeft htMiddle" }];
          })
        )
      ),
      editableCells: this.tableManager?.editableCells || {},
    };
  
    try {
      let allData;
      if (this.mode === "manage" && this.formId) {
        const response = await getForm(this.formId);
        allData = response.data;
        while (allData.pages.length <= this.pageIndex) allData.pages.push({ table: [[]], settings: {} });
      } else {
        allData = JSON.parse(sessionStorage.getItem("tempTestData") || "{}");
        if (!allData.pages && this.formId) {
          allData = (await getForm(this.formId)).data;
        }
        while (allData.pages.length <= this.pageIndex) allData.pages.push({ table: [[]], settings: {} });
      }
  
      allData.pages[this.pageIndex] = {
        table: tableData,
        settings,
        checkboxCells: this.checkboxManager ? Object.fromEntries(this.checkboxManager.checkboxCells) : {},
      };
      allData.totalPages = allData.pages.length;
  
      if (this.mode === "manage" && this.formId) {
        await saveForm(this.formId, allData);
        console.log(`✅ 페이지 ${this.pageIndex + 1} 저장 완료 (formId: ${this.formId})`);
        return allData;
      } else {
        sessionStorage.setItem("tempTestData", JSON.stringify(allData));
        const tempTestId = sessionStorage.getItem("tempTestId") || null;
        const response = await saveTempTest(allData, tempTestId);
        if (!tempTestId) {
          sessionStorage.setItem("tempTestId", response.data.temp_test_id);
        }
        console.log(`✅ 페이지 ${this.pageIndex + 1} 임시 저장 완료 (temp_test_id: ${response.data.temp_test_id})`);
        return allData;
      }
    } catch (error) {
      console.error(`❌ 페이지 ${this.pageIndex + 1} 저장 실패:`, error);
    }
  }

  async loadPageData(formId, pageIndex, initialData = null) {
    try {
      let data;
      if (initialData) {
        data = initialData; // 수정 모드에서 제공된 데이터 사용
      } else if (this.mode === "manage" && formId) {
        data = (await getForm(formId)).data; // 관리 모드에서 form_<id>.json 로드
      } else if (this.mode === "test") {
        data = JSON.parse(sessionStorage.getItem("tempTestData") || "{}");
        if (!data.pages && formId) {
          // sessionStorage가 비어 있으면 formId로 초기 데이터 로드
          data = (await getForm(formId)).data;
          sessionStorage.setItem("tempTestData", JSON.stringify(data)); // 초기 데이터 저장
        }
      } else {
        data = {};
      }
  
      const pageData = data.pages && data.pages[pageIndex] ? data.pages[pageIndex] : { table: [[""]], settings: {} };
      return {
        tableData: pageData.table || [[""]], // 최소한 빈 셀이라도 표시
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