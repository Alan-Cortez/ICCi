import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Calendar, DollarSign, Loader2, Plus, Trash2 } from 'lucide-react';
import { getMinistryById, getMinistryMembers, addMemberToMinistry, removeMemberFromMinistry, getAllMinistries } from '../services/ministryService';
import { getAllMembers } from '../services/memberService';
import { Events } from '../components/youth/Events';
import { Funds } from '../components/youth/Funds';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

export const MinistryDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { currentUser, isLeader, isAdmin, loading: authLoading } = useAuth();
    const [ministry, setMinistry] = useState(null);
    const [loading, setLoading] = useState(true);

    // Data states
    const [members, setMembers] = useState([]);
    const [allMembers, setAllMembers] = useState([]);

    // Modals
    const [showAddMember, setShowAddMember] = useState(false);
    const [availableMembers, setAvailableMembers] = useState([]);

    // Tabs
    const [activeTab, setActiveTab] = useState('members');

    useEffect(() => {
        if (!authLoading) {
            // Access Control
            if (isLeader() && currentUser?.ministry_id !== parseInt(id)) {
                toast.error('No tienes permiso para acceder a este ministerio');
                navigate('/');
                return;
            }
            loadData();
        }
    }, [id, authLoading]);

    const loadData = async () => {
        try {
            setLoading(true);
            const ministryData = await getMinistryById(id);
            setMinistry(ministryData);

            if (ministryData) {
                await Promise.all([
                    loadMembers(),
                    loadAllMembers()
                ]);
            }
        } catch (error) {
            console.error('Error al cargar datos:', error);
            toast.error('Error al cargar ministerio');
        } finally {
            setLoading(false);
        }
    };

    const loadMembers = async () => {
        const data = await getMinistryMembers(id);
        setMembers(data);
    };

    const loadAllMembers = async () => {
        const data = await getAllMembers();
        setAllMembers(data);
    };

    // Handlers Members
    const handleShowAddMember = () => {
        const currentIds = members.map(m => m.id);
        setAvailableMembers(allMembers.filter(m => !currentIds.includes(m.id)));
        setShowAddMember(true);
    };

    const handleAddMember = async (memberId) => {
        await addMemberToMinistry(id, memberId);
        setShowAddMember(false);
        loadMembers();
    };

    const handleRemoveMember = async (membershipId) => {
        if (confirm('¿Remover miembro del ministerio?')) {
            await removeMemberFromMinistry(membershipId);
            loadMembers();
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
                <p className="text-gray-500">Cargando ministerio...</p>
            </div>
        );
    }

    if (!ministry) return <div>Ministerio no encontrado</div>;

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <div className="bg-white shadow-sm p-4 sticky top-0 z-10">
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center mb-4">
                        <button onClick={() => navigate('/')} className="mr-4 p-2 hover:bg-gray-100 rounded-full transition-colors">
                            <ArrowLeft className="w-6 h-6 text-gray-600" />
                        </button>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">{ministry.nombre}</h1>
                            <p className="text-sm text-gray-500">{members.length} miembros activos</p>
                        </div>
                    </div>

                    <div className="flex gap-6 border-b border-gray-100">
                        <button
                            onClick={() => setActiveTab('members')}
                            className={`pb-3 font-medium text-sm transition-colors relative ${activeTab === 'members' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Miembros
                            {activeTab === 'members' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-t-full" />}
                        </button>
                        <button
                            onClick={() => setActiveTab('events')}
                            className={`pb-3 font-medium text-sm transition-colors relative ${activeTab === 'events' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Eventos
                            {activeTab === 'events' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-t-full" />}
                        </button>
                        <button
                            onClick={() => setActiveTab('funds')}
                            className={`pb-3 font-medium text-sm transition-colors relative ${activeTab === 'funds' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Fondos
                            {activeTab === 'funds' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-t-full" />}
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto p-4">
                {activeTab === 'members' && (
                    <div className="space-y-3">
                        {members.map(member => (
                            <div key={member.membership_id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">
                                        {member.foto ? (
                                            <img src={member.foto} alt={member.nombre} className="w-12 h-12 rounded-full object-cover" />
                                        ) : (
                                            `${member.nombre.charAt(0)}${member.apellido_paterno.charAt(0)}`
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900">{member.nombre} {member.apellido_paterno}</h3>
                                        <p className="text-sm text-gray-500">{member.telefono || 'Sin teléfono'}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleRemoveMember(member.membership_id)}
                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        ))}
                        {members.length === 0 && (
                            <div className="text-center py-12 text-gray-500 bg-white rounded-xl border border-dashed border-gray-200">
                                No hay miembros en este ministerio
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'events' && (
                    <Events ministryId={id} ministryName={ministry.nombre} />
                )}

                {activeTab === 'funds' && (
                    <Funds ministryId={id} />
                )}
            </div>

            {/* Floating Action Button */}
            {activeTab === 'members' && (
                <button
                    onClick={handleShowAddMember}
                    className="fixed bottom-24 right-6 w-16 h-16 bg-blue-600 text-white rounded-full shadow-xl shadow-blue-300 flex items-center justify-center hover:bg-blue-700 transition-all transform hover:scale-105 active:scale-95 z-50"
                    title="Agregar Miembro"
                >
                    <Plus className="w-8 h-8" />
                </button>
            )}

            {/* MODALS */}
            {showAddMember && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col shadow-2xl">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-gray-900">Agregar Miembro</h3>
                            <button onClick={() => setShowAddMember(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                <span className="text-gray-500 text-xl">✕</span>
                            </button>
                        </div>
                        <div className="overflow-y-auto p-4 space-y-2">
                            {availableMembers.map(m => (
                                <button
                                    key={m.id}
                                    onClick={() => handleAddMember(m.id)}
                                    className="w-full text-left p-3 hover:bg-blue-50 border border-gray-100 rounded-xl flex items-center justify-between group transition-all"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
                                            {m.foto ? (
                                                <img src={m.foto} alt={m.nombre} className="w-10 h-10 rounded-full object-cover" />
                                            ) : (
                                                `${m.nombre.charAt(0)}${m.apellido_paterno.charAt(0)}`
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-900">{m.nombre} {m.apellido_paterno}</p>
                                            <p className="text-xs text-gray-500">{m.genero}</p>
                                        </div>
                                    </div>
                                    <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                                        <Plus className="w-5 h-5" />
                                    </div>
                                </button>
                            ))}
                            {availableMembers.length === 0 && (
                                <div className="text-center py-8 text-gray-500">
                                    No hay miembros disponibles para agregar
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
