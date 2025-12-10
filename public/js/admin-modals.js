// ================================
// ADMIN MODALS - LÓGICA
// ================================

let currentEditUserId = null;
let currentEditParkingId = null;

// === USUARIOS ===
window.openCreateUserModal = () => {
  document.getElementById('createUserName').value = '';
  document.getElementById('createUserEmail').value = '';
  document.getElementById('createUserPassword').value = '';
  document.getElementById('createUserRole').value = 'conductor';
  new bootstrap.Modal(document.getElementById('createUserModal')).show();
};

window.openEditUserModal = (id, nombre, email, role) => {
  currentEditUserId = id;
  document.getElementById('editUserName').value = nombre;
  document.getElementById('editUserEmail').value = email;
  document.getElementById('editUserRole').value = role;
  new bootstrap.Modal(document.getElementById('editUserModal')).show();
};

window.createUser = async () => {
  const nombre = document.getElementById('createUserName').value.trim();
  const email = document.getElementById('createUserEmail').value.trim();
  const password = document.getElementById('createUserPassword').value.trim();
  const role = document.getElementById('createUserRole').value;

  if (!nombre || !email || !password) {
    return showToast.warning('Advertencia', 'Completa todos los campos');
  }

  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, profile: { nombre } })
    });

    const result = await res.json();
    if (result.success) {
      showToast.success('Éxito', 'Usuario creado exitosamente');
      bootstrap.Modal.getInstance(document.getElementById('createUserModal')).hide();
      
      // Actualizar el rol si es necesario
      if (role === 'admin') {
        await fetch(`/api/admin/users/${result.userId}/role`, {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ role: 'admin' })
        });
      }
      
      loadUsersCRUD();
    } else {
      showToast.error('Error', result.message || 'Error al crear usuario');
    }
  } catch (error) {
    showToast.error('Error', 'Error de conexión');
  }
};

window.saveUserEdit = async () => {
  const nombre = document.getElementById('editUserName').value.trim();
  const role = document.getElementById('editUserRole').value;

  if (!nombre) return showToast.warning('Advertencia', 'Nombre requerido');

  try {
    // Actualizar rol
    const res = await fetch(`/api/admin/users/${currentEditUserId}/role`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ role })
    });

    const result = await res.json();
    if (result.success) {
      showToast.success('Éxito', 'Usuario actualizado');
      bootstrap.Modal.getInstance(document.getElementById('editUserModal')).hide();
      loadUsersCRUD();
    } else {
      showToast.error('Error', result.message);
    }
  } catch (error) {
    showToast.error('Error', 'Error de conexión');
  }
};

// === ESTACIONAMIENTOS ===
window.openCreateParkingModal = () => {
  document.getElementById('createParkingName').value = '';
  document.getElementById('createParkingLocation').value = '';
  document.getElementById('createParkingCapacity').value = '';
  document.getElementById('createParkingRate').value = '';
  document.getElementById('createParkingSchedule').value = '24/7';
  new bootstrap.Modal(document.getElementById('createParkingModal')).show();
};

window.openEditParkingModal = (id, nombre, ubicacion, capacidad, tarifa, horario) => {
  currentEditParkingId = id;
  document.getElementById('editParkingName').value = nombre;
  document.getElementById('editParkingLocation').value = ubicacion;
  document.getElementById('editParkingCapacity').value = capacidad;
  document.getElementById('editParkingRate').value = tarifa;
  document.getElementById('editParkingSchedule').value = horario;
  new bootstrap.Modal(document.getElementById('editParkingModal')).show();
};

window.createParking = async () => {
  const nombre = document.getElementById('createParkingName').value.trim();
  const ubicacion = document.getElementById('createParkingLocation').value.trim();
  const capacidad = parseInt(document.getElementById('createParkingCapacity').value);
  const tarifa = parseFloat(document.getElementById('createParkingRate').value);
  const horario = document.getElementById('createParkingSchedule').value.trim();

  if (!nombre || !ubicacion || !capacidad || !tarifa) {
    return showToast.warning('Advertencia', 'Completa todos los campos');
  }

  try {
    const res = await fetch('/api/admin/parking-lots', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        nombre, 
        ubicacion, 
        capacidadTotal: capacidad, 
        totalSpots: capacidad,
        tarifaHora: tarifa,
        hourlyRate: tarifa,
        horario 
      })
    });

    const result = await res.json();
    if (result.success) {
      showToast.success('Éxito', 'Estacionamiento creado');
      bootstrap.Modal.getInstance(document.getElementById('createParkingModal')).hide();
      loadParkingCRUD();
    } else {
      showToast.error('Error', result.message || 'Error al crear');
    }
  } catch (error) {
    showToast.error('Error', 'Error de conexión');
  }
};

window.saveParkingEdit = async () => {
  const nombre = document.getElementById('editParkingName').value.trim();
  const ubicacion = document.getElementById('editParkingLocation').value.trim();
  const capacidad = parseInt(document.getElementById('editParkingCapacity').value);
  const tarifa = parseFloat(document.getElementById('editParkingRate').value);
  const horario = document.getElementById('editParkingSchedule').value.trim();

  if (!nombre || !ubicacion || !capacidad || !tarifa) {
    return showToast.warning('Advertencia', 'Completa todos los campos');
  }

  try {
    const res = await fetch(`/api/admin/parking-lots/${currentEditParkingId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        nombre, 
        ubicacion, 
        capacidadTotal: capacidad,
        totalSpots: capacidad,
        tarifaHora: tarifa,
        hourlyRate: tarifa,
        horario 
      })
    });

    const result = await res.json();
    if (result.success) {
      showToast.success('Éxito', 'Estacionamiento actualizado');
      bootstrap.Modal.getInstance(document.getElementById('editParkingModal')).hide();
      loadParkingCRUD();
    } else {
      showToast.error('Error', result.message);
    }
  } catch (error) {
    showToast.error('Error', 'Error de conexión');
  }
};