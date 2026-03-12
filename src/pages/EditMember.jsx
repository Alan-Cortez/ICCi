import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { MemberForm } from '../components/MemberForm';
import { getMemberById, updateMember } from '../services/memberService';

export const EditMember = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [member, setMember] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const loadMember = async () => {
            try {
                const data = await getMemberById(id);
                setMember(data);
            } catch (error) {
                console.error('Error al cargar miembro:', error);
                alert('Error al cargar los datos del miembro');
                navigate('/');
            } finally {
                setLoading(false);
            }
        };
        loadMember();
    }, [id, navigate]);

    const handleSubmit = async (data) => {
        try {
            setSaving(true);
            await updateMember(id, data);
            navigate('/');
        } catch (error) {
            console.error('Error al actualizar miembro:', error);
            alert('Error al actualizar el miembro');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
                <p className="text-gray-500">Cargando datos...</p>
            </div>
        );
    }

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
                    <h1 className="text-xl font-bold text-gray-900">Editar Miembro</h1>
                </div>
            </div>

            <div className="max-w-3xl mx-auto p-4">
                <div className="bg-white rounded-xl shadow-sm p-6">
                    <MemberForm
                        initialData={member}
                        onSubmit={handleSubmit}
                        onCancel={() => navigate('/')}
                        loading={saving}
                    />
                </div>
            </div>
        </div>
    );
};
