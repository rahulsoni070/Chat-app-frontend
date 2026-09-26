import axios from "axios";

export const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5001";

const SESSION_KEY = "chatUser";

export const api = axios.create({ baseURL: API_URL });

let authToken = null;
let onUnauthorized = () => {};

export const setAuthToken = (token) => {
  authToken = token;
};

export const setUnauthorizedHandler = (handler) => {
  onUnauthorized = handler;
};

api.interceptors.request.use((config) => {
  if (authToken) config.headers.Authorization = `Bearer ${authToken}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthRoute = error.config?.url?.startsWith("/auth/login") ||
      error.config?.url?.startsWith("/auth/register");
    if (error.response?.status === 401 && !isAuthRoute) onUnauthorized();
    return Promise.reject(error);
  }
);

export const loadSession = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(SESSION_KEY));
    return saved?.token && saved?.username ? saved : null;
  } catch {
    return null;
  }
};

export const saveSession = (session) => {
  try {
    if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    else localStorage.removeItem(SESSION_KEY);
  } catch {
    // Storage can be unavailable (private mode); the session just won't persist.
  }
};

export const errorMessage = (error, fallback = "Something went wrong.") =>
  error.response?.data?.message ||
  (error.request && !error.response
    ? "Can't reach the server. It may be waking up — try again in a moment."
    : fallback);
