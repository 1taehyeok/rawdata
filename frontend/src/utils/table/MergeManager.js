// frontend/src/utils/table/MergeManager.js
export class MergeManager {
  constructor(tableManager) {
    this.tableManager = tableManager;
  }

  get hot() {
    return this.tableManager.hot;
  }

  toggleMergeCells(shouldMerge) {
    const selected = this.hot.getSelected();
    if (!selected) return;

    const validSelections = selected.filter(([startRow, startCol]) => startRow >= 0 && startCol >= 0);
    if (validSelections.length === 0) return;

    const mergeCellsPlugin = this.hot.getPlugin("MergeCells");

    validSelections.forEach(([startRow, startCol, endRow, endCol]) => {
      if (shouldMerge) {
        // 선택된 영역 내에 병합된 셀이 있는지 확인하고 해제
        for (let row = startRow; row <= endRow; row++) {
          for (let col = startCol; col <= endCol; col++) {
            const cellMeta = this.hot.getCellMeta(row, col);
            if (cellMeta.colspan > 1 || cellMeta.rowspan > 1) {
              mergeCellsPlugin.unmerge(row, col, row + cellMeta.rowspan - 1, col + cellMeta.colspan - 1);
            }
          }
        }
        // 새로운 병합 적용
        mergeCellsPlugin.merge(startRow, startCol, endRow, endCol);
      } else {
        mergeCellsPlugin.unmerge(startRow, startCol, endRow, endCol);
      }
    });

    this.hot.render();
    this.tableManager.dataService.saveTable(this.hot);
  }

  isUnmergeDisabled() {
    const selected = this.hot.getSelected();
    if (!Array.isArray(selected) || selected.length === 0 || this.isHeaderSelected()) return true;

    return !selected.some(selection => {
      const [startRow, startCol, endRow, endCol] = selection;
      for (let row = startRow; row <= endRow; row++) {
        for (let col = startCol; col <= endCol; col++) {
          if (this.hot.getCellMeta(row, col).colspan > 1 || this.hot.getCellMeta(row, col).rowspan > 1) return true;
        }
      }
      return false;
    });
  }

  isHeaderSelected() {
    const selected = this.hot.getSelected();
    return !selected || selected.some(([startRow, startCol]) => startRow < 0 || startCol < 0);
  }
}