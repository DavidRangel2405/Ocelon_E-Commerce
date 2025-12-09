// ========================================
// OCELON - Detalle de Sesión
// ========================================

const token = localStorage.getItem('token');
const userRole = localStorage.getItem('userRole');

if (!token) {
    window.location.href = '/login.html';
}

let sessionData = null;
let updateInterval = null;

// Obtener ID de la sesión desde la URL
const urlParams = new URLSearchParams(window.location.search);
const sessionId = urlParams.get('id');

if (!sessionId) {
    showToast.error('Error', 'ID de sesión no proporcionado');
    setTimeout(() => window.location.href = '/dashboard.html', 2000);
}

// ========================================
// CARGAR DATOS DE LA SESIÓN
// ========================================

async function loadSessionDetail() {
    try {
        const response = await fetch(`/api/sessions/${sessionId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const result = await response.json();

        if (result.success) {
            sessionData = result.data;
            renderSessionDetail(sessionData);
            loadPayments();
            
            // Actualizar cada 30 segundos si está activa
            if (sessionData.status === 'activa' || sessionData.status === 'pagada') {
                updateInterval = setInterval(updateDuration, 30000);
            }
        } else {
            showToast.error('Error', 'No se pudo cargar la sesión');
            setTimeout(() => window.location.href = '/dashboard.html', 2000);
        }
    } catch (error) {
        console.error('Error:', error);
        showToast.error('Error', 'Error de conexión');
    }
}

function renderSessionDetail(session) {
    // Ocultar loading
    document.getElementById('sessionLoading').style.display = 'none';
    document.getElementById('sessionContent').style.display = 'block';

    // Estado
    const statusBadge = document.getElementById('sessionStatus');
    statusBadge.textContent = session.status.toUpperCase();
    statusBadge.className = `badge ${getStatusClass(session.status)}`;

    // Información básica
    document.getElementById('vehiclePlates').textContent = session.vehiclePlates || 'N/A';
    document.getElementById('userName').textContent = session.userName || 'Usuario desconocido';
    document.getElementById('userEmail').textContent = session.userEmail || 'Sin email';

    // Estacionamiento
    const parkingName = session.parkingLot?.name || session.parkingLot?.nombre || 'Estacionamiento no disponible';
    const parkingAddress = session.parkingLot?.address || session.parkingLot?.ubicacion || 'Sin dirección';
    document.getElementById('parkingName').textContent = parkingName;
    document.getElementById('parkingAddress').textContent = parkingAddress;

    // Tarifa
    const hourlyRate = session.tarifaHora || session.parkingLot?.tarifaHora || session.parkingLot?.hourlyRate || 0;
    document.getElementById('hourlyRate').textContent = formatCurrency(hourlyRate);

    // Tiempos
    document.getElementById('entryTime').textContent = formatDateTime(session.entryTime);
    
    if (session.exitTime) {
        document.getElementById('exitTime').textContent = formatDateTime(session.exitTime);
    } else {
        document.getElementById('exitTime').textContent = 'Aún en estacionamiento';
    }

    // Duración y costos
    updateDuration();

    // QR Code
    generateQRCode(session.qrCode);
    document.getElementById('qrCodeText').textContent = session.qrCode;

    // Mostrar/ocultar botones según estado
    if (userRole === 'admin') {
        if (session.status === 'pagada') {
            document.getElementById('btnValidateExit').style.display = 'block';
        }
        if (session.status === 'activa') {
            document.getElementById('btnCancelSession').style.display = 'block';
        }
    }
}

function updateDuration() {
    if (!sessionData) return;

    const entryTime = new Date(sessionData.entryTime);
    const exitTime = sessionData.exitTime ? new Date(sessionData.exitTime) : new Date();
    
    const diff = exitTime - entryTime;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    document.getElementById('duration').textContent = `${hours}h ${minutes}m`;

    // Calcular costos
    const hourlyRate = sessionData.tarifaHora || sessionData.parkingLot?.tarifaHora || sessionData.parkingLot?.hourlyRate || 0;
    const totalHours = hours + (minutes / 60);
    const subtotal = Math.ceil(totalHours) * hourlyRate; // Redondear hacia arriba
    const iva = subtotal * 0.16;
    const total = subtotal + iva;

    document.getElementById('subtotal').textContent = formatCurrency(subtotal);
    document.getElementById('iva').textContent = formatCurrency(iva);
    document.getElementById('total').textContent = formatCurrency(total);

    // Ocultar nota de estimación si ya está finalizada
    if (sessionData.status === 'finalizada') {
        document.getElementById('estimatedNote').style.display = 'none';
    }
}

// ========================================
// CARGAR PAGOS
// ========================================

async function loadPayments() {
    try {
        const response = await fetch(`/api/payments?sessionId=${sessionId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const result = await response.json();

        document.getElementById('paymentsLoading').style.display = 'none';
        document.getElementById('paymentsContent').style.display = 'block';

        if (result.success && result.data.length > 0) {
            renderPayments(result.data);
        }
    } catch (error) {
        console.error('Error cargando pagos:', error);
    }
}

function renderPayments(payments) {
    const tbody = document.getElementById('paymentsTableBody');
    
    tbody.innerHTML = payments.map(payment => `
        <tr>
            <td>${formatDateTime(payment.timestamp)}</td>
            <td>
                <i class="fas fa-${getPaymentIcon(payment.paymentMethod)} me-2"></i>
                ${payment.paymentMethod}
            </td>
            <td class="fw-bold">${formatCurrency(payment.amount)}</td>
            <td>
                <span class="badge ${payment.status === 'exitoso' ? 'bg-success' : 'bg-danger'}">
                    ${payment.status}
                </span>
            </td>
        </tr>
    `).join('');
}

// ========================================
// GENERAR QR CODE
// ========================================

function generateQRCode(qrText) {
    const container = document.getElementById('qrCodeContainer');
    container.innerHTML = '';
    
    new QRCode(container, {
        text: qrText,
        width: 200,
        height: 200,
        colorDark: '#0f172a',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.H
    });
}

// ========================================
// ACCIONES
// ========================================

document.getElementById('btnPrintTicket').addEventListener('click', () => {
    window.print();
});

document.getElementById('btnValidateExit').addEventListener('click', async () => {
    if (!confirm('¿Validar la salida de este vehículo?')) return;

    try {
        const response = await fetch(`/api/sessions/${sessionId}/validate`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const result = await response.json();

        if (result.success) {
            showToast.success('Éxito', 'Salida validada exitosamente');
            setTimeout(() => location.reload(), 1500);
        } else {
            showToast.error('Error', result.message);
        }
    } catch (error) {
        showToast.error('Error', 'Error de conexión');
    }
});

document.getElementById('btnCancelSession').addEventListener('click', async () => {
    if (!confirm('¿Cancelar esta sesión? Esta acción no se puede deshacer.')) return;

    try {
        const response = await fetch(`/api/sessions/${sessionId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const result = await response.json();

        if (result.success) {
            showToast.success('Éxito', 'Sesión cancelada');
            setTimeout(() => window.location.href = '/admin.html', 1500);
        } else {
            showToast.error('Error', result.message);
        }
    } catch (error) {
        showToast.error('Error', 'Error de conexión');
    }
});

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
    return new Date(date).toLocaleString('es-MX', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function getStatusClass(status) {
    const classes = {
        'activa': 'bg-warning',
        'pagada': 'bg-info',
        'finalizada': 'bg-success',
        'cancelada': 'bg-danger'
    };
    return classes[status] || 'bg-secondary';
}

function getPaymentIcon(method) {
    const icons = {
        'tarjeta': 'credit-card',
        'wallet': 'wallet',
        'transferencia': 'exchange-alt',
        'efectivo': 'money-bill-wave'
    };
    return icons[method] || 'dollar-sign';
}

// Limpiar intervalo al salir
window.addEventListener('beforeunload', () => {
    if (updateInterval) {
        clearInterval(updateInterval);
    }
});

// ========================================
// INICIALIZAR
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    loadSessionDetail();
});

// Estilos para impresión
const style = document.createElement('style');
style.textContent = `
    @media print {
        .navbar, #actionsCard, .btn { display: none !important; }
        .card { page-break-inside: avoid; }
        body { background: white; }
    }
`;
document.head.appendChild(style);