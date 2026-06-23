import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import App from './App.tsx';
import './index.css';

// --- Production Cache Purge ---
// Clear all legacy local storage and session storage
try {
  localStorage.clear();
  sessionStorage.clear();
  
  // Unregister any lingering service workers
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(function(registrations) {
      for(let registration of registrations) {
        registration.unregister();
      }
    }).catch(function(err) {
      console.log('Service Worker registration failed: ', err);
    });
  }
} catch (e) {
  console.error("Cache purge failed", e);
}
// ------------------------------

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
