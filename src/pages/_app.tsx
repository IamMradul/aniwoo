import type { AppProps } from 'next/app';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';

export default function LegacyPagesApp({ Component, pageProps }: AppProps) {
  return (
    <MemoryRouter>
      <AuthProvider>
        <Component {...pageProps} />
      </AuthProvider>
    </MemoryRouter>
  );
}
