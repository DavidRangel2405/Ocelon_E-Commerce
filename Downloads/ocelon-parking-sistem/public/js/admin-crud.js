// ================================
// OCELON ADMIN - CRUD EXTENSION
// ================================

// === CRUD USUARIOS ===
async function loadUsersCRUD() {
  try {
    const res = await fetch('/api/admin/users', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const result = await res.json();
    if (result.success) renderUsersTableCRUD(result.data);
    else showToast.error('Error', 'No se pudieron cargar los usuarios');
  } catch (error) {
    console.error('Error cargando usuarios:', error);
    showToast.error('Error', 'Error de conexión');
  }
}

function renderUsersTableCRUD(users) {
  const tbody = document.getElementById('adminUsersTableBody');
  if (!tbody) return;
  
  if (users.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4">No hay usuarios registrados</td></tr>';
    return;
  }
  
  tbody.innerHTML = users.map(u => `
    <tr>
      <td>${u.profile?.nombre || 'Sin nombre'}</td>
      <td>${u.email || 'Sin email'}</td>
      <td><span class="badge ${u.role === 'admin' ? 'bg-success' : 'bg-secondary'}">${u.role || 'conductor'}</span></td>
      <td><span class="badge ${u.status === 'activo' ? 'bg-success' : 'bg-danger'}">${u.status || 'activo'}</span></td>
      <td>${u.createdAt ? new Date(u.createdAt).toLocaleDateString('es-MX') : 'N/A'}</td>
      <td>
        <button class="btn btn-sm btn-outline-primary" onclick="openEditUserModal('${u._id}', '${u.profile?.nombre || ''}', '${u.email}', '${u.role}')">
          <i class="fas fa-edit"></i>
        </button>
        <button class="btn btn-sm ${u.status === 'activo' ? 'btn-outline-danger' : 'btn-outline-success'}" 
                onclick="toggleUserStatus('${u._id}', '${u.status}')">
          <i class="fas fa-${u.status === 'activo' ? 'ban' : 'check'}"></i>
        </button>
      </td>
    </tr>
  `).join('');
}

window.toggleUserStatus = async (id, currentStatus) => {
  const newStatus = currentStatus === 'activo' ? 'suspendido' : 'activo';
  try {
    const res = await fetch(`/api/admin/users/${id}/status`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });
    const result = await res.json();
    if (result.success) {
      showToast.success('Éxito', `Usuario ${newStatus}`);
      loadUsersCRUD();
    } else {
      showToast.error('Error', result.message);
    }
  } catch (error) {
    showToast.error('Error', 'Error de conexión');
  }
};

// === CRUD ESTACIONAMIENTOS ===
async function loadParkingCRUD() {
  try {
    const res = await fetch('/api/admin/parking-lots', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const result = await res.json();
    if (result.success) renderParkingTableCRUD(result.data);
    else showToast.error('Error', 'No se pudieron cargar los estacionamientos');
  } catch (error) {
    console.error('Error cargando estacionamientos:', error);
    showToast.error('Error', 'Error de conexión');
  }
}

function renderParkingTableCRUD(lots) {
  const tbody = document.getElementById('adminParkingTableBody');
  if (!tbody) return;
  
  if (lots.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4">No hay estacionamientos registrados</td></tr>';
    return;
  }
  
  tbody.innerHTML = lots.map(l => {
    const nombre = l.name || l.nombre || 'Sin nombre';
    const ubicacion = l.address || l.ubicacion || 'Sin ubicación';
    const capacidad = l.totalSpots || l.capacidadTotal || 0;
    const ocupacion = l.occupiedSpots || l.ocupacionActual || 0;
    const tarifa = l.hourlyRate || l.tarifaHora || 0;
    
    return `
    <tr>
      <td>${nombre}</td>
      <td>${ubicacion}</td>
      <td class="text-center">${capacidad}</td>
      <td class="text-center">
        <span class="badge ${ocupacion / capacidad > 0.8 ? 'bg-danger' : 'bg-success'}">
          ${ocupacion}/${capacidad}
        </span>
      </td>
      <td class="text-end">$${tarifa.toFixed(2)}/hr</td>
      <td><span class="badge ${l.status === 'activo' ? 'bg-success' : 'bg-secondary'}">${l.status || 'activo'}</span></td>
      <td>
        <button class="btn btn-sm btn-outline-warning" onclick="openEditParkingModal('${l._id}', '${nombre}', '${ubicacion}', ${capacidad}, ${tarifa}, '${l.horario || '24/7'}')">
          <i class="fas fa-edit"></i>
        </button>
        <button class="btn btn-sm btn-outline-danger" onclick="deleteParking('${l._id}')">
          <i class="fas fa-trash"></i>
        </button>
      </td>
    </tr>
  `}).join('');
}

window.deleteParking = async (id) => {
  if (!confirm('¿Desactivar este estacionamiento?')) return;
  try {
    const res = await fetch(`/api/admin/parking-lots/${id}`, { 
      method: 'DELETE', 
      headers: { Authorization: `Bearer ${token}` } 
    });
    const result = await res.json();
    if (result.success) {
      showToast.success('Éxito', 'Estacionamiento desactivado');
      loadParkingCRUD();
    } else {
      showToast.error('Error', result.message);
    }
  } catch (error) {
    showToast.error('Error', 'Error de conexión');
  }
};

// === EXPORTAR ===
window.exportTableToExcel = (tableId, filename = 'reporte') => {
  const table = document.getElementById(tableId);
  if (!table) return showToast.warning('Advertencia', 'Tabla no encontrada');
  const wb = XLSX.utils.table_to_book(table, { sheet: 'Reporte' });
  XLSX.writeFile(wb, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
  showToast.success('Éxito', 'Exportado a Excel');
};

window.exportTableToPDF = (tableId, filename = 'reporte') => {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const table = document.getElementById(tableId);
  if (!table) return showToast.warning('Advertencia', 'Tabla no encontrada');
  doc.autoTable({ html: `#${tableId}` });
  doc.save(`${filename}.pdf`);
  showToast.success('Éxito', 'Exportado a PDF');
};

// === INICIALIZAR ===
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('adminUsersTableBody')) loadUsersCRUD();
  if (document.getElementById('adminParkingTableBody')) loadParkingCRUD();
});