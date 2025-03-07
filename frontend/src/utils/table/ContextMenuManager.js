// frontend/src/utils/table/ContextMenuManager.js
import Handsontable from "handsontable";

export class ContextMenuManager {
  constructor(tableManager) {
    this.tableManager = tableManager;
    this.checkboxManager = tableManager.checkboxManager;
    this.mergeManager = tableManager.mergeManager;
    this.borderManager = tableManager.borderManager; // BorderManager 추가
  }

  get hot() {
    return this.tableManager.hot;
  }

  toggleEditableCells(shouldMakeEditable) {
    const selected = this.hot.getSelected();
    if (!selected) return;

    const validSelections = selected.filter(([startRow, startCol]) => startRow >= 0 && startCol >= 0);
    if (validSelections.length === 0) return;

    const editableCells = { ...this.tableManager.editableCells };
    validSelections.forEach(([startRow, startCol, endRow, endCol]) => {
      for (let row = startRow; row <= endRow; row++) {
        for (let col = startCol; col <= endCol; col++) {
          const cellKey = `${row}_${col}`;
          if (shouldMakeEditable) {
            editableCells[cellKey] = true;
          } else {
            delete editableCells[cellKey];
          }
        }
      }
    });

    this.tableManager.editableCells = editableCells;
    this.tableManager.dataService.saveTable(this.hot);
  }

  isEditableMixedOrAllTrue() {
    const selected = this.hot.getSelected();
    if (!selected || this.isHeaderSelected()) return { allEditable: false, mixed: false };

    let hasEditable = false;
    let hasNonEditable = false;

    selected.forEach(([startRow, startCol, endRow, endCol]) => {
      for (let row = Math.max(0, startRow); row <= endRow; row++) {
        for (let col = Math.max(0, startCol); col <= endCol; col++) {
          const cellKey = `${row}_${col}`;
          if (this.tableManager.editableCells[cellKey]) {
            hasEditable = true;
          } else {
            hasNonEditable = true;
          }
          if (hasEditable && hasNonEditable) break;
        }
        if (hasEditable && hasNonEditable) break;
      }
    });

    return {
      allEditable: hasEditable && !hasNonEditable,
      mixed: hasEditable && hasNonEditable,
    };
  }

  getConfig() {
    return {
      items: {
        "make_checkbox": {
          name: "✅ 체크박스로 변환",
          callback: () => this.checkboxManager.toggleCheckbox(),
          disabled: () => this.isHeaderSelected(),
        },
        "remove_checkbox": {
          name: "❌ 체크박스 해제",
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
        "toggle_editable": {
          name: () => {
            const { allEditable, mixed } = this.isEditableMixedOrAllTrue();
            return (allEditable || mixed) ? "🚫 입력용 셀 해제" : "✏️ 입력용 셀로 변환";
          },
          callback: () => {
            const { allEditable, mixed } = this.isEditableMixedOrAllTrue();
            this.toggleEditableCells(!(allEditable || mixed));
          },
          disabled: () => this.isHeaderSelected(),
        },
        "border_menu": {
          name: "🖌️ 테두리 설정",
          submenu: {
            items: [
              {
                key: "border_menu:bottom",
                name: "⬇ 아래쪽 테두리",
                callback: () => this.borderManager.applyBorder("bottom"),
                disabled: () => this.isHeaderSelected(),
              },
              {
                key: "border_menu:top",
                name: "⬆ 윗쪽 테두리",
                callback: () => this.borderManager.applyBorder("top"),
                disabled: () => this.isHeaderSelected(),
              },
              {
                key: "border_menu:left",
                name: "⬅ 왼쪽 테두리",
                callback: () => this.borderManager.applyBorder("left"),
                disabled: () => this.isHeaderSelected(),
              },
              {
                key: "border_menu:right",
                name: "➡ 오른쪽 테두리",
                callback: () => this.borderManager.applyBorder("right"),
                disabled: () => this.isHeaderSelected(),
              },
              {
                key: "border_menu:none",
                name: "🚫 테두리 없음",
                callback: () => this.borderManager.applyBorder("none"),
                disabled: () => this.isHeaderSelected(),
              },
              {
                key: "border_menu:all",
                name: "🔲 모든 테두리",
                callback: () => this.borderManager.applyBorder("all"),
                disabled: () => this.isHeaderSelected(),
              },
              {
                key: "border_menu:outside",
                name: "🔳 바깥쪽 테두리",
                callback: () => this.borderManager.applyBorder("outside"),
                disabled: () => this.isHeaderSelected(),
              },
              {
                key: "border_menu:thick-outside",
                name: "🔴 굵은 바깥쪽 테두리",
                callback: () => this.borderManager.applyBorder("thick-outside"),
                disabled: () => this.isHeaderSelected(),
              },
            ],
          },
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