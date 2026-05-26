import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { initializeDatabase } from './database/turso';
import { AuthProvider } from './context/AuthContext';
import { NetworkProvider } from './context/NetworkContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './pages/Login';
import { ForgotPassword } from './pages/ForgotPassword';
import { ResetPassword } from './pages/ResetPassword';
import { Home } from './pages/Home';
import { Members } from './pages/Members';
import { Ministries } from './pages/Ministries';
import { MinistryDetail } from './pages/MinistryDetail';
import { AddMember } from './pages/AddMember';
import { EditMember } from './pages/EditMember';
import { YouthMinistry } from './pages/YouthMinistry';
import { Admin } from './pages/Admin';
import { Sermons } from './pages/Sermons';
import { NotificationsPage } from './pages/NotificationsPage';
import { Treasury } from './pages/Treasury';
import { Loader2 } from 'lucide-react';

function App() {
    const [isReady, setIsReady] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const initApp = async () => {
            try {
                await initializeDatabase();
                setIsReady(true);
            } catch (err) {
                console.error('Error al inicializar la app:', err);
                setError(err.message);
            }
        };

        initApp();
    }, []);

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-red-50 dark:bg-gray-900 p-6 max-w-lg mx-auto">
                <h1 className="text-xl font-bold text-red-600 dark:text-red-400 mb-2">No se pudo iniciar la aplicación</h1>
                <p className="text-red-700 dark:text-red-300 text-center text-sm mb-4">{error}</p>
                <div className="text-left text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 w-full space-y-2">
                    <p className="font-semibold">Pasos para desarrollo local:</p>
                    <ol className="list-decimal list-inside space-y-1">
                        <li>Copia <code className="text-xs bg-gray-100 dark:bg-gray-700 px-1 rounded">.env.example</code> a <code className="text-xs bg-gray-100 dark:bg-gray-700 px-1 rounded">.env.local</code></li>
                        <li>Completa Turso y JWT (mín. 32 caracteres)</li>
                        <li>Ejecuta <code className="text-xs bg-gray-100 dark:bg-gray-700 px-1 rounded">npm run dev</code> (API + Vite)</li>
                    </ol>
                </div>
                <button
                    type="button"
                    onClick={() => window.location.reload()}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                >
                    Reintentar
                </button>
            </div>
        );
    }

    if (!isReady) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
                <p className="text-gray-500 font-medium">Inicializando aplicación...</p>
            </div>
        );
    }

    return (
        <AuthProvider>
            <NetworkProvider>
                <Router>
                    <Routes>
                        <Route path="/login" element={<Login />} />
                        <Route path="/forgot-password" element={<ForgotPassword />} />
                        <Route path="/reset-password" element={<ResetPassword />} />
                        <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
                        <Route path="/members" element={<ProtectedRoute><Members /></ProtectedRoute>} />
                        <Route path="/ministries" element={<ProtectedRoute requireAdmin><Ministries /></ProtectedRoute>} />
                        <Route path="/ministry/:id" element={<ProtectedRoute><MinistryDetail /></ProtectedRoute>} />
                        <Route path="/add-member" element={<ProtectedRoute><AddMember /></ProtectedRoute>} />
                        <Route path="/edit-member/:id" element={<ProtectedRoute requireAdmin><EditMember /></ProtectedRoute>} />
                        <Route path="/youth-ministry" element={<ProtectedRoute><YouthMinistry /></ProtectedRoute>} />
                        <Route path="/admin" element={<ProtectedRoute requireAdmin><Admin /></ProtectedRoute>} />
                        <Route path="/sermons" element={<ProtectedRoute requireAdmin><Sermons /></ProtectedRoute>} />
                        <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
                        <Route path="/treasury" element={<ProtectedRoute requireTreasurer><Treasury /></ProtectedRoute>} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </Router>
            </NetworkProvider>
        </AuthProvider>
    );
}

export default App;
