import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Loader2, X, Shield, Search } from 'lucide-react';
import { getAllUsers, updateUser, createUser, deleteUser } from '../../services/userService';
import { toast } from 'react-toastify';

export const Settings = ({ ministryId }) => {
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('create');
    const [selectedUser, setSelectedUser] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);

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
        }
    }, [ministryId]);

    useEffect(() => {
        filterUsers();
    }, [users, searchTerm]);

    const loadData = async () => {
        try {
            setLoading(true);
            const usersData = await getAllUsers();
            // Filtrar solo los usuarios del ministerio actual
            const ministryUsers = usersData.filter(u => u.ministry_id === ministryId);
            setUsers(ministryUsers);
        } catch (error) {
            console.error('Error:', error);
            toast.error('Error al cargar datos de configuración');
        } finally {
            setLoading(false);
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

    const handleOpenModal = (mode, user = null) => {
        setModalMode(mode);
        setSelectedUser(user);
        if (mode === 'edit' && user) {
            setFormData({
                nombre: user.nombre,
                email: user.email,
                password: '',
                role: user.role,
                ministry_id: ministryId // Siempre forzar el ministerio actual
            });
        } else {
            setFormData({
                nombre: '',
                email: '',
                password: '',
                role: 'youth_liderazgo',
                ministry_id: ministryId
            });
        }
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setSelectedUser(null);
        setFormData({
            nombre: '',
            email: '',
            password: '',
            role: 'youth_liderazgo',
            ministry_id: ministryId
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (modalMode === 'create') {
                await createUser({ ...formData, ministry_id: ministryId });
                toast.success('Usuario de Jóvenes creado exitosamente');
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

    const handleDeleteClick = (user) => {
        setUserToDelete(user);
        setShowDeleteConfirm(true);
    };

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

    return (
        <div className="space-y-8">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                            <Shield className="w-6 h-6 text-blue-600" />
                            Accesos del Ministerio
                        </h2>
                        <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
                            Asigna roles específicos (Coordinador o Asistente) para el personal de Jóvenes.
                        </p>
                    </div>
                    <button
                        onClick={() => handleOpenModal('create')}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
                    >
                        <Plus className="w-4 h-4" />
                        Nuevo Acceso
                    </button>
                </div>

                {/* Barra de búsqueda */}
                <div className="relative max-w-md">
                    <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre o correo..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>

                {/* Users Table */}
            {loading ? (
                <div className="flex justify-center p-12">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
            ) : filteredUsers.length === 0 ? (
                <div className="text-center py-16 text-gray-500 bg-white rounded-xl border border-dashed border-gray-200">
                    <p>No hay cuentas configuradas en este ministerio todavía.</p>
                </div>
            ) : (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border border-gray-100 dark:border-gray-700">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 dark:bg-gray-700/50">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Usuario</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Email (Login)</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Rol / Permiso</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {filteredUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">
                                                    {user.nombre.charAt(0).toUpperCase()}
                                                </div>
                                                <span className="font-medium text-gray-900 dark:text-gray-100">{user.nombre}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                                            {user.email}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full w-fit ${
                                                user.role === 'admin' || user.role === 'leader'
                                                    ? 'bg-blue-100 text-blue-700'
                                                    : user.role.startsWith('youth_')
                                                        ? 'bg-indigo-100 text-indigo-700'
                                                        : 'bg-gray-100 text-gray-700'
                                            }`}>
                                                {user.role === 'leader' ? 'Líder General' : user.role === 'youth_liderazgo' ? 'Coordinador de Liderazgo' : user.role === 'youth_no_asistencia' ? 'Líder Asistente' : 'Miembro Restringido'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => handleOpenModal('edit', user)}
                                                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                    title="Editar Rol"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteClick(user)}
                                                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                                    title="Revocar Cuenta"
                                                >
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

            {/* Create/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-md max-h-[90vh] flex flex-col shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800 rounded-t-xl shrink-0">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                {modalMode === 'create' ? 'Crear Nuevo Acceso' : 'Modificar Privilegios'}
                            </h3>
                            <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                            <form id="roleForm" onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
                                    <input
                                        type="text"
                                        value={formData.nombre}
                                        onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email <span className="text-gray-400 font-normal">(Login)</span></label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                                    <input
                                        type="password"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder={modalMode === 'edit' ? 'Dejar en blanco para mantener actual' : 'Mínimo 6 caracteres'}
                                        required={modalMode === 'create'}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Asignar Rol</label>
                                    <div className="space-y-2">
                                        <label className="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="role"
                                                value="youth_liderazgo"
                                                checked={formData.role === 'youth_liderazgo'}
                                                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                                className="mt-1"
                                            />
                                            <div>
                                                <div className="font-semibold text-gray-900">Coordinador de Liderazgo</div>
                                                <div className="text-xs text-gray-500">Acceso única y exclusivamente a la sección de Liderazgo.</div>
                                            </div>
                                        </label>
                                        <label className="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="role"
                                                value="youth_no_asistencia"
                                                checked={formData.role === 'youth_no_asistencia'}
                                                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                                className="mt-1"
                                            />
                                            <div>
                                                <div className="font-semibold text-gray-900">Líder Asistente</div>
                                                <div className="text-xs text-gray-500">Acceso a todo el ministerio excepto listas de Asistencia.</div>
                                            </div>
                                        </label>
                                    </div>
                                </div>
                            </form>
                        </div>
                        <div className="p-4 border-t border-gray-100 flex gap-3 shrink-0 bg-gray-50 dark:bg-gray-800 rounded-b-xl">
                            <button
                                type="button"
                                onClick={handleCloseModal}
                                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-white transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                form="roleForm"
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
                            >
                                {modalMode === 'create' ? 'Crear Cuenta' : 'Guardar Cambios'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirm Modal (Ad-hoc simple) */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 text-center">
                        <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Trash2 className="w-6 h-6" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Eliminar Cuenta Totalmente</h3>
                        <p className="text-sm text-gray-500 mb-6">
                            Estás a punto de eliminar permanentemente a <strong>{userToDelete?.nombre}</strong> del sistema. Perderán el acceso por completo.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleDeleteConfirm}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                            >
                                Sí, Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
