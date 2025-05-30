import axios from 'axios';
import config from '../config';

const authAxios = axios.create({
  baseURL: config.API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  withCredentials: true
});

// Add request interceptor
authAxios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['x-auth-token'] = token;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor
authAxios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      console.error('Auth Response Error:', error.response.data);
      return Promise.reject(error.response.data);
    } else if (error.request) {
      console.error('Auth Request Error:', error.request);
      return Promise.reject({ 
        msg: 'No response from server. Please try again.',
        isNetworkError: true
      });
    } else {
      console.error('Auth Error:', error.message);
      return Promise.reject({ 
        msg: error.message,
        isError: true
      });
    }
  }
);

export default authAxios; 