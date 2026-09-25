import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { MotionConfig } from 'framer-motion';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './styles/bootstrap.scss';
import './styles/index.css';
import { SiteProvider } from './context/SiteContext';
import { AuthProvider } from './context/AuthContext';
import App from './App';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '') || undefined}>
      <SiteProvider>
        <AuthProvider>
          <MotionConfig reducedMotion="user">
            <App />
          </MotionConfig>
          <Toaster position="top-right" toastOptions={{ style: { borderRadius: '14px', fontWeight: 500 }, success: { iconTheme: { primary: 'rgb(var(--brand-600))', secondary: '#fff' } } }} />
        </AuthProvider>
      </SiteProvider>
    </BrowserRouter>
  </StrictMode>
);
