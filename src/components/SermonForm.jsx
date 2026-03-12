import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { createSermon, updateSermon } from '../services/sermonService';

export const SermonForm = ({ sermon, onClose }) => {
    const [formData, setFormData] = useState({
        titulo: '',
        fecha: new Date().toISOString().split('T')[0],
        predicador: '',
        versiculos: [],
        texto_completo: ''
    });
    const [newVerse, setNewVerse] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (sermon) {
            setFormData({
                titulo: sermon.titulo,
                fecha: sermon.fecha,
                predicador: sermon.predicador,
                versiculos: sermon.versiculos || [],
                texto_completo: sermon.texto_completo
            });
        }
    }, [sermon]);

    const handleAddVerse = () => {
        if (newVerse.trim()) {
            // Split by comma to allow multiple verses
            const versesToAdd = newVerse.split(',').map(v => v.trim()).filter(v => v);
            setFormData({
                ...formData,
                versiculos: [...formData.versiculos, ...versesToAdd]
            });
            setNewVerse('');
        }
    };

    const handleRemoveVerse = (index) => {
        setFormData({
            ...formData,
            versiculos: formData.versiculos.filter((_, i) => i !== index)
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            if (sermon) {
                await updateSermon(sermon.id, formData);
            } else {
                await createSermon(formData);
            }
            onClose();
        } catch (error) {
            alert('Error al guardar predicación');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} />

            {/* Modal Container to center content properly */}
            <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
                <div className="relative transform overflow-hidden bg-white dark:bg-gray-800 rounded-xl text-left shadow-xl transition-all w-full max-w-3xl my-8">
                    {/* Header - Removed sticky to avoid mobile overlap issues, added simple top placement */}
                    <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-white dark:bg-gray-800">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                            {sermon ? 'Editar Predicación' : 'Nueva Predicación'}
                        </h3>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        {/* Título */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Título de la Predicación *
                            </label>
                            <input
                                type="text"
                                value={formData.titulo}
                                onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                required
                            />
                        </div>

                        {/* Fecha y Predicador */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Fecha *
                                </label>
                                <input
                                    type="date"
                                    value={formData.fecha}
                                    onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Predicador *
                                </label>
                                <input
                                    type="text"
                                    value={formData.predicador}
                                    onChange={(e) => setFormData({ ...formData, predicador: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    required
                                />
                            </div>
                        </div>

                        {/* Versículos */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Versículos Usados
                            </label>
                            <div className="flex gap-2 mb-2">
                                <input
                                    type="text"
                                    value={newVerse}
                                    onChange={(e) => setNewVerse(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddVerse())}
                                    placeholder="Ej: Juan 3:16, Romanos 8:28 (separar por comas)"
                                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                                <button
                                    type="button"
                                    onClick={handleAddVerse}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    <Plus className="w-5 h-5" />
                                </button>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                                Presiona Enter para agregar. Puedes agregar múltiples separándolos por coma.
                            </p>
                            {formData.versiculos.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {formData.versiculos.map((verse, index) => (
                                        <div
                                            key={index}
                                            className="flex items-center gap-2 px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full"
                                        >
                                            <span className="text-sm">{verse}</span>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveVerse(index)}
                                                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Texto Completo */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Texto Completo *
                            </label>
                            <textarea
                                value={formData.texto_completo}
                                onChange={(e) => setFormData({ ...formData, texto_completo: e.target.value })}
                                rows={12}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-y"
                                placeholder="Escribe el contenido completo de la predicación..."
                                required
                            />
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                El campo se expande automáticamente. No hay límite de caracteres.
                            </p>
                        </div>

                        {/* Buttons */}
                        <div className="flex gap-3 pt-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={saving}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                            >
                                {saving ? 'Guardando...' : (sermon ? 'Actualizar' : 'Crear')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};
