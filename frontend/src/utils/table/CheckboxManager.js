import Handsontable from "handsontable";
export class CheckboxManager {
  constructor(tableManager) {
      this.tableManager = tableManager;
      this.checkboxCells = new Map();
  }

  get hot() {
      return this.tableManager.hot;
  }

  toggleCheckbox() {
      const selected = this.hot.getSelected();
      if (!selected) return;

      const validSelections = selected.filter(([startRow, startCol]) => startRow >= 0 && startCol >= 0);
      if (validSelections.length === 0) return;

      this.hot.batch(() => {
          validSelections.forEach(([startRow, startCol, endRow, endCol]) => {
              for (let row = startRow; row <= endRow; row++) {
                  for (let col = startCol; col <= endCol; col++) {
                      const cellKey = `${row}_${col}`;
                      const cellValue = this.hot.getDataAtCell(row, col) || "";

                      if (this.checkboxCells.has(cellKey)) {
                          // 체크박스 해제
                          this.checkboxCells.delete(cellKey);
                          this.hot.setDataAtCell(row, col, cellValue.replace("✔ ", ""));
                          // 렌더러를 명시적으로 TextRenderer로 설정
                          this.hot.setCellMeta(row, col, "renderer", Handsontable.renderers.TextRenderer);
                      } else {
                          // 체크박스 생성
                          this.checkboxCells.set(cellKey, { checked: false, text: cellValue });
                          this.hot.setDataAtCell(row, col, `✔ ${cellValue}`);
                          this.hot.setCellMeta(row, col, "renderer", this.checkboxRenderer.bind(this));
                      }
                  }
              }
          });
      });

      this.tableManager.saveTable();
      this.hot.render();
  }

  getCellMeta(row, col) {
      const cellKey = `${row}_${col}`;
      return this.checkboxCells.has(cellKey) ? { renderer: this.checkboxRenderer.bind(this) } : {};
  }

  checkboxRenderer(instance, td, row, col) {
      const cellKey = `${row}_${col}`;
      if (!this.checkboxCells.has(cellKey)) {
          Handsontable.renderers.TextRenderer.apply(this, arguments);
          return;
      }

      td.innerHTML = "";
      const checkboxData = this.checkboxCells.get(cellKey) || { checked: false, text: "" };
      const checkboxId = `checkbox_${row}_${col}`;
      const checkbox = this.createCheckboxElement(cellKey, checkboxData.checked);
      checkbox.id = checkboxId;

      const label = document.createElement("label");
      label.htmlFor = checkboxId;
      label.style.cursor = "pointer";
      label.style.marginLeft = "8px";
      label.appendChild(this.createTextSpan(checkboxData.text));

      td.appendChild(checkbox);
      td.appendChild(label);
  }

  createCheckboxElement(cellKey, isChecked) {
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = isChecked;
      checkbox.addEventListener("change", () => {
          const checkboxData = this.checkboxCells.get(cellKey) || { checked: false, text: "" };
          this.checkboxCells.set(cellKey, { checked: checkbox.checked, text: checkboxData.text });
          const updatedText = checkbox.checked ? `✔ ${checkboxData.text}` : checkboxData.text;
          const [row, col] = cellKey.split('_').map(Number);
          this.hot.setDataAtCell(row, col, updatedText);
          this.tableManager.saveTable();
      });
      return checkbox;
  }

  createTextSpan(text) {
      const textSpan = document.createElement("span");
      textSpan.style.marginLeft = "8px";
      textSpan.textContent = text;
      return textSpan;
  }

  isCheckboxRemovalDisabled() {
      const selected = this.hot.getSelected();
      if (!Array.isArray(selected) || selected.length === 0 || this.isHeaderSelected()) return true;

      return !selected.some(selection => {
          const [startRow, startCol, endRow, endCol] = selection;
          for (let row = startRow; row <= endRow; row++) {
              for (let col = startCol; col <= endCol; col++) {
                  if (this.checkboxCells.has(`${row}_${col}`)) return true;
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