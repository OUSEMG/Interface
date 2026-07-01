import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const TOKEN_KEY = 'ousemg_token';
const USER_KEY = 'ousemg_user';

const AuthContext = createContext(null);

function readStoredUser() {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    localStorage.removeItem(USER_KEY);
    return null;
  }
}

export function clearStoredAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(readStoredUser);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function hydrateUser() {
      if (!token) {
        setAuthReady(true);
        return;
      }

      try {
        const response = await fetch('/api/auth/me', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Invalid session');
        }

        const data = await response.json();
        if (cancelled) return;

        const nextUser = {
          username: data.username,
          display_name: data.display_name,
          role: data.role,
        };
        localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
        setUser(nextUser);
      } catch {
        if (!cancelled) {
          clearStoredAuth();
          setToken(null);
          setUser(null);
        }
      } finally {
        if (!cancelled) setAuthReady(true);
      }
    }

    hydrateUser();

    return () => {
      cancelled = true;
    };
  }, [token]);

  function login(tokenData) {
    const nextUser = {
      display_name: tokenData.display_name,
      role: tokenData.role,
    };

    localStorage.setItem(TOKEN_KEY, tokenData.access_token);
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
    setToken(tokenData.access_token);
    setUser(nextUser);
    setAuthReady(true);
  }

  async function logout() {
    const currentToken = localStorage.getItem(TOKEN_KEY);
    await fetch('/api/auth/logout', {
      method: 'POST',
      headers: currentToken ? { Authorization: `Bearer ${currentToken}` } : {},
    }).catch(() => {});

    clearStoredAuth();
    setToken(null);
    setUser(null);
    setAuthReady(true);
  }

  const value = useMemo(
    () => ({
      token,
      user,
      authReady,
      login,
      logout,
      isAuthenticated: Boolean(token),
    }),
    [authReady, token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
