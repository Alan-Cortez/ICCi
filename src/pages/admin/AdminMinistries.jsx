import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Loader2, X, Users, Calendar, DollarSign, Church } from 'lucide-react';
import {
    getAllMinistries,
    createMinistry,
    updateMinistry,
    deleteMinistry,
    getMinistryStats
} from '../../services/ministryService';
import { ConfirmModal } from '../../components/admin/ConfirmModal';
import { toast } from 'react-toastify';

export const AdminMinistries = () => {
    const [ministries, setMinistries] = useState([]);
    const [ministriesStats, setMinistriesStats] = useState({});
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('create');
    const [selectedMinistry, setSelectedMinistry] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [ministryToDelete, setMinistryToDelete] = useState(null);
    const [formData, setFormData] = useState({
        nombre: '',
        descripcion: ''
    });

    useEffect(() => {
        loadMinistries();
    }, []);

    const loadMinistries = async () => {
        try {
            setLoading(true);
            const ministriesData = await getAllMinistries();
            setMinistries(ministriesData);

            // Load stats for each ministry
            const statsPromises = ministriesData.map(ministry =>
                getMinistryStats(ministry.id).catch(() => ({
                    totalMembers: 0,
                    totalEvents: 0,
                    balance: 0
                }))
            );
            const stats = await Promise.all(statsPromises);

            const statsMap = {};
            ministriesData.forEach((ministry, index) => {
                statsMap[ministry.id] = stats[index];
            });
            setMinistriesStats(statsMap);
        } catch (error) {
            console.error('Error:', error);
            toast.error('Error al cargar ministerios');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (mode, ministry = null) => {
        setModalMode(mode);
        setSelectedMinistry(ministry);
        if (mode === 'edit' && ministry) {
            setFormData({
                nombre: ministry.nombre,
                descripcion: ministry.descripcion || ''
            });
        } else {
            setFormData({
                nombre: '',
                descripcion: ''
            });
        }
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setSelectedMinistry(null);
        setFormData({
            nombre: '',
            descripcion: ''
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (modalMode === 'create') {
                await createMinistry(formData.nombre, formData.descripcion);
                toast.success('Ministerio creado exitosamente');
            } else {
                await updateMinistry(selectedMinistry.id, formData.nombre, formData.descripcion);
                toast.success('Ministerio actualizado exitosamente');
            }
            handleCloseModal();
            loadMinistries();
        } catch (error) {
            toast.error('Error al guardar ministerio');
        }
    };

    const handleDeleteClick = (ministry) => {
        setMinistryToDelete(ministry);
        setShowDeleteConfirm(true);
    };

    const handleDeleteConfirm = async () => {
        try {
            await deleteMinistry(ministryToDelete.id);
            toast.success('Ministerio eliminado exitosamente');
            loadMinistries();
        } catch (error) {
            toast.error('Error al eliminar ministerio');
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        Gestión de Ministerios
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400">
                        {ministries.length} ministerio{ministries.length !== 1 ? 's' : ''} registrado{ministries.length !== 1 ? 's' : ''}
                    </p>
                </div>
                <button
                    onClick={() => handleOpenModal('create')}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Crear Ministerio
                </button>
            </div>

            {/* Ministries Grid */}
            {loading ? (
                <div className="flex justify-center p-12">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {ministries.map((ministry) => {
                        const stats = ministriesStats[ministry.id] || { totalMembers: 0, totalEvents: 0, balance: 0 };
                        const isLowFunds = stats.balance < 1000;

                        return (
                            <div
                                key={ministry.id}
                                className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border ${isLowFunds
                                        ? 'border-red-200 dark:border-red-900/50'
                                        : 'border-gray-100 dark:border-gray-700'
                                    } p-6 hover:shadow-md transition-shadow`}
                            >
                                {/* Header */}
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                                            <Church className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900 dark:text-gray-100">
                                                {ministry.nombre}
                                            </h3>
                                            {isLowFunds && (
                                                <span className="text-xs text-red-600 dark:text-red-400 font-medium">
                                                    ⚠️ Fondos bajos
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => handleOpenModal('edit', ministry)}
                                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                                            title="Editar"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteClick(ministry)}
                                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                                            title="Eliminar"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* Description */}
                                {ministry.descripcion && (
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                                        {ministry.descripcion}
                                    </p>
                                )}

                                {/* Stats */}
                                <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                            <Users className="w-4 h-4" />
                                            <span className="text-sm">Miembros</span>
                                        </div>
                                        <span className="font-bold text-gray-900 dark:text-gray-100">
                                            {stats.totalMembers}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                            <Calendar className="w-4 h-4" />
                                            <span className="text-sm">Eventos</span>
                                        </div>
                                        <span className="font-bold text-gray-900 dark:text-gray-100">
                                            {stats.totalEvents}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                            <DollarSign className="w-4 h-4" />
                                            <span className="text-sm">Fondos</span>
                                        </div>
                                        <span className={`font-bold ${isLowFunds
                                                ? 'text-red-600 dark:text-red-400'
                                                : 'text-green-600 dark:text-green-400'
                                            }`}>
                                            ${stats.balance.toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Create/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-md shadow-xl">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                {modalMode === 'create' ? 'Nuevo Ministerio' : 'Editar Ministerio'}
                            </h3>
                            <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Nombre del Ministerio
                                </label>
                                <input
                                    type="text"
                                    value={formData.nombre}
                                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    required
                                    placeholder="Ej: Ministerio de Jóvenes"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Descripción
                                </label>
                                <textarea
                                    value={formData.descripcion}
                                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    rows="3"
                                    placeholder="Descripción del ministerio..."
                                />
                            </div>
                            <div className="pt-2 flex gap-3">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    {modalMode === 'create' ? 'Crear' : 'Actualizar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            <ConfirmModal
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={handleDeleteConfirm}
                title="Eliminar Ministerio"
                message={`¿Estás seguro de que deseas eliminar el ministerio "${ministryToDelete?.nombre}"? Esta acción eliminará también todos los datos asociados (miembros, eventos, fondos).`}
                confirmText="Eliminar"
                cancelText="Cancelar"
                variant="danger"
            />
        </div>
    );
};
