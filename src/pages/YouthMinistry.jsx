import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Loader2, Users, Home, ClipboardCheck, Award, FileText, Calendar, DollarSign, UserPlus, Notebook, Settings, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { YouthCard } from '../components/YouthCard';
import { getAllYouthMembers, addYouthMember, removeYouthMember } from '../services/youthService';
import { getAllMembers } from '../services/memberService';
import { Attendance } from '../components/youth/Attendance';
import { Leadership } from '../components/youth/Leadership';
import { Reports } from '../components/youth/Reports';
import { Events } from '../components/youth/Events';
import { Funds } from '../components/youth/Funds';
import { YouthProfile } from '../components/youth/YouthProfile';
import { EditYouthMember } from '../components/youth/EditYouthMember';
import { YouthDashboard } from '../components/youth/YouthDashboard';
import { YouthNotes } from '../components/youth/YouthNotes';
import { getAllMinistries } from '../services/ministryService';
import { createPendingAction, getPendingCount } from '../services/pendingActionsService';
import { getMinistryLeader } from '../services/userService';
import { Settings as SettingsView } from '../components/youth/Settings';

export const YouthMinistry = () => {
    const navigate = useNavigate();
    const { currentUser, isLeader, isAdmin, isYouthLiderazgo, isYouthNoAsistencia, loading: authLoading } = useAuth();
    const [youthMembers, setYouthMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('home');
    const [showAddMember, setShowAddMember] = useState(false);
    const [availableMembers, setAvailableMembers] = useState([]);
    const [ministryId, setMinistryId] = useState(null);
    const [selectedYouth, setSelectedYouth] = useState(null);
    const [showProfile, setShowProfile] = useState(false);
    const [showEdit, setShowEdit] = useState(false);
    const [editingMember, setEditingMember] = useState(null);
    const [showNotes, setShowNotes] = useState(false);
    const [pendingCount, setPendingCount] = useState(0);

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

    const loadMinistryId = async () => {
        try {
            const ministries = await getAllMinistries();
            const youthMinistry = ministries.find(m => m.nombre.toLowerCase().includes('jóvenes') || m.nombre.toLowerCase().includes('jovenes'));
            if (youthMinistry) {
                setMinistryId(youthMinistry.id);

                // Access Control Check
                if (!authLoading && !isAdmin()) {
                    const isAuthorizedYouthRole = isYouthLiderazgo() || isYouthNoAsistencia();
                    if (!isAuthorizedYouthRole && (!isLeader() && currentUser?.role !== 'admin')) {
                         toast.error('No tienes permisos de liderazgo');
                         navigate('/');
                    } else if (isLeader() && currentUser?.ministry_id !== youthMinistry.id) {
                         toast.error('No tienes permiso para acceder a este ministerio');
                         navigate('/');
                    }
                }
            }
        } catch (error) {
            console.error('Error al cargar ID del ministerio:', error);
        }
    };

    const refreshPendingCount = useCallback(async (mid) => {
        if (!mid) return;
        const count = await getPendingCount(mid);
        setPendingCount(count);
    }, []);

    useEffect(() => {
        if (!authLoading) {
            loadYouthMembers();
            loadMinistryId();
        }
    }, [authLoading]);

    // Poll pending count every 30 seconds for the admin
    useEffect(() => {
        if (!ministryId) return;
        
        // Mensaje de bienvenida/estado para roles restringidos
        if (isYouthRole()) {
            toast.info('🛡️ Modo de Aprobación Activo: Sus cambios serán revisados por el encargado.', {
                position: "bottom-center",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
            });
        }

        refreshPendingCount(ministryId);
        const interval = setInterval(() => refreshPendingCount(ministryId), 30000);
        return () => clearInterval(interval);
    }, [ministryId, refreshPendingCount]);

    const handleShowAddMember = async () => {
        try {
            const allMembers = await getAllMembers();
            const youthIds = youthMembers.map(y => y.member_id);
            const available = allMembers.filter(m => !youthIds.includes(m.id));

            if (available.length === 0) {
                alert('Todos los miembros ya están en el ministerio de jóvenes');
                return;
            }

            setAvailableMembers(available);
            setShowAddMember(true);
        } catch (error) {
            console.error('Error al cargar miembros:', error);
        }
    };

    const isYouthRole = () => isYouthLiderazgo() || isYouthNoAsistencia();

    const handleAddYouth = async (memberId) => {
        try {
            const member = availableMembers.find(m => m.id === memberId);
            const memberNombre = member ? `${member.nombre} ${member.apellido_paterno}` : '';

            if (isYouthRole()) {
                // Obtener datos del encargado (Líder del ministerio)
                const leader = await getMinistryLeader(ministryId);

                // Crear solicitud pendiente
                await createPendingAction(
                    'add_youth_member',
                    { memberId, memberNombre },
                    currentUser,
                    ministryId
                );
                
                setShowAddMember(false);
                refreshPendingCount(ministryId);
                toast.info('✋ Solicitud enviada. En espera de aprobación del encargado en el panel de Configuración.');
            } else {
                await addYouthMember(memberId);
                setShowAddMember(false);
                loadYouthMembers();
                toast.success('Joven agregado exitosamente');
            }
        } catch (error) {
            console.error('Error al agregar joven:', error);
            toast.error('Error al procesar solicitud');
        }
    };

    const handleYouthClick = (youth) => {
        setSelectedYouth(youth);
        setShowProfile(true);
    };

    const handleEditYouth = (youth) => {
        setEditingMember(youth);
        setShowProfile(false);
        setShowEdit(true);
    };

    const handleSaveEdit = () => {
        loadYouthMembers();
        setShowEdit(false);
        setEditingMember(null);
    };

    const handleRemoveYouth = async (youth) => {
        if (confirm(`¿Estás seguro de remover a ${youth.nombre} ${youth.apellido_paterno} del ministerio de jóvenes?`)) {
            try {
                const memberNombre = `${youth.nombre} ${youth.apellido_paterno}`;
                if (isYouthRole()) {
                    // Obtener datos del encargado (Líder del ministerio)
                    const leader = await getMinistryLeader(ministryId);

                    await createPendingAction(
                        'remove_youth_member',
                        { youthId: youth.youth_id, memberNombre },
                        currentUser,
                        ministryId
                    );
                    
                    refreshPendingCount(ministryId);
                    toast.info('✋ Solicitud enviada. En espera de aprobación del encargado en el panel de Configuración.');
                } else {
                    await removeYouthMember(youth.youth_id);
                    loadYouthMembers();
                    toast.success('Joven removido exitosamente');
                }
            } catch (error) {
                console.error('Error al remover joven:', error);
                toast.error('Error al procesar solicitud');
            }
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
                <p className="text-gray-500 dark:text-gray-400">Cargando jóvenes...</p>
            </div>
        );
    }

    const allTabs = [
        { id: 'home', label: 'Inicio', icon: Home },
        { id: 'members', label: 'Miembros', icon: Users },
        { id: 'attendance', label: 'Asistencia', icon: ClipboardCheck },
        { id: 'leadership', label: 'Liderazgo', icon: Award },
        { id: 'reports', label: 'Reportes', icon: FileText },
        { id: 'events', label: 'Eventos', icon: Calendar },
        { id: 'funds', label: 'Fondos', icon: DollarSign },
        { id: 'settings', label: 'Configuración', icon: Settings, badge: pendingCount },
    ];

    let tabs = [...allTabs];
    if (isYouthLiderazgo()) {
        tabs = allTabs.filter(t => ['home', 'leadership'].includes(t.id));
    } else if (isYouthNoAsistencia()) {
        tabs = allTabs.filter(t => t.id !== 'attendance');
    }

    if (!isAdmin() && !isLeader()) {
         tabs = tabs.filter(t => t.id !== 'settings');
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20 font-sans">
            {/* Modern Header with Gradient */}
            <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 shadow-lg text-white sticky top-0 z-20">
                <div className="max-w-5xl mx-auto">
                    <div className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => navigate('/')}
                                className="p-2 hover:bg-white/10 rounded-full transition-colors"
                            >
                                <ArrowLeft className="w-6 h-6 text-white" />
                            </button>
                            <div>
                                <h1 className="text-xl font-bold tracking-tight">Ministerio de Jóvenes</h1>
                                <p className="text-xs text-blue-100 font-medium tracking-wide opacity-90">
                                    {youthMembers.length} MIEMBROS ACTIVOS
                                </p>
                            </div>
                        </div>

                        {/* Header Actions - Quick Add Contextual */}
                        {activeTab === 'members' && (
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setShowNotes(true)}
                                    className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-full transition-all backdrop-blur-sm"
                                    title="Ver Notas"
                                >
                                    <Notebook className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={handleShowAddMember}
                                    className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-full transition-all backdrop-blur-sm"
                                    title="Agregar Joven"
                                >
                                    <UserPlus className="w-5 h-5" />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Scrollable Horizontal Navigation */}
                    <div className="flex overflow-x-auto px-4 pb-0 gap-2 scrollbar-hide">
                        {tabs.map(tab => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`relative flex items-center gap-2 px-4 py-3 border-b-2 transition-all whitespace-nowrap text-sm font-medium ${isActive
                                        ? 'border-white text-white'
                                        : 'border-transparent text-blue-100 hover:text-white hover:bg-white/5'
                                        }`}
                                >
                                    <Icon className={`w-4 h-4 ${isActive ? 'scale-110' : ''}`} />
                                    {tab.label}
                                    {tab.badge > 0 && (
                                        <span className="absolute top-1.5 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                                            {tab.badge > 9 ? '9+' : tab.badge}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Main Content Container */}
            <div className="max-w-5xl mx-auto p-4 md:p-6 animate-in fade-in duration-500">
                {activeTab === 'home' && <YouthDashboard ministryId={ministryId} setActiveTab={setActiveTab} />}

                {activeTab === 'members' && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {youthMembers.map((member) => (
                                <YouthCard
                                    key={member.youth_id}
                                    youth={member}
                                    onClick={() => handleYouthClick(member)}
                                    onDelete={handleRemoveYouth}
                                    onEdit={handleEditYouth}
                                />
                            ))}
                        </div>
                        {youthMembers.length === 0 && (
                            <div className="text-center py-16 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 shadow-sm">
                                <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                <p>No hay jóvenes registrados aún.</p>
                                <button
                                    onClick={handleShowAddMember}
                                    className="mt-4 text-blue-600 font-medium hover:underline"
                                >
                                    Agregar el primero
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'attendance' && <Attendance ministryId={ministryId} />}
                {activeTab === 'leadership' && <Leadership ministryId={ministryId} />}
                {activeTab === 'reports' && <Reports ministryId={ministryId} />}
                {activeTab === 'events' && <Events ministryId={ministryId} ministryName="Ministerio de Jóvenes" />}
                {activeTab === 'funds' && <Funds ministryId={ministryId} />}
                {activeTab === 'settings' && <SettingsView ministryId={ministryId} onPendingChange={() => refreshPendingCount(ministryId)} />}
            </div>

            {/* Notes Modal */}
            {showNotes && (
                <YouthNotes onClose={() => setShowNotes(false)} />
            )}

            {/* Modal Agregar Miembro */}
            {showAddMember && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col transform transition-all scale-100">
                        <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 rounded-t-2xl">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Agregar Joven</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Selecciona un miembro de la iglesia</p>
                            </div>
                            <button onClick={() => setShowAddMember(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <div className="sr-only">Cerrar</div>
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <div className="overflow-y-auto p-2 flex-1 scrollbar-thin">
                            {availableMembers.map(member => (
                                <button
                                    key={member.id}
                                    onClick={() => handleAddYouth(member.id)}
                                    className="w-full flex items-center justify-between p-4 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-xl border border-transparent hover:border-blue-100 transition-all group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
                                            {member.nombre.charAt(0)}{member.apellido_paterno.charAt(0)}
                                        </div>
                                        <div className="text-left">
                                            <div className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-700">
                                                {member.nombre} {member.apellido_paterno}
                                            </div>
                                            <div className="text-xs text-gray-500">{member.telefono || 'Sin teléfono'}</div>
                                        </div>
                                    </div>
                                    <span className="text-gray-300 group-hover:text-blue-600 transition-colors">
                                        <UserPlus className="w-5 h-5" />
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Youth Profile Modal */}
            {showProfile && selectedYouth && (
                <YouthProfile
                    youthMember={selectedYouth}
                    onClose={() => {
                        setShowProfile(false);
                        setSelectedYouth(null);
                    }}
                    onEdit={handleEditYouth}
                />
            )}

            {/* Edit Youth Member Modal */}
            {showEdit && editingMember && (
                <EditYouthMember
                    member={editingMember}
                    onClose={() => {
                        setShowEdit(false);
                        setEditingMember(null);
                    }}
                    onSave={handleSaveEdit}
                />
            )}
        </div>
    );
};
