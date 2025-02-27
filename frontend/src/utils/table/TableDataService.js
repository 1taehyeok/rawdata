// frontend/src/utils/table/TableDataService.js
import { debounce } from "lodash";
import { saveForm, getForm, updateTest } from "@/services/api";

export class TableDataService {
  constructor(formId, pageIndex, checkboxManager, testId = null) {
    this.formId = formId;
    this.pageIndex = pageIndex;
    this.checkboxManager = checkboxManager;
    this.testId = testId;
    console.log("TableDataService constructor - formId:", this.formId, "testId:", this.testId);
    this.saveTable = debounce(this._saveTable.bind(this), 100);
  }

  async _saveTable(hot) {
    if (!hot || hot.isDestroyed) {
      console.warn(`⚠️ 페이지 ${this.pageIndex + 1} 저장 건너뜀: Handsontable 인스턴스가 파괴됨`);
      return;
    }

    const tableData = hot.getData();
    const settings = {
      mergeCells: hot.getPlugin("MergeCells").mergedCellsCollection.mergedCells,
      colWidths: hot.getColHeader().map((_, colIndex) => hot.getColWidth(colIndex)),
      rowHeights: hot.getData().map((_, rowIndex) => hot.getRowHeight(rowIndex)),
      cellAlignments: Object.fromEntries(
        [...Array(tableData.length)].flatMap((_, row) =>
          [...Array(tableData[row].length)].map((_, col) => {
            const meta = hot.getCellMeta(row, col);
            return [`${row}_${col}`, { horizontalAlign: meta.className || "htLeft", verticalAlign: meta.verticalAlign || "middle" }];
          })
        )
      ),
    };

    try {
      let allData;
      if (this.formId) {
        const response = await getForm(this.formId);
        allData = response.data;
        while (allData.pages.length <= this.pageIndex) allData.pages.push({ table: [[]], settings: {} });
      } else {
        allData = { pages: [] };
        while (allData.pages.length <= this.pageIndex) allData.pages.push({ table: [[]], settings: {} });
      }
      
      allData.pages[this.pageIndex] = {
        table: tableData,
        settings,
        checkboxCells: this.checkboxManager ? Object.fromEntries(this.checkboxManager.checkboxCells) : {},
      };
      allData.totalPages = allData.pages.length;

      if (this.formId) {
        await saveForm(this.formId, allData);
        console.log(`✅ 페이지 ${this.pageIndex + 1} 저장 완료 (formId: ${this.formId})`);
        return allData;
      } else if (this.testId) {
        // "수정하기" 모드에서는 버튼 클릭 시에만 저장되도록 여기서는 저장 안 함
        console.log(`✅ 페이지 ${this.pageIndex + 1} 데이터 준비 (testId: ${this.testId})`);
        return allData;
      } else {
        console.warn(`⚠️ 페이지 ${this.pageIndex + 1} 저장 실패: formId와 testId가 모두 없음`);
        return allData;
      }
    } catch (error) {
      console.error(`❌ 페이지 ${this.pageIndex + 1} 저장 실패:`, error);
    }
  }

  async loadPageData(formId, pageIndex, initialData = null) {
    try {
      if (initialData && initialData.pages && initialData.pages[pageIndex]) {
        // initialData가 있으면 바로 사용
        return {
          tableData: initialData.pages[pageIndex].table || [[]],
          settings: initialData.pages[pageIndex].settings || {},
          checkboxCells: initialData.pages[pageIndex].checkboxCells || {},
        };
      } else if (formId) {
        // formId가 있으면 서버에서 데이터 가져오기
        const response = await getForm(formId);
        const pageData = response.data.pages[pageIndex] || { table: [[]], settings: {} };
        return {
          tableData: pageData.table || [[]],
          settings: pageData.settings || {},
          checkboxCells: pageData.checkboxCells || {},
        };
      } else {
        // 둘 다 없으면 기본값 반환
        return { tableData: [[]], settings: {}, checkboxCells: {} };
      }
    } catch (error) {
      console.error(`❌ 페이지 ${pageIndex + 1} 데이터 불러오기 실패:`, error);
      return { tableData: [[]], settings: {}, checkboxCells: {} };
    }
  }
}