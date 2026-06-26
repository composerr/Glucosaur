import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import useAppSettings from '@/lib/useAppSettings';
import Layout from './components/Layout';
import Welcome from './pages/Welcome';
import Dashboard from './pages/Dashboard';
import Glucose from './pages/Glucose';
import Meals from './pages/Meals';
import Medications from './pages/Medications';
import Reports from './pages/Reports';
import SettingsPage from './pages/SettingsPage';
import Recipes from './pages/Recipes';
import GlycemicIndex from './pages/GlycemicIndex';
import DailyTips from './pages/DailyTips';
import Stores from './pages/Stores';
import Reminders from './pages/Reminders';
import Achievements from './pages/Achievements';
import useReminders from './hooks/useReminders';

const AuthenticatedApp = () => {
  useReminders();
  const { isLoadingAuth, isLoadingPublicSettings, authError, isAuthenticated, authChecked } = useAuth();
  const { settings, updateSettings, loading: settingsLoading } = useAppSettings();

  if (isLoadingPublicSettings || isLoadingAuth || settingsLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      return <Welcome />;
    }
  }

  // Not authenticated — show welcome page
  if (!isAuthenticated && authChecked) {
    return <Welcome />;
  }

  return (
    <Routes>
      <Route element={<Layout lang={settings.language} settings={settings} />}>
        <Route path="/" element={<Dashboard settings={settings} />} />
        <Route path="/glucose" element={<Glucose settings={settings} />} />
        <Route path="/meals" element={<Meals settings={settings} />} />
        <Route path="/medications" element={<Medications settings={settings} />} />
        <Route path="/reports" element={<Reports settings={settings} />} />
        <Route path="/settings" element={<SettingsPage settings={settings} updateSettings={updateSettings} />} />
        <Route path="/recipes" element={<Recipes settings={settings} />} />
        <Route path="/glycemic" element={<GlycemicIndex settings={settings} />} />
        <Route path="/tips" element={<DailyTips settings={settings} />} />
        <Route path="/stores" element={<Stores settings={settings} />} />
        <Route path="/reminders" element={<Reminders settings={settings} />} />
        <Route path="/achievements" element={<Achievements settings={settings} />} />
        <Route path="*" element={<PageNotFound />} />
      </Route>
    </Routes>
  );
};

function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App