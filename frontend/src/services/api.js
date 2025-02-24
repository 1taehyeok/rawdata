import axios from "axios";

const API_URL = "http://localhost:8000";

export const getRawData = () => axios.get(`${API_URL}/rawdata`);
export const saveRawData = (data) => axios.post(`${API_URL}/rawdata`, data);
export const addRawData = (data) => axios.post(`${API_URL}/rawdata`, data);
export const updateRawData = (index, data) => axios.put(`${API_URL}/rawdata/${index}`, data);
export const deleteRawData = (index) => axios.delete(`${API_URL}/rawdata/${index}`);
export const downloadPDF = () => window.open(`${API_URL}/rawdata/pdf`);