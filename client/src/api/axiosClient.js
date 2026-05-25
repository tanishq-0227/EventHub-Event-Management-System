import axios from 'axios';
import { store } from '../app/store';
import { setCredentials, logout } from '../features/auth/authSlice';

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

// Request interceptor
axiosClient.interceptors.request.use(
  (config) => {
    const token = store.getState().auth.accessToken;
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers['Authorization'] = `Bearer ${token}`;
            return axiosClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        console.log('🔄 Refreshing access token...');
        const { data } = await axiosClient.post('/api/auth/refresh');
        const newToken = data?.data?.accessToken || data?.accessToken;

        if (!newToken) {
          throw new Error('No access token received from refresh endpoint');
        }

        console.log('✅ Access token refreshed successfully');
        store.dispatch(setCredentials({ accessToken: newToken }));

        processQueue(null, newToken);
        originalRequest.headers['Authorization'] = `Bearer ${newToken}`;

        return axiosClient(originalRequest);
      } catch (refreshError) {
        console.error('❌ Token refresh failed:', refreshError?.response?.data || refreshError?.message);
        processQueue(refreshError, null);
        store.dispatch(logout());
        
        // Only redirect if not already on login page to avoid redirect loops
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export default axiosClient;