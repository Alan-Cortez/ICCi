import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, BookOpen, Calendar, User, Trash2, Eye, Edit2, Loader2, Search } from 'lucide-react';
import { getAllSermons, deleteSermon } from '../services/sermonService';
import { SermonForm } from '../components/SermonForm';
import { SermonDetail } from '../components/SermonDetail';

export const Sermons = () => {
    const navigate = useNavigate();
    const [sermons, setSermons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [showDetail, setShowDetail] = useState(false);
    const [selectedSermon, setSelectedSermon] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadSermons();
    }, []);

    const loadSermons = async () => {
        try {
            setLoading(true);
            const data = await getAllSermons();
            setSermons(data);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (confirm('¿Estás seguro de eliminar esta predicación?')) {
            try {
                await deleteSermon(id);
                loadSermons();
            } catch (error) {
                alert('Error al eliminar predicación');
            }
        }
    };

    const handleEdit = (sermon) => {
        setSelectedSermon(sermon);
        setShowForm(true);
    };

    const handleView = (sermon) => {
        setSelectedSermon(sermon);
        setShowDetail(true);
    };

    const handleCloseForm = () => {
        setShowForm(false);
        setSelectedSermon(null);
        loadSermons();
    };

    const filteredSermons = sermons.filter(sermon =>
        sermon.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sermon.predicador.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
                <p className="text-gray-500 dark:text-gray-400">Cargando predicaciones...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 shadow-sm p-4 sticky top-0 z-10">
                <div className="max-w-6xl mx-auto">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => navigate('/')}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                            >
                                <ArrowLeft className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                            </button>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                                    <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Escritos</h1>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{sermons.length} predicaciones</p>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowForm(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <Plus className="w-5 h-5" />
                            <span className="hidden sm:inline">Nueva Predicación</span>
                        </button>
                    </div>

                    {/* Search */}
                    <div className="relative">
                        <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Buscar por título o predicador..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 dark:text-gray-100 border-transparent focus:bg-white dark:focus:bg-gray-600 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 rounded-lg transition-all outline-none"
                        />
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-6xl mx-auto p-4">
                {filteredSermons.length === 0 ? (
                    <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
                        <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500 dark:text-gray-400">
                            {searchTerm ? 'No se encontraron predicaciones' : 'No hay predicaciones registradas'}
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {filteredSermons.map(sermon => (
                            <div
                                key={sermon.id}
                                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 hover:shadow-md transition-shadow"
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <h3 className="font-bold text-gray-900 dark:text-gray-100 line-clamp-2 flex-1">
                                        {sermon.titulo}
                                    </h3>
                                </div>

                                <div className="space-y-2 mb-4">
                                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                        <User className="w-4 h-4" />
                                        <span>{sermon.predicador}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                        <Calendar className="w-4 h-4" />
                                        <span>{new Date(sermon.fecha).toLocaleDateString('es-ES')}</span>
                                    </div>
                                </div>

                                {sermon.versiculos && sermon.versiculos.length > 0 && (
                                    <div className="mb-4">
                                        <div className="flex flex-wrap gap-1">
                                            {sermon.versiculos.slice(0, 3).map((v, i) => (
                                                <span
                                                    key={i}
                                                    className="px-2 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-full"
                                                >
                                                    {v}
                                                </span>
                                            ))}
                                            {sermon.versiculos.length > 3 && (
                                                <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded-full">
                                                    +{sermon.versiculos.length - 3}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-4">
                                    {sermon.texto_completo}
                                </p>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleView(sermon)}
                                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors text-sm"
                                    >
                                        <Eye className="w-4 h-4" />
                                        Ver
                                    </button>
                                    <button
                                        onClick={() => handleEdit(sermon)}
                                        className="flex items-center justify-center px-3 py-2 bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(sermon.id)}
                                        className="flex items-center justify-center px-3 py-2 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Form Modal */}
            {showForm && (
                <SermonForm
                    sermon={selectedSermon}
                    onClose={handleCloseForm}
                />
            )}

            {/* Detail Modal */}
            {showDetail && selectedSermon && (
                <SermonDetail
                    sermon={selectedSermon}
                    onClose={() => {
                        setShowDetail(false);
                        setSelectedSermon(null);
                    }}
                    onEdit={() => {
                        setShowDetail(false);
                        setShowForm(true);
                    }}
                />
            )}
        </div>
    );
};
