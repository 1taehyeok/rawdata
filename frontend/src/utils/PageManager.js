// frontend/src/utils/PageManager.js
import { getForm, saveForm } from "@/services/api";

export class PageManager {
  constructor(formId, initialData = null, tabIndex = 0) {
    this.formId = formId;
    this.initialData = initialData;
    this.tabIndex = tabIndex;
    this.currentPage = 0;
    this.totalPages = initialData?.tabs?.[tabIndex]?.pages?.length || 1;
  }

  async loadFormData() {
    try {
      let response;
      if (this.initialData) {
        response = { data: this.initialData };
      } else if (this.formId) {
        response = await getForm(this.formId);
      }
      const data = response.data;
      this.totalPages = data.tabs[this.tabIndex]?.pages?.length || 1;
      this.currentPage = Math.min(this.currentPage, this.totalPages - 1);
      return { currentPage: this.currentPage, totalPages: this.totalPages };
    } catch (error) {
      console.error("양식 데이터 로드 실패:", error);
      throw error;
    }
  }

  async addPage() {
    try {
      const response = await getForm(this.formId);
      const formData = response.data;
      if (!formData.tabs[this.tabIndex].pages) formData.tabs[this.tabIndex].pages = [];
      formData.tabs[this.tabIndex].pages.push({
        table: [
          ["", "", ""],
          ["", "", ""],
          ["", "", ""],
        ],
        settings: {}
      });
      this.totalPages = formData.tabs[this.tabIndex].pages.length;
      this.currentPage = this.totalPages - 1;
      await saveForm(this.formId, formData);
      return { currentPage: this.currentPage, totalPages: this.totalPages };
    } catch (error) {
      console.error("페이지 추가 실패:", error);
      throw error;
    }
  }

  async removePage() {
    try {
      const response = await getForm(this.formId);
      const formData = response.data;
      if (formData.tabs[this.tabIndex].pages?.length > 1) {
        formData.tabs[this.tabIndex].pages.splice(this.currentPage, 1);
        this.totalPages = formData.tabs[this.tabIndex].pages.length;
        this.currentPage = Math.min(this.currentPage, this.totalPages - 1);
        await saveForm(this.formId, formData);
      }
      return { currentPage: this.currentPage, totalPages: this.totalPages };
    } catch (error) {
      console.error("페이지 삭제 실패:", error);
      throw error;
    }
  }

  prevPage() {
    if (this.currentPage > 0) {
      this.currentPage--;
    }
    return this.currentPage;
  }

  nextPage() {
    if (this.currentPage < this.totalPages - 1) {
      this.currentPage++;
    }
    return this.currentPage;
  }


  getCurrentPage() {
    return this.currentPage;
  }

  getTotalPages() {
    return this.totalPages;
  }
}