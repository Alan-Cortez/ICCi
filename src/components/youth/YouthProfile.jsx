import React, { useState, useEffect } from 'react';
import { X, Edit2, Download, Calendar, Phone, User, Info, Clock, CheckCircle2, TrendingUp, StickyNote, Plus, Trash2, Ban } from 'lucide-react';
import { getMemberById } from '../../services/memberService';
import { getAttendanceByYouth } from '../../services/attendanceService';
import { getComplianceByYouth } from '../../services/complianceService';
import { getNotesByYouth, addNote, deleteNote } from '../../services/noteService';
import { calculateAttendancePercentage, calculateBibleCompliance, calculateNotesCompliance, calculatePunctuality } from '../../utils/reportHelpers';
import { formatDate, getToday } from '../../utils/dateHelpers';
import { exportYouthProfileToPDF } from '../../utils/pdfExport';

export const YouthProfile = ({ youthMember, onClose, onEdit }) => {
    const [activeTab, setActiveTab] = useState('info');
    const [memberData, setMemberData] = useState(null);
    const [attendanceData, setAttendanceData] = useState([]);
    const [complianceData, setComplianceData] = useState([]);
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newNote, setNewNote] = useState({ content: '', date: getToday() });
    const [savingNote, setSavingNote] = useState(false);

    useEffect(() => {
        loadYouthData();
    }, [youthMember]);

    const loadYouthData = async () => {
        try {
            setLoading(true);

            // Obtener datos del miembro
            const member = await getMemberById(youthMember.member_id);
            setMemberData(member);

            // Obtener asistencias (últimos 3 meses)
            const today = new Date();
            const threeMonthsAgo = new Date();
            threeMonthsAgo.setMonth(today.getMonth() - 3);

            const attendance = await getAttendanceByYouth(
                youthMember.youth_id,
                threeMonthsAgo.toISOString().split('T')[0],
                today.toISOString().split('T')[0]
            );
            setAttendanceData(Array.isArray(attendance) ? attendance : []);

            // Obtener cumplimiento
            const compliance = await getComplianceByYouth(
                youthMember.youth_id,
                threeMonthsAgo.toISOString().split('T')[0],
                today.toISOString().split('T')[0]
            );
            setComplianceData(Array.isArray(compliance) ? compliance : []);

            // Obtener notas
            const notesData = await getNotesByYouth(youthMember.youth_id);
            setNotes(notesData);

        } catch (error) {
            console.error('Error loading youth data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddNote = async (e) => {
        e.preventDefault();
        if (!newNote.content.trim()) return;

        try {
            setSavingNote(true);
            await addNote(youthMember.youth_id, newNote.date, newNote.content);
            const updatedNotes = await getNotesByYouth(youthMember.youth_id);
            setNotes(updatedNotes);
            setNewNote({ content: '', date: getToday() });
        } catch (error) {
            console.error('Error adding note:', error);
            alert('Error al guardar la nota');
        } finally {
            setSavingNote(false);
        }
    };

    const handleDeleteNote = async (noteId) => {
        if (!confirm('¿Estás seguro de eliminar esta nota?')) return;
        try {
            await deleteNote(noteId);
            setNotes(notes.filter(n => n.id !== noteId));
        } catch (error) {
            console.error('Error deleting note:', error);
            alert('Error al eliminar la nota');
        }
    };

    const calculateNextBirthday = () => {
        if (!memberData) return null;

        const today = new Date();
        const currentYear = today.getFullYear();
        const birthday = new Date(currentYear, memberData.mes_cumpleanos - 1, memberData.dia_cumpleanos);

        if (birthday < today) {
            birthday.setFullYear(currentYear + 1);
        }

        const daysUntil = Math.ceil((birthday - today) / (1000 * 60 * 60 * 24));
        return { date: birthday, daysUntil };
    };

    const stats = {
        attendancePercentage: calculateAttendancePercentage(attendanceData),
        biblePercentage: calculateBibleCompliance(complianceData),
        notesPercentage: calculateNotesCompliance(complianceData),
        punctualityPercentage: calculatePunctuality(attendanceData)
    };

    const nextBirthday = calculateNextBirthday();

    const handleExportPDF = () => {
        if (!memberData) return;

        const youthData = {
            ...memberData,
            ...youthMember
        };

        exportYouthProfileToPDF(
            youthData,
            attendanceData,
            complianceData,
            stats
        );
    };

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
                <div className="bg-white rounded-2xl p-8 shadow-2xl">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600 font-medium">Cargando perfil...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full max-w-3xl flex flex-col h-[95vh] sm:h-auto sm:max-h-[90vh] overflow-hidden transform transition-all scale-100">

                {/* Header Azul Moderno */}
                <div className="bg-blue-600 text-white p-6 relative overflow-hidden shrink-0">
                    {/* Decorative circles */}
                    <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
                    <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>

                    {/* Cerrar Button absolute safe */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 z-30 p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all"
                    >
                        <X className="w-5 h-5 text-white" />
                    </button>

                    <div className="relative z-10 flex flex-col sm:flex-row items-center gap-6 mt-4 sm:mt-0">
                        <div className="relative group">
                            {memberData?.foto || youthMember?.foto ? (
                                <img
                                    src={memberData?.foto || youthMember?.foto}
                                    alt={memberData?.nombre || youthMember?.nombre}
                                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-4 border-white/30 shadow-xl group-hover:scale-105 transition-transform duration-300"
                                />
                            ) : (
                                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border-4 border-white/30 shadow-xl">
                                    <User className="w-10 h-10 text-white/90" />
                                </div>
                            )}
                            <button
                                onClick={() => onEdit(youthMember)}
                                className="absolute bottom-0 right-0 bg-white text-blue-600 p-2 rounded-full shadow-lg hover:bg-gray-100 transition-colors"
                                title="Editar perfil"
                            >
                                <Edit2 className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="text-center sm:text-left flex-1 min-w-0">
                            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight truncate">
                                {memberData?.nombre || youthMember?.nombre} {memberData?.apellido_paterno || youthMember?.apellido_paterno} {memberData?.apellido_materno || youthMember?.apellido_materno}
                            </h2>
                            <p className="text-blue-100 font-medium text-lg mt-1 truncate">Ministerio de Jóvenes</p>

                            <div className="flex flex-wrap justify-center sm:justify-start gap-4 mt-4">
                                <div className="flex items-center gap-2 bg-blue-700/50 px-3 py-1.5 rounded-full text-sm backdrop-blur-sm border border-blue-500/30">
                                    <Clock className="w-4 h-4 text-blue-200" />
                                    <span>Miembro desde {new Date(youthMember.fecha_ingreso).getFullYear()}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs Navigation */}
                <div className="flex overflow-x-auto border-b border-gray-100 px-2 sm:px-6 pt-2 scrollbar-hide shrink-0">
                    <button
                        onClick={() => setActiveTab('info')}
                        className={`px-4 sm:px-6 py-4 font-semibold text-sm transition-all border-b-2 whitespace-nowrap ${activeTab === 'info'
                            ? 'text-blue-600 border-blue-600'
                            : 'text-gray-500 border-transparent hover:text-gray-900 hover:border-gray-200'
                            }`}
                    >
                        Información
                    </button>
                    <button
                        onClick={() => setActiveTab('attendance')}
                        className={`px-4 sm:px-6 py-4 font-semibold text-sm transition-all border-b-2 whitespace-nowrap ${activeTab === 'attendance'
                            ? 'text-blue-600 border-blue-600'
                            : 'text-gray-500 border-transparent hover:text-gray-900 hover:border-gray-200'
                            }`}
                    >
                        Asistencia
                    </button>
                    <button
                        onClick={() => setActiveTab('stats')}
                        className={`px-4 sm:px-6 py-4 font-semibold text-sm transition-all border-b-2 whitespace-nowrap ${activeTab === 'stats'
                            ? 'text-blue-600 border-blue-600'
                            : 'text-gray-500 border-transparent hover:text-gray-900 hover:border-gray-200'
                            }`}
                    >
                        Estadísticas
                    </button>
                    <button
                        onClick={() => setActiveTab('notes')}
                        className={`px-4 sm:px-6 py-4 font-semibold text-sm transition-all border-b-2 whitespace-nowrap ${activeTab === 'notes'
                            ? 'text-blue-600 border-blue-600'
                            : 'text-gray-500 border-transparent hover:text-gray-900 hover:border-gray-200'
                            }`}
                    >
                        Notas
                    </button>
                </div>

                {/* Content Area */}
                <div className="p-6 bg-gray-50/50 flex-1 overflow-y-auto min-h-[300px]">
                    {activeTab === 'info' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                            {/* Cumpleaños Card */}
                            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-start gap-4">
                                <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                                    <Calendar className="w-6 h-6" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-gray-500 text-sm font-medium mb-1">Cumpleaños</p>
                                    <p className="text-gray-900 font-bold text-lg">
                                        {memberData?.dia_cumpleanos || youthMember?.dia_cumpleanos}/{memberData?.mes_cumpleanos || youthMember?.mes_cumpleanos}
                                    </p>
                                    {nextBirthday && (
                                        <div className="mt-2 inline-flex items-center text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-md">
                                            En {nextBirthday.daysUntil} días
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Telefono Card */}
                            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-start gap-4">
                                <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                                    <Phone className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-gray-500 text-sm font-medium mb-1">Teléfono</p>
                                    <p className="text-gray-900 font-bold text-lg">{memberData?.telefono || youthMember?.telefono || 'No registrado'}</p>
                                </div>
                            </div>

                            {/* Info Ministerio Card (Full Width) */}
                            <div className="md:col-span-2 bg-blue-50/50 p-6 rounded-2xl border border-blue-100 flex items-start gap-4">
                                <div className="p-3 bg-white rounded-xl text-blue-600 shadow-sm">
                                    <Info className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-blue-800 font-bold text-lg mb-1">Información del Ministerio</p>
                                    <p className="text-blue-600 text-sm">
                                        Fecha de ingreso: <span className="font-semibold">{new Date(youthMember.fecha_ingreso).toLocaleDateString()}</span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'attendance' && (
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
                            <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                                <h3 className="font-bold text-gray-900">Historial Reciente</h3>
                                <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">Últimos 3 meses</span>
                            </div>
                            <div className="max-h-[300px] overflow-y-auto">
                                {attendanceData.length > 0 ? (
                                    <table className="w-full text-sm">
                                        <tbody className="divide-y divide-gray-100">
                                            {attendanceData.map((record) => (
                                                <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-6 py-4 font-medium text-gray-900">
                                                        {formatDate(record.fecha)}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {Boolean(record.es_evento_especial) && (
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                                                Especial
                                                            </span>
                                                        )}
                                                        {Boolean(record.es_reunion_cancelada) && (
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 ml-2">
                                                                Cancelada
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        {record.presente ? (
                                                            <span className="inline-flex items-center gap-1.5 text-green-600 font-bold bg-green-50 px-3 py-1 rounded-full">
                                                                <CheckCircle2 className="w-4 h-4" /> Presente
                                                            </span>
                                                        ) : record.es_reunion_cancelada ? (
                                                            <span className="inline-flex items-center gap-1.5 text-gray-600 font-bold bg-gray-100 px-3 py-1 rounded-full">
                                                                <Ban className="w-4 h-4" /> Cancelada
                                                            </span>
                                                        ) : (
                                                            <span className={`inline-flex items-center gap-1.5 font-bold px-3 py-1 rounded-full ${record.justificado
                                                                ? 'text-yellow-600 bg-yellow-50'
                                                                : 'text-red-600 bg-red-50'
                                                                }`}>
                                                                {record.justificado ? 'Justificado' : 'Falta'}
                                                            </span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <div className="p-12 text-center text-gray-500">
                                        <p>No hay registros de asistencia recientes.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'stats' && (
                        <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                            {[
                                { label: 'Asistencia', value: stats.attendancePercentage, color: 'text-blue-600', bg: 'bg-blue-50' },
                                { label: 'Puntualidad', value: stats.punctualityPercentage, color: 'text-green-600', bg: 'bg-green-50' },
                                { label: 'Biblia', value: stats.biblePercentage, color: 'text-purple-600', bg: 'bg-purple-50' },
                                { label: 'Apuntes', value: stats.notesPercentage, color: 'text-orange-600', bg: 'bg-orange-50' }
                            ].map((stat, i) => (
                                <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center hover:shadow-md transition-shadow">
                                    <div className={`w-16 h-16 rounded-full ${stat.bg} ${stat.color} flex items-center justify-center text-2xl font-bold mb-3`}>
                                        {stat.value}%
                                    </div>
                                    <p className="text-gray-500 font-medium text-sm">{stat.label}</p>
                                    <div className="w-full bg-gray-100 h-1.5 rounded-full mt-3 overflow-hidden">
                                        <div
                                            className={`h-full rounded-full ${stat.bg.replace('bg-', 'bg-').replace('50', '500')}`}
                                            style={{ width: `${stat.value}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === 'notes' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                            <form onSubmit={handleAddNote} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col gap-3">
                                <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                    <StickyNote className="w-4 h-4 text-orange-500" /> Nueva Nota
                                </h3>
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <div className="flex-[3]">
                                        <textarea
                                            value={newNote.content}
                                            onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                                            placeholder="Escribe una nota sobre este joven..."
                                            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none min-h-[80px] resize-none"
                                            required
                                        />
                                    </div>
                                    <div className="flex-1 flex flex-col gap-3 min-w-[150px]">
                                        <input
                                            type="date"
                                            value={newNote.date}
                                            onChange={(e) => setNewNote({ ...newNote, date: e.target.value })}
                                            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                            required
                                        />
                                        <button
                                            type="submit"
                                            disabled={savingNote}
                                            className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors flex justify-center items-center gap-2 h-[42px]"
                                        >
                                            <Plus className="w-4 h-4" /> {savingNote ? '...' : 'Agregar'}
                                        </button>
                                    </div>
                                </div>
                            </form>

                            {/* Lista de notas */}
                            <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2">
                                {notes.length > 0 ? (
                                    notes.map((note) => (
                                        <div key={note.id} className="bg-yellow-50 p-4 rounded-xl border border-yellow-100 relative group transition-all hover:shadow-sm">
                                            <button
                                                onClick={() => handleDeleteNote(note.id)}
                                                className="absolute top-2 right-2 text-yellow-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                                                title="Eliminar nota"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                            <p className="text-xs font-bold text-yellow-700 mb-1 flex items-center gap-2">
                                                <Calendar className="w-3 h-3" /> {formatDate(note.fecha)}
                                            </p>
                                            <p className="text-sm text-gray-800 whitespace-pre-wrap">{note.contenido}</p>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8 text-gray-400">
                                        <StickyNote className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                        <p className="text-sm">No hay notas registradas</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t border-gray-100 bg-white flex justify-between items-center shrink-0">
                    <button
                        onClick={onClose}
                        className="text-gray-500 font-semibold hover:text-gray-900 hover:bg-gray-100 px-4 py-2 rounded-lg transition-colors"
                    >
                        Cerrar
                    </button>
                    <button
                        onClick={handleExportPDF}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-blue-200 hover:shadow-blue-300 transition-all flex items-center gap-2 transform active:scale-95"
                    >
                        <Download className="w-5 h-5" />
                        Exportar PDF
                    </button>
                </div>
            </div>
        </div>
    );
};
