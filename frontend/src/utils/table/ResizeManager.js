export class ResizeManager {
  constructor(tableManager) {
    this.tableManager = tableManager;
    this.maxHeight = 1123; // A4 제한
  }

  get hot() {
    return this.tableManager.hot;
  }

  handleRowResize(newSize, row) {
    const totalHeight = this.getTotalHeight();
    if (totalHeight > this.maxHeight) {
      alert("🚫 행 높이 조절 불가: A4 높이를 초과할 수 없습니다.");
      this.hot.getPlugin("ManualRowResize").setManualSize(row, this.maxHeight - (totalHeight - newSize));
    } else {
      this.hot.getPlugin("ManualRowResize").setManualSize(row, newSize);
    }
    this.hot.render();
    this.tableManager.saveTable();
  }

  preventRowAddition(index, amount) {
    const totalHeight = this.getTotalHeight();
    if (totalHeight + amount * 23 > this.maxHeight) {
      alert("🚫 행 추가 불가: A4 높이를 초과할 수 없습니다.");
      return false;
    }
  }

  getTotalHeight() {
    let totalHeight = 0;
    const totalRows = this.hot.countRows();
    for (let i = 0; i < totalRows; i++) {
      totalHeight += this.hot.getRowHeight(i) || 23;
    }
    return totalHeight;
  }
}