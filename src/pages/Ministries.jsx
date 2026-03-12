import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Users, ChevronRight, Loader2 } from 'lucide-react';
import { getAllMinistries, createMinistry } from '../services/ministryService';

export const Ministries = () => {
    const navigate = useNavigate();
    const [ministries, setMinistries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newMinistry, setNewMinistry] = useState({ nombre: '', descripcion: '' });

    useEffect(() => {
        loadMinistries();
    }, []);

    const loadMinistries = async () => {
        try {
            setLoading(true);
            const data = await getAllMinistries();
            setMinistries(data);
        } catch (error) {
            console.error('Error al cargar ministerios:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!newMinistry.nombre.trim()) return;

        try {
            await createMinistry(newMinistry.nombre, newMinistry.descripcion);
            setShowCreateModal(false);
            setNewMinistry({ nombre: '', descripcion: '' });
            loadMinistries();
        } catch (error) {
            console.error('Error al crear ministerio:', error);
        }
    };

    const handleMinistryClick = (ministry) => {
        if (ministry.nombre.toLowerCase() === 'jóvenes' || ministry.nombre.toLowerCase() === 'jovenes') {
            navigate('/youth-ministry');
        } else {
            navigate(`/ministry/${ministry.id}`);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 shadow-sm p-4 sticky top-0 z-10">
                <div className="max-w-3xl mx-auto flex items-center">
                    <button
                        onClick={() => navigate('/')}
                        className="mr-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                    >
                        <ArrowLeft className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                    </button>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Ministerios</h1>
                </div>
            </div>

            <div className="max-w-3xl mx-auto p-4 space-y-4">
                {/* Lista de Ministerios Dinámicos */}
                {ministries.map(ministry => (
                    <div
                        key={ministry.id}
                        onClick={() => handleMinistryClick(ministry)}
                        className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between cursor-pointer hover:shadow-md transition-shadow"
                    >
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${ministry.nombre.toLowerCase().includes('jóvenes') || ministry.nombre.toLowerCase().includes('jovenes')
                                ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                                : 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400'
                                }`}>
                                <Users className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 dark:text-gray-100 text-lg">{ministry.nombre}</h3>
                                {ministry.descripcion && (
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{ministry.descripcion}</p>
                                )}
                            </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                ))}

                {ministries.length === 0 && (
                    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                        No hay ministerios registrados
                    </div>
                )}
            </div>

            {/* FAB Crear Ministerio */}
            <button
                onClick={() => setShowCreateModal(true)}
                className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-blue-700 transition-transform hover:scale-105 active:scale-95"
            >
                <Plus className="w-8 h-8" />
            </button>

            {/* Modal Crear */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-md p-6">
                        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">Nuevo Ministerio</h2>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre</label>
                                <input
                                    type="text"
                                    value={newMinistry.nombre}
                                    onChange={e => setNewMinistry({ ...newMinistry, nombre: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="Ej. Ministerio de Alabanza"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descripción</label>
                                <textarea
                                    value={newMinistry.descripcion}
                                    onChange={e => setNewMinistry({ ...newMinistry, descripcion: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="Breve descripción..."
                                    rows="3"
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="flex-1 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                                >
                                    Crear
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
