// ================================
// BÚSQUEDA Y FILTROS EN TIEMPO REAL
// ================================

let allUsers = [];
let allParking = [];
let allSessions = [];

// === USUARIOS ===
document.addEventListener('DOMContentLoaded', () => {
  const searchUsers = document.getElementById('searchUsers');
  const filterRole = document.getElementById('filterUserRole');
  const filterStatus = document.getElementById('filterUserStatus');

  if (searchUsers) {
    searchUsers.addEventListener('input', filterUsersTable);
    filterRole.addEventListener('change', filterUsersTable);
    filterStatus.addEventListener('change', filterUsersTable);
  }

  const searchParking = document.getElementById('searchParking');
  const filterParkingStatus = document.getElementById('filterParkingStatus');

  if (searchParking) {
    searchParking.addEventListener('input', filterParkingTable);
    filterParkingStatus.addEventListener('change', filterParkingTable);
  }

  const searchSessions = document.getElementById('searchSessions');
  if (searchSessions) {
    searchSessions.addEventListener('input', filterSessionsTable);
  }
});

function filterUsersTable() {
  const searchTerm = document.getElementById('searchUsers').value.toLowerCase();
  const roleFilter = document.getElementById('filterUserRole').value;
  const statusFilter = document.getElementById('filterUserStatus').value;

  const filtered = allUsers.filter(user => {
    const matchesSearch = 
      (user.profile?.nombre || '').toLowerCase().includes(searchTerm) ||
      (user.email || '').toLowerCase().includes(searchTerm);
    
    const matchesRole = !roleFilter || user.role === roleFilter;
    const matchesStatus = !statusFilter || user.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  renderUsersTableCRUD(filtered);
}

function filterParkingTable() {
  const searchTerm = document.getElementById('searchParking').value.toLowerCase();
  const statusFilter = document.getElementById('filterParkingStatus').value;

  const filtered = allParking.filter(parking => {
    const nombre = parking.name || parking.nombre || '';
    const ubicacion = parking.address || parking.ubicacion || '';
    
    const matchesSearch = 
      nombre.toLowerCase().includes(searchTerm) ||
      ubicacion.toLowerCase().includes(searchTerm);
    
    const matchesStatus = !statusFilter || parking.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  renderParkingTableCRUD(filtered);
}

function filterSessionsTable() {
  const searchTerm = document.getElementById('searchSessions').value.toLowerCase();

  const filtered = allSessions.filter(session => {
    return (
      (session.vehiclePlates || '').toLowerCase().includes(searchTerm) ||
      (session.userName || '').toLowerCase().includes(searchTerm) ||
      (session.parkingName || '').toLowerCase().includes(searchTerm)
    );
  });

  renderActiveSessionsTableCRUD(filtered);
}

// Sobrescribir funciones de carga para guardar datos en arrays globales
const originalLoadUsersCRUD = window.loadUsersCRUD || loadUsersCRUD;
window.loadUsersCRUD = async function() {
  try {
    const res = await fetch('/api/admin/users', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const result = await res.json();
    if (result.success) {
      allUsers = result.data;
      renderUsersTableCRUD(allUsers);
    } else {
      showToast.error('Error', 'No se pudieron cargar los usuarios');
    }
  } catch (error) {
    console.error('Error cargando usuarios:', error);
    showToast.error('Error', 'Error de conexión');
  }
};

const originalLoadParkingCRUD = window.loadParkingCRUD || loadParkingCRUD;
window.loadParkingCRUD = async function() {
  try {
    const res = await fetch('/api/admin/parking-lots', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const result = await res.json();
    if (result.success) {
      allParking = result.data;
      renderParkingTableCRUD(allParking);
    } else {
      showToast.error('Error', 'No se pudieron cargar los estacionamientos');
    }
  } catch (error) {
    console.error('Error cargando estacionamientos:', error);
    showToast.error('Error', 'Error de conexión');
  }
};

const originalLoadActiveSessionsCRUD = window.loadActiveSessionsCRUD || loadActiveSessionsCRUD;
window.loadActiveSessionsCRUD = async function() {
  try {
    const res = await fetch('/api/admin/active-sessions', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const result = await res.json();
    if (result.success) {
      allSessions = result.data;
      renderActiveSessionsTableCRUD(allSessions);
    } else {
      showToast.error('Error', 'No se pudieron cargar las sesiones');
    }
  } catch (error) {
    console.error('Error cargando sesiones:', error);
    showToast.error('Error', 'Error de conexión');
  }
};