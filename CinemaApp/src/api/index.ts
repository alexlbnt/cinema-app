import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

// Descobre automaticamente o IP do PC que está rodando o Expo (mesmo IP do backend).
// Para forçar outro endereço, defina EXPO_PUBLIC_API_URL (ex: http://192.168.0.10:3000).
function resolveBaseUrl(): string {
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL;
  const hostUri = Constants.expoConfig?.hostUri; // ex: "10.43.57.141:8081"
  const host = hostUri?.split(':')[0];
  if (host) return `http://${host}:3000`;
  return 'http://10.0.2.2:3000'; // fallback: emulador Android
}

export const BASE_URL = resolveBaseUrl();

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// Injeta o token JWT em toda requisição automaticamente
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('jwt_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor de resposta para tratar 401 (token expirado)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await SecureStore.deleteItemAsync('jwt_token');
      await SecureStore.deleteItemAsync('user_data');
    }
    return Promise.reject(error);
  }
);

// ============ AUTH ============
export const authApi = {
  login: (email: string, senha: string) =>
    api.post('/auth/login', { email, senha }),

  register: (nome: string, email: string, senha: string) =>
    api.post('/auth/register', { nome, email, senha }),

  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }),

  me: () => api.get('/auth/me'),
};

// ============ FILMES ============
export const filmesApi = {
  getAll: () => api.get('/filme'),
  getOne: (id: number) => api.get(`/filme/${id}`),
};

// ============ SESSÕES ============
export const sessoesApi = {
  getAll: () => api.get('/sessao'),
  getOne: (id: number) => api.get(`/sessao/${id}`),
  getByFilme: (filmeId: number) => api.get(`/sessao?filmeId=${filmeId}`),
};

// ============ INGRESSOS ============
export const ingressosApi = {
  getAll: () => api.get('/ingresso'),
  create: (data: {
    sessaoId: number;
    tipo: 'Inteira' | 'Meia';
    valorPago: number;
    assento: string;
    usuarioId?: number;
  }) => api.post('/ingresso', data),
};

// ============ SNACKS ============
export const snacksApi = {
  getAll: () => api.get('/snack'),
};

// ============ PEDIDOS ============
export const pedidosApi = {
  create: (data: {
    ingressoIds: number[];
    snackIds: number[];
    valorTotal: number;
  }) => api.post('/pedido', data),

  getAll: () => api.get('/pedido'),
  getOne: (id: number) => api.get(`/pedido/${id}`),
};
