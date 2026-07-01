import { Outlet } from 'react-router-dom';
import NavBar from './components/NavBar/NavBar.jsx';

export default function Layout() {
  return (
    <>
      <NavBar />
      <Outlet />
    </>
  );
}
