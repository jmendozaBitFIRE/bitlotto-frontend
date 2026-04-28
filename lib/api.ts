import { getAccessToken, clearAuthData } from './auth';

const BASE_URL = '/api';

interface RequestOptions extends RequestInit {
  params?: Record<string, string>;
}

export const api = async (endpoint: string, options: RequestOptions = {}) => {
  const { params, ...customConfig } = options;
  
  const token = getAccessToken();
  
  // Determinamos los headers iniciales
  const headers: Record<string, string> = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  // Solo agregamos Content-Type si NO es FormData (el navegador lo maneja automáticamente con el boundary)
  if (!(customConfig.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const config: RequestInit = {
    ...customConfig,
    headers: {
      ...headers,
      ...customConfig.headers,
    },
  };

  // Limpiar el endpoint para evitar doble slash si viene con uno
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const urlBase = `${BASE_URL}${cleanEndpoint}`;
  
  let url = urlBase;
  if (params) {
    const searchParams = new URLSearchParams(params);
    url += `?${searchParams.toString()}`;
  }

  try {
    const response = await fetch(url, config);

    // Manejo de tokens expirados (401)
    if (response.status === 401) {
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        clearAuthData();
        window.location.href = '/login';
      }
    }

    // Intentar parsear JSON
    let data;
    try {
      data = await response.json();
    } catch (e) {
      data = { message: 'Error en la respuesta del servidor' };
    }

    if (!response.ok) {
      throw new Error(data.message || `Error ${response.status}: ${response.statusText}`);
    }

    return data;
  } catch (error: any) {
    console.error('API Error:', error.message);
    throw error;
  }
};
