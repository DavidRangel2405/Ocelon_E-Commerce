// ========================================
// OCELON - Login Script
// ========================================

// Elementos del DOM
const loginForm = document.getElementById('loginForm');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const togglePasswordBtn = document.getElementById('togglePassword');
const rememberMeCheckbox = document.getElementById('rememberMe');
const loginBtn = document.getElementById('loginBtn');
const errorMessage = document.getElementById('errorMessage');
const successMessage = document.getElementById('successMessage');
const forgotPasswordBtn = document.getElementById('forgotPasswordBtn');
const sendResetBtn = document.getElementById('sendResetBtn');
const googleLoginBtn = document.getElementById('googleLogin');
const appleLoginBtn = document.getElementById('appleLogin');

// Modal
const forgotPasswordModal = new bootstrap.Modal(document.getElementById('forgotPasswordModal'));

// ========================================
// VALIDACIONES
// ========================================

// Validar email en tiempo real
emailInput.addEventListener('input', function() {
    const email = this.value.trim();
    
    if (email === '') {
        this.classList.remove('is-valid', 'is-invalid');
        return;
    }
    
    if (validateEmail(email)) {
        this.classList.remove('is-invalid');
        this.classList.add('is-valid');
    } else {
        this.classList.remove('is-valid');
        this.classList.add('is-invalid');
    }
});

// Validar contraseña en tiempo real
passwordInput.addEventListener('input', function() {
    const password = this.value;
    
    if (password === '') {
        this.classList.remove('is-valid', 'is-invalid');
        return;
    }
    
    if (password.length >= 6) {
        this.classList.remove('is-invalid');
        this.classList.add('is-valid');
    } else {
        this.classList.remove('is-valid');
        this.classList.add('is-invalid');
    }
});

// Función de validación de email
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// ========================================
// MOSTRAR/OCULTAR CONTRASEÑA
// ========================================

if (togglePasswordBtn) {
    togglePasswordBtn.addEventListener('click', function() {
        const type = passwordInput.type === 'password' ? 'text' : 'password';
        passwordInput.type = type;
        
        const icon = this.querySelector('i');
        icon.classList.toggle('fa-eye');
        icon.classList.toggle('fa-eye-slash');
    });
}

// ========================================
// MANEJO DE MENSAJES
// ========================================

function showError(message) {
    // Sistema Toast si está disponible
    if (typeof showToast !== 'undefined') {
        showToast.error('Error', message);
    }
    
    const errorText = errorMessage.querySelector('#errorText');
    if (errorText) {
        errorText.textContent = message;
        errorMessage.style.display = 'flex';
        if (successMessage) successMessage.style.display = 'none';
        
        // Hacer scroll hasta el mensaje
        errorMessage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        
        // Ocultar después de 5 segundos
        setTimeout(() => {
            errorMessage.style.display = 'none';
        }, 5000);
    }
}

function showSuccess(message) {
    // Sistema Toast con sonido si está disponible
    if (typeof showToast !== 'undefined') {
        showToast.success('¡Éxito!', message, { sound: true });
    }
    
    const successText = successMessage.querySelector('#successText');
    if (successText) {
        successText.textContent = message;
        successMessage.style.display = 'flex';
        if (errorMessage) errorMessage.style.display = 'none';
        
        // Hacer scroll hasta el mensaje
        successMessage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

function hideMessages() {
    if (errorMessage) errorMessage.style.display = 'none';
    if (successMessage) successMessage.style.display = 'none';
}

// ========================================
// LOADING STATE
// ========================================

function setLoading(loading) {
    if (!loginBtn) return;
    
    if (loading) {
        loginBtn.classList.add('loading');
        loginBtn.disabled = true;
        loginBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Iniciando sesión...';
    } else {
        loginBtn.classList.remove('loading');
        loginBtn.disabled = false;
        loginBtn.innerHTML = '<i class="fas fa-sign-in-alt me-2"></i><span>Iniciar Sesión</span>';
    }
}

// ========================================
// RECORDARME - MEJORADO CON ENCRIPTACIÓN
// ========================================

// Función simple de encriptación (XOR con clave)
function simpleEncrypt(text, key = 'ocelon-secret-key-2024') {
    let result = '';
    for (let i = 0; i < text.length; i++) {
        result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return btoa(result); // Base64 encode
}

// Función simple de desencriptación
function simpleDecrypt(encrypted, key = 'ocelon-secret-key-2024') {
    try {
        const decoded = atob(encrypted); // Base64 decode
        let result = '';
        for (let i = 0; i < decoded.length; i++) {
            result += String.fromCharCode(decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length));
        }
        return result;
    } catch (e) {
        console.error('Error al desencriptar:', e);
        return null;
    }
}

function saveCredentials(email, password, remember) {
    if (remember) {
        // Guardar email sin encriptar (es público)
        localStorage.setItem('ocelon_remember_email', email);
        // Guardar contraseña encriptada
        localStorage.setItem('ocelon_remember_pass', simpleEncrypt(password));
        localStorage.setItem('ocelon_remember_me', 'true');
    } else {
        // Limpiar datos guardados
        clearSavedCredentials();
    }
}

function loadSavedCredentials() {
    // Primero verificar si viene de un registro exitoso
    const newUserEmail = sessionStorage.getItem('ocelon_new_user_email');
    const newUserPassword = sessionStorage.getItem('ocelon_new_user_password');
    
    if (newUserEmail && newUserPassword) {
        // Cargar credenciales del nuevo usuario
        emailInput.value = newUserEmail;
        passwordInput.value = simpleDecrypt(newUserPassword);
        emailInput.classList.add('is-valid');
        passwordInput.classList.add('is-valid');
        rememberMeCheckbox.checked = true;
        
        // Limpiar sessionStorage
        sessionStorage.removeItem('ocelon_new_user_email');
        sessionStorage.removeItem('ocelon_new_user_password');
        
        // Guardar en localStorage para futuras sesiones
        saveCredentials(emailInput.value, passwordInput.value, true);
        
        // Mostrar mensaje de bienvenida
        showSuccess('Cuenta creada exitosamente. Puedes iniciar sesión ahora.');
        
        return;
    }
    
    // Si no hay nuevo usuario, cargar credenciales guardadas
    const rememberMe = localStorage.getItem('ocelon_remember_me') === 'true';
    
    if (rememberMe) {
        const savedEmail = localStorage.getItem('ocelon_remember_email');
        const savedPassEncrypted = localStorage.getItem('ocelon_remember_pass');
        
        if (savedEmail) {
            emailInput.value = savedEmail;
            emailInput.classList.add('is-valid');
        }
        
        if (savedPassEncrypted) {
            const savedPassword = simpleDecrypt(savedPassEncrypted);
            if (savedPassword) {
                passwordInput.value = savedPassword;
                passwordInput.classList.add('is-valid');
            }
        }
        
        rememberMeCheckbox.checked = true;
    }
}

function clearSavedCredentials() {
    localStorage.removeItem('ocelon_remember_email');
    localStorage.removeItem('ocelon_remember_pass');
    localStorage.removeItem('ocelon_remember_me');
}

// ========================================
// SUBMIT DEL FORMULARIO
// ========================================

if (loginForm) {
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        hideMessages();
        
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        const remember = rememberMeCheckbox.checked;
        
        // Validaciones básicas
        if (!email || !password) {
            showError('Por favor completa todos los campos');
            return;
        }
        
        if (!validateEmail(email)) {
            showError('Por favor ingresa un correo electrónico válido');
            emailInput.classList.add('is-invalid');
            emailInput.focus();
            return;
        }
        
        setLoading(true);
        
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });
            
            const data = await response.json();
            
            if (response.ok && data.success) {
                // Guardar credenciales si "Recordarme" está marcado
                saveCredentials(email, password, remember);
                
                // Guardar token y datos del usuario
                localStorage.setItem('token', data.token);
                localStorage.setItem('userId', data.userId);
                localStorage.setItem('userRole', data.role);
                localStorage.setItem('userName', data.userName);
                
                // Mensaje de éxito
                showSuccess(`¡Bienvenido ${data.userName}! Redirigiendo...`);
                
                // Animar salida
                const loginCard = document.querySelector('.login-card');
                if (loginCard) {
                    loginCard.classList.add('animate__animated', 'animate__fadeOutUp');
                }
                
                setTimeout(() => {
                    window.location.href = '/dashboard.html';
                }, 1000);
            } else {
                setLoading(false);
                showError(data.message || 'Error al iniciar sesión. Verifica tus credenciales.');
                
                // Marcar campos como inválidos
                emailInput.classList.add('is-invalid');
                passwordInput.classList.add('is-invalid');
            }
        } catch (error) {
            setLoading(false);
            console.error('Error:', error);
            showError('Error de conexión. Por favor intenta de nuevo.');
        }
    });
}

// ========================================
// RECUPERAR CONTRASEÑA - MEJORADO
// ========================================

if (forgotPasswordBtn) {
    forgotPasswordBtn.addEventListener('click', function(e) {
        e.preventDefault();
        hideMessages();
        
        // Pre-llenar el email si está disponible
        const currentEmail = emailInput.value.trim();
        if (currentEmail && validateEmail(currentEmail)) {
            document.getElementById('resetEmail').value = currentEmail;
        }
        
        forgotPasswordModal.show();
    });
}

if (sendResetBtn) {
    sendResetBtn.addEventListener('click', async function() {
        const resetEmailInput = document.getElementById('resetEmail');
        const resetEmail = resetEmailInput.value.trim();
        
        if (!resetEmail) {
            showError('Por favor ingresa tu correo electrónico');
            resetEmailInput.focus();
            return;
        }
        
        if (!validateEmail(resetEmail)) {
            showError('Por favor ingresa un correo electrónico válido');
            resetEmailInput.classList.add('is-invalid');
            resetEmailInput.focus();
            return;
        }
        
        // Limpiar clases de validación
        resetEmailInput.classList.remove('is-invalid');
        
        // Deshabilitar botón y mostrar loading
        this.disabled = true;
        const originalHTML = this.innerHTML;
        this.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Enviando...';
        
        try {
            const response = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email: resetEmail })
            });
            
            const data = await response.json();
            
            if (data.success || response.ok) {
                // Mostrar link de recuperación en el modal si está disponible
                if (data.resetUrl) {
                    // Actualizar el contenido del modal
                    const modalBody = document.querySelector('#forgotPasswordModal .modal-body');
                    modalBody.innerHTML = `
                        <div class="alert alert-success">
                            <i class="fas fa-check-circle me-2"></i>
                            ¡Enlace generado exitosamente!
                        </div>
                        <p class="mb-3">Haz clic en el siguiente enlace para restablecer tu contraseña:</p>
                        <div class="input-group mb-3">
                            <input type="text" class="form-control" value="${data.resetUrl}" id="resetLinkInput" readonly>
                            <button class="btn btn-outline-ocelon" type="button" id="copyLinkBtn">
                                <i class="fas fa-copy"></i> Copiar
                            </button>
                        </div>
                        <a href="${data.resetUrl}" class="btn btn-ocelon w-100" target="_blank">
                            <i class="fas fa-external-link-alt me-2"></i>Abrir enlace de recuperación
                        </a>
                    `;
                    
                    // Agregar funcionalidad de copiar
                    document.getElementById('copyLinkBtn').addEventListener('click', function() {
                        const linkInput = document.getElementById('resetLinkInput');
                        linkInput.select();
                        document.execCommand('copy');
                        this.innerHTML = '<i class="fas fa-check"></i> Copiado';
                        setTimeout(() => {
                            this.innerHTML = '<i class="fas fa-copy"></i> Copiar';
                        }, 2000);
                    });
                    
                    // Ocultar botón de enviar
                    sendResetBtn.style.display = 'none';
                } else {
                    // Cerrar modal
                    forgotPasswordModal.hide();
                    
                    // Mostrar mensaje de éxito
                    showSuccess('Se han enviado las instrucciones a tu correo electrónico. Por favor revisa tu bandeja de entrada.');
                    
                    // Limpiar campo
                    resetEmailInput.value = '';
                    resetEmailInput.classList.remove('is-valid', 'is-invalid');
                }
            } else {
                showError(data.message || 'Error al enviar instrucciones. Intenta nuevamente.');
            }
        } catch (error) {
            console.error('Error:', error);
            showError('Error de conexión. Por favor intenta de nuevo.');
        } finally {
            // Restaurar botón
            this.disabled = false;
            this.innerHTML = originalHTML;
        }
    });
}

// Validación en tiempo real del email de recuperación
document.getElementById('resetEmail')?.addEventListener('input', function() {
    const email = this.value.trim();
    
    if (email === '') {
        this.classList.remove('is-valid', 'is-invalid');
        return;
    }
    
    if (validateEmail(email)) {
        this.classList.remove('is-invalid');
        this.classList.add('is-valid');
    } else {
        this.classList.remove('is-valid');
        this.classList.add('is-invalid');
    }
});

// ========================================
// LOGIN SOCIAL (Simulado)
// ========================================

if (googleLoginBtn) {
    googleLoginBtn.addEventListener('click', function() {
        showError('La autenticación con Google estará disponible próximamente');
    });
}

if (appleLoginBtn) {
    appleLoginBtn.addEventListener('click', function() {
        showError('La autenticación con Apple estará disponible próximamente');
    });
}

// ========================================
// CARGAR DATOS GUARDADOS AL INICIAR
// ========================================

window.addEventListener('DOMContentLoaded', function() {
    // Cargar credenciales guardadas si existe
    loadSavedCredentials();
    
    // Si hay credenciales guardadas, enfocar el botón de login
    if (rememberMeCheckbox.checked && emailInput.value && passwordInput.value) {
        loginBtn.focus();
    } else if (emailInput.value) {
        passwordInput.focus();
    } else {
        emailInput.focus();
    }
    
    // Verificar si ya hay sesión activa
    const token = localStorage.getItem('token');
    if (token) {
        // Verificar si el token es válido antes de redireccionar
        fetch('/api/auth/verify', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                window.location.href = '/dashboard.html';
            }
        })
        .catch(() => {
            // Token inválido, limpiar localStorage
            localStorage.removeItem('token');
            localStorage.removeItem('userId');
            localStorage.removeItem('userRole');
        });
    }
});

// ========================================
// ATAJOS DE TECLADO
// ========================================

document.addEventListener('keydown', function(e) {
    // Ctrl/Cmd + K para enfocar email
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        emailInput.focus();
        emailInput.select();
    }
    
    // Enter en modal para enviar
    if (e.key === 'Enter' && document.getElementById('forgotPasswordModal').classList.contains('show')) {
        e.preventDefault();
        sendResetBtn.click();
    }
});

// ========================================
// LIMPIAR CREDENCIALES AL DESMARCAR
// ========================================

if (rememberMeCheckbox) {
    rememberMeCheckbox.addEventListener('change', function() {
        if (!this.checked) {
            // Si desmarca, limpiar credenciales guardadas
            clearSavedCredentials();
        } else {
            // Si marca, guardar las credenciales actuales si existen
            const email = emailInput.value.trim();
            const password = passwordInput.value;
            if (email && password && validateEmail(email)) {
                saveCredentials(email, password, true);
            }
        }
    });
}

// ========================================
// ANIMACIONES DE ENTRADA
// ========================================

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('animate__animated', 'animate__fadeInUp');
        }
    });
});

const loginCard = document.querySelector('.login-card');
if (loginCard) {
    observer.observe(loginCard);
}

// ========================================
// LIMPIAR MODAL AL CERRAR
// ========================================

document.getElementById('forgotPasswordModal')?.addEventListener('hidden.bs.modal', function() {
    const resetEmailInput = document.getElementById('resetEmail');
    const modalBody = this.querySelector('.modal-body');
    
    // Resetear contenido del modal
    modalBody.innerHTML = `
        <p class="text-muted mb-4">
            Ingresa tu correo electrónico y te enviaremos instrucciones para restablecer tu contraseña.
        </p>
        <form id="forgotPasswordForm">
            <div class="input-group-custom">
                <input 
                    type="email" 
                    class="form-control" 
                    id="resetEmail" 
                    placeholder="correo@ejemplo.com"
                    required
                >
                <i class="fas fa-envelope input-icon"></i>
            </div>
        </form>
    `;
    
    // Restaurar botón de enviar
    sendResetBtn.style.display = '';
    
    // Limpiar clases de validación
    const newResetEmailInput = document.getElementById('resetEmail');
    if (newResetEmailInput) {
        newResetEmailInput.classList.remove('is-valid', 'is-invalid');
        
        // Re-agregar event listener de validación
        newResetEmailInput.addEventListener('input', function() {
            const email = this.value.trim();
            
            if (email === '') {
                this.classList.remove('is-valid', 'is-invalid');
                return;
            }
            
            if (validateEmail(email)) {
                this.classList.remove('is-invalid');
                this.classList.add('is-valid');
            } else {
                this.classList.remove('is-valid');
                this.classList.add('is-invalid');
            }
        });
    }
});

// ========================================
// CONSOLE LOG
// ========================================

console.log('%cOcelon - Sistema de Estacionamiento Digital', 'color: #10b981; font-size: 20px; font-weight: bold;');
console.log('%cLogin page loaded successfully', 'color: #6366f1; font-size: 12px;');
console.log('%cRecordarme habilitado', 'color: #10b981; font-size: 12px;');
console.log('%cRecuperación de contraseña habilitado', 'color: #10b981; font-size: 12px;');