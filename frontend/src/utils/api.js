import { clearStoredAuth } from '../context/AuthContext.jsx';

export async function apiFetch(path, options = {}) {
  const token = localStorage.getItem('ousemg_token');
  const isFormData = options.body instanceof FormData;

  const response = await fetch(path.startsWith('/api') ? path : `/api${path}`, {
    ...options,
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  if (response.status === 401) {
    clearStoredAuth();
    window.location.href = '/login';
  }

  return response;
}
