import axios from 'axios';

const API = axios.create({
  // Explicitly hardcode /api here so it never gets lost
  baseURL: 'http://localhost:5000/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT Auth token to outgoing requests
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Pre-seeded initial fallback data for Business Partners
const INITIAL_PARTNERS = [
  {
    _id: 'bp-101',
    name: 'Sarah Jenkins',
    email: 'sarah.jenkins@company.com',
    phone: '+1 (555) 234-5678',
    department: 'Engineering',
    assignedTeams: ['Backend Devs', 'DevOps', 'QA Core'],
    status: 'Active',
    notes: 'Handles technical recruitment and senior engineering performance evaluations.',
    createdAt: '2025-01-15T08:00:00.000Z',
  },
  {
    _id: 'bp-102',
    name: 'Marcus Vance',
    email: 'marcus.vance@company.com',
    phone: '+1 (555) 876-5432',
    department: 'Sales & Marketing',
    assignedTeams: ['Growth Marketing', 'Enterprise Sales'],
    status: 'Active',
    notes: 'Oversees commission structure reviews and quarterly team alignment.',
    createdAt: '2025-02-01T10:30:00.000Z',
  },
];

const getStoredPartners = () => {
  const stored = localStorage.getItem('app_business_partners');
  if (!stored) {
    localStorage.setItem('app_business_partners', JSON.stringify(INITIAL_PARTNERS));
    return INITIAL_PARTNERS;
  }
  return JSON.parse(stored);
};

const saveStoredPartners = (partners) => {
  localStorage.setItem('app_business_partners', JSON.stringify(partners));
};

export const businessPartnerApi = {
  getAll: async (params = {}) => {
    try {
      const response = await API.get('/business-partners', { params });
      return response.data;
    } catch (error) {
      console.warn('Backend unavailable. Using local storage fallback.', error.message);
      let list = getStoredPartners();
      if (params.search) {
        const query = params.search.toLowerCase();
        list = list.filter(
          (item) =>
            item.name.toLowerCase().includes(query) ||
            item.email.toLowerCase().includes(query) ||
            item.department.toLowerCase().includes(query)
        );
      }
      return { success: true, count: list.length, data: list };
    }
  },
  create: async (data) => {
    try {
      const response = await API.post('/business-partners', data);
      return response.data;
    } catch {
      const list = getStoredPartners();
      const newPartner = { ...data, _id: 'bp-' + Date.now(), createdAt: new Date().toISOString() };
      list.unshift(newPartner);
      saveStoredPartners(list);
      return { success: true, message: 'Created locally', data: newPartner };
    }
  },
  update: async (id, data) => {
    try {
      const response = await API.put(`/business-partners/${id}`, data);
      return response.data;
    } catch {
      let list = getStoredPartners();
      let updatedItem = null;
      list = list.map((item) => {
        if (item._id === id) {
          updatedItem = { ...item, ...data, updatedAt: new Date().toISOString() };
          return updatedItem;
        }
        return item;
      });
      saveStoredPartners(list);
      return { success: true, message: 'Updated locally', data: updatedItem };
    }
  },
  delete: async (id) => {
    try {
      const response = await API.delete(`/business-partners/${id}`);
      return response.data;
    } catch {
      let list = getStoredPartners();
      list = list.filter((item) => item._id !== id);
      saveStoredPartners(list);
      return { success: true, message: 'Deleted locally', id };
    }
  },
};

export const api = async (url, options = {}) => {
  try {
    const response = await API.request({
      url,
      method: options.method || 'GET',
      data: options.body,
      params: options.params,
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || error.message || 'Request failed', { cause: error });
  }
};

export default API;
