import Handsontable from "handsontable";

export class ContextMenuManager {
  constructor(tableManager) {
    this.tableManager = tableManager;
    this.checkboxManager = tableManager.checkboxManager;
    this.mergeManager = tableManager.mergeManager;
  }

  get hot() {
    return this.tableManager.hot;
  }

  getConfig() {
    return {
      items: {
        "make_checkbox": {
          name: "✅ 체크박스로 변환 (여러 개 가능)",
          callback: () => this.checkboxManager.toggleCheckbox(),
          disabled: () => this.isHeaderSelected(),
        },
        "remove_checkbox": {
          name: "❌ 체크박스 해제 (여러 개 가능)",
          callback: () => this.checkboxManager.toggleCheckbox(),
          disabled: () => this.isHeaderSelected() || this.checkboxManager.isCheckboxRemovalDisabled(),
        },
        "merge_cells": {
          name: "🔗 병합",
          callback: () => this.mergeManager.toggleMergeCells(true),
          disabled: () => this.isHeaderSelected(),
        },
        "unmerge_cells": {
          name: "❌ 병합 해제",
          callback: () => this.mergeManager.toggleMergeCells(false),
          disabled: () => this.isHeaderSelected() || this.mergeManager.isUnmergeDisabled(),
        },
        ...Handsontable.plugins.ContextMenu.DEFAULT_ITEMS,
      },
    };
  }

  isHeaderSelected() {
    const selected = this.hot.getSelected();
    return !selected || selected.some(([startRow, startCol]) => startRow < 0 || startCol < 0);
  }
}