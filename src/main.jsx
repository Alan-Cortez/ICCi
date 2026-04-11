import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { ThemeProvider } from './context/ThemeContext'

// Register Service Worker with cache busting
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // Usamos un query string para forzar al navegador a ver un archivo "nuevo"
        navigator.serviceWorker.register('/sw.js?v=6')
            .then((registration) => {
                console.log('✅ Service Worker registered:', registration.scope);

                // Forzar la actualización si hay un nuevo service worker esperando
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            console.log('🔄 New version available! Forcing reload...');
                            window.location.reload();
                        }
                    });
                });
            })
            .catch((error) => {
                console.error('❌ Service Worker registration failed:', error);
            });
    });

    // Asegurarse de que el nuevo SW tome el control de inmediato
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
            window.location.reload();
            refreshing = true;
        }
    });
}

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <ThemeProvider>
            <App />
        </ThemeProvider>
    </React.StrictMode>,
)
