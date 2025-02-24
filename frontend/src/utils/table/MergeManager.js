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

    validSelections.forEach(([startRow, startCol, endRow, endCol]) => {
      this.hot.getPlugin("MergeCells")[shouldMerge ? "merge" : "unmerge"](startRow, startCol, endRow, endCol);
    });
    this.tableManager.saveTable();
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
