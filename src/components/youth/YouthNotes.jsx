import React, { useState, useEffect } from 'react';
import { X, Calendar, Search, Trash2, Edit2, Check, Save } from 'lucide-react';
import { getAllNotes, updateNote, deleteNote } from '../../services/noteService';
import { toast } from 'react-toastify';

export const YouthNotes = ({ onClose }) => {
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterDate, setFilterDate] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [editingNote, setEditingNote] = useState(null);
    const [editContent, setEditContent] = useState('');

    useEffect(() => {
        loadNotes();
    }, []);

    const loadNotes = async () => {
        try {
            setLoading(true);
            const data = await getAllNotes();
            setNotes(data);
        } catch (error) {
            console.error('Error loading notes:', error);
            toast.error('Error al cargar las notas');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (noteId) => {
        if (confirm('¿Estás seguro de eliminar esta nota?')) {
            try {
                await deleteNote(noteId);
                toast.success('Nota eliminada');
                loadNotes();
            } catch (error) {
                toast.error('Error al eliminar nota');
            }
        }
    };

    const startEdit = (note) => {
        setEditingNote(note.id);
        setEditContent(note.contenido);
    };

    const handleUpdate = async (noteId) => {
        try {
            await updateNote(noteId, editContent);
            toast.success('Nota actualizada');
            setEditingNote(null);
            loadNotes();
        } catch (error) {
            toast.error('Error al actualizar nota');
        }
    };

    const filteredNotes = notes.filter(note => {
        const matchDate = filterDate ? note.fecha === filterDate : true;
        const matchSearch = searchTerm.toLowerCase().trim() === '' ||
            note.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
            note.apellido_paterno.toLowerCase().includes(searchTerm.toLowerCase()) ||
            note.contenido.toLowerCase().includes(searchTerm.toLowerCase());
        return matchDate && matchSearch;
    });

    // Helper to format date safely without timezone offset issues
    const formatDate = (dateString) => {
        if (!dateString) return '';
        const [year, month, day] = dateString.split('-').map(Number);
        const date = new Date(year, month - 1, day);
        return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', weekday: 'long' });
    };

    const formatDateShort = (dateString) => {
        if (!dateString) return '';
        const [year, month, day] = dateString.split('-').map(Number);
        const date = new Date(year, month - 1, day);
        return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'long' });
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col transform transition-all scale-100">
                {/* Header */}
                <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 rounded-t-2xl">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Notas de Jóvenes</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {filteredNotes.length} {filteredNotes.length === 1 ? 'nota encontrada' : 'notas encontradas'}
                            {filterDate && ` del ${formatDateShort(filterDate)}`}
                        </p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-full">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Filters */}
                <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-white grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre o contenido..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                        />
                    </div>
                    <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="date"
                            value={filterDate}
                            onChange={(e) => setFilterDate(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                        />
                    </div>
                </div>

                {/* List */}
                <div className="overflow-y-auto p-6 flex-1 bg-gray-50/30 scrollbar-thin">
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    ) : filteredNotes.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <p className="text-lg font-medium">No se encontraron notas</p>
                            <p className="text-sm">Intenta cambiar los filtros</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredNotes.map(note => (
                                <div key={note.id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-center gap-3 mb-3">
                                            {note.foto ? (
                                                <img src={note.foto} alt="" className="w-10 h-10 rounded-full object-cover" />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm">
                                                    {note.nombre.charAt(0)}{note.apellido_paterno.charAt(0)}
                                                </div>
                                            )}
                                            <div>
                                                <h4 className="font-bold text-gray-900">{note.nombre} {note.apellido_paterno}</h4>
                                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                                    <Calendar className="w-3 h-3" />
                                                    {formatDate(note.fecha)}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1">
                                            {editingNote === note.id ? (
                                                <button
                                                    onClick={() => handleUpdate(note.id)}
                                                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                    title="Guardar"
                                                >
                                                    <Save className="w-4 h-4" />
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => startEdit(note)}
                                                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Editar"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleDelete(note.id)}
                                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Eliminar"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="pl-13 mt-2">
                                        {editingNote === note.id ? (
                                            <textarea
                                                value={editContent}
                                                onChange={(e) => setEditContent(e.target.value)}
                                                className="w-full p-3 rounded-lg border border-indigo-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent min-h-[100px] text-gray-700"
                                                autoFocus
                                            />
                                        ) : (
                                            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed bg-gray-50 p-3 rounded-lg border border-gray-100/50">
                                                {note.contenido}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
