import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: { "Content-Type": "application/json" },
  // Margem para o "cold start" do Render (~1 min); evita carregamento infinito.
  timeout: 90000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("authToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response?.status === 401 &&
      !window.location.pathname.includes("/login")
    ) {
      localStorage.removeItem("authToken");
      localStorage.removeItem("currentUser");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

export default api;
