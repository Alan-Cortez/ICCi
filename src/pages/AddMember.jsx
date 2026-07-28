import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { MemberForm } from '../components/MemberForm';
import { createMember } from '../services/memberService';

export const AddMember = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false); // evita doble envío

    const handleSubmit = async (data) => {
        if (submitted) return; // previene duplicados si el usuario hace doble clic
        try {
            setLoading(true);
            setSubmitted(true);
            await createMember(data);
            navigate('/members');
        } catch (error) {
            console.error('Error al crear miembro:', error);
            // Si el error es solo de notificaciones, el miembro SÍ se guardó → redirigir igual
            const esErrorDeNotificacion =
                error?.message?.includes('users_old') ||
                error?.message?.includes('notifications') ||
                error?.message?.includes('push');

            if (esErrorDeNotificacion) {
                // El miembro se guardó correctamente, el error es no-crítico
                navigate('/members');
            } else {
                // Error real al guardar el miembro
                setSubmitted(false);
                alert('Error al guardar el miembro. Por favor inténtalo de nuevo.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white shadow-sm p-4 sticky top-0 z-10">
                <div className="max-w-3xl mx-auto flex items-center">
                    <button
                        onClick={() => navigate('/')}
                        className="mr-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <ArrowLeft className="w-6 h-6 text-gray-600" />
                    </button>
                    <h1 className="text-xl font-bold text-gray-900">Nuevo Miembro</h1>
                </div>
            </div>

            <div className="max-w-3xl mx-auto p-4">
                <div className="bg-white rounded-xl shadow-sm p-6">
                    <MemberForm
                        onSubmit={handleSubmit}
                        onCancel={() => navigate('/')}
                        loading={loading}
                    />
                </div>
            </div>
        </div>
    );
};
