// Helpers compartidos para el módulo de Servicios

export const getEstadoBadge = (estado) => {
  const badges = {
    pendiente_aprobacion: {
      color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      text: 'Pendiente',
    },
    aprobado: {
      color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      text: 'Aprobado',
    },
    en_proceso: {
      color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      text: 'En Proceso',
    },
    completado: {
      color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      text: 'Completado',
    },
    cancelado: {
      color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
      text: 'Cancelado',
    },
    anulado: {
      color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      text: 'Anulado',
    },
  };
  return badges[estado] || badges.aprobado;
};

export const canAgregarServicio = (service, currentUser) => {
  if (!currentUser) return false;
  if (currentUser.role === 'admin' || currentUser.role === 'supervisor') return true;
  if (
    currentUser.role === 'asesor' &&
    service.creado_por_id === currentUser.id &&
    service.estado === 'pendiente_aprobacion'
  )
    return true;
  return false;
};

export const canAprobar = (service, currentUser) => {
  return (
    (currentUser?.role === 'admin' || currentUser?.role === 'supervisor') &&
    service.estado === 'pendiente_aprobacion'
  );
};

export const canAnular = (service, currentUser) => {
  return (
    (currentUser?.role === 'admin' || currentUser?.role === 'supervisor') &&
    service.estado !== 'anulado'
  );
};

export const getTotalServicios = (service) => {
  return 1 + (service.items_servicio?.length || 0);
};

export const getNombreCompletoCliente = (cliente) => {
  if (!cliente) return '';
  return `${cliente.primer_nombre || ''} ${cliente.segundo_nombre || ''} ${cliente.primer_apellido || ''} ${cliente.segundo_apellido || ''}`
    .replace(/\s+/g, ' ')
    .trim();
};
