import axios from "axios";
import { getAuth } from "firebase/auth";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_BASE_URL,
  withCredentials: true,
  timeout: 120000,
});

apiClient.interceptors.request.use(async (config) => {
  const auth = getAuth();
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      getAuth().signOut();
      window.location.href = "/signin";
    }
    return Promise.reject(error);
  },
);

const monitoringSnapShot = async () => {
  return apiClient.get("/monitor/snapshot");
};

export { monitoringSnapShot };
