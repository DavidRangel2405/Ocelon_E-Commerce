// ========================================
// OCELON - Panel de Administración
// ========================================

// Variables globales
let currentSection = 'dashboard';
let token = localStorage.getItem('token');
let userRole = localStorage.getItem('userRole');
let charts = {};

// Verificar autenticación
if (!token || userRole !== 'admin') {
    alert('Acceso denegado. Solo administradores.');
    window.location.href = '/login.html';
}

// ========================================
// INICIALIZACIÓN
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    // Esperamos a que el DOM esté 100% renderizado
    setTimeout(() => {
        loadDashboard();
        setupEventListeners();
        startAutoRefresh();
        updateUserInfo();
    }, 150); // 150 ms es suficiente para que el DOM termine de pintar
});

// ========================================
// EVENT LISTENERS
// ========================================

function setupEventListeners() {
    // Navegación del sidebar
    document.querySelectorAll('.admin-nav-link').forEach(link => {
        link.addEventListener('click', handleNavigation);
    });

    // Logout
    document.getElementById('logoutBtn')?.addEventListener('click', handleLogout);

    // Botones de acción
    document.getElementById('addParkingBtn')?.addEventListener('click', () => openParkingModal());
    document.getElementById('refreshDashboardBtn')?.addEventListener('click', () => {
        showNotification('Actualizando datos...', 'info');
        loadDashboard();
    });
    
    // Formulario de reportes
    document.getElementById('reportForm')?.addEventListener('submit', generateReport);

    // Filtros
    document.getElementById('roleFilter')?.addEventListener('change', () => loadUsers());
    document.getElementById('statusFilter')?.addEventListener('change', () => loadUsers());
    document.getElementById('logTypeFilter')?.addEventListener('change', () => loadLogs());

    // Mobile menu
    document.getElementById('mobileMenuBtn')?.addEventListener('click', function() {
        document.getElementById('adminSidebar').classList.toggle('show');
    });
}

function updateUserInfo() {
    const userName = localStorage.getItem('userName') || 'Administrador';
    const roleDisplay = localStorage.getItem('userRole') || 'admin';
    
    const userNameEl = document.getElementById('userName');
    const userRoleEl = document.getElementById('userRole');
    const userAvatarEl = document.getElementById('userAvatar');
    
    if (userNameEl) userNameEl.textContent = userName;
    if (userRoleEl) userRoleEl.textContent = roleDisplay;
    if (userAvatarEl) userAvatarEl.textContent = userName.charAt(0).toUpperCase();
}

function handleNavigation(e) {
    e.preventDefault();
    const section = e.currentTarget.dataset.section;
    
    if (!section) return;
    
    // Actualizar título de página
    const titles = {
        dashboard: 'Dashboard',
        parking: 'Estacionamientos',
        users: 'Usuarios',
        sessions: 'Sesiones Activas',
        reports: 'Reportes',
        tickets: 'Tickets',
        logs: 'Logs y Auditoría'
    };
    
    document.getElementById('pageTitle').textContent = titles[section] || section;
    
    // Actualizar menú activo
    document.querySelectorAll('.admin-nav-link').forEach(l => l.classList.remove('active'));
    e.currentTarget.classList.add('active');
    
    // Ocultar todas las secciones
    document.querySelectorAll('.content-section').forEach(s => {
        s.classList.remove('active');
        s.style.display = 'none';
    });
    
    // Mostrar sección seleccionada
    const sectionEl = document.getElementById(`${section}Section`);
    if (sectionEl) {
        sectionEl.classList.add('active');
        sectionEl.style.display = 'block';
    }
    
    currentSection = section;
    
    // Cargar datos según la sección
    switch(section) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'parking':
            loadParkingLots();
            break;
        case 'users':
            loadUsers();
            break;
        case 'sessions':
            loadActiveSessions();
            break;
        case 'reports':
            // Los reportes se cargan al generar
            break;
        case 'tickets':
            loadAdminTickets();
            break;
        case 'logs':
            loadLogs();
            break;
    }
}

function handleLogout() {
    if (confirm('¿Estás seguro de cerrar sesión?')) {
        localStorage.clear();
        window.location.href = '/login.html';
    }
}

// ========================================
// DASHBOARD ANALYTICS
// ========================================

async function loadDashboard() {
    try {
        console.log('Enviando petición a /api/admin/analytics con token:', token);

        const response = await fetch('/api/admin/analytics', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const result = await response.json();
        console.log('Respuesta del servidor:', result);
        console.log('Verificando elementos del dashboard:');
console.log('totalUsers:', document.getElementById('totalUsers'));
console.log('totalParkingLots:', document.getElementById('totalParkingLots'));
console.log('todaySessions:', document.getElementById('todaySessions'));
console.log('monthlyRevenue:', document.getElementById('monthlyRevenue'));
console.log('activeSessions:', document.getElementById('activeSessions'));

        if (result.success) {
            renderDashboardSummary(result.data.summary);
            renderRevenueChart(result.data.revenueByParking);
            renderSessionsChart(result.data.sessionsByDay);
            renderPaymentMethodsChart(result.data.paymentMethods);
            renderPlansChart(result.data.plansDistribution);
            renderTicketsChart(result.data.ticketsByStatus);
            loadPlansTableMonth();
            updateMonthlyRevenueWithPlans();
        } else {
            showError('Error al cargar dashboard: ' + result.message);
        }
    } catch (error) {
        console.error('Error en loadDashboard:', error);
        showError('Error de conexión con el servidor');
    }
}

function renderDashboardSummary(summary) {
    if (!summary || typeof summary !== 'object') {
        console.warn('Dashboard: no hay datos del servidor o summary es inválido');
        showNotification('Error de conexión con el servidor', 'error');
        return;
    }

    const elements = {
        totalUsers: document.getElementById('totalUsers'),
        totalParkingLots: document.getElementById('totalParkingLots'),
        todaySessions: document.getElementById('todaySessions'),
        monthlyRevenue: document.getElementById('monthlyRevenue'),
        activeSessions: document.getElementById('activeSessions')
    };

    if (!elements.totalUsers || !elements.totalParkingLots || !elements.todaySessions || !elements.monthlyRevenue || !elements.activeSessions) {
        console.error('Algunos elementos del dashboard no existen en el HTML');
        return;
    }

    elements.totalUsers.textContent = summary.totalUsers || 0;
    elements.totalParkingLots.textContent = summary.totalParkingLots || 0;
    elements.todaySessions.textContent = summary.todaySessions || 0;
    elements.monthlyRevenue.textContent = formatCurrency(summary.monthlyRevenue || 0);
    elements.activeSessions.textContent = summary.activeSessions || 0;
}

function renderRevenueChart(data) {
    const ctx = document.getElementById('revenueChart');
    if (!ctx) return;
    
    if (charts.revenue) {
        charts.revenue.destroy();
    }
    
    // Validar que hay datos
    if (!data || data.length === 0) {
        const parent = ctx.parentElement;
        parent.innerHTML = '<div class="text-center py-4 text-muted"><i class="fas fa-chart-bar fa-3x mb-3"></i><br>No hay datos de ingresos disponibles</div>';
        return;
    }
    
    console.log('Datos para gráfica:', data);
    
    charts.revenue = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.map(d => d.parkingName || 'Sin nombre'),
            datasets: [{
                label: 'Ingresos ($)',
                data: data.map(d => d.totalRevenue || 0),
                backgroundColor: 'rgba(16, 185, 129, 0.7)',
                borderColor: 'rgba(16, 185, 129, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: (value) => '$' + value.toLocaleString('es-MX', { minimumFractionDigits: 2 })
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            const value = context.parsed.y;
                            return `Ingresos: $${value.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;
                        }
                    }
                }
            }
        }
    });
}

function renderSessionsChart(data) {
    const ctx = document.getElementById('sessionsChart');
    if (!ctx) return;
    
    if (charts.sessions) {
        charts.sessions.destroy();
    }
    
    charts.sessions = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.map(d => d._id),
            datasets: [{
                label: 'Sesiones',
                data: data.map(d => d.count),
                fill: true,
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                borderColor: 'rgba(99, 102, 241, 1)',
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

function renderPaymentMethodsChart(data) {
    const ctx = document.getElementById('paymentMethodsChart');
    if (!ctx) return;
    
    if (charts.paymentMethods) {
        charts.paymentMethods.destroy();
    }
    
    const labels = {
        'tarjeta': 'Tarjeta',
        'wallet': 'Wallet',
        'transferencia': 'Transferencia'
    };
    
    charts.paymentMethods = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: data.map(d => labels[d._id] || d._id),
            datasets: [{
                data: data.map(d => d.count),
                backgroundColor: [
                    'rgba(16, 185, 129, 0.8)',
                    'rgba(99, 102, 241, 0.8)',
                    'rgba(251, 146, 60, 0.8)'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

function renderTicketsChart(data) {
    const ctx = document.getElementById('ticketsChart');
    if (!ctx) return;
    
    if (charts.tickets) {
        charts.tickets.destroy();
    }
    
    const statusLabels = {
        'abierto': 'Abiertos',
        'en_proceso': 'En Proceso',
        'resuelto': 'Resueltos',
        'cerrado': 'Cerrados'
    };
    
    const colors = {
        'abierto': 'rgba(239, 68, 68, 0.8)',
        'en_proceso': 'rgba(251, 146, 60, 0.8)',
        'resuelto': 'rgba(16, 185, 129, 0.8)',
        'cerrado': 'rgba(107, 114, 128, 0.8)'
    };
    
    charts.tickets = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: data.map(d => statusLabels[d._id] || d._id),
            datasets: [{
                data: data.map(d => d.count),
                backgroundColor: data.map(d => colors[d._id] || 'rgba(0,0,0,0.5)')
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

// ========================================
// GESTIÓN DE ESTACIONAMIENTOS
// ========================================

async function loadParkingLots() {
    try {
        showTableLoading('parkingTableBody');
        
        const response = await fetch('/api/admin/parking-lots', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            renderParkingTable(result.data);
        } else {
            showError('Error al cargar estacionamientos');
        }
    } catch (error) {
        console.error('Error:', error);
        showError('Error de conexión');
    }
}

function renderParkingTable(parkingLots) {
    const tbody = document.getElementById('parkingTableBody');
    if (!tbody) return;
    
    if (parkingLots.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4">No hay estacionamientos registrados</td></tr>';
        return;
    }
    
    tbody.innerHTML = parkingLots.map(lot => `
        <tr>
            <td>${lot.nombre}</td>
            <td>${lot.ubicacion}</td>
            <td class="text-center">${lot.capacidadTotal}</td>
            <td class="text-center">
                <span class="badge ${lot.ocupacionActual / lot.capacidadTotal > 0.8 ? 'bg-danger' : 'bg-success'}">
                    ${lot.ocupacionActual || 0}/${lot.capacidadTotal}
                </span>
            </td>
            <td class="text-end">${formatCurrency(lot.tarifaHora)}/hr</td>
            <td>
                <span class="badge ${lot.status === 'activo' ? 'bg-success' : 'bg-secondary'}">
                    ${lot.status}
                </span>
            </td>
            <td class="text-end">
                <button class="btn btn-sm btn-primary" onclick="editParkingLot('${lot._id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteParkingLot('${lot._id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function openParkingModal(id = null) {
    showNotification('Funcionalidad en desarrollo', 'info');
}

window.editParkingLot = function(id) {
    openParkingModal(id);
};

window.deleteParkingLot = async function(id) {
    if (!confirm('¿Estás seguro de desactivar este estacionamiento?')) return;
    
    try {
        const response = await fetch(`/api/admin/parking-lots/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Estacionamiento desactivado exitosamente', 'success');
            loadParkingLots();
        } else {
            showNotification(result.message, 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('Error de conexión', 'error');
    }
};

// ========================================
// GESTIÓN DE USUARIOS
// ========================================

async function loadUsers() {
    try {
        showTableLoading('usersTableBody');
        
        const role = document.getElementById('roleFilter')?.value || '';
        const status = document.getElementById('statusFilter')?.value || '';
        
        const params = new URLSearchParams();
        if (role) params.append('role', role);
        if (status) params.append('status', status);
        
        const response = await fetch(`/api/admin/users?${params}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            renderUsersTable(result.data);
        } else {
            showError('Error al cargar usuarios');
        }
    } catch (error) {
        console.error('Error:', error);
        showError('Error de conexión');
    }
}

function renderUsersTable(users) {
    const tbody = document.getElementById('adminUsersTableBody');
    if (!tbody) return;
    
    if (users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4">No hay usuarios</td></tr>';
        return;
    }
    
    const planNames = {
        'basico': 'Básico',
        'premium': 'Premium',
        'empresarial': 'Empresarial'
    };
    
    const planColors = {
        'basico': 'secondary',
        'premium': 'primary',
        'empresarial': 'warning'
    };
    
    tbody.innerHTML = users.map(user => `
        <tr>
            <td>${user.profile?.nombre || 'N/A'}</td>
            <td>${user.email}</td>
            <td>
                <span class="badge bg-${planColors[user.currentPlan] || 'secondary'}">
                    ${planNames[user.currentPlan] || 'Básico'}
                </span>
            </td>
            <td>
                <span class="badge bg-info">${user.role}</span>
            </td>
            <td>
                <span class="badge ${user.status === 'activo' ? 'bg-success' : 'bg-danger'}">
                    ${user.status}
                </span>
            </td>
            <td>${new Date(user.createdAt).toLocaleDateString()}</td>
            <td class="text-end">
                <button class="btn btn-sm btn-warning" onclick="changeUserRole('${user._id}', '${user.role}')">
                    <i class="fas fa-user-shield"></i>
                </button>
                <button class="btn btn-sm ${user.status === 'activo' ? 'btn-danger' : 'btn-success'}" 
                        onclick="toggleUserStatus('${user._id}', '${user.status}')">
                    <i class="fas fa-${user.status === 'activo' ? 'ban' : 'check'}"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

window.changeUserRole = async function(userId, currentRole) {
    const newRole = prompt(`Cambiar rol de usuario. Actual: ${currentRole}\nNuevo rol (conductor/admin):`);
    
    if (!newRole || !['conductor', 'admin'].includes(newRole)) {
        return showNotification('Rol inválido', 'error');
    }
    
    try {
        const response = await fetch(`/api/admin/users/${userId}/role`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ role: newRole })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Rol actualizado exitosamente', 'success');
            loadUsers();
        } else {
            showNotification(result.message, 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('Error de conexión', 'error');
    }
};

window.toggleUserStatus = async function(userId, currentStatus) {
    const newStatus = currentStatus === 'activo' ? 'suspendido' : 'activo';
    
    try {
        const response = await fetch(`/api/admin/users/${userId}/status`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: newStatus })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Estado actualizado exitosamente', 'success');
            loadUsers();
        } else {
            showNotification(result.message, 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('Error de conexión', 'error');
    }
};

// ========================================
// SESIONES ACTIVAS
// ========================================

async function loadActiveSessions() {
    try {
        showTableLoading('sessionsTableBody');
        
        const response = await fetch('/api/admin/active-sessions', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            renderSessionsTable(result.data);
        } else {
            showError('Error al cargar sesiones');
        }
    } catch (error) {
        console.error('Error:', error);
        showError('Error de conexión');
    }
}

function renderSessionsTable(sessions) {
    const tbody = document.getElementById('sessionsTableBody');
    if (!tbody) return;
    
    if (sessions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4">No hay sesiones activas</td></tr>';
        return;
    }
    
    tbody.innerHTML = sessions.map(session => {
        const duration = calculateDuration(session.entryTime);
        const estimatedCost = calculateCost(duration, session.tarifaHora);
        
        return `
        <tr>
            <td>${session.vehiclePlates}</td>
            <td>${session.userName}</td>
            <td>${session.parkingName}</td>
            <td>${formatDateTime(session.entryTime)}</td>
            <td>${duration}</td>
            <td class="text-end">${formatCurrency(estimatedCost)}</td>
            <td>
                <span class="badge ${session.status === 'pagada' ? 'bg-success' : 'bg-warning'}">
                    ${session.status}
                </span>
            </td>
        </tr>
    `}).join('');
}

// ========================================
// REPORTES
// ========================================

async function generateReport(e) {
    e.preventDefault();
    
    const startDate = document.getElementById('reportStartDate').value;
    const endDate = document.getElementById('reportEndDate').value;
    
    if (!startDate || !endDate) {
        return showNotification('Selecciona un rango de fechas', 'warning');
    }
    
    try {
        const response = await fetch(`/api/admin/reports/revenue?startDate=${startDate}&endDate=${endDate}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            renderReportResults(result.data);
        } else {
            showError('Error al generar reporte');
        }
    } catch (error) {
        console.error('Error:', error);
        showError('Error de conexión');
    }
}

function renderReportResults(data) {
    const container = document.getElementById('reportResults');
    if (!container) return;
    
    const summary = data.summary || {};
    
    container.innerHTML = `
        <div class="row mb-4">
            <div class="col-md-3">
                <div class="card">
                    <div class="card-body text-center">
                        <h6 class="text-muted">Ingresos Totales</h6>
                        <h3 class="text-primary">${formatCurrency(summary.totalRevenue || 0)}</h3>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card">
                    <div class="card-body text-center">
                        <h6 class="text-muted">Transacciones</h6>
                        <h3 class="text-info">${summary.totalTransactions || 0}</h3>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card">
                    <div class="card-body text-center">
                        <h6 class="text-muted">Promedio</h6>
                        <h3 class="text-success">${formatCurrency(summary.avgTransaction || 0)}</h3>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card">
                    <div class="card-body text-center">
                        <h6 class="text-muted">IVA Total</h6>
                        <h3 class="text-warning">${formatCurrency(summary.totalIVA || 0)}</h3>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="card">
            <div class="card-header d-flex justify-content-between align-items-center">
                <h5 class="mb-0">Detalle por Estacionamiento</h5>
                <button class="btn btn-sm btn-success" onclick="exportToExcel()">
                    <i class="fas fa-file-excel me-2"></i>Exportar
                </button>
            </div>
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table table-striped">
                        <thead>
                            <tr>
                                <th>Fecha</th>
                                <th>Estacionamiento</th>
                                <th class="text-end">Ingresos</th>
                                <th class="text-center">Transacciones</th>
                                <th class="text-end">Promedio</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data.details.map(d => `
                                <tr>
                                    <td>${d._id.date}</td>
                                    <td>${d._id.parking}</td>
                                    <td class="text-end">${formatCurrency(d.totalAmount)}</td>
                                    <td class="text-center">${d.totalTransactions}</td>
                                    <td class="text-end">${formatCurrency(d.avgAmount)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
}

// ========================================
// TICKETS DE SOPORTE - VERSIÓN MEJORADA
// ========================================

let allTickets = [];
let selectedTicketId = null;

async function loadAdminTickets() {
    try {
        showTableLoading('ticketsList');
        
        const response = await fetch('/api/admin/tickets', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const result = await response.json();
        
        if (result.success) {
            allTickets = result.data;
            renderTicketsList(allTickets);
            updateTicketsStats(allTickets);
        } else {
            showNotification('Error al cargar tickets', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('Error de conexión', 'error');
    }
}

function updateTicketsStats(tickets) {
    const stats = {
        total: tickets.length,
        abierto: tickets.filter(t => t.status === 'abierto').length,
        en_proceso: tickets.filter(t => t.status === 'en_proceso').length,
        resuelto: tickets.filter(t => t.status === 'resuelto').length
    };

    document.getElementById('totalTickets').textContent = stats.total;
    document.getElementById('openTickets').textContent = stats.abierto;
    document.getElementById('processingTickets').textContent = stats.en_proceso;
    document.getElementById('resolvedTickets').textContent = stats.resuelto;
}

function renderTicketsList(tickets) {
    const container = document.getElementById('ticketsList');
    
    if (!tickets || tickets.length === 0) {
        container.innerHTML = `
            <div class="text-center py-5">
                <i class="fas fa-inbox fa-3x text-muted mb-3"></i>
                <p class="text-muted">No hay tickets disponibles</p>
            </div>
        `;
        return;
    }

    container.innerHTML = tickets.map(ticket => {
        const statusColors = {
            abierto: 'danger',
            en_proceso: 'warning',
            resuelto: 'success',
            cerrado: 'secondary'
        };
        
        const priorityColors = {
            alta: 'danger',
            media: 'warning',
            baja: 'info'
        };

        const statusColor = statusColors[ticket.status] || 'secondary';
        const priorityColor = priorityColors[ticket.priority] || 'secondary';
        const isSelected = selectedTicketId === ticket._id;

        return `
            <div class="ticket-item ${isSelected ? 'selected' : ''}" onclick="selectTicket('${ticket._id}')" 
                 style="padding: 1rem; border-bottom: 1px solid rgba(255,255,255,0.1); cursor: pointer; transition: all 0.2s; ${isSelected ? 'background: rgba(16, 185, 129, 0.1); border-left: 3px solid #10b981;' : ''}">
                <div class="d-flex justify-content-between align-items-start mb-2">
                    <div class="d-flex align-items-center gap-2">
                        <span class="badge bg-${statusColor}">
                            <i class="fas fa-${ticket.status === 'abierto' ? 'exclamation-circle' : ticket.status === 'en_proceso' ? 'clock' : ticket.status === 'resuelto' ? 'check-circle' : 'times-circle'}"></i>
                        </span>
                        <small class="text-muted fw-bold">${ticket.ticketNumber}</small>
                    </div>
                    <span class="badge bg-${priorityColor} bg-opacity-25 text-${priorityColor}">
                        ${ticket.priority.toUpperCase()}
                    </span>
                </div>
                
                <h6 class="mb-2 text-white">${ticket.subject}</h6>
                
                <div class="d-flex align-items-center gap-2 mb-2">
                    <i class="fas fa-user text-muted" style="font-size: 0.75rem;"></i>
                    <small class="text-muted">${ticket.user.profile.nombre}</small>
                </div>
                
                <div class="d-flex justify-content-between align-items-center">
                    <small class="text-muted">
                        <i class="fas fa-comment-dots me-1"></i>
                        ${ticket.messages ? ticket.messages.length : 0} mensaje(s)
                    </small>
                    <small class="text-muted">
                        ${formatDateTime(ticket.createdAt)}
                    </small>
                </div>
            </div>
        `;
    }).join('');
}

function selectTicket(ticketId) {
    selectedTicketId = ticketId;
    const ticket = allTickets.find(t => t._id === ticketId);
    
    if (!ticket) return;

    // Actualizar la lista visual
    renderTicketsList(allTickets);
    
    // Mostrar detalle
    document.getElementById('noTicketSelected').style.display = 'none';
    document.getElementById('ticketDetailContent').style.display = 'block';
    
    renderTicketDetail(ticket);
}

function renderTicketDetail(ticket) {
    const statusColors = {
        abierto: 'danger',
        en_proceso: 'warning',
        resuelto: 'success',
        cerrado: 'secondary'
    };
    
    const priorityColors = {
        alta: 'danger',
        media: 'warning',
        baja: 'info'
    };

    const statusColor = statusColors[ticket.status] || 'secondary';
    const priorityColor = priorityColors[ticket.priority] || 'secondary';

    const content = `
        <div class="card-header border-bottom border-secondary">
            <div class="d-flex justify-content-between align-items-start mb-3">
                <div>
                    <small class="text-muted d-block mb-1">Ticket #${ticket.ticketNumber}</small>
                    <h4 class="mb-0 text-white">${ticket.subject}</h4>
                </div>
                <span class="badge bg-${priorityColor} bg-opacity-25 text-${priorityColor}">
                    ${ticket.priority.toUpperCase()}
                </span>
            </div>
            
            <div class="d-flex align-items-center gap-3">
                <div class="d-flex align-items-center gap-2">
                    <div class="rounded-circle bg-primary d-flex align-items-center justify-center" 
                         style="width: 40px; height: 40px; background: rgba(16, 185, 129, 0.2);">
                        <span class="text-primary fw-bold">${ticket.user.profile.nombre.charAt(0)}</span>
                    </div>
                    <div>
                        <div class="fw-bold text-white">${ticket.user.profile.nombre}</div>
                        <small class="text-muted">${ticket.user.email}</small>
                    </div>
                </div>
            </div>
        </div>

        <div class="card-body" style="max-height: 400px; overflow-y: auto;">
            <div class="mb-3">
                ${ticket.messages.map(msg => {
                    const isUser = msg.autor === 'usuario';
                    return `
                        <div class="mb-3 ${isUser ? '' : 'ms-4'}" style="padding: 1rem; border-radius: 0.75rem; background: ${isUser ? 'rgba(255, 255, 255, 0.05)' : 'rgba(16, 185, 129, 0.1)'}; ${!isUser ? 'border: 1px solid rgba(16, 185, 129, 0.3);' : ''}">
                            <div class="d-flex justify-content-between mb-2">
                                <span class="fw-bold text-white" style="font-size: 0.875rem;">
                                    ${isUser ? 'Usuario' : 'Soporte'}
                                </span>
                                <small class="text-muted">
                                    ${formatDateTime(msg.timestamp)}
                                </small>
                            </div>
                            <p class="mb-0 text-white-50" style="font-size: 0.875rem; line-height: 1.6;">
                                ${msg.texto}
                            </p>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>

        <div class="card-footer border-top border-secondary">
            <div class="mb-3">
                <label class="form-label text-white">Responder:</label>
                <textarea class="form-control" id="adminReplyText" rows="4" 
                          placeholder="Escribe tu respuesta..." 
                          style="background: rgba(255, 255, 255, 0.05); border-color: rgba(255, 255, 255, 0.1);"></textarea>
            </div>
            
            <div class="d-flex gap-2">
                <select class="form-select flex-grow-1" id="adminReplyStatus" 
                        style="background: rgba(255, 255, 255, 0.05); border-color: rgba(255, 255, 255, 0.1);">
                    <option value="">Mantener estado actual</option>
                    <option value="en_proceso">En Proceso</option>
                    <option value="resuelto">Resuelto</option>
                    <option value="cerrado">Cerrado</option>
                </select>
                
                <button class="btn btn-primary" onclick="sendAdminTicketReply('${ticket._id}')">
                    <i class="fas fa-paper-plane me-2"></i>Enviar
                </button>
            </div>
        </div>
    `;

    document.getElementById('ticketDetailContent').innerHTML = content;
}

window.sendAdminTicketReply = async function(ticketId) {
    const message = document.getElementById('adminReplyText').value.trim();
    const status = document.getElementById('adminReplyStatus').value;
    
    if (!message) {
        return showNotification('Escribe un mensaje', 'warning');
    }
    
    try {
        const response = await fetch(`/api/admin/tickets/${ticketId}/reply`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message, status })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Respuesta enviada', 'success');
            loadAdminTickets();
            
            // Recargar el ticket actual
            setTimeout(() => {
                const ticket = allTickets.find(t => t._id === ticketId);
                if (ticket) selectTicket(ticketId);
            }, 500);
        } else {
            showNotification(result.message || 'Error al enviar respuesta', 'error');
        }
    } catch (error) {
        showNotification('Error al enviar respuesta', 'error');
    }
};

// Filtros
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchTickets');
    const statusFilter = document.getElementById('filterTicketStatus');
    const priorityFilter = document.getElementById('filterTicketPriority');

    if (searchInput) {
        searchInput.addEventListener('input', filterTickets);
    }
    if (statusFilter) {
        statusFilter.addEventListener('change', filterTickets);
    }
    if (priorityFilter) {
        priorityFilter.addEventListener('change', filterTickets);
    }
});

function filterTickets() {
    const searchTerm = document.getElementById('searchTickets')?.value.toLowerCase() || '';
    const statusFilter = document.getElementById('filterTicketStatus')?.value || '';
    const priorityFilter = document.getElementById('filterTicketPriority')?.value || '';

    const filtered = allTickets.filter(ticket => {
        const matchesSearch = searchTerm === '' ||
            ticket.subject.toLowerCase().includes(searchTerm) ||
            ticket.user.profile.nombre.toLowerCase().includes(searchTerm) ||
            ticket.ticketNumber.toLowerCase().includes(searchTerm);
        
        const matchesStatus = !statusFilter || ticket.status === statusFilter;
        const matchesPriority = !priorityFilter || ticket.priority === priorityFilter;

        return matchesSearch && matchesStatus && matchesPriority;
    });

    renderTicketsList(filtered);
}

// ========================================
// LOGS Y AUDITORÍA
// ========================================

async function loadLogs() {
    try {
        showTableLoading('logsTableBody');
        
        const type = document.getElementById('logTypeFilter')?.value || '';
        const params = new URLSearchParams();
        if (type) params.append('type', type);
        
        const response = await fetch(`/api/admin/logs?${params}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            renderLogsTable(result.data);
        } else {
            showError('Error al cargar logs');
        }
    } catch (error) {
        console.error('Error:', error);
        showError('Error de conexión');
    }
}

function renderLogsTable(logs) {
    const tbody = document.getElementById('logsTableBody');
    if (!tbody) return;
    
    if (logs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center">No hay logs registrados</td></tr>';
        return;
    }
    
    tbody.innerHTML = logs.map(log => `
        <tr>
            <td>${formatDateTime(log.timestamp)}</td>
            <td><span class="badge bg-secondary">${log.type}</span></td>
            <td>${log.user || 'Sistema'}</td>
            <td>${log.action}</td>
            <td><small class="text-muted">${log.details || ''}</small></td>
        </tr>
    `).join('');
}

// ========================================
// UTILIDADES
// ========================================

function formatCurrency(amount) {
    return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN'
    }).format(amount);
}

function formatDateTime(date) {
    return new Date(date).toLocaleString('es-MX');
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
    return (hours * tarifaHora * 1.16).toFixed(2); // Con IVA
}

function showTableLoading(tbodyId) {
    const tbody = document.getElementById(tbodyId);
    if (tbody) {
        tbody.innerHTML = '<tr><td colspan="10" class="text-center py-4"><div class="spinner-border text-primary"></div></td></tr>';
    }
}

function showError(message) {
    showNotification(message, 'error');
}

function showNotification(message, type = 'info') {
    const colors = {
        success: '#10b981',
        error: '#ef4444',
        warning: '#f59e0b',
        info: '#3b82f6'
    };
    
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${colors[type] || colors.info};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 0.5rem;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function startAutoRefresh() {
    // Refrescar dashboard cada 30 segundos
    setInterval(() => {
        if (currentSection === 'dashboard') {
            loadDashboard();
        } else if (currentSection === 'sessions') {
            loadActiveSessions();
        }
    }, 30000);
}

window.exportToExcel = function() {
    showNotification('Exportación a Excel en desarrollo', 'info');
}

// ========================================
// GRÁFICA Y TABLA DE PLANES
// ========================================

function renderPlansChart(data) {
    const ctx = document.getElementById('plansChart');
    if (!ctx) return;
    
    if (charts.plans) {
        charts.plans.destroy();
    }
    
    // Si no hay datos, mostrar mensaje
    if (!data || data.length === 0) {
        const parent = ctx.parentElement;
        parent.innerHTML = '<div class="text-center py-4 text-muted"><i class="fas fa-chart-pie fa-3x mb-3"></i><br>No hay datos de planes disponibles</div>';
        return;
    }
    
    const colors = {
        'basico': 'rgba(107, 114, 128, 0.8)',
        'premium': 'rgba(59, 130, 246, 0.8)',
        'empresarial': 'rgba(139, 92, 246, 0.8)'
    };
    
    const labels = {
        'basico': 'Básico',
        'premium': 'Premium',
        'empresarial': 'Empresarial'
    };
    
    charts.plans = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: data.map(d => labels[d._id] || d._id),
            datasets: [{
                data: data.map(d => d.count),
                backgroundColor: data.map(d => colors[d._id] || 'rgba(0,0,0,0.5)')
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 15,
                        font: { size: 12 }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const value = context.parsed;
                            const percentage = ((value / total) * 100).toFixed(1);
                            return context.label + ': ' + value + ' usuarios (' + percentage + '%)';
                        }
                    }
                }
            }
        }
    });
}

// Recargar gráfica de planes (con datos del servidor)
async function refreshPlansChart() {
    try {
        const response = await fetch('/api/admin/plans-distribution', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const result = await response.json();
        
        if (result.success && result.data) {
            renderPlansChart(result.data);
        }
    } catch (error) {
        console.error('Error al actualizar gráfica de planes:', error);
    }
}

// Cargar tabla de planes comprados del mes
async function loadPlansTableMonth() {
    try {
        const response = await fetch('/api/admin/plans-month', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const result = await response.json();
        
        if (result.success && result.data) {
            renderPlansTableMonth(result.data);
        }
    } catch (error) {
        console.error('Error al cargar planes del mes:', error);
    }
}

function renderPlansTableMonth(plans) {
    const tbody = document.getElementById('plansTableMonthBody');
    
    if (!plans || plans.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">No hay planes comprados este mes</td></tr>';
        return;
    }
    
    const planNames = {
        'basico': 'Básico',
        'premium': 'Premium ($99)',
        'empresarial': 'Empresarial ($299)'
    };
    
    tbody.innerHTML = plans.map(plan => `
        <tr>
            <td>
                <small>${plan.userName || 'Usuario'}</small>
                <br><span class="text-muted" style="font-size: 0.8em;">${plan.userEmail || ''}</span>
            </td>
            <td>
                <span class="badge bg-info">${planNames[plan.plan] || plan.plan}</span>
            </td>
            <td>
                <strong class="text-success">$${plan.price || 0}</strong>
            </td>
            <td>
                <small class="text-muted">${new Date(plan.createdAt).toLocaleDateString('es-MX')}</small>
            </td>
        </tr>
    `).join('');
}

// Actualizar ingresos mensuales incluyendo planes
async function updateMonthlyRevenueWithPlans() {
    try {
        const response = await fetch('/api/admin/monthly-revenue', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            const monthlyRevenueEl = document.getElementById('monthlyRevenue');
            if (monthlyRevenueEl) {
                monthlyRevenueEl.textContent = formatCurrency(result.data.totalRevenue || 0);
            }
        }
    } catch (error) {
        console.error('Error al actualizar ingresos mensuales:', error);
    }
}

// ========================================
// ACTUALIZACIÓN EN TIEMPO REAL
// ========================================

// Escuchar evento de compra de plan desde el dashboard
document.addEventListener('planPurchased', async (event) => {
    console.log('Evento de compra de plan recibido:', event.detail);
    
    // Pequeña pausa para asegurar que MongoDB haya guardado
    setTimeout(async () => {
        // Recargar todos los gráficos y tablas de planes
        await refreshPlansChart();
        await loadPlansTableMonth();
        await updateMonthlyRevenueWithPlans();
    }, 500);
});

// Función para recargar gráficos de planes
async function refreshPlansData() {
    try {
        await refreshPlansChart();
        await loadPlansTableMonth();
        await updateMonthlyRevenueWithPlans();
        console.log('Datos de planes actualizados en tiempo real');
    } catch (error) {
        console.error('Error al actualizar datos de planes:', error);
    }
}

console.log('Admin panel loaded successfully');