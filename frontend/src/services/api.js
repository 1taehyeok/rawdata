// frontend/src/services/api.js
import axios from "axios";

const API_URL = "http://localhost:8000";

export const getFormList = () => axios.get(`${API_URL}/forms`);
export const createForm = (form) => axios.post(`${API_URL}/forms`, form);
export const getForm = (formId) => axios.get(`${API_URL}/forms/${formId}`);
export const saveForm = (formId, data) => axios.post(`${API_URL}/forms/${formId}`, data);
export const updateTest = (testId, data) => axios.post(`${API_URL}/tests/${testId}`, data);
export const updateFormName = (formId, { name, formCode }) => axios.post(`${API_URL}/forms/${formId}/name`, { name, formCode });
export const downloadFormPDF = (formId) => window.open(`${API_URL}/pdf/form/${formId}`);
export const downloadTestPDF = (testId, revision = null) => window.open(`${API_URL}/pdf/test/${testId}${revision !== null ? `?revision=${revision}` : ''}`);
export const deleteForm = (formId) => axios.delete(`${API_URL}/forms/${formId}`);
export const copyForm = (formId) => axios.post(`${API_URL}/forms/${formId}/copy`);
export const movePage = (formId, currentIndex, targetIndex) => axios.post(`${API_URL}/forms/${formId}/move-page`, { currentIndex, targetIndex });
export const copyPage = (formId, pageIndex) => axios.post(`${API_URL}/forms/${formId}/copy-page`, { pageIndex });
export const saveTest = (data, tempTestId = null) => {
    return axios.post(`${API_URL}/tests`, data, {
      params: tempTestId ? { temp_test_id: tempTestId } : {},
    });
  };
export const saveTempTest = (data, tempTestId = null) => {
    return axios.post(`${API_URL}/tests/temp`, data, {
      params: tempTestId ? { temp_test_id: tempTestId } : {},
    });
  };