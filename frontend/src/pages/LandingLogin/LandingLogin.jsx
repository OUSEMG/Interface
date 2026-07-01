import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logoUrl from '@assets/ousemg-logo.jpg';
import { useAuth } from '../../context/AuthContext.jsx';
import './LandingLogin.css';

export default function LandingLogin() {
  const navigate = useNavigate();
  const { authReady, isAuthenticated, login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (authReady && isAuthenticated) {
      navigate('/portfolio', { replace: true });
    }
  }, [authReady, isAuthenticated, navigate]);

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.detail || 'Invalid username or password');
      }

      const data = await response.json();
      login(data);
      navigate('/portfolio', { replace: true });
    } catch (loginError) {
      setError(loginError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-card" aria-labelledby="login-title">
        <img src={logoUrl} alt="" className="login-card__logo" />
        <p className="login-card__eyebrow">Ohio University</p>
        <h1 id="login-title" className="login-card__title">
          Student Equity Management Group
        </h1>
        <p className="login-card__subtitle">
          Sign in to access the member interface.
        </p>

        <form className="login-form" onSubmit={handleSubmit}>
          <label className="login-form__field">
            <span>Username</span>
            <input
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="username"
              disabled={loading}
              required
            />
          </label>

          <label className="login-form__field">
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              disabled={loading}
              required
            />
          </label>

          {error ? <p className="login-form__error">{error}</p> : null}

          <button type="submit" className="login-form__submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </section>
    </main>
  );
}
