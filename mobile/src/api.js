import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';

// Detecta o IP do computador que roda o Expo (mesma rede Wi-Fi) e usa a porta 3333 do backend.
// Para forçar outro endereço: defina EXPO_PUBLIC_API_URL (ex.: http://192.168.0.10:3333/api).
function baseUrl() {
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL;
  const host = Constants.expoConfig?.hostUri?.split(':')[0] || 'localhost';
  return `http://${host}:3333/api`;
}
export const API_URL = baseUrl();
const REQUEST_TIMEOUT_MS = 15000;

let token = null;
export const setToken = async (t) => {
  token = t;
  try { t ? await SecureStore.setItemAsync('token', t) : await SecureStore.deleteItemAsync('token'); } catch {}
};
export const loadToken = async () => {
  try { token = await SecureStore.getItemAsync('token'); } catch { token = null; }
  return token;
};

export async function api(method, path, body) {
  let res;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    res = await fetch(API_URL + path, {
      method,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error(`Tempo limite ao conectar ao servidor (${API_URL}). Verifique se o backend está rodando e se o celular está na mesma rede Wi-Fi.`);
    }
    throw new Error(`Não foi possível conectar ao servidor (${API_URL}). Verifique se o backend está rodando e se o celular está na mesma rede.`);
  } finally {
    clearTimeout(timeout);
  }
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || 'Erro inesperado.');
    err.status = res.status;
    throw err;
  }
  return data;
}
