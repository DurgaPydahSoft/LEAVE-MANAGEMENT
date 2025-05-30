import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

export const createAuthAxios = (token) => {
  return axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
}; 