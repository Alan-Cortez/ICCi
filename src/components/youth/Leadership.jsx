import React, { useState, useEffect } from 'react';
import { Loader2, Plus, Check, Calendar, Users, BookOpen, Heart, Trash2, Crown, Sparkles, Clock, AlertCircle } from 'lucide-react';
import { getLeadershipMembers, addToLeadership, assignTask, getPendingAssignments, completeAssignment, removeFromLeadership } from '../../services/leadershipService';
import { getAllYouthMembers } from '../../services/youthService';
import { getToday } from '../../utils/dateHelpers';

export const Leadership = () => {
    const [leaders, setLeaders] = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeSubTab, setActiveSubTab] = useState('leaders'); // leaders, predicacion, ayuno, intercesion

    // Modal states
    const [showAssignTask, setShowAssignTask] = useState(false);
    const [showAddLeader, setShowAddLeader] = useState(false);

    // Form states
    const [selectedLeaders, setSelectedLeaders] = useState([]);
    const [taskType, setTaskType] = useState('predicacion');
    const [taskDate, setTaskDate] = useState(getToday());
    const [taskNotes, setTaskNotes] = useState('');
    const [availableYouth, setAvailableYouth] = useState([]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [leadersData, assignmentsData, allYouthData] = await Promise.all([
                getLeadershipMembers(),
                getPendingAssignments(),
                getAllYouthMembers()
            ]);
            setLeaders(leadersData);
            setAssignments(assignmentsData);
            setAvailableYouth(allYouthData); // Cache all youth for availablity, though used differently now
        } catch (error) {
            console.error('Error al cargar datos:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleShowAddLeader = () => {
        try {
            // Filter out existing leaders
            const leaderIds = leaders.map(l => l.youth_member_id);
            const available = availableYouth.filter(y => !leaderIds.includes(y.youth_id));

            if (available.length === 0) {
                alert('Todos los jóvenes ya son líderes');
                return;
            }

            // Note: reusing availableYouth state for the modal, but filtered
            setAvailableYouth(available);
            setShowAddLeader(true);
        } catch (error) {
            console.error('Error al preparar modal:', error);
        }
    };

    const handleAddLeader = async (youthId) => {
        try {
            await addToLeadership(youthId);
            setShowAddLeader(false);
            loadData();
        } catch (error) {
            console.error('Error al agregar líder:', error);
        }
    };

    const handleOpenAssignModal = (type) => {
        setTaskType(type);
        setSelectedLeaders([]);
        setTaskDate(getToday());
        setTaskNotes('');
        setShowAssignTask(true);
    };

    const toggleMemberSelection = (member) => {
        setSelectedLeaders(prev => {
            // Check if selected by ID (either leadership_id for leaders or youth_id for general members)
            const idKey = taskType === 'ayuno' ? 'youth_id' : 'leadership_id';
            const isSelected = prev.some(m => m[idKey] === member[idKey]);

            // Si es ayuno, permite múltiples
            if (taskType === 'ayuno') {
                if (isSelected) {
                    return prev.filter(m => m[idKey] !== member[idKey]);
                } else {
                    return [...prev, member];
                }
            }
            // Si no es ayuno, solo permite uno (reemplaza selección)
            else {
                if (isSelected) {
                    return [];
                } else {
                    return [member];
                }
            }
        });
    };

    const handleAssignTask = async () => {
        if (selectedLeaders.length === 0) return;

        try {
            for (const member of selectedLeaders) {
                // If it's ayuno, we use youth_id directly. If it's other, we use leadership_id.
                // However, updated service accepts (youthMemberId, type, date, notes, leadershipId)

                let youthId, leadershipId;

                if (taskType === 'ayuno') {
                    youthId = member.youth_id;
                    leadershipId = null; // No required leadership role for ayuno
                } else {
                    leadershipId = member.leadership_id;
                    youthId = member.youth_member_id; // Leaders have this field
                }

                await assignTask(youthId, taskType, taskDate, taskNotes || null, leadershipId);
            }

            loadData();
            setShowAssignTask(false);
            setSelectedLeaders([]);
            setTaskNotes('');
            setTaskDate(getToday());
        } catch (error) {
            console.error('Error al asignar tarea:', error);
        }
    };

    const handleCompleteTask = async (assignmentId) => {
        try {
            await completeAssignment(assignmentId);
            loadData();
        } catch (error) {
            console.error('Error al completar tarea:', error);
        }
    };

    const handleRemoveLeader = async (leader) => {
        if (confirm(`¿Estás seguro de remover a ${leader.nombre} ${leader.apellido_paterno} del liderazgo?`)) {
            try {
                await removeFromLeadership(leader.leadership_id);
                loadData();
            } catch (error) {
                console.error('Error al remover líder:', error);
                alert('Error al remover el líder');
            }
        }
    };

    const getTaskTypeLabel = (type) => {
        const labels = {
            predicacion: 'Predicación',
            intercesion: 'Intercesión',
            ayuno: 'Ayuno'
        };
        return labels[type] || type;
    };

    const getInitials = (nombre, apellido) => {
        return `${nombre?.charAt(0) || ''}${apellido?.charAt(0) || ''}`;
    };

    if (loading) {
        return (
            <div className="flex justify-center p-8">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
        );
    }

    const subTabs = [
        { id: 'leaders', label: 'Líderes', icon: Users },
        { id: 'predicacion', label: 'Predicación', icon: BookOpen },
        { id: 'ayuno', label: 'Ayuno', icon: Heart },
        { id: 'intercesion', label: 'Intercesión', icon: Sparkles }
    ];

    return (
        <div className="space-y-6">
            {/* Sub-Tabs Navigation */}
            <div className="flex overflow-x-auto pb-2 gap-2 scrollbar-hide">
                {subTabs.map(tab => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveSubTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${activeSubTab === tab.id
                                ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200 indent-0'
                                }`}
                        >
                            <Icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Contenido: Lista de Líderes */}
            {activeSubTab === 'leaders' && (
                <section className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold text-gray-900">Equipo de Liderazgo</h2>
                        <button
                            onClick={handleShowAddLeader}
                            className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors flex items-center gap-1 shadow-sm"
                        >
                            <Plus className="w-4 h-4" /> Agregar Líder
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {leaders.map(leader => (
                            <div key={leader.leadership_id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between group relative hover:shadow-md transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-gradient-to-br from-yellow-100 to-yellow-50 rounded-full flex items-center justify-center border-2 border-yellow-200 text-yellow-700 font-bold shadow-sm">
                                        {getInitials(leader.nombre, leader.apellido_paterno)}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                            {leader.nombre} {leader.apellido_paterno}
                                            <Crown className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                                        </h3>
                                        <p className="text-xs text-gray-400 font-medium">Líder desde {new Date(leader.fecha_inicio).getFullYear()}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleRemoveLeader(leader)}
                                    className="p-2 bg-gray-50 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Remover del liderazgo"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                        {leaders.length === 0 && (
                            <div className="col-span-full text-center py-16 text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                <Users className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                                <p>No hay líderes registrados</p>
                            </div>
                        )}
                    </div>
                </section>
            )}

            {/* Contenido: Tareas (Predicación, Ayuno, Intercesión) */}
            {activeSubTab !== 'leaders' && (
                <section className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold text-gray-900">
                            Asignaciones de {getTaskTypeLabel(activeSubTab)}
                        </h2>
                        <button
                            onClick={() => handleOpenAssignModal(activeSubTab)}
                            className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors flex items-center gap-1 shadow-sm"
                        >
                            <Plus className="w-4 h-4" /> Nueva Asignación
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {assignments.filter(a => a.tipo === activeSubTab).length === 0 ? (
                            <div className="col-span-full text-center py-16 text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                <BookOpen className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                                <p>No hay asignaciones pendientes de {getTaskTypeLabel(activeSubTab).toLowerCase()}</p>
                            </div>
                        ) : (
                            assignments
                                .filter(a => a.tipo === activeSubTab)
                                .map(assignment => (
                                    <div key={assignment.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden group">
                                        {/* Decorative bar */}
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500"></div>

                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center font-bold text-sm">
                                                    {getInitials(assignment.nombre, assignment.apellido_paterno)}
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-gray-900">
                                                        {assignment.nombre} {assignment.apellido_paterno}
                                                    </h3>
                                                    <span className="text-xs text-gray-500 font-medium">Responsable</span>
                                                </div>
                                            </div>
                                            <span className={`text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1 ${new Date(assignment.fecha_asignada) < new Date()
                                                ? 'bg-red-50 text-red-700'
                                                : 'bg-green-50 text-green-700'
                                                }`}>
                                                <Calendar className="w-3 h-3" />
                                                {new Date(assignment.fecha_asignada).toLocaleDateString()}
                                            </span>
                                        </div>

                                        {assignment.notas && (
                                            <div className="mb-4 bg-gray-50 p-3 rounded-lg border border-gray-100">
                                                <p className="text-sm text-gray-600 italic">"{assignment.notas}"</p>
                                            </div>
                                        )}

                                        <button
                                            onClick={() => handleCompleteTask(assignment.id)}
                                            className="w-full mt-2 bg-white border border-gray-200 text-gray-600 py-2 rounded-lg text-sm font-semibold hover:border-green-500 hover:text-green-600 hover:bg-green-50 transition-all flex items-center justify-center gap-2"
                                        >
                                            <div className="w-4 h-4 rounded-full border-2 border-current"></div>
                                            Marcar como Completado
                                        </button>
                                    </div>
                                ))
                        )}
                    </div>
                </section>
            )}

            {/* Modal Agregar Líder */}
            {showAddLeader && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col shadow-2xl">
                        <div className="p-5 border-b border-gray-100">
                            <h3 className="text-lg font-bold text-gray-900">Agregar Líder</h3>
                            <p className="text-sm text-gray-500">Selecciona un joven para agregar al liderazgo</p>
                        </div>

                        <div className="overflow-y-auto p-2 flex-1 scrollbar-thin">
                            {availableYouth.map(youth => (
                                <button
                                    key={youth.youth_id}
                                    onClick={() => handleAddLeader(youth.youth_id)}
                                    className="w-full flex items-center justify-between p-3 hover:bg-blue-50 rounded-xl transition-colors group"
                                >
                                    <span className="font-semibold text-gray-700 group-hover:text-blue-700 transition-colors">
                                        {youth.nombre} {youth.apellido_paterno}
                                    </span>
                                    <span className="text-blue-200 group-hover:text-blue-600 transition-colors">
                                        <Plus className="w-5 h-5" />
                                    </span>
                                </button>
                            ))}
                        </div>

                        <div className="p-4 border-t border-gray-100">
                            <button
                                onClick={() => setShowAddLeader(false)}
                                className="w-full py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition-colors"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Asignar Tarea */}
            {showAssignTask && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] flex flex-col shadow-2xl">
                        <div className="p-5 border-b border-gray-100 bg-gray-50/50 rounded-t-2xl">
                            <h3 className="text-lg font-bold text-gray-900">
                                Asignar {getTaskTypeLabel(taskType)}
                            </h3>
                            <p className="text-sm text-gray-500">
                                {taskType === 'ayuno'
                                    ? 'Selecciona uno o varios jóvenes'
                                    : 'Selecciona un líder responsable'}
                            </p>
                        </div>

                        <div className="p-5 space-y-5 overflow-y-auto">
                            {/* Selección de Líderes o Miembros */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                                    {taskType === 'ayuno' ? 'Seleccionar Jóvenes' : 'Seleccionar Líder Responsable'}
                                </label>
                                <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-xl p-2 space-y-1">
                                    {taskType === 'ayuno' ? (
                                        // List all youth members for Ayuno
                                        availableYouth.map(youth => { // Using availableYouth which holds all members now (need to fix loadData logic if I overrode it)
                                            // Actually I modified loadData to setAvailableYouth = allYouthData. 
                                            // The addLeader modal filters it locally. So availableYouth has ALL youth. That works.

                                            const isSelected = selectedLeaders.some(l => l.youth_id === youth.youth_id);
                                            return (
                                                <button
                                                    key={youth.youth_id}
                                                    onClick={() => toggleMemberSelection(youth)}
                                                    className={`w-full flex items-center justify-between p-3 rounded-lg text-sm transition-all ${isSelected
                                                        ? 'bg-blue-50 text-blue-700 font-bold shadow-sm'
                                                        : 'hover:bg-gray-50 text-gray-600'
                                                        }`}
                                                >
                                                    <span>{youth.nombre} {youth.apellido_paterno}</span>
                                                    {isSelected && <Check className="w-4 h-4" />}
                                                </button>
                                            );
                                        })
                                    ) : (
                                        // List only leaders for other tasks
                                        leaders.map(leader => {
                                            const isSelected = selectedLeaders.some(l => l.leadership_id === leader.leadership_id);
                                            return (
                                                <button
                                                    key={leader.leadership_id}
                                                    onClick={() => toggleMemberSelection(leader)}
                                                    className={`w-full flex items-center justify-between p-3 rounded-lg text-sm transition-all ${isSelected
                                                        ? 'bg-blue-50 text-blue-700 font-bold shadow-sm'
                                                        : 'hover:bg-gray-50 text-gray-600'
                                                        }`}
                                                >
                                                    <span>{leader.nombre} {leader.apellido_paterno}</span>
                                                    {isSelected && <Check className="w-4 h-4" />}
                                                </button>
                                            );
                                        })
                                    )}
                                </div>
                            </div>

                            {/* Fecha */}
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">Fecha Programada</label>
                                <div className="relative">
                                    <input
                                        type="date"
                                        value={taskDate}
                                        onChange={(e) => setTaskDate(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-700 font-medium"
                                    />
                                    <Calendar className="w-5 h-5 text-gray-400 absolute left-3 top-3" />
                                </div>
                            </div>

                            {/* Notas */}
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">Notas Adicionales</label>
                                <textarea
                                    value={taskNotes}
                                    onChange={(e) => setTaskNotes(e.target.value)}
                                    placeholder="Detalles sobre la asignación..."
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none h-24 resize-none text-gray-700"
                                />
                            </div>
                        </div>

                        <div className="p-5 border-t border-gray-100 flex gap-3">
                            <button
                                onClick={() => {
                                    setShowAssignTask(false);
                                    setSelectedLeaders([]);
                                    setTaskNotes('');
                                    setTaskDate(getToday());
                                }}
                                className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleAssignTask}
                                disabled={selectedLeaders.length === 0}
                                className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-200"
                            >
                                Asignar Tarea
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
