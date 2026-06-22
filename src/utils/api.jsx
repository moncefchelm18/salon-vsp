import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  // REMOVED: "Content-Type": "application/json"
  // Let Axios and the browser set the content type automatically
});

api.interceptors.request.use(
  (config) => {
    // If you have a token in the future, it goes here
    const token = localStorage.getItem("picasso_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error.response?.data?.message || error.message);
    return Promise.reject(error);
  },
);

export default api;
