import { Suspense, lazy } from 'react';
import { Route, Routes } from 'react-router-dom';
import { Layout } from './components/layout/Layout';

const HomePage = lazy(() => import('./pages/Home'));
const AiHealthCheckPage = lazy(() => import('./pages/AiHealthCheck'));
const ShopPage = lazy(() => import('./pages/Shop'));
const VetsPage = lazy(() => import('./pages/Vets'));
const MatingConnectPage = lazy(() => import('./pages/MatingConnect'));
const AboutPage = lazy(() => import('./pages/About'));
const ContactPage = lazy(() => import('./pages/Contact'));
const LoginPage = lazy(() => import('./pages/Login'));
const SignupPage = lazy(() => import('./pages/Signup'));
const ProfilePage = lazy(() => import('./pages/Profile'));

function App() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading Aniwoo...</div>}>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/ai-health-check" element={<AiHealthCheckPage />} />
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/vets" element={<VetsPage />} />
          <Route path="/mating-connect" element={<MatingConnectPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}

export default App;


