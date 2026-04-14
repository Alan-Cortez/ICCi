import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Loader2, X, Download, Search } from 'lucide-react';
import { getAllUsers, updateUser, createUser, deleteUser } from '../../services/userService';
import { getAllMinistries } from '../../services/ministryService';
import { FilterBar } from '../../components/admin/FilterBar';
import { ConfirmModal } from '../../components/admin/ConfirmModal';
import { toast } from 'react-toastify';
import * as XLSX from 'xlsx';

export const AdminUsers = () => {
    const [users, setUsers] = useState([]);
    const [ministries, setMinistries] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('create');
    const [selectedUser, setSelectedUser] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);
    const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });
    const [formData, setFormData] = useState({
        nombre: '',
        email: '',
        password: '',
        role: 'member',
        ministry_id: ''
    });

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        filterAndSortUsers();
    }, [users, searchTerm, roleFilter, sortConfig]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [usersData, ministriesData] = await Promise.all([
                getAllUsers(),
                getAllMinistries()
            ]);
            setUsers(usersData);
            setMinistries(ministriesData);
        } catch (error) {
            console.error('Error:', error);
            toast.error('Error al cargar datos');
        } finally {
            setLoading(false);
        }
    };

    const filterAndSortUsers = () => {
        let filtered = [...users];

        // Apply search filter
        if (searchTerm) {
            filtered = filtered.filter(user =>
                user.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.email.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Apply role filter
        if (roleFilter) {
            filtered = filtered.filter(user => user.role === roleFilter);
        }

        // Apply sorting
        filtered.sort((a, b) => {
            const aValue = a[sortConfig.key];
            const bValue = b[sortConfig.key];

            if (aValue < bValue) {
                return sortConfig.direction === 'asc' ? -1 : 1;
            }
            if (aValue > bValue) {
                return sortConfig.direction === 'asc' ? 1 : -1;
            }
            return 0;
        });

        setFilteredUsers(filtered);
    };

    const handleSort = (key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
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
                ministry_id: user.ministry_id || ''
            });
        } else {
            setFormData({
                nombre: '',
                email: '',
                password: '',
                role: 'member',
                ministry_id: ''
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
            role: 'member',
            ministry_id: ''
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (modalMode === 'create') {
                await createUser(formData);
                toast.success('Usuario creado exitosamente');
            } else {
                await updateUser(selectedUser.id, formData);
                toast.success('Usuario actualizado exitosamente');
            }
            handleCloseModal();
            const usersData = await getAllUsers(); // Reload users
            setUsers(usersData);
        } catch (error) {
            toast.error('Error al guardar usuario');
        }
    };

    const handleDeleteClick = (user) => {
        setUserToDelete(user);
        setShowDeleteConfirm(true);
    };

    const handleDeleteConfirm = async () => {
        try {
            await deleteUser(userToDelete.id);
            toast.success('Usuario eliminado exitosamente');
            const usersData = await getAllUsers(); // Reload users
            setUsers(usersData);
        } catch (error) {
            toast.error('Error al eliminar usuario');
        }
    };

    const handleExport = () => {
        const exportData = filteredUsers.map(user => ({
            Nombre: user.nombre,
            Email: user.email,
            Rol: user.role,
            Ministerio: user.ministry_name || 'N/A',
            'Fecha de Creación': new Date(user.created_at).toLocaleDateString('es-MX')
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Usuarios');
        XLSX.writeFile(wb, `usuarios_${new Date().toISOString().split('T')[0]}.xlsx`);
        toast.success('Usuarios exportados exitosamente');
    };

    const handleReset = () => {
        setSearchTerm('');
        setRoleFilter('');
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        Gestión de Usuarios
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400">
                        {filteredUsers.length} usuario{filteredUsers.length !== 1 ? 's' : ''} encontrado{filteredUsers.length !== 1 ? 's' : ''}
                    </p>
                </div>
                <button
                    onClick={() => handleOpenModal('create')}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Crear Usuario
                </button>
            </div>

            {/* Filter Bar */}
            <FilterBar
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                filters={[
                    { value: 'admin', label: 'Administradores' },
                    { value: 'leader', label: 'Líderes' },
                    { value: 'member', label: 'Miembros' },
                    { value: 'youth_liderazgo', label: 'Jóvenes: Coord. Liderazgo' },
                    { value: 'youth_no_asistencia', label: 'Jóvenes: Líder Asistente' }
                ]}
                activeFilter={roleFilter}
                onFilterChange={setRoleFilter}
                onExport={handleExport}
                onReset={handleReset}
                placeholder="Buscar por nombre o email..."
            />

            {/* Users Table */}
            {loading ? (
                <div className="flex justify-center p-12">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
            ) : (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border border-gray-100 dark:border-gray-700">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 dark:bg-gray-700/50">
                                <tr>
                                    <th
                                        onClick={() => handleSort('nombre')}
                                        className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                                    >
                                        Usuario {sortConfig.key === 'nombre' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                    </th>
                                    <th
                                        onClick={() => handleSort('email')}
                                        className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                                    >
                                        Email {sortConfig.key === 'email' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                    </th>
                                    <th
                                        onClick={() => handleSort('role')}
                                        className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                                    >
                                        Rol {sortConfig.key === 'role' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                    </th>
                                    <th
                                        onClick={() => handleSort('created_at')}
                                        className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                                    >
                                        Fecha {sortConfig.key === 'created_at' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                    </th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Acciones
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {filteredUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 font-medium">
                                                    {user.nombre.charAt(0).toUpperCase()}
                                                </div>
                                                <span className="font-medium text-gray-900 dark:text-gray-100">{user.nombre}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                                            {user.email}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <span className={`px-2 py-1 text-xs font-medium rounded-full w-fit ${user.role === 'admin'
                                                    ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                                                    : user.role === 'leader' || user.role.startsWith('youth_')
                                                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                                                        : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                                                    }`}>
                                                    {user.role === 'admin' ? 'Administrador' : user.role === 'leader' ? 'Líder' : user.role === 'youth_liderazgo' ? 'Jóvenes: Coord. Liderazgo' : user.role === 'youth_no_asistencia' ? 'Jóvenes: Líder Asistente' : 'Miembro'}
                                                </span>
                                                {(user.role === 'leader' || user.role.startsWith('youth_')) && user.ministry_name && (
                                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                                        {user.ministry_name}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600 dark:text-gray-300 text-sm">
                                            {new Date(user.created_at).toLocaleDateString('es-MX')}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleOpenModal('edit', user)}
                                                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                                                    title="Editar"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteClick(user)}
                                                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                                                    title="Eliminar"
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

            {/* Create/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-md shadow-xl">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                {modalMode === 'create' ? 'Nuevo Usuario' : 'Editar Usuario'}
                            </h3>
                            <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Nombre Completo
                                </label>
                                <input
                                    type="text"
                                    value={formData.nombre}
                                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Contraseña
                                </label>
                                <input
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder={modalMode === 'edit' ? 'Dejar en blanco para mantener actual' : ''}
                                    required={modalMode === 'create'}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Rol
                                </label>
                                <select
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                >
                                    <option value="member">Miembro</option>
                                    <option value="leader">Líder</option>
                                    <option value="admin">Administrador</option>
                                    <option value="youth_liderazgo">Jóvenes: Coord. Liderazgo</option>
                                    <option value="youth_no_asistencia">Jóvenes: Líder Asistente</option>
                                </select>
                            </div>

                            {(formData.role === 'leader' || formData.role?.startsWith('youth_')) && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Asignar Ministerio
                                    </label>
                                    <select
                                        value={formData.ministry_id}
                                        onChange={(e) => setFormData({ ...formData, ministry_id: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        required
                                    >
                                        <option value="">Seleccione un ministerio</option>
                                        {ministries.map(ministry => (
                                            <option key={ministry.id} value={ministry.id}>
                                                {ministry.nombre}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div className="pt-2 flex gap-3">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    {modalMode === 'create' ? 'Crear' : 'Actualizar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            <ConfirmModal
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={handleDeleteConfirm}
                title="Eliminar Usuario"
                message={`¿Estás seguro de que deseas eliminar al usuario "${userToDelete?.nombre}"? Esta acción no se puede deshacer.`}
                confirmText="Eliminar"
                cancelText="Cancelar"
                variant="danger"
            />
        </div>
    );
};
