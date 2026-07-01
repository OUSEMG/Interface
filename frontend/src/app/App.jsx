import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute.jsx';
import LandingPage from '../modules/atlas/pages/LandingPage.jsx';
import ToolingPage from '../modules/atlas/pages/ToolingPage.jsx';
import AlumniPage from '../modules/professional-development/pages/AlumniPage.jsx';
import ApplicationTrackerPage from '../modules/professional-development/application-tracker/ApplicationTrackerPage.jsx';
import ProfDevLanding from '../modules/professional-development/pages/ProfDevLanding.jsx';
import PortfolioTrackerPage from '../modules/portfolio-tracking/pages/PortfolioTrackerPage.jsx';
import HomeLanding from '../pages/HomeLanding/HomeLanding.jsx';
import LandingLogin from '../pages/LandingLogin/LandingLogin.jsx';
import Layout from './Layout.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LandingLogin />} />
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<HomeLanding />} />
        <Route path="/atlas" element={<LandingPage />} />
        <Route path="/atlas/tooling" element={<ToolingPage />} />
        <Route path="/portfolio" element={<PortfolioTrackerPage />} />
        <Route path="/professional-development" element={<ProfDevLanding />} />
        <Route path="/professional-development/alumni" element={<AlumniPage />} />
        <Route path="/professional-development/applications" element={<ApplicationTrackerPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
