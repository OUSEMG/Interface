import { Link, NavLink } from 'react-router-dom';
import logoUrl from '@assets/ousemg-logo.jpg';
import { useAuth } from '../../../context/AuthContext.jsx';
import './NavBar.css';

const NAV_LINKS = [
  { label: 'Home', path: '/', end: true },
  { label: 'Atlas', path: '/atlas', end: false },
  { label: 'Portfolio', path: '/portfolio', end: true },
  { label: 'Professional Development', path: '/professional-development', end: false },
];

export default function NavBar() {
  const { logout, user } = useAuth();

  return (
    <header className="nav">
      <div className="nav__inner">
        <Link to="/" className="nav__brand" aria-label="OUSEMG Interface home">
          <img src={logoUrl} alt="" className="nav__logo" />
          <span>OUSEMG</span>
        </Link>

        <nav className="nav__links" aria-label="Main navigation">
          {NAV_LINKS.map(({ label, path, end }) => (
            <NavLink
              key={path}
              to={path}
              end={end}
              className={({ isActive }) =>
                `nav__link ${isActive ? 'nav__link--active' : ''}`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="nav__session">
          {user?.display_name ? (
            <span className="nav__user">{user.display_name}</span>
          ) : null}
          <button type="button" className="nav__login" onClick={logout}>
            Sign Out
          </button>
        </div>
      </div>
    </header>
  );
}
