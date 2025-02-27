// frontend/src/utils/PageManager.js
import { getForm, saveForm } from "@/services/api";

export class PageManager {
  constructor(formId, initialData = null) {
    this.formId = formId;
    this.initialData = initialData;
    this.currentPage = 0;
    this.totalPages = initialData ? initialData.totalPages || 1 : 1;
  }

  async loadFormData() {
    try {
      if (this.initialData) {
        this.totalPages = this.initialData.totalPages || 1;
        this.currentPage = Math.min(this.currentPage, this.totalPages - 1);
        return { currentPage: this.currentPage, totalPages: this.totalPages };
      } else if (this.formId) {
        const response = await getForm(this.formId);
        this.totalPages = response.data.totalPages || 1;
        this.currentPage = Math.min(this.currentPage, this.totalPages - 1);
        return { currentPage: this.currentPage, totalPages: this.totalPages };
      } else {
        return { currentPage: this.currentPage, totalPages: this.totalPages };
      }
    } catch (error) {
      console.error("양식 데이터 로드 실패:", error);
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

  async addPage() {
    try {
      const response = await getForm(this.formId);
      const formData = response.data;
      if (!formData.pages) formData.pages = [];
      formData.pages.push({ table: [[]], settings: {} });
      formData.totalPages = formData.pages.length;
      this.totalPages = formData.totalPages;
      this.currentPage = this.totalPages - 1;
      await saveForm(this.formId, formData);
      console.log("✅ 페이지 추가 완료");
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
      if (formData.pages && formData.pages.length > 1) {
        formData.pages.splice(this.currentPage, 1);
        formData.totalPages = formData.pages.length;
        this.totalPages = formData.totalPages;
        this.currentPage = Math.min(this.currentPage, this.totalPages - 1);
        await saveForm(this.formId, formData);
        console.log("✅ 페이지 삭제 완료");
      }
      return { currentPage: this.currentPage, totalPages: this.totalPages };
    } catch (error) {
      console.error("페이지 삭제 실패:", error);
      throw error;
    }
  }

  getCurrentPage() {
    return this.currentPage;
  }

  getTotalPages() {
    return this.totalPages;
  }
}