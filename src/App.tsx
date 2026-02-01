import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/AppLayout';
import { Dashboard } from './pages/Dashboard';
import { AddLead } from './pages/AddLead';
import { Settings } from './pages/Settings';
import { LeadDetails } from './pages/LeadDetails';
import { Reports } from './pages/Reports';
import { Legal } from './pages/Legal';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/leads/:id" element={<LeadDetails />} />
          <Route path="/add" element={<AddLead />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/legal" element={<Legal />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
