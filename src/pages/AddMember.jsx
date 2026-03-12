import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { MemberForm } from '../components/MemberForm';
import { createMember } from '../services/memberService';

export const AddMember = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (data) => {
        try {
            setLoading(true);
            await createMember(data);
            navigate('/');
        } catch (error) {
            console.error('Error al crear miembro:', error);
            alert('Error al guardar el miembro');
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
