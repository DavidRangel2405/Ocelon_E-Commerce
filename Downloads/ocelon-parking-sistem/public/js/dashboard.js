// ========================================
// OCELON - Dashboard Script Mejorado
// ========================================

// Configuración global
const API_BASE = '';
let currentSessionId = null;
let charts = {};

// Obtener datos del usuario
const token = localStorage.getItem('token');
const userId = localStorage.getItem('userId');
const userRole = localStorage.getItem('userRole');

// Redireccionar si no hay sesión
if (!token || !userId) {
    window.location.href = '/login.html';
}

// Mostrar sección de admin si es admin
if (userRole === 'admin') {
    document.getElementById('adminSection').style.display = 'block';
}

// ========================================
// UTILIDADES
// ========================================

// Función para hacer fetch con autenticación
async function fetchWithAuth(url, options = {}) {
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers
    };
    
    const response = await fetch(url, { ...options, headers });
    
    if (response.status === 401) {
        localStorage.clear();
        window.location.href = '/login.html';
    }
    
    return response;
}

// Formatear moneda
function formatCurrency(amount) {
    return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN'
    }).format(amount || 0);
}

// Formatear fecha
function formatDate(date) {
    return new Intl.DateTimeFormat('es-MX', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(new Date(date));
}

// Formatear fecha corta
function formatDateShort(date) {
    return new Intl.DateTimeFormat('es-MX', {
        month: 'short',
        day: 'numeric'
    }).format(new Date(date));
}

// Obtener color de estado
function getStatusColor(status) {
    const colors = {
        'activa': 'info',
        'pagada': 'warning',
        'finalizada': 'success',
        'exitoso': 'success',
        'abierto': 'info',
        'en_proceso': 'warning',
        'resuelto': 'success',
        'cerrado': 'secondary'
    };
    return colors[status] || 'secondary';
}

// Mostrar loading
function showLoading(containerId) {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = `
            <div class="loading-container">
                <div class="loading-spinner-lg"></div>
                <div class="loading-text">Cargando datos...</div>
            </div>
        `;
    }
}

// Mostrar estado vacío
function showEmptyState(containerId, icon, title, description, actionBtn = null) {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">
                    <i class="fas fa-${icon}"></i>
                </div>
                <h3 class="empty-state-title">${title}</h3>
                <p class="empty-state-description">${description}</p>
                ${actionBtn || ''}
            </div>
        `;
    }
}

// ========================================
// NAVEGACIÓN
// ========================================

// Cambiar entre secciones
document.querySelectorAll('.sidebar-link').forEach(link => {
    link.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        
        // Si el link tiene un href real (no "#" ni vacío), permitir navegación normal
        if (href && href !== '#' && href !== '') {
            return; // Dejar que el navegador maneje el click
        }
        
        e.preventDefault();
        const section = this.dataset.section;
        
        // Actualizar links activos
        document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
        this.classList.add('active');
        
        // Ocultar todas las secciones
        document.querySelectorAll('.dashboard-section').forEach(s => s.style.display = 'none');
        
        // Mostrar sección seleccionada
        const sectionElement = document.getElementById(`${section}Section`);
        if (sectionElement) {
            sectionElement.style.display = 'block';
            sectionElement.classList.add('animate__animated', 'animate__fadeIn');
        }
        
        // Cargar datos según la sección
        switch(section) {
            case 'overview':
                loadOverview();
                break;
            case 'map':
                loadMap();
                break;
            case 'sessions':
                loadSessions();
                break;
            case 'payments':
                loadPayments();
                break;
            case 'analytics':
                loadAnalytics();
                break;
            case 'promotions':
                loadPromotions();
                break;
            case 'profile':
                loadProfile();
                break;
            case 'support':
                loadSupport();
                break;
        }
    });
});

// Logout
document.getElementById('logoutBtn').addEventListener('click', () => {
    if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
        localStorage.clear();
        window.location.href = '/login.html';
    }
});

// ========================================
// SECCIÓN: OVERVIEW (Resumen)
// ========================================

async function loadOverview() {
    try {
        const response = await fetchWithAuth(`/api/dashboard/overview?userId=${userId}`);
        const data = await response.json();

        if (data.success) {
            const d = data.data;

            // Stats
            document.getElementById('totalSessions').textContent = d.totalSessions;
            document.getElementById('activeSessions').textContent = d.activeSessions;
            document.getElementById('activeSessionsBadge').textContent = d.activeSessions;
            document.getElementById('totalSpent').textContent = formatCurrency(d.totalSpent);
            document.getElementById('totalPayments').textContent = d.totalPayments;
            document.getElementById('userName').textContent = d.userName;
            document.getElementById('userAvatar').textContent = d.userName.charAt(0).toUpperCase();

            // Gráficas
            updateSessionsChart(d.sessionsByDay);
            updateDistributionChart(d.sessionsByStatus);
            updateSpendingChart(d.spendingByMonth);
            updateParkingUsageChart(d.parkingUsage);

            // Actividad reciente
            renderRecentActivity(d.recentActivity);
        }
    } catch (error) {
        console.error('Error loading overview:', error);
        alert('Error al cargar el resumen');
    }
}

// Renderizar actividad reciente
function renderRecentActivity(activities) {
    const container = document.getElementById('recentActivity');
    
    if (!activities || activities.length === 0) {
        showEmptyState('recentActivity', 'history', 'Sin actividad reciente', 'Tus últimas acciones aparecerán aquí');
        return;
    }
    
    const html = activities.map(activity => `
        <div class="mb-3 pb-3 border-bottom border-secondary">
            <div class="d-flex justify-content-between align-items-start">
                <div>
                    <i class="fas fa-circle text-primary me-2" style="font-size: 0.5rem;"></i>
                    <span class="text-white-50">${activity.description}</span>
                </div>
                <span class="text-muted" style="font-size: 0.875rem;">${formatDate(activity.timestamp)}</span>
            </div>
        </div>
    `).join('');
    
    container.innerHTML = html;
}

// Gráfica de sesiones
function createSessionsChart() {
    const ctx = document.getElementById('sessionsChart');
    if (!ctx) return;
    
    // Destruir gráfica anterior si existe
    if (charts.sessions) {
        charts.sessions.destroy();
    }
    
    // Datos de ejemplo (reemplazar con datos reales)
    const data = {
        labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
        datasets: [{
            label: 'Estancias',
            data: [12, 19, 8, 15, 10, 18, 14],
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointRadius: 5,
            pointHoverRadius: 7,
            pointBackgroundColor: '#10b981',
            pointBorderColor: '#fff',
            pointBorderWidth: 2
        }]
    };
    
    charts.sessions = new Chart(ctx, {
        type: 'line',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(30, 41, 59, 0.95)',
                    titleColor: '#10b981',
                    bodyColor: '#fff',
                    borderColor: '#10b981',
                    borderWidth: 1,
                    padding: 12,
                    displayColors: false,
                    callbacks: {
                        label: function(context) {
                            return `${context.parsed.y} estancias`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)'
                    },
                    ticks: {
                        color: '#94a3b8'
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: '#94a3b8'
                    }
                }
            }
        }
    });
}

// Gráfica de distribución
function createDistributionChart() {
    const ctx = document.getElementById('distributionChart');
    if (!ctx) return;
    
    if (charts.distribution) {
        charts.distribution.destroy();
    }
    
    charts.distribution = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Activas', 'Pagadas', 'Finalizadas'],
            datasets: [{
                data: [15, 45, 40],
                backgroundColor: [
                    '#3b82f6',
                    '#f59e0b',
                    '#10b981'
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#94a3b8',
                        padding: 15,
                        font: {
                            size: 12
                        }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(30, 41, 59, 0.95)',
                    titleColor: '#10b981',
                    bodyColor: '#fff',
                    borderColor: '#10b981',
                    borderWidth: 1,
                    padding: 12
                }
            }
        }
    });
}

// ========================================
// SECCIÓN: SESIONES
// ========================================

async function loadSessions() {
    showLoading('sessionsTable');
    
    try {
        const response = await fetchWithAuth(`/api/sessions?userId=${userId}`);
        const data = await response.json();
        
        if (data.success) {
            renderSessionsTable(data.data);
        }
    } catch (error) {
        console.error('Error loading sessions:', error);
        showEmptyState('sessionsTable', 'exclamation-triangle', 'Error al cargar', 'No se pudieron cargar las estancias');
    }
}

function renderSessionsTable(sessions) {
    console.log("Sesiones recibidas:", sessions);
    const tableBody = document.getElementById('sessionsTable');
    
    if (!sessions || sessions.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7">
                    <div class="empty-state">
                        <div class="empty-state-icon"><i class="fas fa-parking"></i></div>
                        <h3 class="empty-state-title">No hay estancias</h3>
                        <p class="empty-state-description">Crea tu primera estancia para comenzar</p>
                        <button class="btn btn-ocelon" onclick="document.getElementById('newSessionBtn').click()">
                            <i class="fas fa-plus-circle me-2"></i>
                            Nueva Estancia
                        </button>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    tableBody.innerHTML = sessions.map(session => {
        const currentPlan = getCurrentPlan();
        let amountDisplay = '<span class="text-muted">Pendiente</span>';
        
        if (session.amount) {
            const discountInfo = applyPlanDiscount(session.amount);
            if (currentPlan.discount > 0) {
                amountDisplay = `
                    <div style="font-size: 0.85em;">
                        <del class="text-muted">${formatCurrency(discountInfo.original)}</del>
                        <strong class="text-success">${formatCurrency(discountInfo.final)}</strong>
                        <small class="text-success">(${discountInfo.discountPercentage}% desc.)</small>
                    </div>
                `;
            } else {
                amountDisplay = `<strong>${formatCurrency(session.amount)}</strong>`;
            }
        }
        
        return `
            <tr>
                <td><code class="text-primary">${session.qrCode.substring(0, 12)}...</code></td>
                <td><strong>${session.parkingLotName}</strong></td>
                <td>${formatDate(session.entryTime)}</td>
                <td>${session.exitTime ? formatDate(session.exitTime) : '<span class="badge badge-warning">En estacionamiento</span>'}</td>
                <td><span class="badge badge-${getStatusColor(session.status)}">${session.status.toUpperCase()}</span></td>
                <td>${amountDisplay}</td>
                <td>
                    <div class="action-buttons">
                        ${session.status === 'activa' ? `
                            <button class="btn-action btn-action-pay" onclick="openPaymentModal('${session._id}')" title="Pagar Estancia">
                                <i class="fas fa-credit-card"></i>
                            </button>
                        ` : ''}
                        ${session.status === 'pagada' ? `
                            <button class="btn-action btn-action-success" onclick="validateExit('${session._id}')" title="Validar Salida">
                                <i class="fas fa-check-circle"></i>
                            </button>
                        ` : ''}
                        <button class="btn-action btn-action-view" onclick="viewSessionDetail('${session._id}')" title="Ver Detalles">
                            <i class="fas fa-eye"></i>
                        </button>
                        ${session.status === 'finalizada' ? `
                            <button class="btn-action btn-action-download" onclick="downloadTicket('${session._id}')" title="Descargar Ticket">
                                <i class="fas fa-download"></i>
                            </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// Nueva sesión
document.getElementById('newSessionBtn')?.addEventListener('click', async () => {
    try {
        const response = await fetchWithAuth('/api/parking/lots');
        const data = await response.json();
        
        if (data.success) {
            const select = document.getElementById('parkingLotSelect');
            select.innerHTML = data.data.map(lot => 
                `<option value="${lot._id}">${lot.nombre} - ${lot.ubicacion}</option>`
            ).join('');
            
            new bootstrap.Modal(document.getElementById('newSessionModal')).show();
        }
    } catch (error) {
        console.error('Error:', error);
    }
});

document.getElementById('createSessionBtn')?.addEventListener('click', async () => {
    try {
        const response = await fetchWithAuth('/api/sessions', {
            method: 'POST',
            body: JSON.stringify({
                userId: userId,
                parkingLotId: document.getElementById('parkingLotSelect').value,
                vehiclePlates: document.getElementById('vehiclePlates').value
            })
        });

        const data = await response.json();

        if (data.success) {
            bootstrap.Modal.getInstance(document.getElementById('newSessionModal')).hide();

            window.showToast.success('Estancia creada', `Código QR: ${data.data.qrCode}`);

            // Incrementar badge
            const badge = document.getElementById('activeSessionsBadge');
            badge.textContent = parseInt(badge.textContent) + 1;

            loadSessions();
            if (parkingMapInstance) {
                parkingMapInstance.loadParkingData();
            }
        } else {
            window.showToast.error('Error', data.message || 'No se pudo crear la estancia');
        }
    } catch (error) {
        console.error('Error:', error);
        window.showToast.error('Error', 'Hubo un problema al crear la estancia');
    }
});

// ========================================
// SECCIÓN: PAGOS
// ========================================

// Gestión de métodos de pago guardados
const PaymentStorage = {
    // Obtener método guardado
    getSavedMethod: function() {
        const saved = localStorage.getItem(`ocelon_saved_payment_${userId}`);
        return saved ? JSON.parse(saved) : null;
    },
    
    // Guardar método
    saveMethod: function(method, data) {
        const saved = {
            method: method,
            data: data,
            savedAt: new Date().toISOString()
        };
        localStorage.setItem(`ocelon_saved_payment_${userId}`, JSON.stringify(saved));
    },
    
    // Limpiar método guardado
    clearMethod: function() {
        localStorage.removeItem(`ocelon_saved_payment_${userId}`);
    }
};

// Validaciones de campos de pago
const PaymentValidations = {
    // Validar tarjeta
    validarTarjeta: function() {
        const nombre = document.getElementById('tarjetaNombre').value.trim();
        const numero = document.getElementById('tarjetaNumero').value.replace(/\s/g, '');
        const fecha = document.getElementById('tarjetaFecha').value;
        const cvv = document.getElementById('tarjetaCvv').value;
        
        if (!nombre) {
            window.showToast.warning('Campo requerido', 'Por favor ingresa el nombre del titular');
            return false;
        }
        
        if (numero.length !== 16 || !/^\d+$/.test(numero)) {
            window.showToast.warning('Tarjeta inválida', 'El número debe tener 16 dígitos');
            return false;
        }
        
        if (!fecha || !/^\d{2}\/\d{2}$/.test(fecha)) {
            window.showToast.warning('Fecha inválida', 'Usa formato MM/YY');
            return false;
        }
        
        // Validar que la fecha no sea mayor a 5 años
        const [mes, año] = fecha.split('/');
        const fechaIngresada = new Date(2000 + parseInt(año), parseInt(mes) - 1);
        const fechaMaxima = new Date();
        fechaMaxima.setFullYear(fechaMaxima.getFullYear() + 5);
        
        if (fechaIngresada > fechaMaxima) {
            window.showToast.warning('Fecha de caducidad inválida', 'La fecha no puede ser mayor a 5 años desde hoy');
            return false;
        }
        
        if (!/^\d{3,4}$/.test(cvv)) {
            window.showToast.warning('CVV inválido', 'El CVV debe tener 3 o 4 dígitos');
            return false;
        }
        
        return true;
    },
    
    // Validar wallet
    validarWallet: function() {
        const email = document.getElementById('walletEmail').value.trim();
        const password = document.getElementById('walletPassword').value;
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
        if (!email || !emailRegex.test(email)) {
            window.showToast.warning('Email inválido', 'Por favor ingresa un email válido');
            return false;
        }
        
        if (!password || password.length < 6) {
            window.showToast.warning('Contraseña requerida', 'La contraseña debe tener al menos 6 caracteres');
            return false;
        }
        
        return true;
    },
    
    // Validar transferencia
    validarTransferencia: function() {
        const clabe = document.getElementById('transferenciaClabe').value.replace(/\s/g, '');
        const banco = document.getElementById('transferenciaBanco').value;
        const beneficiario = document.getElementById('transferenciaBeneficiario').value.trim();
        
        if (clabe.length !== 18 || !/^\d+$/.test(clabe)) {
            window.showToast.warning('CLABE inválida', 'La CLABE debe tener 18 dígitos');
            return false;
        }
        
        if (!banco) {
            window.showToast.warning('Banco requerido', 'Por favor selecciona un banco');
            return false;
        }
        
        if (!beneficiario) {
            window.showToast.warning('Beneficiario requerido', 'Por favor ingresa el nombre del beneficiario');
            return false;
        }
        
        return true;
    }
};

// Event listener para cambio de método de pago
document.getElementById('paymentMethod')?.addEventListener('change', function(e) {
    const method = e.target.value;
    const saveContainer = document.getElementById('saveMethodContainer');
    
    // Ocultar todos los formularios
    document.querySelectorAll('.payment-method-form').forEach(form => {
        form.style.display = 'none';
    });
    
    // Mostrar formulario seleccionado
    if (method === 'tarjeta') {
        document.getElementById('tarjetaForm').style.display = 'block';
        saveContainer.style.display = 'block';
    } else if (method === 'wallet') {
        document.getElementById('walletForm').style.display = 'block';
        saveContainer.style.display = 'block';
    } else if (method === 'transferencia') {
        document.getElementById('transferenciaForm').style.display = 'block';
        saveContainer.style.display = 'block';
    } else {
        saveContainer.style.display = 'none';
    }
});

// Formatear número de tarjeta con espacios
document.getElementById('tarjetaNumero')?.addEventListener('input', function(e) {
    let value = e.target.value.replace(/\s/g, '').replace(/\D/g, '');
    let formatted = value.match(/.{1,4}/g)?.join(' ') || value;
    e.target.value = formatted;
});

// Formatear fecha de caducidad MM/YY
document.getElementById('tarjetaFecha')?.addEventListener('input', function(e) {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length >= 2) {
        value = value.substring(0, 2) + '/' + value.substring(2, 4);
    }
    e.target.value = value;
});

// Permitir solo números en CLABE
document.getElementById('transferenciaClabe')?.addEventListener('input', function(e) {
    e.target.value = e.target.value.replace(/\D/g, '');
});

// Permitir solo números en CVV
document.getElementById('tarjetaCvv')?.addEventListener('input', function(e) {
    e.target.value = e.target.value.replace(/\D/g, '');
});

async function loadPayments() {
    showLoading('paymentsTable');
    
    try {
        const response = await fetchWithAuth(`/api/payments?userId=${userId}`);
        const data = await response.json();
        
        if (data.success) {
            renderPaymentsTable(data.data);
        }
    } catch (error) {
        console.error('Error loading payments:', error);
    }
}

function renderPaymentsTable(payments) {
    const tableBody = document.getElementById('paymentsTable');
    
    if (!payments || payments.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="8">
                    <div class="empty-state">
                        <div class="empty-state-icon"><i class="fas fa-receipt"></i></div>
                        <h3 class="empty-state-title">No hay pagos registrados</h3>
                        <p class="empty-state-description">Tus transacciones aparecerán aquí</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    tableBody.innerHTML = payments.map(payment => `
        <tr>
            <td><code class="text-primary">${payment.transactionId}</code></td>
            <td>${formatDate(payment.timestamp)}</td>
            <td>
                <span class="badge badge-info">
                    <i class="fas fa-${getPaymentMethodIcon(payment.paymentMethod)} me-1"></i>
                    ${payment.paymentMethod}
                </span>
            </td>
            <td>${formatCurrency(payment.subtotal)}</td>
            <td>${formatCurrency(payment.taxes.iva)}</td>
            <td><strong class="text-primary">${formatCurrency(payment.amount)}</strong></td>
            <td><span class="badge badge-${getStatusColor(payment.status)}">${payment.status.toUpperCase()}</span></td>
            <td>
                <div class="action-buttons">
                    <button class="btn-action btn-action-view" onclick="viewPaymentDetail('${payment._id}')" title="Ver Detalles">
                        <i class="fas fa-file-invoice"></i>
                    </button>
                    <button class="btn-action btn-action-download" onclick="downloadPaymentReceipt('${payment._id}')" title="Descargar Comprobante">
                        <i class="fas fa-download"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Función auxiliar para iconos de métodos de pago
function getPaymentMethodIcon(method) {
    const icons = {
        'tarjeta': 'credit-card',
        'wallet': 'wallet',
        'transferencia': 'exchange-alt',
        'efectivo': 'money-bill-wave'
    };
    return icons[method] || 'dollar-sign';
}

// ========================================
// GESTIÓN DE PLANES Y PROMOCIONES
// ========================================

// Planes disponibles con sus descuentos
const Plans = {
    basico: { name: 'Básico', discount: 0, price: 0 },
    premium: { name: 'Premium', discount: 15, price: 99 },
    empresarial: { name: 'Empresarial', discount: 25, price: 299 }
};

// Obtener plan actual del usuario
function getCurrentPlan() {
    const saved = localStorage.getItem(`ocelon_current_plan_${userId}`);
    return saved ? JSON.parse(saved) : { plan: 'basico', discount: 0 };
}

// Cargar plan desde el servidor (se ejecuta al iniciar dashboard)
async function loadUserPlanFromServer() {
    try {
        const response = await fetchWithAuth(`/api/users/${userId}`);
        const data = await response.json();
        
        if (data.success && data.data) {
            const user = data.data;
            
            // Si el usuario tiene un plan guardado en el servidor, restaurarlo en localStorage
            if (user.currentPlan) {
                const planData = {
                    plan: user.currentPlan,
                    discount: user.planDiscount || 0,
                    savedAt: new Date().toISOString()
                };
                localStorage.setItem(`ocelon_current_plan_${userId}`, JSON.stringify(planData));
            }
        }
    } catch (error) {
        console.error('Error al cargar plan del servidor:', error);
    }
}

// Guardar plan del usuario
function savePlan(plan, discount) {
    const planData = { plan: plan, discount: discount, savedAt: new Date().toISOString() };
    localStorage.setItem(`ocelon_current_plan_${userId}`, JSON.stringify(planData));
    
    // Guardar también en el servidor
    savePlanToServer(plan, discount);
}

// Guardar plan en el servidor
async function savePlanToServer(plan, discount) {
    try {
        const planPrices = {
            'basico': 0,
            'premium': 99,
            'empresarial': 299
        };
        
        const response = await fetchWithAuth('/api/users/plan', {
            method: 'POST',
            body: JSON.stringify({
                plan: plan,
                discount: discount,
                price: planPrices[plan] || 0
            })
        });
        
        const data = await response.json();
        if (data.success) {
            console.log('Plan guardado en servidor:', data);
            
            // Disparar evento para que se actualicen los gráficos del admin
            const event = new CustomEvent('planPurchased', {
                detail: {
                    plan: plan,
                    price: planPrices[plan] || 0,
                    discount: discount
                }
            });
            document.dispatchEvent(event);
            
            return true;
        } else {
            console.error('Error al guardar plan:', data.message);
            return false;
        }
    } catch (error) {
        console.error('Error al guardar plan en servidor:', error);
        return false;
    }
}

// Calcular descuento en el total
function applyPlanDiscount(total) {
    const currentPlan = getCurrentPlan();
    const discountAmount = total * (currentPlan.discount / 100);
    return {
        original: total,
        discount: discountAmount,
        final: total - discountAmount,
        discountPercentage: currentPlan.discount
    };
}

// Cargar y mostrar promociones
function loadPromotions() {
    const currentPlan = getCurrentPlan();
    
    // Mostrar alerta de plan actual
    if (currentPlan.plan !== 'basico') {
        document.getElementById('currentPlanAlert').style.display = 'block';
        document.getElementById('currentPlanName').textContent = Plans[currentPlan.plan].name;
        document.getElementById('currentPlanDiscount').textContent = currentPlan.discount + '%';
    }
    
    // Actualizar botones de planes
    updatePlanButtons(currentPlan.plan);
}

// Actualizar estados de botones de planes
function updatePlanButtons(currentPlanName) {
    // Restablecer todos los botones - NUNCA desactivarlos, solo cambiar texto
    const basicBtn = document.querySelector('[onclick="selectPlan(\'basico\', 0)"]');
    const premiumBtn = document.querySelector('[onclick="selectPlan(\'premium\', 15)"]');
    const empresarialBtn = document.querySelector('[onclick="selectPlan(\'empresarial\', 25)"]');
    
    // Habilitar todos los botones
    if (basicBtn) basicBtn.disabled = false;
    if (premiumBtn) premiumBtn.disabled = false;
    if (empresarialBtn) empresarialBtn.disabled = false;
    
    // Actualizar texto según el plan actual
    document.getElementById('basicButtonText').textContent = 'Elegir Plan';
    document.getElementById('premiumButtonText').textContent = 'Elegir Premium';
    document.getElementById('empresarialButtonText').textContent = 'Elegir Empresarial';
    
    // Solo cambiar texto del botón del plan actual
    if (currentPlanName === 'basico') {
        document.getElementById('basicButtonText').textContent = '✓ Plan Actual';
    } else if (currentPlanName === 'premium') {
        document.getElementById('premiumButtonText').textContent = '✓ Plan Actual';
    } else if (currentPlanName === 'empresarial') {
        document.getElementById('empresarialButtonText').textContent = '✓ Plan Actual';
    }
}

// Seleccionar un plan
function selectPlan(planName, discount) {
    const currentPlan = getCurrentPlan();
    
    // Si es el plan actual, no hacer nada
    if (currentPlan.plan === planName) {
        window.showToast.warning('Plan Actual', 'Ya tienes este plan activo');
        return;
    }
    
    // Si quiere cambiar a otro plan, mostrar confirmación
    if (planName === 'basico') {
        // Si cambia a Básico, advertir que perderá descuentos
        showCustomConfirm(
            '¿Volver al Plan Básico?',
            `¿Estás seguro de volver a ${Plans[planName].name}? Perderás todos los beneficios y descuentos.`,
            'Volver a Básico',
            'Cancelar'
        ).then(confirmed => {
            if (confirmed) {
                savePlan(planName, discount);
                window.showToast.info('Plan Cambiado', `Has vuelto a ${Plans[planName].name}. Sin descuentos aplicados.`);
                loadPromotions();
                loadSessions();
            }
        });
    } else {
        // Cambiar a Premium o Empresarial
        showCustomConfirm(
            '¿Cambiar de Plan?',
            `¿Estás seguro de cambiar de ${Plans[currentPlan.plan].name} a ${Plans[planName].name}? El descuento del ${discount}% se aplicará en tus próximos pagos.`,
            'Cambiar Plan',
            'Cancelar'
        ).then(confirmed => {
            if (confirmed) {
                savePlan(planName, discount);
                window.showToast.success('¡Plan Actualizado!', `Has cambiado a ${Plans[planName].name}. El descuento del ${discount}% se aplicará en tus próximos pagos.`);
                loadPromotions();
                loadSessions();
            }
        });
    }
}

// ========================================
// SECCIÓN: ANALÍTICAS
// ========================================

async function loadAnalytics() {
    try {
        const response = await fetchWithAuth(`/api/dashboard/analytics/user?userId=${userId}`);
        const data = await response.json();

        if (data.success) {
            updateSpendingChart(data.data.spendingByMonth);
            updateParkingUsageChart(data.data.parkingUsage);
        }
    } catch (error) {
        console.error('Error loading analytics:', error);
    }
}

function createSpendingChart() {
    const ctx = document.getElementById('spendingChart');
    if (!ctx) return;
    
    if (charts.spending) charts.spending.destroy();
    
    charts.spending = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
            datasets: [{
                label: 'Gastos',
                data: [450, 380, 520, 410, 480, 550],
                backgroundColor: 'rgba(16, 185, 129, 0.8)',
                borderColor: '#10b981',
                borderWidth: 2,
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(30, 41, 59, 0.95)',
                    titleColor: '#10b981',
                    bodyColor: '#fff',
                    borderColor: '#10b981',
                    borderWidth: 1,
                    padding: 12,
                    callbacks: {
                        label: (context) => formatCurrency(context.parsed.y)
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: {
                        color: '#94a3b8',
                        callback: (value) => '$' + value
                    }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: '#94a3b8' }
                }
            }
        }
    });
}

function createParkingUsageChart() {
    const ctx = document.getElementById('parkingUsageChart');
    if (!ctx) return;
    
    if (charts.parkingUsage) charts.parkingUsage.destroy();
    
    charts.parkingUsage = new Chart(ctx, {
        type: 'polarArea',
        data: {
            labels: ['Plaza Centro', 'Galerías', 'Hospital', 'Universidad', 'Aeropuerto'],
            datasets: [{
                data: [25, 35, 15, 10, 15],
                backgroundColor: [
                    'rgba(16, 185, 129, 0.7)',
                    'rgba(99, 102, 241, 0.7)',
                    'rgba(245, 158, 11, 0.7)',
                    'rgba(239, 68, 68, 0.7)',
                    'rgba(59, 130, 246, 0.7)'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#94a3b8',
                        padding: 15,
                        font: { size: 11 }
                    }
                }
            }
        }
    });
}

// ========================================
// SECCIÓN: PERFIL
// ========================================

async function loadProfile() {
    try {
        const response = await fetchWithAuth(`/api/users/${userId}`);
        const data = await response.json();
        
        if (data.success) {
            document.getElementById('profileNombre').value = data.data.profile.nombre || '';
            document.getElementById('profileEmail').value = data.data.email;
            document.getElementById('profileTelefono').value = data.data.profile.telefono || '';
            document.getElementById('profileRfc').value = data.data.profile.rfc || '';
        }
    } catch (error) {
        console.error('Error loading profile:', error);
    }
}

document.getElementById('profileForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    try {
        const response = await fetchWithAuth(`/api/users/${userId}`, {
            method: 'PUT',
            body: JSON.stringify({
                profile: {
                    nombre: document.getElementById('profileNombre').value,
                    telefono: document.getElementById('profileTelefono').value,
                    rfc: document.getElementById('profileRfc').value
                }
            })
        });
        
        if ((await response.json()).success) {
            alert('Perfil actualizado exitosamente');
            loadOverview(); // Recargar para actualizar nombre
        }
    } catch (error) {
        console.error('Error:', error);
    }
});

// ========================================
// SECCIÓN: SOPORTE
// ========================================

async function loadSupport() {
    showLoading('ticketsList');
    
    try {
        const response = await fetchWithAuth(`/api/support/tickets?userId=${userId}`);
        const data = await response.json();
        
        if (data.success) {
            renderTickets(data.data);
        } else {
            showEmptyState('ticketsList', 'ticket-alt', 'Error al cargar', 'No se pudieron cargar los tickets');
        }
    } catch (error) {
        console.error('Error loading support:', error);
        showEmptyState('ticketsList', 'exclamation-triangle', 'Error de conexión', 'No se pudo conectar con el servidor');
    }
}

function renderTickets(tickets) {
    const container = document.getElementById('ticketsList');
    
    if (!tickets || tickets.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon"><i class="fas fa-ticket-alt"></i></div>
                <h3 class="empty-state-title">No hay tickets</h3>
                <p class="empty-state-description">Crea un ticket si necesitas ayuda con algún problema</p>
                <button class="btn btn-ocelon" onclick="openNewTicketModal()">
                    <i class="fas fa-plus-circle me-2"></i>
                    Crear Primer Ticket
                </button>
            </div>
        `;
        return;
    }

    container.innerHTML = tickets.map(ticket => {
        const statusColor = getTicketStatusColor(ticket.status);
        const priorityColor = getTicketPriorityColor(ticket.priority);
        const lastMessage = ticket.messages && ticket.messages.length > 0 
            ? ticket.messages[ticket.messages.length - 1].texto 
            : 'Sin mensajes';
        
        return `
            <div class="ticket-card mb-3 hover-lift" onclick="viewTicketDetail('${ticket._id}')">
                <div class="ticket-card-header">
                    <div class="d-flex align-items-start justify-content-between">
                        <div class="flex-grow-1">
                            <div class="d-flex align-items-center gap-2 mb-2">
                                <span class="badge badge-${statusColor}">${getStatusText(ticket.status)}</span>
                                <span class="badge badge-${priorityColor}">
                                    <i class="fas fa-flag me-1"></i>${ticket.priority.toUpperCase()}
                                </span>
                                <span class="badge badge-secondary">
                                    <i class="fas fa-tag me-1"></i>${ticket.category}
                                </span>
                            </div>
                            <h5 class="ticket-title mb-2">
                                <i class="fas fa-ticket-alt text-primary me-2"></i>
                                ${ticket.subject}
                            </h5>
                            <div class="ticket-meta">
                                <span class="text-muted">
                                    <i class="fas fa-hashtag me-1"></i>${ticket.ticketNumber}
                                </span>
                                <span class="text-muted mx-2">•</span>
                                <span class="text-muted">
                                    <i class="fas fa-clock me-1"></i>Creado: ${formatDate(ticket.createdAt)}
                                </span>
                            </div>
                        </div>
                        <div class="ticket-actions">
                            <button class="btn-action btn-action-view" onclick="event.stopPropagation(); viewTicketDetail('${ticket._id}')" title="Ver Detalles">
                                <i class="fas fa-eye"></i>
                            </button>
                        </div>
                    </div>
                </div>
                <div class="ticket-card-body">
                    <p class="ticket-preview">${lastMessage.substring(0, 150)}${lastMessage.length > 150 ? '...' : ''}</p>
                </div>
                <div class="ticket-card-footer">
                    <div class="d-flex justify-content-between align-items-center">
                        <span class="text-muted small">
                            <i class="fas fa-comments me-1"></i>
                            ${ticket.messages ? ticket.messages.length : 0} mensaje(s)
                        </span>
                        ${ticket.resolvedAt ? `
                            <span class="text-success small">
                                <i class="fas fa-check-circle me-1"></i>
                                Resuelto: ${formatDateShort(ticket.resolvedAt)}
                            </span>
                        ` : `
                            <span class="text-warning small">
                                <i class="fas fa-hourglass-half me-1"></i>
                                En proceso
                            </span>
                        `}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Funciones auxiliares para tickets
function getTicketStatusColor(status) {
    const colors = {
        'abierto': 'info',
        'en_proceso': 'warning',
        'resuelto': 'success',
        'cerrado': 'secondary'
    };
    return colors[status] || 'secondary';
}

function getTicketPriorityColor(priority) {
    const colors = {
        'baja': 'info',
        'media': 'warning',
        'alta': 'danger'
    };
    return colors[priority] || 'info';
}

function getStatusText(status) {
    const texts = {
        'abierto': 'ABIERTO',
        'en_proceso': 'EN PROCESO',
        'resuelto': 'RESUELTO',
        'cerrado': 'CERRADO'
    };
    return texts[status] || status.toUpperCase();
}

// ========================================
// MODAL: NUEVO TICKET
// ========================================

function openNewTicketModal() {
    const modal = new bootstrap.Modal(document.getElementById('newTicketModal'));
    
    // Limpiar formulario
    document.getElementById('newTicketForm').reset();
    
    modal.show();
}

// Event listener para crear ticket
document.getElementById('createTicketBtn')?.addEventListener('click', async () => {
    const category = document.getElementById('ticketCategory').value;
    const subject = document.getElementById('ticketSubject').value;
    const description = document.getElementById('ticketDescription').value;
    
    // Validaciones
    if (!subject.trim()) {
        window.showToast.warning('Campo requerido', 'Por favor ingresa el asunto del ticket');
        return;
    }
    
    if (!description.trim()) {
        window.showToast.warning('Campo requerido', 'Por favor describe tu problema');
        return;
    }
    
    if (description.length < 20) {
        window.showToast.warning('Descripción muy corta', 'Por favor proporciona más detalles (mínimo 20 caracteres)');
        return;
    }
    
    try {
        window.showToast.info('Creando', 'Enviando tu solicitud de soporte...');
        
        const response = await fetchWithAuth('/api/support/tickets', {
            method: 'POST',
            body: JSON.stringify({
                userId: userId,
                category: category,
                subject: subject,
                description: description
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Cerrar modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('newTicketModal'));
            modal.hide();
            
            // Mostrar éxito
            window.showToast.success(
                '¡Ticket Creado!', 
                `Tu ticket #${data.data.ticketNumber} ha sido creado. Te responderemos pronto.`,
                { duration: 5000 }
            );
            
            // Recargar tickets
            loadSupport();
            
            // Actualizar badge
            const badge = document.getElementById('openTicketsBadge');
            if (badge) {
                badge.textContent = parseInt(badge.textContent || 0) + 1;
            }
        } else {
            window.showToast.error('Error', data.message || 'No se pudo crear el ticket');
        }
    } catch (error) {
        console.error('Error:', error);
        window.showToast.error('Error', 'Error de conexión al crear el ticket');
    }
});

// ========================================
// DETALLES DEL TICKET
// ========================================

async function viewTicketDetail(ticketId) {
    try {
        const response = await fetchWithAuth(`/api/support/tickets/${ticketId}`);
        const data = await response.json();
        
        if (data.success) {
            const ticket = data.data;
            showTicketDetailModal(ticket);
        } else {
            window.showToast.error('Error', data.message || 'No se pudo cargar el ticket');
        }
    } catch (error) {
        console.error('Error:', error);
        window.showToast.error('Error', 'Error al cargar detalles del ticket');
    }
}

function showTicketDetailModal(ticket) {
    const statusColor = getTicketStatusColor(ticket.status);
    const priorityColor = getTicketPriorityColor(ticket.priority);
    
    const modalHtml = `
        <div class="modal fade" id="ticketDetailModal" tabindex="-1">
            <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
                <div class="modal-content">
                    <div class="modal-header">
                        <div>
                            <h5 class="modal-title mb-2">
                                <i class="fas fa-ticket-alt text-primary me-2"></i>
                                ${ticket.subject}
                            </h5>
                            <div class="d-flex gap-2">
                                <span class="badge badge-${statusColor}">${getStatusText(ticket.status)}</span>
                                <span class="badge badge-${priorityColor}">
                                    <i class="fas fa-flag me-1"></i>${ticket.priority.toUpperCase()}
                                </span>
                                <span class="badge badge-secondary">
                                    <i class="fas fa-tag me-1"></i>${ticket.category}
                                </span>
                            </div>
                        </div>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <!-- Información del ticket -->
                        <div class="card bg-dark-light mb-3 p-3">
                            <div class="row">
                                <div class="col-md-6 mb-2">
                                    <small class="text-muted">Número de Ticket</small>
                                    <div class="fw-bold">${ticket.ticketNumber}</div>
                                </div>
                                <div class="col-md-6 mb-2">
                                    <small class="text-muted">Canal</small>
                                    <div class="fw-bold">
                                        <i class="fas fa-${getChannelIcon(ticket.channel)} me-2"></i>
                                        ${ticket.channel.toUpperCase()}
                                    </div>
                                </div>
                                <div class="col-md-6 mb-2">
                                    <small class="text-muted">Creado</small>
                                    <div>${formatDate(ticket.createdAt)}</div>
                                </div>
                                ${ticket.resolvedAt ? `
                                    <div class="col-md-6 mb-2">
                                        <small class="text-muted">Resuelto</small>
                                        <div class="text-success">${formatDate(ticket.resolvedAt)}</div>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                        
                        <!-- Mensajes -->
                        <div class="ticket-messages" id="ticketMessages">
                            ${renderTicketMessages(ticket.messages || [])}
                        </div>
                        
                        <!-- Responder (solo si no está cerrado) -->
                        ${ticket.status !== 'cerrado' && ticket.status !== 'resuelto' ? `
                            <div class="mt-4">
                                <label class="form-label fw-bold">
                                    <i class="fas fa-reply me-2"></i>
                                    Agregar Respuesta
                                </label>
                                <textarea class="form-control mb-3" id="newMessageText" rows="4" 
                                    placeholder="Escribe tu mensaje aquí..."></textarea>
                                <button class="btn btn-ocelon" onclick="sendTicketMessage('${ticket._id}')">
                                    <i class="fas fa-paper-plane me-2"></i>
                                    Enviar Mensaje
                                </button>
                            </div>
                        ` : `
                            <div class="alert alert-info mt-4">
                                <i class="fas fa-info-circle me-2"></i>
                                Este ticket está ${ticket.status === 'cerrado' ? 'cerrado' : 'resuelto'}. 
                                ${ticket.status === 'resuelto' ? 'Si necesitas reabrir el caso, crea un nuevo ticket.' : ''}
                            </div>
                        `}
                    </div>
                    <div class="modal-footer">
                        ${ticket.status === 'resuelto' ? `
                            <button class="btn btn-success" onclick="closeTicket('${ticket._id}')">
                                <i class="fas fa-check-double me-2"></i>
                                Marcar como Cerrado
                            </button>
                        ` : ''}
                        <button class="btn btn-outline-ocelon" data-bs-dismiss="modal">Cerrar</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remover modal anterior si existe
    const oldModal = document.getElementById('ticketDetailModal');
    if (oldModal) oldModal.remove();
    
    // Insertar y mostrar nuevo modal
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const modal = new bootstrap.Modal(document.getElementById('ticketDetailModal'));
    modal.show();
}

function renderTicketMessages(messages) {
    if (!messages || messages.length === 0) {
        return '<p class="text-muted text-center py-4">No hay mensajes aún</p>';
    }
    
    return messages.map(msg => `
        <div class="message-item ${msg.autor === 'usuario' ? 'message-user' : 'message-support'}">
            <div class="message-header">
                <div class="d-flex align-items-center gap-2">
                    <div class="message-avatar">
                        <i class="fas fa-${msg.autor === 'usuario' ? 'user' : 'headset'}"></i>
                    </div>
                    <div>
                        <div class="message-author">${msg.autor === 'usuario' ? 'Tú' : 'Soporte Ocelon'}</div>
                        <div class="message-time">${formatDate(msg.timestamp)}</div>
                    </div>
                </div>
            </div>
            <div class="message-content">
                ${msg.texto}
            </div>
        </div>
    `).join('');
}

function getChannelIcon(channel) {
    const icons = {
        'web': 'globe',
        'chat': 'comments',
        'email': 'envelope',
        'phone': 'phone'
    };
    return icons[channel] || 'question';
}

// ========================================
// ENVIAR MENSAJE
// ========================================

async function sendTicketMessage(ticketId) {
    const messageText = document.getElementById('newMessageText').value.trim();
    
    if (!messageText) {
        window.showToast.warning('Campo vacío', 'Por favor escribe un mensaje');
        return;
    }
    
    if (messageText.length < 10) {
        window.showToast.warning('Mensaje muy corto', 'Por favor proporciona más detalles');
        return;
    }
    
    try {
        window.showToast.info('Enviando', 'Enviando tu mensaje...');
        
        const response = await fetchWithAuth(`/api/support/tickets/${ticketId}`, {
            method: 'PUT',
            body: JSON.stringify({
                message: messageText
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            window.showToast.success('¡Enviado!', 'Tu mensaje ha sido enviado');
            
            // Cerrar y reabrir modal con datos actualizados
            const modal = bootstrap.Modal.getInstance(document.getElementById('ticketDetailModal'));
            modal.hide();
            
            setTimeout(() => viewTicketDetail(ticketId), 300);
        } else {
            window.showToast.error('Error', data.message || 'No se pudo enviar el mensaje');
        }
    } catch (error) {
        console.error('Error:', error);
        window.showToast.error('Error', 'Error de conexión al enviar mensaje');
    }
}

// ========================================
// CERRAR TICKET
// ========================================

async function closeTicket(ticketId) {
    const confirmed = await showCustomConfirm(
        '¿Cerrar Ticket?',
        'Esta acción marcará el ticket como cerrado. Solo cierra el ticket si tu problema está completamente resuelto.',
        'Cerrar Ticket',
        'Cancelar'
    );
    
    if (!confirmed) return;
    
    try {
        window.showToast.info('Procesando', 'Cerrando ticket...');
        
        const response = await fetchWithAuth(`/api/support/tickets/${ticketId}`, {
            method: 'PUT',
            body: JSON.stringify({
                status: 'cerrado'
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            window.showToast.success('¡Cerrado!', 'El ticket ha sido cerrado exitosamente');
            
            // Cerrar modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('ticketDetailModal'));
            modal.hide();
            
            // Recargar tickets
            loadSupport();
        } else {
            window.showToast.error('Error', data.message || 'No se pudo cerrar el ticket');
        }
    } catch (error) {
        console.error('Error:', error);
        window.showToast.error('Error', 'Error de conexión al cerrar ticket');
    }
}

// ========================================
// SECCIÓN: MAPA DE ESTACIONAMIENTOS
// ========================================

let parkingMapInstance = null;

async function loadMap() {
    console.log('Cargando mapa...');
    
    const container = document.getElementById('parkingMapContainer');
    if (!container) {
        console.error('Container parkingMapContainer no encontrado');
        return;
    }
    
    // Si ya existe una instancia, no crear otra
    if (parkingMapInstance) {
        console.log('Mapa ya existe, no recrear');
        return;
    }
    
    try {
        // Inicializar el mapa
        parkingMapInstance = new ParkingMap('parkingMapContainer', {
            center: [21.8818, -102.2916],
            zoom: 13,
            apiEndpoint: '/api/parking-lots',
            autoUpdate: true,
            updateInterval: 30000,
            clustering: true
        });
        
        console.log('Mapa inicializado correctamente');
        
        // Hacer la instancia disponible globalmente
        window.parkingMapInstance = parkingMapInstance;
        
    } catch (error) {
        console.error('Error al inicializar mapa:', error);
    }
}

// Función GLOBAL para abrir modal con estacionamiento preseleccionado
window.openNewSessionModalWithParking = async function(parkingLotId) {
    console.log('Abriendo modal con estacionamiento:', parkingLotId);
    
    try {
        // Cargar todos los estacionamientos
        const response = await fetchWithAuth('/api/parking/lots');
        const data = await response.json();
        
        if (data.success) {
            const select = document.getElementById('parkingLotSelect');
            
            // Llenar el select con todos los estacionamientos
            select.innerHTML = data.data.map(lot => 
                `<option value="${lot._id}" ${lot._id === parkingLotId ? 'selected' : ''}>
                    ${lot.nombre} - ${lot.ubicacion}
                </option>`
            ).join('');
            
            // Cambiar a la sección de sesiones
            const sessionsLink = document.querySelector('.sidebar-link[data-section="sessions"]');
            if (sessionsLink) {
                sessionsLink.click();
            }
            
            // Abrir el modal
            const modal = new bootstrap.Modal(document.getElementById('newSessionModal'));
            modal.show();
            
            console.log('Modal abierto con estacionamiento seleccionado');
            
            // Opcional: Mostrar un toast de confirmación
            if (window.showToast) {
                const selectedLot = data.data.find(l => l._id === parkingLotId);
                if (selectedLot) {
                    window.showToast.success(
                        'Estacionamiento seleccionado',
                        `${selectedLot.nombre}`
                    );
                }
            }
        }
    } catch (error) {
        console.error('Error al abrir modal:', error);
        if (window.showToast) {
            window.showToast.error('Error', 'No se pudo abrir el formulario de nueva estancia');
        }
    }
};

// Función original (mantener para compatibilidad)
async function openNewSessionModalWithParking(parkingLotId) {
    window.openNewSessionModalWithParking(parkingLotId);
}

// ========================================
// DETALLES DE PAGO
// ========================================

async function viewPaymentDetail(paymentId) {
    try {
        const response = await fetchWithAuth(`/api/payments/${paymentId}`);
        const data = await response.json();
        
        if (data.success) {
            const payment = data.data;
            
            const modalHtml = `
                <div class="modal fade" id="paymentDetailModal" tabindex="-1">
                    <div class="modal-dialog modal-lg modal-dialog-centered">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">
                                    <i class="fas fa-file-invoice text-primary me-2"></i>
                                    Detalles de Pago
                                </h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body">
                                <div class="row">
                                    <!-- Estado del pago -->
                                    <div class="col-12 mb-4">
                                        <div class="alert alert-${payment.status === 'exitoso' ? 'success' : 'danger'} d-flex align-items-center">
                                            <i class="fas fa-${payment.status === 'exitoso' ? 'check-circle' : 'times-circle'} me-3 fs-4"></i>
                                            <div>
                                                <strong>Estado:</strong> ${payment.status.toUpperCase()}
                                                ${payment.status === 'exitoso' ? '<br><small>Pago procesado exitosamente</small>' : ''}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <!-- Información de transacción -->
                                    <div class="col-md-6 mb-3">
                                        <label class="form-label text-muted">ID de Transacción</label>
                                        <div class="form-control-static">
                                            <code class="text-primary">${payment.transactionId}</code>
                                        </div>
                                    </div>
                                    
                                    <div class="col-md-6 mb-3">
                                        <label class="form-label text-muted">Fecha y Hora</label>
                                        <div class="form-control-static">
                                            <i class="fas fa-calendar-alt me-2"></i>
                                            ${formatDate(payment.timestamp)}
                                        </div>
                                    </div>
                                    
                                    <!-- Método de pago -->
                                    <div class="col-md-6 mb-3">
                                        <label class="form-label text-muted">Método de Pago</label>
                                        <div class="form-control-static">
                                            <i class="fas fa-${getPaymentMethodIcon(payment.paymentMethod)} me-2"></i>
                                            <strong>${payment.paymentMethod.toUpperCase()}</strong>
                                        </div>
                                    </div>
                                    
                                    <div class="col-md-6 mb-3">
                                        <label class="form-label text-muted">Proveedor</label>
                                        <div class="form-control-static">
                                            ${payment.provider || 'N/A'}
                                        </div>
                                    </div>
                                    
                                    <!-- Desglose financiero -->
                                    <div class="col-12 mt-3">
                                        <div class="card bg-dark-light p-3">
                                            <h6 class="mb-3">Desglose Financiero</h6>
                                            <div class="d-flex justify-content-between mb-2">
                                                <span>Subtotal</span>
                                                <strong>${formatCurrency(payment.subtotal)}</strong>
                                            </div>
                                            <div class="d-flex justify-content-between mb-2">
                                                <span>IVA (16%)</span>
                                                <strong>${formatCurrency(payment.taxes.iva)}</strong>
                                            </div>
                                            ${payment.taxes.retencionIva > 0 ? `
                                                <div class="d-flex justify-content-between mb-2">
                                                    <span>Retención IVA</span>
                                                    <strong>-${formatCurrency(payment.taxes.retencionIva)}</strong>
                                                </div>
                                            ` : ''}
                                            ${payment.taxes.retencionIsr > 0 ? `
                                                <div class="d-flex justify-content-between mb-2">
                                                    <span>Retención ISR</span>
                                                    <strong>-${formatCurrency(payment.taxes.retencionIsr)}</strong>
                                                </div>
                                            ` : ''}
                                            <hr class="my-2">
                                            <div class="d-flex justify-content-between">
                                                <span class="fs-5"><strong>Total</strong></span>
                                                <span class="fs-5 text-primary"><strong>${formatCurrency(payment.amount)}</strong></span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="modal-footer">
                                <button class="btn btn-ocelon" onclick="downloadPaymentReceipt('${payment._id}')">
                                    <i class="fas fa-download me-2"></i>
                                    Descargar Comprobante
                                </button>
                                <button class="btn btn-outline-ocelon" data-bs-dismiss="modal">Cerrar</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            const oldModal = document.getElementById('paymentDetailModal');
            if (oldModal) oldModal.remove();
            
            document.body.insertAdjacentHTML('beforeend', modalHtml);
            const modal = new bootstrap.Modal(document.getElementById('paymentDetailModal'));
            modal.show();
        } else {
            window.showToast.error('Error', data.message || 'No se pudo cargar el pago');
        }
    } catch (error) {
        console.error('Error:', error);
        window.showToast.error('Error', 'Error al cargar detalles del pago');
    }
}

async function downloadPaymentReceipt(paymentId) {
try {
window.showToast.info('Generando', 'Preparando comprobante...');
const response = await fetchWithAuth(`/api/payments/${paymentId}`);
    const data = await response.json();
    
    if (data.success) {
        const payment = data.data;
        
        const receiptHtml = `
            <!DOCTYPE html>
            <html lang="es">
            <head>
                <meta charset="UTF-8">
                <title>Comprobante - ${payment.transactionId}</title>
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body { 
                        font-family: Arial, sans-serif; 
                        padding: 40px; 
                        max-width: 800px; 
                        margin: 0 auto;
                        background: white;
                        color: black;
                    }
                    .header { 
                        text-align: center; 
                        margin-bottom: 40px; 
                        padding-bottom: 20px;
                        border-bottom: 3px solid #10b981;
                    }
                    .logo { 
                        font-size: 32px; 
                        font-weight: bold; 
                        color: #10b981;
                        margin-bottom: 10px;
                    }
                    .logo img {
                        width: 70px;   /* Ajusta el tamaño que necesites */
                        height: auto;
                    }
                    .company-info { font-size: 14px; color: #666; }
                    .title { 
                        font-size: 24px; 
                        font-weight: bold; 
                        margin: 30px 0;
                        color: #333;
                    }
                    .section { 
                        margin: 25px 0; 
                        padding: 20px;
                        background: #f8f9fa;
                        border-radius: 8px;
                    }
                    .section-title { 
                        font-weight: bold; 
                        margin-bottom: 15px;
                        color: #10b981;
                        font-size: 16px;
                    }
                    .info-row { 
                        display: flex; 
                        justify-content: space-between; 
                        padding: 8px 0;
                        border-bottom: 1px solid #e0e0e0;
                    }
                    .info-row:last-child { border-bottom: none; }
                    .label { font-weight: 600; color: #666; }
                    .value { color: #333; }
                    .total-section {
                        background: #10b981;
                        color: white;
                        padding: 20px;
                        border-radius: 8px;
                        margin-top: 30px;
                    }
                    .total-row {
                        display: flex;
                        justify-content: space-between;
                        padding: 8px 0;
                    }
                    .total-amount {
                        font-size: 32px;
                        font-weight: bold;
                        text-align: right;
                    }
                    .footer {
                        text-align: center;
                        margin-top: 50px;
                        padding-top: 20px;
                        border-top: 2px solid #e0e0e0;
                        font-size: 12px;
                        color: #999;
                    }
                    .status-badge {
                        display: inline-block;
                        padding: 5px 15px;
                        background: ${payment.status === 'exitoso' ? '#10b981' : '#ef4444'};
                        color: white;
                        border-radius: 20px;
                        font-size: 14px;
                        font-weight: bold;
                    }
                    @media print {
                        body { padding: 20px; }
                        .no-print { display: none; }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="logo">
                        <img src="/images/Logo.jpg" alt="Ocelon Logo">
                    </div>

                    <div class="company-info">
                        Sistema de Gestión de Estacionamientos<br>
                        RFC: OCL123456789<br>
                        www.ocelon.com | soporte@ocelon.com
                    </div>
                </div>
                
                <div class="title">COMPROBANTE DE PAGO</div>
                
                <div class="section">
                    <div class="section-title">Información de Transacción</div>
                    <div class="info-row">
                        <span class="label">ID de Transacción:</span>
                        <span class="value"><strong>${payment.transactionId}</strong></span>
                    </div>
                    <div class="info-row">
                        <span class="label">Fecha y Hora:</span>
                        <span class="value">${formatDate(payment.timestamp)}</span>
                    </div>
                    <div class="info-row">
                        <span class="label">Estado:</span>
                        <span class="value"><span class="status-badge">${payment.status.toUpperCase()}</span></span>
                    </div>
                    <div class="info-row">
                        <span class="label">Método de Pago:</span>
                        <span class="value">${payment.paymentMethod.toUpperCase()}</span>
                    </div>
                    <div class="info-row">
                        <span class="label">Proveedor:</span>
                        <span class="value">${payment.provider || 'N/A'}</span>
                    </div>
                </div>
                
                <div class="section">
                    <div class="section-title">Desglose de Pago</div>
                    <div class="info-row">
                        <span class="label">Subtotal:</span>
                        <span class="value">${formatCurrency(payment.subtotal)}</span>
                    </div>
                    <div class="info-row">
                        <span class="label">IVA (16%):</span>
                        <span class="value">${formatCurrency(payment.taxes.iva)}</span>
                    </div>
                    ${payment.taxes.retencionIva > 0 ? `
                        <div class="info-row">
                            <span class="label">Retención IVA:</span>
                            <span class="value">-${formatCurrency(payment.taxes.retencionIva)}</span>
                        </div>
                    ` : ''}
                    ${payment.taxes.retencionIsr > 0 ? `
                        <div class="info-row">
                            <span class="label">Retención ISR:</span>
                            <span class="value">-${formatCurrency(payment.taxes.retencionIsr)}</span>
                        </div>
                    ` : ''}
                </div>
                
                <div class="total-section">
                    <div class="total-row">
                        <span style="font-size: 20px;">TOTAL PAGADO</span>
                        <span class="total-amount">${formatCurrency(payment.amount)}</span>
                    </div>
                </div>
                
                <div class="footer">
                    <p><strong>Este es un comprobante válido de pago</strong></p>
                    <p>Para cualquier aclaración, contacte a soporte@ocelon.com</p>
                    <p style="margin-top: 10px;">© ${new Date().getFullYear()} OCELON - Todos los derechos reservados</p>
                </div>
                
                <div class="no-print" style="text-align: center; margin-top: 30px;">
                    <button onclick="window.print()" style="padding: 15px 30px; background: #10b981; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 16px;">
                        Imprimir Comprobante
                    </button>
                </div>
            </body>
            </html>
        `;
        
        const printWindow = window.open('', '_blank');
        printWindow.document.write(receiptHtml);
        printWindow.document.close();
        
        window.showToast.success('Listo', 'Comprobante generado correctamente');
    }
} catch (error) {
    console.error('Error:', error);
    window.showToast.error('Error', 'No se pudo generar el comprobante');
}
}

// ========================================
// FUNCIONES AUXILIARES
// ========================================

async function openPaymentModal(sessionId) {
    currentSessionId = sessionId;
    
    try {
        const response = await fetchWithAuth(`/api/sessions/${sessionId}`);
        const data = await response.json();
        
        if (data.success) {
            const session = data.data;
            const duration = Math.ceil((new Date() - new Date(session.entryTime)) / (1000 * 60 * 60));
            const subtotal = duration * session.tarifaHora;
            const iva = subtotal * 0.16;
            const total = subtotal + iva;
            const currentPlan = getCurrentPlan();
            const discountInfo = applyPlanDiscount(total);
            
            let paymentDetailsHtml = `
                <div class="alert alert-info">
                    <p class="mb-2"><strong>Duración:</strong> ${duration} hora(s)</p>
                    <p class="mb-2"><strong>Tarifa:</strong> ${formatCurrency(session.tarifaHora)}/hora</p>
                    <p class="mb-2"><strong>Subtotal:</strong> ${formatCurrency(subtotal)}</p>
                    <p class="mb-2"><strong>IVA (16%):</strong> ${formatCurrency(iva)}</p>
                    ${currentPlan.discount > 0 ? `
                        <p class="mb-2" style="background: rgba(16, 185, 129, 0.1); padding: 10px; border-radius: 5px; margin: 5px 0;">
                            <strong class="text-success"><i class="fas fa-tag me-2"></i>Descuento ${currentPlan.discount}% (${Plans[currentPlan.plan].name}):</strong> 
                            <span class="text-success">-${formatCurrency(discountInfo.discount)}</span>
                        </p>
                    ` : ''}
                    <p class="mb-0"><strong class="text-primary">Total a Pagar:</strong> <span class="text-primary fs-4">${formatCurrency(discountInfo.final)}</span></p>
                </div>
            `;
            
            document.getElementById('paymentDetails').innerHTML = paymentDetailsHtml;
            
            // Limpiar formulario
            document.getElementById('paymentForm').reset();
            document.getElementById('paymentMethod').value = '';
            document.querySelectorAll('.payment-method-form').forEach(form => {
                form.style.display = 'none';
            });
            document.getElementById('saveMethodContainer').style.display = 'none';
            
            // Cargar método guardado si existe
            const savedMethod = PaymentStorage.getSavedMethod();
            if (savedMethod) {
                document.getElementById('paymentMethod').value = savedMethod.method;
                
                // Auto-rellenar campos
                if (savedMethod.method === 'tarjeta') {
                    document.getElementById('tarjetaForm').style.display = 'block';
                    document.getElementById('tarjetaNombre').value = savedMethod.data.nombre || '';
                    document.getElementById('tarjetaNumero').value = savedMethod.data.numero || '';
                    document.getElementById('tarjetaFecha').value = savedMethod.data.fecha || '';
                    document.getElementById('tarjetaCvv').value = savedMethod.data.cvv || '';
                } else if (savedMethod.method === 'wallet') {
                    document.getElementById('walletForm').style.display = 'block';
                    document.getElementById('walletEmail').value = savedMethod.data.email || '';
                    document.getElementById('walletPassword').value = '';
                    document.getElementById('walletTipo').value = savedMethod.data.tipo || 'paypal';
                } else if (savedMethod.method === 'transferencia') {
                    document.getElementById('transferenciaForm').style.display = 'block';
                    document.getElementById('transferenciaClabe').value = savedMethod.data.clabe || '';
                    document.getElementById('transferenciaBanco').value = savedMethod.data.banco || '';
                    document.getElementById('transferenciaBeneficiario').value = savedMethod.data.beneficiario || '';
                }
                document.getElementById('saveMethodContainer').style.display = 'block';
            }
            
            new bootstrap.Modal(document.getElementById('paymentModal')).show();
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

document.getElementById('confirmPaymentBtn')?.addEventListener('click', async () => {
    try {
        const method = document.getElementById('paymentMethod').value;
        
        if (!method) {
            window.showToast.warning('Método requerido', 'Por favor selecciona un método de pago');
            return;
        }
        
        let isValid = false;
        let paymentData = {
            sessionId: currentSessionId,
            paymentMethod: method
        };
        
        // Validar según el método seleccionado
        if (method === 'tarjeta') {
            isValid = PaymentValidations.validarTarjeta();
            if (isValid) {
                paymentData.paymentDetails = {
                    nombre: document.getElementById('tarjetaNombre').value,
                    numero: document.getElementById('tarjetaNumero').value.replace(/\s/g, ''),
                    fecha: document.getElementById('tarjetaFecha').value,
                    cvv: document.getElementById('tarjetaCvv').value
                };
            }
        } else if (method === 'wallet') {
            isValid = PaymentValidations.validarWallet();
            if (isValid) {
                paymentData.paymentDetails = {
                    email: document.getElementById('walletEmail').value,
                    tipo: document.getElementById('walletTipo').value
                };
            }
        } else if (method === 'transferencia') {
            isValid = PaymentValidations.validarTransferencia();
            if (isValid) {
                paymentData.paymentDetails = {
                    clabe: document.getElementById('transferenciaClabe').value.replace(/\s/g, ''),
                    banco: document.getElementById('transferenciaBanco').value,
                    beneficiario: document.getElementById('transferenciaBeneficiario').value
                };
            }
        }
        
        if (!isValid) {
            return;
        }
        
        // Guardar método si está marcado
        if (document.getElementById('guardarMetodo').checked) {
            PaymentStorage.saveMethod(method, paymentData.paymentDetails);
        }
        
        // Procesar pago
        const response = await fetchWithAuth('/api/payments/process', {
            method: 'POST',
            body: JSON.stringify(paymentData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            bootstrap.Modal.getInstance(document.getElementById('paymentModal')).hide();
            window.showToast.success('¡Pago exitoso!', 'Tu transacción se ha procesado correctamente');
            loadSessions();
            loadOverview();
        } else {
            window.showToast.error('Error en el pago', result.message || 'No se pudo procesar el pago');
        }
    } catch (error) {
        console.error('Error:', error);
        window.showToast.error('Error', 'Hubo un problema al procesar el pago');
    }
});

async function validateExit(sessionId) {
    if (!confirm('¿Confirmar salida del estacionamiento?')) return;
    
    try {
        const response = await fetchWithAuth(`/api/sessions/${sessionId}/validate`, {
            method: 'POST'
        });
        
        if ((await response.json()).success) {
            window.showToast.success('Salida validada. Puede proceder a la salida del estacionamiento.');
            // Decrementar badge (mínimo 0)
            const badge = document.getElementById('activeSessionsBadge');
            badge.textContent = Math.max(0, parseInt(badge.textContent) - 1);
            loadSessions();
            loadOverview();
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

function viewSession(sessionId) {
    alert('Ver detalles de sesión: ' + sessionId);
}

function viewPayment(paymentId) {
    alert('Ver detalles de pago: ' + paymentId);
}

// ========================================
// FILTROS Y BÚSQUEDA
// ========================================

// Búsqueda en sesiones
document.getElementById('searchSessions')?.addEventListener('input', function(e) {
    const search = e.target.value.toLowerCase();
    const rows = document.querySelectorAll('#sessionsTable tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(search) ? '' : 'none';
    });
});

// Filtro por estado
document.getElementById('filterStatus')?.addEventListener('change', function(e) {
    const status = e.target.value;
    const rows = document.querySelectorAll('#sessionsTable tr');
    
    rows.forEach(row => {
        if (!status || row.textContent.includes(status)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
});

// Búsqueda en pagos
document.getElementById('searchPayments')?.addEventListener('input', function(e) {
    const search = e.target.value.toLowerCase();
    const rows = document.querySelectorAll('#paymentsTable tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(search) ? '' : 'none';
    });
});

function updateSessionsChart(sessionsByDay) {
    console.log("sessionsByDay recibido:", sessionsByDay);

    if (!charts.sessions) {
        console.warn("charts.sessions no inicializado");
        return;
    }

    if (!Array.isArray(sessionsByDay) || sessionsByDay.length === 0) {
        console.warn("No hay datos válidos para sessionsChart");
        charts.sessions.data.labels = [];
        charts.sessions.data.datasets[0].data = [];
        charts.sessions.update();
        return;
    }

    charts.sessions.data.labels = sessionsByDay.map(item => item._id);
    charts.sessions.data.datasets[0].data = sessionsByDay.map(item => item.count);
    charts.sessions.update();
}

function updateDistributionChart(sessionsByStatus) {
    if (!charts.distribution) return;
    if (!Array.isArray(sessionsByStatus) || sessionsByStatus.length === 0) {
        charts.distribution.data.labels = [];
        charts.distribution.data.datasets[0].data = [];
        charts.distribution.update();
        return;
    }

    charts.distribution.data.labels = sessionsByStatus.map(item => item._id);
    charts.distribution.data.datasets[0].data = sessionsByStatus.map(item => item.count);
    charts.distribution.update();
}

function updateSpendingChart(spendingByMonth) {
    if (!charts.spending) return;
    if (!Array.isArray(spendingByMonth) || spendingByMonth.length === 0) {
        charts.spending.data.labels = [];
        charts.spending.data.datasets[0].data = [];
        charts.spending.update();
        return;
    }

    charts.spending.data.labels = spendingByMonth.map(item => item._id);
    charts.spending.data.datasets[0].data = spendingByMonth.map(item => item.total);
    charts.spending.update();
}

function updateParkingUsageChart(parkingUsage) {
    if (!charts.parkingUsage) return;
    if (!Array.isArray(parkingUsage) || parkingUsage.length === 0) {
        charts.parkingUsage.data.labels = [];
        charts.parkingUsage.data.datasets[0].data = [];
        charts.parkingUsage.update();
        return;
    }

    charts.parkingUsage.data.labels = parkingUsage.map(item => item._id);
    charts.parkingUsage.data.datasets[0].data = parkingUsage.map(item => item.count);
    charts.parkingUsage.update();
}

// ========================================
// MODAL DE DETALLES DE SESIÓN
// ========================================

async function viewSessionDetail(sessionId) {
    try {
        const response = await fetchWithAuth(`/api/sessions/${sessionId}`);
        const data = await response.json();
        
        if (data.success) {
            const session = data.data;
            
            // Calcular duración y costos
            const entryTime = new Date(session.entryTime);
            const exitTime = session.exitTime ? new Date(session.exitTime) : new Date();
            const duration = Math.ceil((exitTime - entryTime) / (1000 * 60 * 60));
            
            const hourlyRate = session.parkingLot?.hourlyRate || session.parkingLot?.tarifaHora || 0;
            const subtotal = duration * hourlyRate;
            const iva = subtotal * 0.16;
            const total = subtotal + iva;
            
            // Crear modal dinámico
            const modalHtml = `
                <div class="modal fade" id="sessionDetailModal" tabindex="-1">
                    <div class="modal-dialog modal-lg modal-dialog-centered">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">
                                    <i class="fas fa-parking text-primary me-2"></i>
                                    Detalles de la Estancia
                                </h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body">
                                <div class="row">
                                    <!-- Estado -->
                                    <div class="col-12 mb-4">
                                        <div class="alert alert-${getStatusColor(session.status)} d-flex align-items-center">
                                            <i class="fas fa-info-circle me-3 fs-4"></i>
                                            <div>
                                                <strong>Estado:</strong> ${session.status.toUpperCase()}
                                                ${session.status === 'activa' ? '<br><small>Esta estancia está actualmente en uso</small>' : ''}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <!-- Información del vehículo -->
                                    <div class="col-md-6 mb-3">
                                        <label class="form-label text-muted">Placas del Vehículo</label>
                                        <div class="form-control-static">
                                            <strong>${session.vehiclePlates || 'N/A'}</strong>
                                        </div>
                                    </div>
                                    
                                    <!-- Código QR -->
                                    <div class="col-md-6 mb-3">
                                        <label class="form-label text-muted">Código QR</label>
                                        <div class="form-control-static">
                                            <code class="text-primary">${session.qrCode}</code>
                                        </div>
                                    </div>
                                    
                                    <!-- Estacionamiento -->
                                    <div class="col-12 mb-3">
                                        <label class="form-label text-muted">Estacionamiento</label>
                                        <div class="card bg-dark-light p-3">
                                            <h6 class="mb-2">${session.parkingLot?.name || session.parkingLot?.nombre || 'N/A'}</h6>
                                            <small class="text-muted">
                                                <i class="fas fa-map-marker-alt me-2"></i>
                                                ${session.parkingLot?.address || session.parkingLot?.ubicacion || 'Sin dirección'}
                                            </small>
                                        </div>
                                    </div>
                                    
                                    <!-- Horarios -->
                                    <div class="col-md-6 mb-3">
                                        <label class="form-label text-muted">Hora de Entrada</label>
                                        <div class="form-control-static">
                                            <i class="fas fa-sign-in-alt text-success me-2"></i>
                                            ${formatDate(session.entryTime)}
                                        </div>
                                    </div>
                                    
                                    <div class="col-md-6 mb-3">
                                        <label class="form-label text-muted">Hora de Salida</label>
                                        <div class="form-control-static">
                                            ${session.exitTime ? 
                                                `<i class="fas fa-sign-out-alt text-danger me-2"></i>${formatDate(session.exitTime)}` : 
                                                '<span class="badge badge-warning">Aún en estacionamiento</span>'
                                            }
                                        </div>
                                    </div>
                                    
                                    <!-- Duración -->
                                    <div class="col-md-6 mb-3">
                                        <label class="form-label text-muted">Duración</label>
                                        <div class="form-control-static">
                                            <strong class="text-primary">${duration} hora(s)</strong>
                                        </div>
                                    </div>
                                    
                                    <!-- Tarifa por hora -->
                                    <div class="col-md-6 mb-3">
                                        <label class="form-label text-muted">Tarifa por Hora</label>
                                        <div class="form-control-static">
                                            ${formatCurrency(hourlyRate)}
                                        </div>
                                    </div>
                                    
                                    <!-- Desglose de costos -->
                                    <div class="col-12 mt-3">
                                        <div class="card bg-dark-light p-3">
                                            <h6 class="mb-3">Desglose de Costos</h6>
                                            <div class="d-flex justify-content-between mb-2">
                                                <span>Subtotal (${duration}h × ${formatCurrency(hourlyRate)})</span>
                                                <strong>${formatCurrency(subtotal)}</strong>
                                            </div>
                                            <div class="d-flex justify-content-between mb-2">
                                                <span>IVA (16%)</span>
                                                <strong>${formatCurrency(iva)}</strong>
                                            </div>
                                            ${(() => {
                                                const currentPlan = getCurrentPlan();
                                                if (currentPlan.discount > 0) {
                                                    const discountInfo = applyPlanDiscount(total);
                                                    return `
                                                        <div style="background: rgba(16, 185, 129, 0.1); padding: 10px; border-radius: 5px; margin: 10px 0;">
                                                            <div class="d-flex justify-content-between mb-2">
                                                                <span class="text-success"><i class="fas fa-tag me-2"></i>Descuento ${currentPlan.discount}% (${Plans[currentPlan.plan].name})</span>
                                                                <strong class="text-success">-${formatCurrency(discountInfo.discount)}</strong>
                                                            </div>
                                                        </div>
                                                    `;
                                                }
                                                return '';
                                            })()}
                                            <hr class="my-2">
                                            <div class="d-flex justify-content-between">
                                                <span class="fs-5"><strong>Total</strong></span>
                                                <span class="fs-5 text-primary"><strong>${formatCurrency((() => {
                                                    const currentPlan = getCurrentPlan();
                                                    if (currentPlan.discount > 0) {
                                                        return applyPlanDiscount(total).final;
                                                    }
                                                    return total;
                                                })())}</strong></span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="modal-footer">
                                ${session.status === 'activa' ? `
                                    <button class="btn btn-ocelon" onclick="openPaymentModalFromDetail('${session._id}')">
                                        <i class="fas fa-credit-card me-2"></i>
                                        Proceder al Pago
                                    </button>
                                ` : ''}
                                ${session.status === 'finalizada' ? `
                                    <button class="btn btn-ocelon" onclick="downloadTicket('${session._id}')">
                                        <i class="fas fa-download me-2"></i>
                                        Descargar Ticket
                                    </button>
                                ` : ''}
                                <button class="btn btn-outline-ocelon" data-bs-dismiss="modal">Cerrar</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            // Remover modal anterior si existe
            const oldModal = document.getElementById('sessionDetailModal');
            if (oldModal) oldModal.remove();
            
            // Insertar y mostrar nuevo modal
            document.body.insertAdjacentHTML('beforeend', modalHtml);
            const modal = new bootstrap.Modal(document.getElementById('sessionDetailModal'));
            modal.show();
            
        } else {
            window.showToast.error('Error', data.message || 'No se pudo cargar la sesión');
        }
    } catch (error) {
        console.error('Error:', error);
        window.showToast.error('Error', 'Error al cargar detalles de la sesión');
    }
}

function openPaymentModalFromDetail(sessionId) {
    // Cerrar modal de detalles
    const detailModal = bootstrap.Modal.getInstance(document.getElementById('sessionDetailModal'));
    if (detailModal) detailModal.hide();
    
    // Abrir modal de pago
    setTimeout(() => openPaymentModal(sessionId), 300);
}

// ========================================
// DESCARGAR TICKET
// ========================================

async function downloadTicket(sessionId) {
    try {
        window.showToast.info('Generando', 'Preparando tu ticket...');
        
        const response = await fetchWithAuth(`/api/sessions/${sessionId}`);
        const data = await response.json();
        
        if (data.success) {
            const session = data.data;
            
            // Calcular datos
            const entryTime = new Date(session.entryTime);
            const exitTime = session.exitTime ? new Date(session.exitTime) : new Date();
            const duration = Math.ceil((exitTime - entryTime) / (1000 * 60 * 60));
            const hourlyRate = session.parkingLot?.hourlyRate || session.parkingLot?.tarifaHora || 0;
            const subtotal = duration * hourlyRate;
            const iva = subtotal * 0.16;
            const total = subtotal + iva;
            
            // Crear contenido HTML del ticket
            const ticketHtml = `
                <!DOCTYPE html>
                <html lang="es">
                <head>
                    <meta charset="UTF-8">
                    <title>Ticket - ${session.qrCode}</title>
                    <style>
                        * { margin: 0; padding: 0; box-sizing: border-box; }
                        body { 
                            font-family: 'Courier New', monospace; 
                            padding: 20px; 
                            max-width: 400px; 
                            margin: 0 auto;
                            background: white;
                            color: black;
                        }
                        .header { text-align: center; margin-bottom: 20px; border-bottom: 2px dashed #000; padding-bottom: 15px; }
                        .logo { font-size: 24px; font-weight: bold; color: #10b981; }
                        .logo img { width: 50px;   /* Ajusta el tamaño que necesites */
                        height: auto; }
                        .section { margin: 15px 0; }
                        .label { font-weight: bold; display: inline-block; width: 140px; }
                        .divider { border-top: 1px dashed #999; margin: 15px 0; }
                        .total { font-size: 18px; font-weight: bold; text-align: right; margin-top: 15px; }
                        .footer { text-align: center; margin-top: 20px; font-size: 12px; border-top: 2px dashed #000; padding-top: 15px; }
                        .qr { text-align: center; margin: 15px 0; font-size: 12px; background: #f0f0f0; padding: 10px; }
                        @media print {
                            body { padding: 0; }
                            .no-print { display: none; }
                        }
                    </style>
                </head>
                <body>
                    <div class="header">
                    <div class="logo">
                        <img src="/images/Logo.jpg" alt="Ocelon Logo">
                    </div>
                        <div>Sistema de Estacionamiento</div>
                        <div style="font-size: 12px; margin-top: 5px;">Ticket de Estancia</div>
                    </div>
                    
                    <div class="section">
                        <div><span class="label">Código QR:</span> ${session.qrCode}</div>
                        <div><span class="label">Placas:</span> ${session.vehiclePlates || 'N/A'}</div>
                    </div>
                    
                    <div class="divider"></div>
                    
                    <div class="section">
                        <div><strong>Estacionamiento:</strong></div>
                        <div>${session.parkingLot?.name || session.parkingLot?.nombre}</div>
                        <div style="font-size: 12px; color: #666;">${session.parkingLot?.address || session.parkingLot?.ubicacion}</div>
                    </div>
                    
                    <div class="divider"></div>
                    
                    <div class="section">
                        <div><span class="label">Entrada:</span> ${formatDate(entryTime)}</div>
                        <div><span class="label">Salida:</span> ${session.exitTime ? formatDate(exitTime) : 'En estacionamiento'}</div>
                        <div><span class="label">Duración:</span> ${duration} hora(s)</div>
                    </div>
                    
                    <div class="divider"></div>
                    
                    <div class="section">
                        <div><span class="label">Tarifa/hora:</span> ${formatCurrency(hourlyRate)}</div>
                        <div><span class="label">Subtotal:</span> ${formatCurrency(subtotal)}</div>
                        <div><span class="label">IVA (16%):</span> ${formatCurrency(iva)}</div>
                    </div>
                    
                    <div class="total">
                        TOTAL: ${formatCurrency(total)}
                    </div>
                    
                    <div class="divider"></div>
                    
                    <div class="qr">
                        <strong>Código de Verificación</strong><br>
                        ${session.qrCode}
                    </div>
                    
                    <div class="footer">
                        <div><strong>Estado:</strong> ${session.status.toUpperCase()}</div>
                        <div style="margin-top: 10px;">Gracias por usar OCELON</div>
                        <div style="font-size: 10px; margin-top: 5px;">www.ocelon.com | soporte@ocelon.com</div>
                    </div>
                    
                    <div class="no-print" style="text-align: center; margin-top: 20px;">
                        <button onclick="window.print()" style="padding: 10px 20px; background: #10b981; color: white; border: none; border-radius: 5px; cursor: pointer;">
                            Imprimir Ticket
                        </button>
                    </div>
                </body>
                </html>
            `;
            
            // Abrir en nueva ventana
            const printWindow = window.open('', '_blank');
            printWindow.document.write(ticketHtml);
            printWindow.document.close();
            
            window.showToast.success('Listo', 'Ticket generado correctamente');
        }
    } catch (error) {
        console.error('Error:', error);
        window.showToast.error('Error', 'No se pudo generar el ticket');
    }
}

// ========================================
// VALIDAR SALIDA MEJORADA
// ========================================

async function validateExit(sessionId) {
    // Mostrar confirmación personalizada
    const confirmed = await showCustomConfirm(
        '¿Validar Salida?',
        'Esta acción marcará la estancia como finalizada. Asegúrate de que el vehículo esté saliendo del estacionamiento.',
        'Validar Salida',
        'Cancelar'
    );
    
    if (!confirmed) return;
    
    try {
        window.showToast.info('Procesando', 'Validando salida...');
        
        const response = await fetchWithAuth(`/api/sessions/${sessionId}/validate`, {
            method: 'POST'
        });
        
        const result = await response.json();
        
        if (result.success) {
            window.showToast.success('¡Éxito!', 'Salida validada correctamente. Puede proceder.');
            
            // Actualizar badge
            const badge = document.getElementById('activeSessionsBadge');
            badge.textContent = Math.max(0, parseInt(badge.textContent) - 1);
            
            // Recargar sesiones
            loadSessions();
            loadOverview();
        } else {
            window.showToast.error('Error', result.message || 'No se pudo validar la salida');
        }
    } catch (error) {
        console.error('Error:', error);
        window.showToast.error('Error', 'Error de conexión al validar salida');
    }
}

// ========================================
// CONFIRMACIÓN PERSONALIZADA
// ========================================

function showCustomConfirm(title, message, confirmText, cancelText) {
    return new Promise((resolve) => {
        const modalHtml = `
            <div class="modal fade" id="customConfirmModal" tabindex="-1">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">${title}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <p>${message}</p>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-outline-ocelon" data-bs-dismiss="modal" id="confirmCancel">${cancelText}</button>
                            <button type="button" class="btn btn-ocelon" id="confirmOk">${confirmText}</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        const oldModal = document.getElementById('customConfirmModal');
        if (oldModal) oldModal.remove();
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        const modal = new bootstrap.Modal(document.getElementById('customConfirmModal'));
        
        document.getElementById('confirmOk').addEventListener('click', () => {
            modal.hide();
            resolve(true);
        });
        
        document.getElementById('confirmCancel').addEventListener('click', () => {
            modal.hide();
            resolve(false);
        });
        
        modal.show();
    });
}

// ========================================
// INICIALIZACIÓN
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    createSessionsChart(); // ← crea charts.sessions
    createDistributionChart(); // ← crea charts.distribution
    createSpendingChart();
    createParkingUsageChart();

    loadUserPlanFromServer(); // Cargar plan desde el servidor
    loadOverview(); // ← ahora sí puedes actualizarlas
    loadPromotions(); // Cargar promociones al iniciar
    
    console.log('%cOcelon Dashboard', 'color: #10b981; font-size: 20px; font-weight: bold;');
    console.log('%cLoaded successfully', 'color: #6366f1; font-size: 12px;');
}); 