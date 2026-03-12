import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage';
import { AuthPage } from './pages/AuthPage';
import { MyEchoesPage } from './pages/MyEchoesPage';
import { CreateEchoPage } from './pages/CreateEchoPage';
import { EchoDetailPage } from './pages/EchoDetailPage';
import { ProtectedLayout } from './components/ui/ProtectedLayout';
import './App.css';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<AuthPage />} />

        {/* Protected — share the Nav + auth guard */}
        <Route element={<ProtectedLayout />}>
          <Route path="/echoes" element={<MyEchoesPage />} />
          <Route path="/echoes/:id" element={<EchoDetailPage />} />
          <Route path="/create" element={<CreateEchoPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
