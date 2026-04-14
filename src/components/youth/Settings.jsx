import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Loader2, X, Shield, Search, Clock, CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { getAllUsers, updateUser, createUser, deleteUser } from '../../services/userService';
import { getPendingActions, approveAction, rejectAction, getActionLabel } from '../../services/pendingActionsService';
import { toast } from 'react-toastify';

export const Settings = ({ ministryId, onPendingChange }) => {
    // ── User management state ──
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('create');
    const [selectedUser, setSelectedUser] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);

    // ── Pending actions state ──
    const [pendingActions, setPendingActions] = useState([]);
    const [pendingLoading, setPendingLoading] = useState(true);
    const [processingId, setProcessingId] = useState(null);
    const [rejectModal, setRejectModal] = useState(null);
    const [rejectNote, setRejectNote] = useState('');
    const [activeSection, setActiveSection] = useState('pending'); // 'pending' | 'users'

    const [formData, setFormData] = useState({
        nombre: '',
        email: '',
        password: '',
        role: 'youth_liderazgo',
        ministry_id: ministryId
    });

    useEffect(() => {
        if (ministryId) {
            loadData();
            loadPending();
        }
    }, [ministryId]);

    useEffect(() => {
        filterUsers();
    }, [users, searchTerm]);

    const loadData = async () => {
        try {
            setLoading(true);
            const usersData = await getAllUsers();
            const ministryUsers = usersData.filter(u => u.ministry_id === ministryId);
            setUsers(ministryUsers);
        } catch (error) {
            toast.error('Error al cargar usuarios');
        } finally {
            setLoading(false);
        }
    };

    const loadPending = async () => {
        try {
            setPendingLoading(true);
            const actions = await getPendingActions(ministryId);
            setPendingActions(actions);
            onPendingChange?.();
        } catch (error) {
            console.error('Error al cargar solicitudes:', error);
        } finally {
            setPendingLoading(false);
        }
    };

    const filterUsers = () => {
        let filtered = [...users];
        if (searchTerm) {
            filtered = filtered.filter(user =>
                user.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.email.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        setFilteredUsers(filtered);
    };

    const handleApprove = async (action) => {
        setProcessingId(action.id);
        try {
            await approveAction(action);
            toast.success('✅ Solicitud aprobada y aplicada');
            loadPending();
        } catch (error) {
            toast.error('Error al aprobar solicitud');
        } finally {
            setProcessingId(null);
        }
    };

    const handleRejectConfirm = async () => {
        if (!rejectModal) return;
        setProcessingId(rejectModal.id);
        try {
            await rejectAction(rejectModal.id, rejectNote);
            toast.info('Solicitud rechazada');
            setRejectModal(null);
            setRejectNote('');
            loadPending();
        } catch (error) {
            toast.error('Error al rechazar solicitud');
        } finally {
            setProcessingId(null);
        }
    };

    const handleOpenModal = (mode, user = null) => {
        setModalMode(mode);
        setSelectedUser(user);
        if (mode === 'edit' && user) {
            setFormData({ nombre: user.nombre, email: user.email, password: '', role: user.role, ministry_id: ministryId });
        } else {
            setFormData({ nombre: '', email: '', password: '', role: 'youth_liderazgo', ministry_id: ministryId });
        }
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setSelectedUser(null);
        setFormData({ nombre: '', email: '', password: '', role: 'youth_liderazgo', ministry_id: ministryId });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (modalMode === 'create') {
                await createUser({ ...formData, ministry_id: ministryId });
                toast.success('Usuario creado exitosamente');
            } else {
                await updateUser(selectedUser.id, { ...formData, ministry_id: ministryId });
                toast.success('Rol actualizado exitosamente');
            }
            handleCloseModal();
            loadData();
        } catch (error) {
            toast.error('Error al guardar acceso');
        }
    };

    const handleDeleteClick = (user) => { setUserToDelete(user); setShowDeleteConfirm(true); };

    const handleDeleteConfirm = async () => {
        try {
            await deleteUser(userToDelete.id);
            toast.success('Acceso revocado exitosamente');
            setShowDeleteConfirm(false);
            setUserToDelete(null);
            loadData();
        } catch (error) {
            toast.error('Error al revocar acceso');
        }
    };

    if (!ministryId) return null;

    const pendingOnly = pendingActions.filter(a => a.status === 'pending');
    const reviewedActions = pendingActions.filter(a => a.status !== 'pending');

    const statusBadge = (status) => {
        if (status === 'approved') return <span className="px-2 py-0.5 text-xs font-semibold bg-green-100 text-green-700 rounded-full">Aprobado</span>;
        if (status === 'rejected') return <span className="px-2 py-0.5 text-xs font-semibold bg-red-100 text-red-700 rounded-full">Rechazado</span>;
        return <span className="px-2 py-0.5 text-xs font-semibold bg-yellow-100 text-yellow-700 rounded-full flex items-center gap-1"><Clock className="w-3 h-3" /> Pendiente</span>;
    };

    return (
        <div className="space-y-6">

            {/* Section Tabs */}
            <div className="flex gap-2 bg-gray-100 dark:bg-gray-700 p-1 rounded-xl w-fit">
                <button
                    onClick={() => setActiveSection('pending')}
                    className={`relative px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeSection === 'pending' ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Solicitudes Pendientes
                    {pendingOnly.length > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                            {pendingOnly.length > 9 ? '9+' : pendingOnly.length}
                        </span>
                    )}
                </button>
                <button
                    onClick={() => setActiveSection('users')}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeSection === 'users' ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Accesos del Ministerio
                </button>
            </div>

            {/* ── PENDING ACTIONS SECTION ── */}
            {activeSection === 'pending' && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                <Clock className="w-5 h-5 text-yellow-500" />
                                Solicitudes de Cambio
                            </h2>
                            <p className="text-sm text-gray-500 mt-0.5">
                                Aprueba o rechaza los cambios solicitados por los líderes del ministerio.
                            </p>
                        </div>
                        <button
                            onClick={loadPending}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Actualizar"
                        >
                            <RefreshCw className="w-4 h-4" />
                        </button>
                    </div>

                    {pendingLoading ? (
                        <div className="flex justify-center p-12">
                            <Loader2 className="w-7 h-7 animate-spin text-blue-600" />
                        </div>
                    ) : pendingOnly.length === 0 ? (
                        <div className="text-center py-14 text-gray-400">
                            <CheckCircle className="w-10 h-10 mx-auto mb-3 text-green-300" />
                            <p className="font-medium">¡Todo al día!</p>
                            <p className="text-sm mt-1">No hay solicitudes pendientes en este momento.</p>
                        </div>
                    ) : (
                        <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                            {pendingOnly.map(action => (
                                <li key={action.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors">
                                    <div className="flex items-start gap-3 flex-1 min-w-0">
                                        <div className="w-9 h-9 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                                            <AlertCircle className="w-4 h-4" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm truncate">
                                                {getActionLabel(action.action_type, action.entity_data)}
                                            </p>
                                            <p className="text-xs text-gray-400 mt-0.5">
                                                Solicitado por <span className="font-medium text-gray-600 dark:text-gray-300">{action.requested_by_nombre}</span> · {new Date(action.created_at).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' })}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <button
                                            onClick={() => handleApprove(action)}
                                            disabled={processingId === action.id}
                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white text-xs font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                                        >
                                            {processingId === action.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                                            Aprobar
                                        </button>
                                        <button
                                            onClick={() => setRejectModal(action)}
                                            disabled={processingId === action.id}
                                            className="flex items-center gap-1.5 px-3 py-1.5 border border-red-200 text-red-600 text-xs font-semibold rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors"
                                        >
                                            <XCircle className="w-3.5 h-3.5" />
                                            Rechazar
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}

                    {/* Reviewed history */}
                    {reviewedActions.length > 0 && (
                        <div className="border-t border-gray-100 dark:border-gray-700">
                            <div className="px-5 py-3 bg-gray-50 dark:bg-gray-700/50">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Historial reciente</p>
                            </div>
                            <ul className="divide-y divide-gray-100 dark:divide-gray-700 max-h-48 overflow-y-auto">
                                {reviewedActions.slice(0, 10).map(action => (
                                    <li key={action.id} className="px-5 py-3 flex items-center justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
                                                {getActionLabel(action.action_type, action.entity_data)}
                                            </p>
                                            <p className="text-xs text-gray-400">{action.requested_by_nombre} · {new Date(action.created_at).toLocaleDateString('es-MX')}</p>
                                        </div>
                                        {statusBadge(action.status)}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}

            {/* ── USER MANAGEMENT SECTION ── */}
            {activeSection === 'users' && (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                <Shield className="w-5 h-5 text-blue-600" />
                                Accesos del Ministerio
                            </h2>
                            <p className="text-gray-500 dark:text-gray-400 mt-0.5 text-sm">
                                Asigna roles a los líderes del Ministerio de Jóvenes.
                            </p>
                        </div>
                        <button
                            onClick={() => handleOpenModal('create')}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap text-sm font-medium"
                        >
                            <Plus className="w-4 h-4" />
                            Nuevo Acceso
                        </button>
                    </div>

                    <div className="relative max-w-md">
                        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre o correo..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                        />
                    </div>

                    {loading ? (
                        <div className="flex justify-center p-10">
                            <Loader2 className="w-7 h-7 animate-spin text-blue-600" />
                        </div>
                    ) : filteredUsers.length === 0 ? (
                        <div className="text-center py-14 text-gray-400 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-dashed border-gray-200 dark:border-gray-600">
                            <p className="font-medium">No hay cuentas configuradas aún.</p>
                            <p className="text-sm mt-1">Crea el primer acceso con el botón de arriba.</p>
                        </div>
                    ) : (
                        <div className="rounded-xl overflow-hidden border border-gray-100 dark:border-gray-700">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-gray-50 dark:bg-gray-700/50 text-xs font-semibold text-gray-500 uppercase">
                                        <tr>
                                            <th className="px-5 py-3">Usuario</th>
                                            <th className="px-5 py-3">Email</th>
                                            <th className="px-5 py-3">Rol</th>
                                            <th className="px-5 py-3 text-right">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                        {filteredUsers.map((user) => (
                                            <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center text-blue-600 font-bold text-xs">
                                                            {user.nombre.charAt(0).toUpperCase()}
                                                        </div>
                                                        <span className="font-medium text-gray-900 dark:text-gray-100">{user.nombre}</span>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4 text-gray-500 dark:text-gray-400">{user.email}</td>
                                                <td className="px-5 py-4">
                                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${user.role === 'youth_liderazgo' ? 'bg-indigo-100 text-indigo-700' : 'bg-purple-100 text-purple-700'}`}>
                                                        {user.role === 'youth_liderazgo' ? 'Coordinador de Liderazgo' : 'Líder Asistente'}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4 text-right">
                                                    <div className="flex justify-end gap-1.5">
                                                        <button onClick={() => handleOpenModal('edit', user)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Editar">
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                        <button onClick={() => handleDeleteClick(user)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Revocar">
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ── CREATE / EDIT MODAL ── */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-md max-h-[90vh] flex flex-col shadow-2xl">
                        <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800 rounded-t-xl shrink-0">
                            <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
                                {modalMode === 'create' ? 'Crear Nuevo Acceso' : 'Modificar Privilegios'}
                            </h3>
                            <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1">
                            <form id="roleForm" onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre Completo</label>
                                    <input type="text" value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email <span className="text-gray-400 font-normal">(Login)</span></label>
                                    <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contraseña</label>
                                    <input type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                        placeholder={modalMode === 'edit' ? 'Dejar en blanco para mantener actual' : 'Mínimo 6 caracteres'}
                                        required={modalMode === 'create'} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Asignar Rol</label>
                                    <div className="space-y-2">
                                        <label className="flex items-start gap-3 p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                                            <input type="radio" name="role" value="youth_liderazgo" checked={formData.role === 'youth_liderazgo'} onChange={(e) => setFormData({ ...formData, role: e.target.value })} className="mt-1" />
                                            <div>
                                                <div className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Coordinador de Liderazgo</div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400">Solo puede ver y gestionar la sección de Liderazgo.</div>
                                            </div>
                                        </label>
                                        <label className="flex items-start gap-3 p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                                            <input type="radio" name="role" value="youth_no_asistencia" checked={formData.role === 'youth_no_asistencia'} onChange={(e) => setFormData({ ...formData, role: e.target.value })} className="mt-1" />
                                            <div>
                                                <div className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Líder Asistente</div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400">Acceso a todo el ministerio excepto Asistencia.</div>
                                            </div>
                                        </label>
                                    </div>
                                </div>
                            </form>
                        </div>
                        <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex gap-3 shrink-0 bg-gray-50 dark:bg-gray-800 rounded-b-xl">
                            <button type="button" onClick={handleCloseModal} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-white dark:hover:bg-gray-700 text-sm transition-colors">Cancelar</button>
                            <button type="submit" form="roleForm" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors">
                                {modalMode === 'create' ? 'Crear Cuenta' : 'Guardar Cambios'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── REJECT MODAL ── */}
            {rejectModal && (
                <div className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-sm shadow-2xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                                <XCircle className="w-5 h-5 text-red-600" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 dark:text-gray-100">Rechazar Solicitud</h3>
                                <p className="text-xs text-gray-500">Opcional: indica el motivo del rechazo</p>
                            </div>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                            {getActionLabel(rejectModal.action_type, rejectModal.entity_data)}
                        </p>
                        <textarea
                            value={rejectNote}
                            onChange={(e) => setRejectNote(e.target.value)}
                            placeholder="Motivo del rechazo (opcional)..."
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-red-300 outline-none text-sm resize-none mb-4"
                        />
                        <div className="flex gap-3">
                            <button onClick={() => { setRejectModal(null); setRejectNote(''); }} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 dark:text-gray-300 rounded-lg text-sm hover:bg-gray-50">Cancelar</button>
                            <button onClick={handleRejectConfirm} disabled={processingId === rejectModal?.id} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors">
                                {processingId === rejectModal?.id ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Rechazar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── DELETE CONFIRM MODAL ── */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-sm p-6 text-center">
                        <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Trash2 className="w-6 h-6" />
                        </div>
                        <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-2">Eliminar Cuenta</h3>
                        <p className="text-sm text-gray-500 mb-6">
                            Eliminarás permanentemente a <strong>{userToDelete?.nombre}</strong>. Perderán acceso al sistema.
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 dark:text-gray-300 text-sm hover:bg-gray-50">Cancelar</button>
                            <button onClick={handleDeleteConfirm} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700">Sí, Eliminar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
