import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { initializeDatabase } from './database/turso';
import { AuthProvider } from './context/AuthContext';
import { NetworkProvider } from './context/NetworkContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './pages/Login';
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
            <div className="flex flex-col items-center justify-center min-h-screen bg-red-50 p-4">
                <h1 className="text-xl font-bold text-red-600 mb-2">Error al conectar con la base de datos</h1>
                <p className="text-red-500 text-center">{error}</p>
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
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </Router>
            </NetworkProvider>
        </AuthProvider>
    );
}

export default App;
