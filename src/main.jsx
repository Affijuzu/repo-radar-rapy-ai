
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import { ThemeProvider } from '@/components/ui/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import { initializeApp } from './utils/initialize';

// Initialize backend services
initializeApp().then((status) => {
  console.log("Application initialized with services:", status.servicesAvailable);
  
  // Render the application
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <BrowserRouter>
        <ThemeProvider defaultTheme="system" storageKey="anarepo-theme">
          <App />
          <Toaster />
        </ThemeProvider>
      </BrowserRouter>
    </React.StrictMode>,
  );
}).catch(error => {
  console.error("Failed to initialize application:", error);
  
  // Render the application anyway, with degraded functionality
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <BrowserRouter>
        <ThemeProvider defaultTheme="system" storageKey="anarepo-theme">
          <App />
          <Toaster />
        </ThemeProvider>
      </BrowserRouter>
    </React.StrictMode>,
  );
});
