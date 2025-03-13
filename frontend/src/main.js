// frontend/src/main.js
import './assets/main.css'
import './assets/styles/global.css'; // 추가
import { createApp } from 'vue'
import App from './App.vue'
import axios from 'axios'

const app = createApp(App)
app.config.globalProperties.$axios = axios  // 전역으로 axios 추가
app.mount('#app')