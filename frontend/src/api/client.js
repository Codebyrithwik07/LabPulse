import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach active simulated user identity
api.interceptors.request.use((config) => {
  const storedUser = localStorage.getItem('labpulse_user');
  if (storedUser) {
    try {
      const user = JSON.parse(storedUser);
      config.headers['x-user-id'] = user.id;
      config.headers['x-user-role'] = user.role;
    } catch {
      // ignore parse error
    }
  }
  return config;
});

// Response interceptor for error unwrapping
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const errorMsg =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message ||
      'An unexpected network error occurred';
    return Promise.reject(new Error(errorMsg));
  }
);

export const equipmentApi = {
  getAll: (params) => api.get('/equipment', { params }),
  getById: (id) => api.get(`/equipment/${id}`),
  getTimeline: (id) => api.get(`/equipment/${id}/timeline`),
  create: (data) => api.post('/equipment', data),
  update: (id, data) => api.put(`/equipment/${id}`, data),
};

export const faultApi = {
  getAll: (params) => api.get('/faults', { params }),
  getById: (id) => api.get(`/faults/${id}`),
  report: (data) => api.post('/faults', data),
};

export const repairApi = {
  getAll: (params) => api.get('/repairs', { params }),
  getById: (id) => api.get(`/repairs/${id}`),
  assign: (data) => api.post('/repairs', data),
  updateAction: (id, data) => api.put(`/repairs/${id}/action`, data),
  verifyAndRestore: (id, data) => api.post(`/repairs/${id}/restore`, data),
};

export const calibrationApi = {
  getAll: (params) => api.get('/calibrations', { params }),
  getOverdue: () => api.get('/calibrations/overdue'),
  record: (data) => api.post('/calibrations', data),
};

export const dashboardApi = {
  getOverview: () => api.get('/dashboard/overview'),
  getDowntimeByEquipment: () => api.get('/dashboard/downtime-by-equipment'),
  getFailureRankings: () => api.get('/dashboard/failure-ranking'),
  getRecurringFaults: () => api.get('/dashboard/recurring-faults'),
};

export const metaApi = {
  getLabs: () => api.get('/labs'),
  getUsers: (params) => api.get('/users', { params }),
};

export default api;
