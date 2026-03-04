import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API_URL = `${BACKEND_URL}/api`;

// Crear instancia de axios
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token a las peticiones
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores de autenticación
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token inválido o expirado
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => apiClient.post('/auth/login', credentials),
  register: (userData) => apiClient.post('/auth/register', userData),
  getMe: () => apiClient.get('/auth/me'),
  logout: () => apiClient.post('/auth/logout'),
};

// Users API
export const usersAPI = {
  getAll: () => apiClient.get('/users'),
  getById: (id) => apiClient.get(`/users/${id}`),
  update: (id, data) => apiClient.put(`/users/${id}`, data),
  delete: (id) => apiClient.delete(`/users/${id}`),
  changePassword: (id, passwords) => apiClient.put(`/users/${id}/change-password`, passwords),
};

// Services API
export const servicesAPI = {
  getAll: (params) => apiClient.get('/services', { params }),
  getById: (id) => apiClient.get(`/services/${id}`),
  create: (data) => apiClient.post('/services', data),
  update: (id, data) => apiClient.put(`/services/${id}`, data),
  aprobar: (id) => apiClient.put(`/services/${id}/aprobar`),
  anular: (id, data) => apiClient.put(`/services/${id}/anular`, data),
  agregarItem: (id, data) => apiClient.post(`/services/${id}/agregar-item`, data),
  getStats: () => apiClient.get('/services/stats'),
};

// Service Types API
export const serviceTypesAPI = {
  getAll: (params) => apiClient.get('/service-types', { params }),
  getById: (id) => apiClient.get(`/service-types/${id}`),
  create: (data) => apiClient.post('/service-types', data),
  update: (id, data) => apiClient.put(`/service-types/${id}`, data),
  delete: (id) => apiClient.delete(`/service-types/${id}`),
};

export default apiClient;
