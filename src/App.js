import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/AuthContext';
import { LanguageProvider } from './lib/LanguageContext';
import { Toaster } from 'sonner';
import AppLayout from './components/layout/app-layout';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import LogExplorerPage from './pages/LogExplorerPage';
import LogDetailPage from './pages/LogDetailPage';
import ErrorGroupsPage from './pages/ErrorGroupsPage';
import DockerLogsPage from './pages/DockerLogsPage';
import ProjectsPage from './pages/ProjectsPage';
import ProjectLogsPage from './pages/ProjectLogsPage';
import ChannelsPage from './pages/ChannelsPage';
import SDKDocsPage from './pages/SDKDocsPage';
import SettingsPage from './pages/SettingsPage';
import AuthCallbackPage from './pages/AuthCallbackPage';
import SetupPage from './pages/SetupPage';
import ProfilePage from './pages/ProfilePage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import TermsOfServicePage from './pages/TermsOfServicePage';
import ErrorBoundary from './components/ui/error-boundary';
import './App.css';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen"><div className="w-8 h-8 border-2 border-zinc-700 border-t-zinc-300 rounded-full animate-spin"></div></div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen"><div className="w-8 h-8 border-2 border-zinc-700 border-t-zinc-300 rounded-full animate-spin"></div></div>;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/setup" element={<ErrorBoundary><SetupPage /></ErrorBoundary>} />
      <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
      <Route path="/terms-of-service" element={<TermsOfServicePage />} />
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/signup" element={<PublicRoute><SignupPage /></PublicRoute>} />
      <Route path="/reset-password" element={<PublicRoute><ResetPasswordPage /></PublicRoute>} />
      <Route path="/auth/callback/:provider" element={<PublicRoute><AuthCallbackPage /></PublicRoute>} />
      <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<ErrorBoundary><DashboardPage /></ErrorBoundary>} />
        <Route path="logs" element={<ErrorBoundary><LogExplorerPage /></ErrorBoundary>} />
        <Route path="logs/groups" element={<ErrorBoundary><ErrorGroupsPage /></ErrorBoundary>} />
        <Route path="logs/docker" element={<ErrorBoundary><DockerLogsPage /></ErrorBoundary>} />
        <Route path="logs/:id" element={<LogDetailPage />} />
        <Route path="projects" element={<ProjectsPage />} />
        <Route path="projects/:id/logs" element={<ProjectLogsPage />} />
        <Route path="channels" element={<ChannelsPage />} />
        <Route path="sdk-docs" element={<SDKDocsPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <LanguageProvider>
          <div id="app-root">
            <AppRoutes />
            <Toaster position="top-right" richColors theme="dark" />
          </div>
        </LanguageProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
