// frontend/src/utils/table/ResizeManager.js
export class ResizeManager {
  constructor(tableManager) {
    this.tableManager = tableManager;
    this.maxHeight = 1123;
    this.maxWidth = 794;
  }

  get hot() {
    return this.tableManager.hot;
  }

  handleRowResize(newSize, index) {
    if (!this.hot) return;
    const currentHeight = this.hot.getRowHeight(index) || 23;
    const totalHeight = this.getTotalHeight() - currentHeight + newSize;
    if (totalHeight > this.maxHeight) {
      alert("🚫 행 높이 조절 불가: A4 높이를 초과할 수 없습니다.");
      this.hot.getPlugin("ManualRowResize").setManualSize(index, this.maxHeight - (this.getTotalHeight() - currentHeight));
    } else {
      this.hot.getPlugin("ManualRowResize").setManualSize(index, newSize);
    }
    this.hot.render();
    this.tableManager.dataService.saveTable(this.hot);
  }

  handleColumnResize(newSize, col) {
    if (!this.hot) return;
    const currentWidth = this.hot.getColWidth(col) || 100;
    const totalWidth = this.getTotalWidth() - currentWidth + newSize;
    if (totalWidth > this.maxWidth) {
      alert("🚫 열 너비 조절 불가: A4 너비를 초과할 수 없습니다.");
      this.hot.getPlugin("ManualColumnResize").setManualSize(col, this.maxWidth - (this.getTotalWidth() - currentWidth));
    } else {
      this.hot.getPlugin("ManualColumnResize").setManualSize(col, newSize);
    }
    this.hot.render();
    this.tableManager.dataService.saveTable(this.hot);
  }

  preventRowAddition(index, amount) {
    if (!this.hot) return false;
    const totalHeight = this.getTotalHeight();
    if (totalHeight + amount * 23 > this.maxHeight) {
      alert("🚫 행 추가 불가: A4 높이를 초과할 수 없습니다.");
      return false;
    }
  }

  preventColumnAddition(index, amount) {
    if (!this.hot) return false;
    const totalWidth = this.getTotalWidth();
    if (totalWidth + amount * 100 > this.maxWidth) {
      alert("🚫 열 추가 불가: A4 너비를 초과할 수 없습니다.");
      return false;
    }
  }

  getTotalHeight() {
    if (!this.hot) return 0;
    let totalHeight = 0;
    const totalRows = this.hot.countRows();
    for (let i = 0; i < totalRows; i++) {
      totalHeight += this.hot.getRowHeight(i) || 23;
    }
    return totalHeight;
  }

  getTotalWidth() {
    if (!this.hot) return 0;
    let totalWidth = 0;
    const totalCols = this.hot.countCols();
    for (let i = 0; i < totalCols; i++) {
      totalWidth += this.hot.getColWidth(i) || 100;
    }
    return totalWidth;
  }
}