import axios from "axios";

// ── LA MAGIE EST ICI ──
// Si on est en "npm run dev" (développement), on utilise le .env
// Si on est compilé (dans le .exe ou l'iPad), on utilise "/api" pour s'adapter automatiquement à la vraie IP / localhost !
const isDev = import.meta.env.MODE === "development";

const API_BASE_URL = isDev
  ? import.meta.env.VITE_API_URL || "http://localhost:5000/api"
  : "/api";

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use(
  (config) => {
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
