import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';
import { FootprintTrail } from '../common/FootprintTrail';

export const Layout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-light text-dark">
      <FootprintTrail />
      <Header />
      <main className="flex-1 pt-16">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};


