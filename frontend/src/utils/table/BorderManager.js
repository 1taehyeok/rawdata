// frontend/src/utils/table/BorderManager.js
export class BorderManager {
    constructor(tableManager) {
      this.tableManager = tableManager;
    }
  
    get hot() {
      return this.tableManager.hot;
    }
  
    applyBorder(borderType) {
      const selected = this.hot.getSelected();
      if (!selected || this.isHeaderSelected()) return;
  
      const newBorders = [];
      selected.forEach(([startRow, startCol, endRow, endCol]) => {
        for (let row = startRow; row <= endRow; row++) {
          for (let col = startCol; col <= endCol; col++) {
            const borderConfig = { row, col };
            switch (borderType) {
              case "bottom":
                borderConfig.bottom = { width: 2, color: "black" };
                break;
              case "top":
                borderConfig.top = { width: 2, color: "black" };
                break;
              case "left":
                borderConfig.left = { width: 2, color: "black" };
                break;
              case "right":
                borderConfig.right = { width: 2, color: "black" };
                break;
              case "none":
                borderConfig.top = undefined;
                borderConfig.bottom = undefined;
                borderConfig.left = undefined;
                borderConfig.right = undefined;
                break;
              case "all":
                borderConfig.top = { width: 2, color: "black" };
                borderConfig.bottom = { width: 2, color: "black" };
                borderConfig.left = { width: 2, color: "black" };
                borderConfig.right = { width: 2, color: "black" };
                break;
              case "outside":
                if (row === startRow) borderConfig.top = { width: 2, color: "black" };
                if (row === endRow) borderConfig.bottom = { width: 2, color: "black" };
                if (col === startCol) borderConfig.left = { width: 2, color: "black" };
                if (col === endCol) borderConfig.right = { width: 2, color: "black" };
                break;
              case "thick-outside":
                if (row === startRow) borderConfig.top = { width: 3, color: "black" };
                if (row === endRow) borderConfig.bottom = { width: 3, color: "black" };
                if (col === startCol) borderConfig.left = { width: 3, color: "black" };
                if (col === endCol) borderConfig.right = { width: 3, color: "black" };
                break;
            }
            newBorders.push(borderConfig);
          }
        }
      });
  
      this.tableManager.updateBorders(newBorders);
      this.tableManager.dataService.saveTable(this.hot);
    }
  
    isHeaderSelected() {
      const selected = this.hot.getSelected();
      return !selected || selected.some(([startRow, startCol]) => startRow < 0 || startCol < 0);
    }
  }