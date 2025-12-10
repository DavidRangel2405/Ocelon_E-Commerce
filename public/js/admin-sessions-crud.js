// ================================
// ADMIN - SESIONES ACTIVAS CRUD
// ================================

async function loadActiveSessionsCRUD() {
  try {
    const res = await fetch('/api/admin/active-sessions', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const result = await res.json();
    if (result.success) renderActiveSessionsTableCRUD(result.data);
    else showToast.error('Error', 'No se pudieron cargar las sesiones');
  } catch (error) {
    console.error('Error cargando sesiones:', error);
    showToast.error('Error', 'Error de conexión');
  }
}

function renderActiveSessionsTableCRUD(sessions) {
  const tbody = document.getElementById('adminSessionsTableBody');
  if (!tbody) return;
  
  if (sessions.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" class="text-center py-4">No hay sesiones activas</td></tr>';
    return;
  }
  
  tbody.innerHTML = sessions.map(s => {
    const duration = calculateDuration(s.entryTime);
    const cost = calculateCost(duration, s.tarifaHora || 0);
    
    return `
      <tr>
        <td>${s.vehiclePlates || 'N/A'}</td>
        <td>${s.userName || 'Usuario desconocido'}</td>
        <td>${s.parkingName || 'Estacionamiento no disponible'}</td>
        <td>${new Date(s.entryTime).toLocaleString('es-MX')}</td>
        <td>${duration}</td>
        <td class="text-end">$${cost}</td>
        <td><span class="badge ${s.status === 'pagada' ? 'bg-success' : 'bg-warning'}">${s.status}</span></td>
        <td>
          <button class="btn btn-sm btn-outline-info" onclick="viewSession('${s._id}')">
            <i class="fas fa-eye"></i>
          </button>
          <button class="btn btn-sm btn-outline-danger" onclick="endSession('${s._id}')">
            <i class="fas fa-sign-out-alt"></i>
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

function calculateDuration(entryTime) {
  const diff = Date.now() - new Date(entryTime);
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${minutes}m`;
}

function calculateCost(duration, tarifaHora) {
  const match = duration.match(/(\d+)h/);
  const hours = match ? parseInt(match[1]) : 0;
  const minutes = parseInt(duration.match(/(\d+)m/)?.[1] || 0);
  const totalHours = hours + (minutes / 60);
  return ((totalHours * tarifaHora) * 1.16).toFixed(2); // Con IVA
}

window.viewSession = (id) => {
  window.open(`/session.html?id=${id}`, '_blank');
};

window.endSession = async (id) => {
  if (!confirm('¿Marcar salida de esta sesión?')) return;
  
  try {
    const res = await fetch(`/api/admin/sessions/${id}/validate`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    });
    const result = await res.json();
    if (result.success) {
      showToast.success('Éxito', 'Sesión finalizada');
      loadActiveSessionsCRUD();
    } else {
      showToast.error('Error', result.message);
    }
  } catch (error) {
    showToast.error('Error', 'Error de conexión');
  }
};

// === INICIALIZAR ===
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('adminSessionsTableBody')) loadActiveSessionsCRUD();
});