import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import MainLayout from '@/components/layout/MainLayout';
import { usersAPI, authAPI } from '@/api/client';
import { Plus, Edit, Trash2, Mail, Phone, User, Shield, AlertCircle, CheckCircle } from 'lucide-react';

const Users = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('create'); // 'create' or 'edit'
  const [selectedUser, setSelectedUser] = useState(null);
  const [message, setMessage] = useState(null);

  const [formData, setFormData] = useState({
    email: '',
    nombre_completo: '',
    password: '',
    role: 'tecnico',
    roles: ['tecnico'], // Array de roles
    activo: true,
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await usersAPI.getAll();
      setUsers(response.data);
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
      showMessage('Error al cargar usuarios', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleCreate = () => {
    setModalType('create');
    setFormData({
      email: '',
      nombre_completo: '',
      password: '',
      role: 'tecnico',
      roles: ['tecnico'],
      activo: true,
    });
    setShowModal(true);
  };

  const handleEdit = (user) => {
    setModalType('edit');
    setSelectedUser(user);
    setFormData({
      email: user.email,
      nombre_completo: user.nombre_completo,
      role: user.role,
      roles: user.roles || [user.role], // Si no tiene roles array, usar el rol principal
      activo: user.activo,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (modalType === 'create') {
        await authAPI.register(formData);
        showMessage('Usuario creado exitosamente', 'success');
      } else {
        const updateData = { ...formData };
        delete updateData.password; // No enviar password en update
        await usersAPI.update(selectedUser.id, updateData);
        showMessage('Usuario actualizado exitosamente', 'success');
      }

      setShowModal(false);
      loadUsers();
    } catch (error) {
      console.error('Error:', error);
      showMessage(error.response?.data?.detail || 'Error al guardar usuario', 'error');
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('¿Estás seguro de eliminar este usuario?')) {
      return;
    }

    try {
      await usersAPI.delete(userId);
      showMessage('Usuario eliminado exitosamente', 'success');
      loadUsers();
    } catch (error) {
      console.error('Error:', error);
      showMessage(error.response?.data?.detail || 'Error al eliminar usuario', 'error');
    }
  };

  const getRoleBadge = (role) => {
    const badges = {
      admin: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      supervisor: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      asesor: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      tecnico: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    };
    const labels = {
      admin: 'Administrador',
      supervisor: 'Supervisor',
      asesor: 'Asesor',
      tecnico: 'Técnico',
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${badges[role]}`}>
        {labels[role]}
      </span>
    );
  };

  const handleRoleToggle = (role) => {
    const newRoles = formData.roles.includes(role)
      ? formData.roles.filter(r => r !== role)
      : [...formData.roles, role];
    
    // Siempre debe haber al menos un rol seleccionado
    if (newRoles.length === 0) return;
    
    // Actualizar el rol principal si el actual fue deseleccionado
    const newRole = newRoles.includes(formData.role) ? formData.role : newRoles[0];
    
    setFormData({ ...formData, roles: newRoles, role: newRole });
  };

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gestión de Usuarios</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Administrar usuarios del sistema</p>
          </div>
          {currentUser?.role === 'admin' && (
            <button
              onClick={handleCreate}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              data-testid="create-user-button"
            >
              <Plus className="w-5 h-5" />
              <span>Crear Usuario</span>
            </button>
          )}
        </div>

        {/* Message Alert */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg flex items-start space-x-3 ${
              message.type === 'success'
                ? 'bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800'
                : 'bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
            )}
            <p className={`text-sm font-medium ${
              message.type === 'success' ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'
            }`}>
              {message.text}
            </p>
          </div>
        )}

        {/* Buscador y Filtros */}
        <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por nombre o email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
            <div className="w-full md:w-48">
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">Todos los roles</option>
                <option value="admin">Administrador</option>
                <option value="supervisor">Supervisor</option>
                <option value="asesor">Asesor</option>
                <option value="tecnico">Técnico</option>
              </select>
            </div>
            {(searchTerm || filterRole) && (
              <button
                onClick={() => { setSearchTerm(''); setFilterRole(''); }}
                className="flex items-center justify-center px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                <X className="w-4 h-4 mr-2" />
                Limpiar
              </button>
            )}
          </div>
          <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
            <Filter className="w-4 h-4 inline mr-1" />
            Mostrando {users.filter(u => {
              const matchesSearch = !searchTerm || 
                u.nombre_completo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                u.email?.toLowerCase().includes(searchTerm.toLowerCase());
              const matchesRole = !filterRole || u.roles?.includes(filterRole) || u.role === filterRole;
              return matchesSearch && matchesRole;
            }).length} usuario(s)
          </div>
        </div>

        {/* Users Table */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Usuario
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Rol
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {users.map((user) => (
                    <tr key={user.id} data-testid={`user-row-${user.id}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                            <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">{user.nombre_completo}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-gray-300">{user.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-wrap gap-1">
                          {(user.roles && user.roles.length > 0 ? user.roles : [user.role]).map((role) => (
                            <span key={role}>{getRoleBadge(role)}</span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            user.activo
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          }`}
                        >
                          {user.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleEdit(user)}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 mr-4"
                          data-testid={`edit-user-${user.id}`}
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        {currentUser?.role === 'admin' && user.id !== currentUser.id && (
                          <button
                            onClick={() => handleDelete(user.id)}
                            className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                            data-testid={`delete-user-${user.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                {modalType === 'create' ? 'Crear Usuario' : 'Editar Usuario'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nombre Completo
                  </label>
                  <input
                    type="text"
                    value={formData.nombre_completo}
                    onChange={(e) => setFormData({ ...formData, nombre_completo: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    required
                    disabled={modalType === 'edit'}
                  />
                </div>

                {modalType === 'create' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Contraseña
                    </label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      required
                      minLength={6}
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Roles (selecciona uno o más)
                  </label>
                  <div className="space-y-2">
                    {[
                      { value: 'tecnico', label: 'Técnico' },
                      { value: 'asesor', label: 'Asesor de Ventas' },
                      { value: 'supervisor', label: 'Supervisor' },
                      { value: 'admin', label: 'Administrador' }
                    ].map((roleOption) => (
                      <label
                        key={roleOption.value}
                        className="flex items-center space-x-3 cursor-pointer p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <input
                          type="checkbox"
                          checked={formData.roles.includes(roleOption.value)}
                          onChange={() => handleRoleToggle(roleOption.value)}
                          disabled={currentUser?.role !== 'admin'}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
                        />
                        <span className="text-sm text-gray-900 dark:text-gray-300">
                          {roleOption.label}
                        </span>
                        {formData.roles.includes(roleOption.value) && formData.role === roleOption.value && (
                          <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                            (Principal)
                          </span>
                        )}
                      </label>
                    ))}
                  </div>
                  {formData.roles.length > 1 && (
                    <div className="mt-3">
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                        Rol Principal
                      </label>
                      <select
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        disabled={currentUser?.role !== 'admin'}
                      >
                        {formData.roles.map((role) => (
                          <option key={role} value={role}>
                            {role === 'admin' ? 'Administrador' : role === 'supervisor' ? 'Supervisor' : role === 'asesor' ? 'Asesor' : 'Técnico'}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="activo"
                    checked={formData.activo}
                    onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    disabled={currentUser?.role !== 'admin'}
                  />
                  <label htmlFor="activo" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                    Usuario Activo
                  </label>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {modalType === 'create' ? 'Crear' : 'Guardar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Users;
