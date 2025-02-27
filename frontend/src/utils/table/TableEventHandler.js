// frontend/src/utils/table/TableEventHandler.js
export class TableEventHandler {
    constructor(tableManager) {
      this.tableManager = tableManager;
      this.lastClickTime = null;
      this.clickTimeout = null;
    }
  
    get hot() {
      return this.tableManager.hot;
    }
  
    handleHeaderClick(event, coords, TD) {
      const now = Date.now();
      const isRowHeader = coords.col === -1;
      const isColumnHeader = coords.row === -1;
  
      if (isRowHeader || isColumnHeader) {
        if (this.lastClickTime && now - this.lastClickTime < 200) {
          clearTimeout(this.clickTimeout);
          if (isRowHeader) {
            this.handleRowHeaderDblClick(coords.row);
          } else if (isColumnHeader) {
            this.handleColumnHeaderDblClick(coords.col);
          }
        } else {
          this.lastClickTime = now;
          this.clickTimeout = setTimeout(() => {
            this.lastClickTime = null;
          }, 300);
        }
      }
    }
  
    setupHeaderEvents() {
      if (!this.hot || !this.hot.rootElement) return;
  
      const headers = this.hot.rootElement.querySelectorAll('.htRowHeader, .htColHeader');
      headers.forEach(header => {
        header.removeEventListener('dblclick', this.handleHeaderDblClickBound);
        this.handleHeaderDblClickBound = this.handleHeaderDblClick.bind(this);
        header.addEventListener('dblclick', this.handleHeaderDblClickBound);
      });
    }
  
    handleHeaderDblClick(event) {
      const td = event.target.closest('th');
      if (!td) return;
  
      const coords = this.hot.getCoords(td);
      if (coords.col === -1) {
        this.handleRowHeaderDblClick(coords.row);
      } else if (coords.row === -1) {
        this.handleColumnHeaderDblClick(coords.col);
      }
    }
  
    handleRowHeaderDblClick(row) {
      this.showResizePopup('row', row);
    }
  
    handleColumnHeaderDblClick(col) {
      this.showResizePopup('column', col);
    }
  
    showResizePopup(type, index) {
      if (!this.hot) {
        alert("테이블이 초기화되지 않았습니다. 다시 시도해 주세요.");
        return;
      }
  
      const currentSize = type === 'column' 
        ? (this.hot.getColWidth(index) || 100) 
        : (this.hot.getRowHeight(index) || 23);
      const maxSize = type === 'column' ? this.tableManager.resizeManager.maxWidth : this.tableManager.resizeManager.maxHeight;
      const minSize = type === 'column' ? 50 : 20;
  
      const newSize = prompt(`새 ${type === 'column' ? '열 너비' : '행 높이'} (px)를 입력하세요 (최소 ${minSize}px, 최대 ${maxSize}px):`, currentSize);
      
      if (newSize !== null) {
        const size = parseInt(newSize, 10);
        if (!isNaN(size) && size >= minSize && size <= maxSize) {
          if (type === 'column') {
            this.tableManager.resizeManager.handleColumnResize(size, index);
          } else {
            this.tableManager.resizeManager.handleRowResize(size, index);
          }
          this.hot.render();
          this.tableManager.dataService.saveTable(this.hot);
        } else {
          alert(`유효한 값(최소 ${minSize}px, 최대 ${maxSize}px)을 입력하세요.`);
        }
      }
    }
  }