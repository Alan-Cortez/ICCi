import React, { useState, useEffect } from 'react';
import { Loader2, Check, X, Calendar, XCircle, Star, BookOpen, FileText, Clock, History, Edit2, Trash2, CheckCheck, AlertCircle, Ban } from 'lucide-react';
import { getAllYouthMembers } from '../../services/youthService';
import {
    markAttendance,
    getAttendanceWithComplianceByDate,
    updateAttendance,
    deleteAttendance,
    getAttendanceHistorySummary
} from '../../services/attendanceService';
import { markCompliance, updateCompliance, deleteCompliance } from '../../services/complianceService';
import { getToday, formatDate } from '../../utils/dateHelpers';

export const Attendance = () => {
    const [youthMembers, setYouthMembers] = useState([]);
    const [selectedDate, setSelectedDate] = useState(getToday());
    const [attendance, setAttendance] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [existingAttendanceIds, setExistingAttendanceIds] = useState({});
    const [existingComplianceIds, setExistingComplianceIds] = useState({});
    const [showHistory, setShowHistory] = useState(false);
    const [attendanceHistory, setAttendanceHistory] = useState([]);

    // Cancellation State
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [cancelReason, setCancelReason] = useState('');

    useEffect(() => {
        loadYouthMembers();
    }, []);

    useEffect(() => {
        if (youthMembers.length > 0) {
            loadAttendanceForDate(selectedDate);
        }
    }, [selectedDate, youthMembers]);

    const loadYouthMembers = async () => {
        try {
            setLoading(true);
            const data = await getAllYouthMembers();
            setYouthMembers(data);
        } catch (error) {
            console.error('Error al cargar jóvenes:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadAttendanceForDate = async (fecha) => {
        try {
            setLoading(true);

            // Intentar cargar asistencia existente
            const existingData = await getAttendanceWithComplianceByDate(fecha);

            if (existingData.length > 0) {
                // Modo edición - cargar datos existentes
                setEditMode(true);
                const loadedAttendance = {};
                const attendanceIds = {};
                const complianceIds = {};

                existingData.forEach(record => {
                    loadedAttendance[record.youth_member_id] = {
                        presente: Boolean(record.presente),
                        justificado: Boolean(record.justificado),
                        razon: record.razon_falta || '',
                        biblia: Boolean(record.tiene_biblia),
                        apuntes: Boolean(record.tiene_apuntes),
                        puntual: Boolean(record.puntual),
                        esReunionCancelada: Boolean(record.es_reunion_cancelada),
                        esEventoEspecial: Boolean(record.es_evento_especial),
                        notas: record.notas || ''
                    };
                    attendanceIds[record.youth_member_id] = record.attendance_id;
                    if (record.compliance_id) {
                        complianceIds[record.youth_member_id] = record.compliance_id;
                    }
                });

                // Agregar jóvenes que no tienen registro
                youthMembers.forEach(youth => {
                    if (!loadedAttendance[youth.youth_id]) {
                        loadedAttendance[youth.youth_id] = {
                            presente: false,
                            justificado: false,
                            razon: '',
                            biblia: false,
                            apuntes: false,
                            puntual: true,
                            esReunionCancelada: false,
                            esEventoEspecial: false,
                            notas: ''
                        };
                    }
                });

                setAttendance(loadedAttendance);
                setExistingAttendanceIds(attendanceIds);
                setExistingComplianceIds(complianceIds);
            } else {
                // Modo creación - inicializar vacío
                setEditMode(false);
                const initialAttendance = {};
                youthMembers.forEach(youth => {
                    initialAttendance[youth.youth_id] = {
                        presente: false,
                        justificado: false,
                        razon: '',
                        biblia: false,
                        apuntes: false,
                        puntual: true,
                        esReunionCancelada: false,
                        esEventoEspecial: false,
                        notas: ''
                    };
                });
                setAttendance(initialAttendance);
                setExistingAttendanceIds({});
                setExistingComplianceIds({});
            }
        } catch (error) {
            console.error('Error al cargar asistencia:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadHistory = async () => {
        try {
            const summary = await getAttendanceHistorySummary();
            setAttendanceHistory(summary);
            setShowHistory(true);
        } catch (error) {
            console.error('Error al cargar historial:', error);
        }
    };

    const selectDateFromHistory = (fecha) => {
        setSelectedDate(fecha);
        setShowHistory(false);
    };

    const togglePresent = (youthId) => {
        setAttendance(prev => ({
            ...prev,
            [youthId]: {
                ...prev[youthId],
                presente: !prev[youthId].presente,
                justificado: false,
                esReunionCancelada: false,
                razon: ''
            }
        }));
    };

    const markAllPresent = () => {
        setAttendance(prev => {
            const updated = {};
            Object.keys(prev).forEach(key => {
                updated[key] = {
                    ...prev[key],
                    presente: true,
                    justificado: false,
                    esReunionCancelada: false,
                    razon: ''
                };
            });
            return updated;
        });
    };

    const toggleJustified = (youthId) => {
        setAttendance(prev => ({
            ...prev,
            [youthId]: {
                ...prev[youthId],
                justificado: !prev[youthId].justificado,
                presente: false,
                esReunionCancelada: false
            }
        }));
    };

    const updateReason = (youthId, razon) => {
        setAttendance(prev => ({
            ...prev,
            [youthId]: {
                ...prev[youthId],
                razon
            }
        }));
    };

    const toggleBible = (youthId) => {
        setAttendance(prev => ({
            ...prev,
            [youthId]: {
                ...prev[youthId],
                biblia: !prev[youthId].biblia
            }
        }));
    };

    const toggleNotes = (youthId) => {
        setAttendance(prev => ({
            ...prev,
            [youthId]: {
                ...prev[youthId],
                apuntes: !prev[youthId].apuntes
            }
        }));
    };

    const togglePunctual = (youthId) => {
        setAttendance(prev => ({
            ...prev,
            [youthId]: {
                ...prev[youthId],
                puntual: !prev[youthId].puntual
            }
        }));
    };

    const confirmCancelMeeting = () => {
        if (!cancelReason.trim()) {
            alert('Por favor agrega un motivo para cancelar la reunión');
            return;
        }

        setAttendance(prev => {
            const updated = {};
            Object.keys(prev).forEach(key => {
                updated[key] = {
                    ...prev[key],
                    esReunionCancelada: true,
                    presente: false,
                    justificado: true, // Counts as justified attendance
                    razon: cancelReason
                };
            });
            return updated;
        });

        setShowCancelModal(false);
        setCancelReason('');
        // We auto-save after setting cancellation? Or let user click save?
        // User flow usually expects confirmation to save.
        alert('Reunión marcada como cancelada. Por favor haz clic en "Guardar" para confirmar.');
    };

    const updateNotes = (youthId, notas) => {
        setAttendance(prev => ({
            ...prev,
            [youthId]: {
                ...prev[youthId],
                notas
            }
        }));
    };

    const handleSave = async () => {
        try {
            setSaving(true);

            for (const youth of youthMembers) {
                const youthId = youth.youth_id;
                const data = attendance[youthId];
                const attendanceId = existingAttendanceIds[youthId];
                const complianceId = existingComplianceIds[youthId];

                if (editMode && attendanceId) {
                    // Actualizar asistencia existente
                    await updateAttendance(attendanceId, {
                        presente: data.presente,
                        justificado: data.justificado,
                        razonFalta: data.razon || null,
                        esReunionCancelada: data.esReunionCancelada,
                        esEventoEspecial: data.esEventoEspecial,
                        puntual: data.puntual,
                        notas: data.notas || null
                    });

                    // Actualizar o crear cumplimiento
                    if (data.presente) {
                        if (complianceId) {
                            await updateCompliance(complianceId, data.biblia, data.apuntes);
                        } else {
                            await markCompliance(youthId, selectedDate, data.biblia, data.apuntes);
                        }
                    } else if (complianceId) {
                        // Si ya no está presente, eliminar cumplimiento
                        await deleteCompliance(complianceId);
                    }
                } else {
                    // Crear nueva asistencia
                    await markAttendance(
                        youthId,
                        selectedDate,
                        data.presente,
                        data.justificado,
                        data.razon || null,
                        {
                            esReunionCancelada: data.esReunionCancelada,
                            esEventoEspecial: data.esEventoEspecial,
                            puntual: data.puntual,
                            notas: data.notas || null
                        }
                    );

                    // Guardar cumplimiento si está presente
                    if (data.presente) {
                        await markCompliance(youthId, selectedDate, data.biblia, data.apuntes);
                    }
                }
            }

            alert(editMode ? 'Asistencia actualizada correctamente' : 'Asistencia guardada correctamente');
            loadAttendanceForDate(selectedDate);
        } catch (error) {
            console.error('Error al guardar asistencia:', error);
            alert('Error al guardar asistencia');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!editMode) {
            alert('No hay asistencia para eliminar en esta fecha');
            return;
        }

        if (!confirm('¿Estás seguro de eliminar toda la asistencia de esta fecha? Esta acción no se puede deshacer.')) {
            return;
        }

        try {
            setSaving(true);

            // Eliminar todos los registros
            for (const youthId of Object.keys(existingAttendanceIds)) {
                const attendanceId = existingAttendanceIds[youthId];
                const complianceId = existingComplianceIds[youthId];

                if (attendanceId) {
                    await deleteAttendance(attendanceId);
                }
                if (complianceId) {
                    await deleteCompliance(complianceId);
                }
            }

            alert('Asistencia eliminada correctamente');
            loadAttendanceForDate(selectedDate);
        } catch (error) {
            console.error('Error al eliminar asistencia:', error);
            alert('Error al eliminar asistencia');
        } finally {
            setSaving(false);
        }
    };

    if (loading && youthMembers.length === 0) {
        return (
            <div className="flex justify-center p-8">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
        );
    }

    // Contar estadísticas
    const presentCount = Object.values(attendance).filter(a => a.presente).length;
    const justifiedCount = Object.values(attendance).filter(a => a.justificado).length;
    const absentCount = youthMembers.length - presentCount - justifiedCount;
    // Check if current date is cancelled (check if first record is cancelled)
    const isCancelled = Object.values(attendance).some(a => a.esReunionCancelada);
    const cancellationReason = isCancelled ? Object.values(attendance).find(a => a.esReunionCancelada)?.razon : '';

    return (
        <div className="space-y-6">
            {/* Modal de Cancelación de Reunión */}
            {showCancelModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-red-600 flex items-center gap-2">
                                <Ban className="w-5 h-5" /> Cancelar Reunión
                            </h3>
                            <button onClick={() => setShowCancelModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <p className="text-gray-600 text-sm mb-4">
                            Esta acción cancelará la reunión para todos los jóvenes en esta fecha.
                        </p>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Motivo</label>
                            <input
                                type="text"
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-red-200"
                                placeholder="Ej: Lluvia intensa, día festivo..."
                                value={cancelReason}
                                onChange={(e) => setCancelReason(e.target.value)}
                                autoFocus
                            />
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowCancelModal(false)}
                                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={confirmCancelMeeting}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                            >
                                Confirmar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Historial */}
            {showHistory && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl max-w-md w-full h-[90vh] sm:h-auto sm:max-h-[80vh] overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between shrink-0">
                            <h2 className="text-xl font-bold text-gray-900">Historial</h2>
                            <button onClick={() => setShowHistory(false)} className="bg-gray-100 p-2 rounded-full hover:bg-gray-200 transition-colors">
                                <X className="w-6 h-6 text-gray-500" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {attendanceHistory.map((record, index) => (
                                <button
                                    key={index}
                                    onClick={() => selectDateFromHistory(record.fecha)}
                                    className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-blue-50 rounded-xl border border-transparent hover:border-blue-100 transition-all group text-left"
                                >
                                    <div>
                                        <div className="font-bold text-gray-900 group-hover:text-blue-700 flex items-center gap-2">
                                            {formatDate(record.fecha)}
                                            {record.cancelled === 1 && (
                                                <span className="bg-red-100 text-red-600 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full">Cancelada</span>
                                            )}
                                        </div>
                                        <div className="text-xs text-gray-500">{record.fecha}</div>
                                        {record.cancelled === 1 && record.reason && (
                                            <div className="text-xs text-red-500 mt-1 italic">"{record.reason}"</div>
                                        )}
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        <div className="bg-white p-2 rounded-full shadow-sm">
                                            {record.cancelled === 1 ? (
                                                <Ban className="w-4 h-4 text-red-400" />
                                            ) : (
                                                <Calendar className="w-4 h-4 text-gray-400 group-hover:text-blue-500" />
                                            )}
                                        </div>
                                        <div className="text-xs font-medium text-gray-400">
                                            {record.present_count} Asist.
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Header Sticky */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sticky top-[72px] z-10">
                {/* Banner de Cancelación */}
                {isCancelled && (
                    <div className="mb-4 bg-red-50 border border-red-100 rounded-xl p-3 flex items-start gap-3 animate-in fade-in">
                        <div className="bg-red-100 p-2 rounded-full">
                            <Ban className="w-5 h-5 text-red-600" />
                        </div>
                        <div className="flex-1">
                            <h4 className="text-red-800 font-bold text-sm">Reunión Cancelada</h4>
                            <p className="text-red-600 text-xs mt-0.5">Motivo: {cancellationReason}</p>
                        </div>
                        <button
                            onClick={() => {
                                // Undo Cancellation (Reset to absent or previous)
                                setAttendance(prev => {
                                    const updated = {};
                                    Object.keys(prev).forEach(key => {
                                        updated[key] = {
                                            ...prev[key],
                                            esReunionCancelada: false,
                                            razon: ''
                                        };
                                    });
                                    return updated;
                                });
                            }}
                            className="text-red-500 hover:text-red-700 text-xs font-semibold underline"
                        >
                            Restaurar
                        </button>
                    </div>
                )}

                {editMode && !isCancelled && (
                    <div className="mb-4 flex items-center justify-between bg-blue-50 border border-blue-100 rounded-lg px-4 py-2">
                        <div className="flex items-center gap-2">
                            <Edit2 className="w-4 h-4 text-blue-600" />
                            <span className="text-xs font-semibold text-blue-700 uppercase tracking-wide">
                                Modo Edición
                            </span>
                        </div>
                        <div className="text-xs text-blue-600 font-medium">
                            {formatDate(selectedDate)}
                        </div>
                    </div>
                )}

                <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-1 border border-gray-200">
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="bg-transparent border-none text-sm font-semibold text-gray-700 focus:ring-0 cursor-pointer w-full"
                            />
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowCancelModal(true)}
                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-red-100"
                                title="Cancelar Reunión"
                            >
                                <Ban className="w-5 h-5" />
                            </button>
                            <button onClick={markAllPresent} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-blue-100" title="Marcar todos presentes">
                                <CheckCheck className="w-5 h-5" />
                            </button>
                            <button onClick={loadHistory} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200" title="Historial">
                                <History className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {!isCancelled && (
                        <div className="grid grid-cols-3 gap-2 text-center">
                            <div className="bg-green-50 rounded-xl p-2 border border-green-100 shadow-sm">
                                <div className="text-xl md:text-2xl font-black text-green-700">{presentCount}</div>
                                <div className="text-[10px] md:text-xs uppercase font-bold text-green-500">Presentes</div>
                            </div>
                            <div className="bg-yellow-50 rounded-xl p-2 border border-yellow-100 shadow-sm">
                                <div className="text-xl md:text-2xl font-black text-yellow-700">{justifiedCount}</div>
                                <div className="text-[10px] md:text-xs uppercase font-bold text-yellow-500">Justif.</div>
                            </div>
                            <div className="bg-red-50 rounded-xl p-2 border border-red-100 shadow-sm">
                                <div className="text-xl md:text-2xl font-black text-red-700">{absentCount}</div>
                                <div className="text-[10px] md:text-xs uppercase font-bold text-red-500">Ausentes</div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Listado */}
            <div className="space-y-4">
                {isCancelled ? (
                    <div className="text-center py-12 opacity-50">
                        <Ban className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                        <h3 className="text-xl font-bold text-gray-400">Reunión Cancelada</h3>
                        <p className="text-gray-400">No se puede tomar asistencia.</p>
                    </div>
                ) : (
                    youthMembers.map(youth => {
                        const data = attendance[youth.youth_id] || {};
                        const isPresent = data.presente;
                        const isJustified = data.justificado;

                        return (
                            <div
                                key={youth.youth_id}
                                className={`rounded-2xl border transition-all duration-200 overflow-hidden ${isPresent
                                    ? 'bg-white border-green-200 shadow-green-100/50 shadow-md'
                                    : isJustified
                                        ? 'bg-white border-yellow-200'
                                        : 'bg-white border-gray-100 shadow-sm'
                                    }`}
                            >
                                <div className="p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                                    <div className="flex-1">
                                        <h3 className="font-bold text-gray-900 text-lg">
                                            {youth.nombre} {youth.apellido_paterno}
                                        </h3>
                                        {isJustified && <p className="text-xs text-yellow-600 mt-1">Falta justificada</p>}
                                    </div>

                                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                                        <button
                                            onClick={() => togglePresent(youth.youth_id)}
                                            className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${isPresent
                                                ? 'bg-green-500 text-white shadow-lg shadow-green-200 transform scale-105'
                                                : 'bg-gray-100 text-gray-500 hover:bg-green-50 hover:text-green-600'
                                                }`}
                                        >
                                            <Check className="w-5 h-5" />
                                            {isPresent ? 'Presente' : 'Asistir'}
                                        </button>

                                        <button
                                            onClick={() => toggleJustified(youth.youth_id)}
                                            className={`w-full sm:w-auto px-3 py-2.5 rounded-xl font-semibold transition-all flex items-center justify-center ${isJustified
                                                ? 'bg-yellow-500 text-white shadow-lg'
                                                : 'bg-gray-100 text-gray-400 hover:bg-yellow-50 hover:text-yellow-600'
                                                }`}
                                            title="Justificar Falta"
                                        >
                                            <AlertCircle className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>

                                {/* Detalle Expandible (si presente) */}
                                {isPresent && (
                                    <div className="bg-green-50/50 border-t border-green-100 p-4 animate-in slide-in-from-top-2">
                                        <div className="flex flex-wrap gap-4 mb-3">
                                            <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm hover:border-blue-300 transition-colors">
                                                <input type="checkbox" checked={data.biblia} onChange={() => toggleBible(youth.youth_id)} className="rounded text-blue-600 focus:ring-blue-500" />
                                                <BookOpen className="w-4 h-4 text-blue-600" />
                                                <span className="text-sm font-medium text-gray-700">Biblia</span>
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm hover:border-orange-300 transition-colors">
                                                <input type="checkbox" checked={data.apuntes} onChange={() => toggleNotes(youth.youth_id)} className="rounded text-orange-600 focus:ring-orange-500" />
                                                <FileText className="w-4 h-4 text-orange-600" />
                                                <span className="text-sm font-medium text-gray-700">Apuntes</span>
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm hover:border-green-300 transition-colors">
                                                <input type="checkbox" checked={data.puntual} onChange={() => togglePunctual(youth.youth_id)} className="rounded text-green-600 focus:ring-green-500" />
                                                <Clock className="w-4 h-4 text-green-600" />
                                                <span className="text-sm font-medium text-gray-700">Puntual</span>
                                            </label>
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="Agregar nota sobre el joven..."
                                            value={data.notas}
                                            onChange={(e) => updateNotes(youth.youth_id, e.target.value)}
                                            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                                        />
                                    </div>
                                )}

                                {/* Detalle Expandible (si justificado) */}
                                {isJustified && (
                                    <div className="bg-yellow-50/50 border-t border-yellow-100 p-4 animate-in slide-in-from-top-2">
                                        <input
                                            type="text"
                                            placeholder="Razón de la falta..."
                                            value={data.razon}
                                            onChange={(e) => updateReason(youth.youth_id, e.target.value)}
                                            className="w-full bg-white border border-yellow-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none"
                                        />
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            {/* Floating Save Button */}
            <div className="sticky bottom-6 z-20">
                <div className="bg-white/80 backdrop-blur-md p-2 rounded-2xl shadow-2xl border border-gray-100 flex gap-2 max-w-md mx-auto">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 disabled:opacity-70 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-200"
                    >
                        {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Check className="w-5 h-5" /> Guardar</>}
                    </button>
                    {editMode && (
                        <button
                            onClick={handleDelete}
                            disabled={saving}
                            className="px-4 bg-red-100 text-red-600 rounded-xl font-bold hover:bg-red-200 disabled:opacity-70 transition-colors"
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
