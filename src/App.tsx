import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/AppLayout';
import { Dashboard } from './pages/Dashboard';
import { AddLead } from './pages/AddLead';
import { Settings } from './pages/Settings';
import { LeadDetails } from './pages/LeadDetails';
import { Reports } from './pages/Reports';
import { Legal } from './pages/Legal';
import { UserGuide } from './pages/UserGuide';

import { LandingPage } from './pages/LandingPage';

function RootWrapper() {
  const hasOnboarded = localStorage.getItem('crm_onboarded');

  if (!hasOnboarded) {
    return <LandingPage />;
  }

  return <Dashboard />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes - Accessible without Layout */}
        <Route path="/legal" element={<Legal />} />
        <Route path="/privacy-policy" element={<Legal />} />
        <Route path="/terms-condition" element={<Legal />} />
        <Route path="/doc" element={<UserGuide />} />

        {/* Main App Routes - Protected by Layout */}
        <Route element={<AppLayout />}>
          <Route path="/" element={<RootWrapper />} />
          <Route path="/leads/:id" element={<LeadDetails />} />
          <Route path="/add" element={<AddLead />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/reports" element={<Reports />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
