import axios from 'axios';

const BASE = 'https://deshthaus-crm-production.up.railway.app';

const api = axios.create({ baseURL: BASE + '/api' });

api.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
