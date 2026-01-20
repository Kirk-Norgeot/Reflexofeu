import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { useVersionCheck } from './hooks/useVersionCheck';
import Layout from './components/Layout';
import { UpdateNotification } from './components/UpdateNotification';
import Login from './pages/Login';
import HomePage from './pages/HomePage';
import ClientsPage from './pages/ClientsPage';
import CreateClientPage from './pages/CreateClientPage';
import ImportClientsPage from './pages/ImportClientsPage';
import MapPage from './pages/MapPage';
import ReleveEtudePage from './pages/ReleveEtudePage';
import ReleveListPage from './pages/ReleveListPage';
import ReleveSignaturePage from './pages/ReleveSignaturePage';
import ReleveSessionSignaturePage from './pages/ReleveSessionSignaturePage';
import InstallationPage from './pages/InstallationPage';
import InstallationSignaturePage from './pages/InstallationSignaturePage';
import InstallationPhotosPage from './pages/InstallationPhotosPage';
import VerificationPage from './pages/VerificationPage';
import CreateVerificationPage from './pages/CreateVerificationPage';
import VerificationSessionPage from './pages/VerificationSessionPage';
import VerificationSignaturePage from './pages/VerificationSignaturePage';
import InfosPage from './pages/InfosPage';
import RapportsPage from './pages/RapportsPage';
import UsersPage from './pages/UsersPage';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Chargement...</div>
      </div>
    );
  }

  return user ? <>{children}</> : <Navigate to="/login" />;
}

function App() {
  const { hasUpdate, reloadApp } = useVersionCheck(60000);

  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route index element={<Navigate to="/accueil" replace />} />
          <Route path="accueil" element={<HomePage />} />
          <Route path="clients" element={<ClientsPage />} />
          <Route path="clients/new" element={<CreateClientPage />} />
          <Route path="clients/import" element={<ImportClientsPage />} />
          <Route path="clients/:id/edit" element={<CreateClientPage />} />
          <Route path="carte" element={<MapPage />} />
          <Route path="releve-etude" element={<ReleveEtudePage />} />
          <Route path="releve-etude/:releveId" element={<ReleveEtudePage />} />
          <Route path="releves-liste" element={<ReleveListPage />} />
          <Route path="releves/:releveId/signature" element={<ReleveSignaturePage />} />
          <Route path="releves/session/:sessionId/signature" element={<ReleveSessionSignaturePage />} />
          <Route path="installation" element={<InstallationPage />} />
          <Route path="installation/:siteId/signature" element={<InstallationSignaturePage />} />
          <Route path="installation/:siteId/photos" element={<InstallationPhotosPage />} />
          <Route path="verification" element={<VerificationPage />} />
          <Route path="verification/new" element={<VerificationSessionPage />} />
          <Route path="verification/signature/:sessionId" element={<VerificationSignaturePage />} />
          <Route path="infos" element={<InfosPage />} />
          <Route path="rapports" element={<RapportsPage />} />
          <Route path="utilisateurs" element={<UsersPage />} />
        </Route>
      </Routes>
      {hasUpdate && <UpdateNotification onReload={reloadApp} />}
    </>
  );
}

export default App;
