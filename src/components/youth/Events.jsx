import React, { useState, useEffect } from 'react';
import { Loader2, Plus, Trash2, Calendar, Search, Edit2 } from 'lucide-react';
import { getAllEvents, createEvent, deleteEvent, getEventsByMinistry, updateEvent } from '../../services/eventService';
import { getToday, getNextSaturday } from '../../utils/dateHelpers';
import { useAuth } from '../../context/AuthContext';
import { createPendingAction } from '../../services/pendingActionsService';
import { toast } from 'react-toastify';

export const Events = ({ ministryId, ministryName }) => {
    const { currentUser, isYouthLiderazgo, isYouthNoAsistencia, isAdmin, isLeader } = useAuth();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);

    // Logic to determine default date
    const getDefaultDate = () => {
        if (ministryName && (ministryName.toLowerCase().includes('jóvenes') || ministryName.toLowerCase().includes('jovenes'))) {
            return getNextSaturday();
        }
        return getToday();
    };

    // Form Config
    const [editingId, setEditingId] = useState(null);
    const [nombre, setNombre] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [fecha, setFecha] = useState(getDefaultDate());

    // Multi-day config
    const [isMultiDay, setIsMultiDay] = useState(false);
    const [fechaFin, setFechaFin] = useState(getDefaultDate());

    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (ministryId) {
            loadData();
        }
        // Update default date when ministry name changes
        setFecha(getDefaultDate());
        setFechaFin(getDefaultDate());
    }, [ministryId, ministryName]);

    const loadData = async () => {
        try {
            setLoading(true);
            const eventsData = await getEventsByMinistry(ministryId);
            setEvents(eventsData);
        } catch (error) {
            console.error('Error al cargar datos:', error);
        } finally {
            setLoading(false);
        }
    };

    // ... (handleSave omitted)

    const isYouthRole = () => isYouthLiderazgo() || isYouthNoAsistencia();
    const canDoDirectly = () => isAdmin() || isLeader();

    const handleSave = async () => {
        if (!nombre.trim()) {
            toast.warning('El nombre del evento es requerido');
            return;
        }

        try {
            const organizerId = null;

            if (isYouthRole() && !canDoDirectly()) {
                if (editingId) {
                    await createPendingAction(
                        'update_event',
                        { id: editingId, nombre, descripcion, fecha, organizerId },
                        currentUser,
                        ministryId
                    );
                } else {
                    await createPendingAction(
                        'create_event',
                        { nombre, descripcion, fecha, ministryId, organizerId },
                        currentUser,
                        ministryId
                    );
                }
                resetForm();
                toast.info('✋ Evento enviado a revisión por el encargado.');
            } else {
                if (editingId) {
                    await updateEvent(editingId, nombre, descripcion, fecha, organizerId);
                    toast.success('Evento actualizado');
                } else {
                    if (isMultiDay && fechaFin > fecha) {
                        const [startYear, startMonth, startDay] = fecha.split('-').map(Number);
                        const [endYear, endMonth, endDay] = fechaFin.split('-').map(Number);
                        const startDate = new Date(startYear, startMonth - 1, startDay);
                        const endDate = new Date(endYear, endMonth - 1, endDay);
                        const eventsToCreate = [];
                        let currentDate = new Date(startDate);
                        while (currentDate <= endDate) {
                            const y = currentDate.getFullYear();
                            const m = String(currentDate.getMonth() + 1).padStart(2, '0');
                            const d = String(currentDate.getDate()).padStart(2, '0');
                            eventsToCreate.push(`${y}-${m}-${d}`);
                            currentDate.setDate(currentDate.getDate() + 1);
                        }
                        await Promise.all(eventsToCreate.map(dateStr =>
                            createEvent(nombre, descripcion, dateStr, ministryId, organizerId)
                        ));
                    } else {
                        await createEvent(nombre, descripcion, fecha, ministryId, organizerId);
                    }
                    toast.success('Evento creado exitosamente');
                }
                resetForm();
                loadData();
            }
        } catch (error) {
            console.error('Error al guardar evento:', error);
            toast.error('Error al procesar solicitud');
        }
    };

    const handleEdit = (event) => {
        setEditingId(event.id);
        setNombre(event.nombre);
        setDescripcion(event.descripcion || '');
        setFecha(event.fecha);
        setIsMultiDay(false); // Al editar, tratamos como individual por seguridad
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        const event = events.find(e => e.id === id);
        if (confirm(`¿Estás seguro de eliminar el evento "${event?.nombre}"?`)) {
            try {
                if (isYouthRole() && !canDoDirectly()) {
                    await createPendingAction(
                        'delete_event',
                        { id, nombre: event?.nombre },
                        currentUser,
                        ministryId
                    );
                    toast.info('✋ Solicitud de eliminación enviada al encargado.');
                } else {
                    await deleteEvent(id);
                    loadData();
                    toast.success('Evento eliminado');
                }
            } catch (error) {
                console.error('Error al eliminar evento:', error);
                toast.error('Error al procesar eliminación');
            }
        }
    };

    const resetForm = () => {
        setNombre('');
        setDescripcion('');
        setFecha(getDefaultDate());
        setFechaFin(getDefaultDate());
        setIsMultiDay(false);
        setEditingId(null);
        setShowForm(false);
    };

    const filteredEvents = events.filter(e =>
        e.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (e.descripcion && e.descripcion.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // Lógica para mostrar el nombre del organizador
    const getOrganizerName = () => {
        if (ministryName && ministryName.toLowerCase().includes('administracion')) {
            return 'General';
        }
        return ministryName || 'Ministerio';
    };

    const organizerDisplay = getOrganizerName();

    if (loading && !events.length && !showForm) {
        return (
            <div className="flex justify-center p-8">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-20">
            {/* Buscador */}
            {!showForm && events.length > 0 && (
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Buscar eventos..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>
            )}

            {/* Formulario */}
            {showForm && (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 animate-in slide-in-from-top-4 duration-300">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">
                        {editingId ? 'Editar Evento' : 'Nuevo Evento'}
                    </h2>

                    <div className="space-y-4">
                        <input
                            type="text"
                            placeholder="Nombre del evento *"
                            value={nombre}
                            onChange={(e) => setNombre(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />

                        <textarea
                            placeholder="Descripción"
                            value={descripcion}
                            onChange={(e) => setDescripcion(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-24 resize-none"
                        />

                        {/* Toggle Multi-day (Only on create) */}
                        {!editingId && (
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="multiDay"
                                    checked={isMultiDay}
                                    onChange={(e) => setIsMultiDay(e.target.checked)}
                                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                />
                                <label htmlFor="multiDay" className="text-sm font-medium text-gray-700 cursor-pointer select-none">
                                    Evento de varios días
                                </label>
                            </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-500 mb-1">
                                    {isMultiDay ? 'Fecha Inicio' : 'Fecha'}
                                </label>
                                <input
                                    type="date"
                                    value={fecha}
                                    onChange={(e) => setFecha(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>

                            {isMultiDay && (
                                <div>
                                    <label className="block text-sm font-semibold text-gray-500 mb-1">
                                        Fecha Fin
                                    </label>
                                    <input
                                        type="date"
                                        value={fechaFin}
                                        min={fecha}
                                        onChange={(e) => setFechaFin(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-500 mb-1">Organizado por</label>
                            <div className="w-full px-4 py-2 border border-gray-200 bg-gray-50 text-gray-600 rounded-lg">
                                {organizerDisplay}
                            </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={resetForm}
                                className="flex-1 py-2 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSave}
                                className="flex-1 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
                            >
                                {editingId ? 'Guardar Cambios' : 'Crear Eventos'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Lista de eventos */}
            <div className="space-y-4">
                {filteredEvents.map(event => (
                    <div key={event.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="text-xl font-bold text-gray-900">{event.nombre}</h3>
                            <div className="flex gap-1">
                                <button
                                    onClick={() => handleEdit(event)}
                                    className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
                                >
                                    <Edit2 className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => handleDelete(event.id)}
                                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {event.descripcion && (
                            <p className="text-gray-600 mb-4">{event.descripcion}</p>
                        )}

                        <div className="flex items-center text-blue-600 font-medium text-sm border-t border-gray-100 pt-3">
                            <Calendar className="w-4 h-4 mr-2" />
                            {event.fecha}
                        </div>
                        <div className="text-xs text-gray-500 mt-2">
                            Organizado por: {organizerDisplay}
                        </div>
                    </div>
                ))}

                {filteredEvents.length === 0 && !showForm && (
                    <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                        <p className="mb-2">
                            {searchTerm ? 'No se encontraron eventos' : 'No hay eventos registrados'}
                        </p>
                        {!searchTerm && (
                            <p className="text-sm text-gray-400">Presiona el botón + para crear uno</p>
                        )}
                    </div>
                )}
            </div>

            {/* FAB */}
            {!showForm && (
                <button
                    onClick={() => setShowForm(true)}
                    className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-blue-700 transition-transform hover:scale-105 active:scale-95 z-50"
                >
                    <Plus className="w-8 h-8" />
                </button>
            )}
        </div>
    );
};
