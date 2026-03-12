import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ArrowLeft, Search } from 'lucide-react';
import { MemberCard } from '../components/MemberCard';
import { getAllMembers, deleteMember } from '../services/memberService';
import { Loader2 } from 'lucide-react';

export const Members = () => {
    const navigate = useNavigate();
    const [members, setMembers] = useState([]);
    const [filteredMembers, setFilteredMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const loadMembers = async () => {
        try {
            setLoading(true);
            const data = await getAllMembers();
            setMembers(data);
            setFilteredMembers(data);
        } catch (error) {
            console.error('Error al cargar miembros:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadMembers();
    }, []);

    useEffect(() => {
        const lowerTerm = searchTerm.toLowerCase();
        const filtered = members.filter(member =>
            member.nombre.toLowerCase().includes(lowerTerm) ||
            member.apellido_paterno.toLowerCase().includes(lowerTerm) ||
            member.apellido_materno.toLowerCase().includes(lowerTerm)
        );
        setFilteredMembers(filtered);
    }, [searchTerm, members]);

    const handleEdit = (member) => {
        navigate(`/edit-member/${member.id}`);
    };

    const handleDelete = async (id) => {
        if (confirm('¿Estás seguro de eliminar este miembro?')) {
            try {
                await deleteMember(id);
                loadMembers();
            } catch (error) {
                console.error('Error al eliminar miembro:', error);
            }
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
                <p className="text-gray-500">Cargando miembros...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 shadow-sm p-4 sticky top-0 z-10">
                <div className="max-w-3xl mx-auto">
                    <div className="flex items-center mb-4">
                        <button
                            onClick={() => navigate('/')}
                            className="mr-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                        >
                            <ArrowLeft className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                        </button>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Gestionar Miembros</h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{members.length} miembros totales</p>
                        </div>
                    </div>

                    {/* Buscador */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Buscar miembro..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                </div>
            </div>

            {/* Lista de miembros */}
            <div className="max-w-3xl mx-auto p-4">
                {filteredMembers.length === 0 ? (
                    <div className="text-center py-20 text-gray-500 dark:text-gray-400">
                        {searchTerm ? 'No se encontraron miembros' : 'No hay miembros registrados'}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredMembers.map((member) => (
                            <MemberCard
                                key={member.id}
                                member={member}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Botón flotante */}
            <button
                onClick={() => navigate('/add-member')}
                className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-blue-700 transition-transform hover:scale-105 active:scale-95 border border-white dark:border-gray-800"
            >
                <Plus className="w-8 h-8" />
            </button>
        </div>
    );
};
