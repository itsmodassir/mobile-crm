import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';
import { AppLayout } from './components/AppLayout';
import { Dashboard } from './pages/Dashboard';
import { AddLead } from './pages/AddLead';
import { Settings } from './pages/Settings';
import { LeadDetails } from './pages/LeadDetails';
import { Reports } from './pages/Reports';
import { Legal } from './pages/Legal';
import { UserGuide } from './pages/UserGuide';
import { LandingPage } from './pages/LandingPage';
import { Login } from './pages/Login';
import { AdvanceCrm } from './pages/AdvanceCrm';
import { Clients } from './pages/crm/Clients';
import { Pipeline } from './pages/crm/Pipeline';
import { Invoices } from './pages/crm/Invoices';
import { Proposals } from './pages/crm/Proposals';
import { Employees } from './pages/crm/Employees';
import { Attendance } from './pages/crm/Attendance';
import { Payroll } from './pages/crm/Payroll';
import { Accounts } from './pages/crm/Accounts';
import { Catalogue } from './pages/crm/Catalogue';
import { Chat } from './pages/Chat';
import { Reports as AdvanceCrmReports } from './pages/crm/Reports';
import { auth } from './lib/auth';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  if (!auth.isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

function RootWrapper() {
  const hasOnboarded = localStorage.getItem('crm_onboarded');

  if (!hasOnboarded) {
    return <LandingPage />;
  }

  if (!auth.isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  return <Dashboard />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/legal" element={<Legal />} />
        <Route path="/privacy-policy" element={<Legal />} />
        <Route path="/terms-condition" element={<Legal />} />
        <Route path="/doc" element={<UserGuide />} />
        <Route path="/login" element={<Login />} />

        <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route path="/" element={<RootWrapper />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/leads/:id" element={<LeadDetails />} />
          <Route path="/add" element={<AddLead />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/advance-crm" element={<AdvanceCrm />} />
          <Route path="/advance-crm/clients" element={<Clients />} />
          <Route path="/advance-crm/pipeline" element={<Pipeline />} />
          <Route path="/advance-crm/invoices" element={<Invoices />} />
          <Route path="/advance-crm/proposals" element={<Proposals />} />
          <Route path="/advance-crm/employees" element={<Employees />} />
          <Route path="/advance-crm/attendance" element={<Attendance />} />
          <Route path="/advance-crm/payroll" element={<Payroll />} />
          <Route path="/advance-crm/accounts" element={<Accounts />} />
          <Route path="/advance-crm/reports" element={<AdvanceCrmReports />} />
          <Route path="/advance-crm/catalogue" element={<Catalogue />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
