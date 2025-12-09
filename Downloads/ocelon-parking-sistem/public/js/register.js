// ========================================
// OCELON - Register Script
// ========================================

// ========================================
// VARIABLES GLOBALES
// ========================================

const registerForm = document.getElementById('registerForm');
const nombreInput = document.getElementById('nombre');
const emailInput = document.getElementById('email');
const telefonoInput = document.getElementById('telefono');
const rfcInput = document.getElementById('rfc');
const passwordInput = document.getElementById('password');
const confirmPasswordInput = document.getElementById('confirmPassword');
const termsCheckbox = document.getElementById('termsCheckbox');
const registerBtn = document.getElementById('registerBtn');

// ========================================
// UTILIDADES DE ENCRIPTACIÓN
// ========================================

function simpleEncrypt(text, key = 'ocelon-secret-key-2024') {
    let result = '';
    for (let i = 0; i < text.length; i++) {
        result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return btoa(result); // Base64 encode
}

// ========================================
// VALIDACIÓN EN TIEMPO REAL
// ========================================

// Validar nombre
if (nombreInput) {
    nombreInput.addEventListener('input', function() {
        const nombre = this.value.trim();
        
        if (nombre.length === 0) {
            this.classList.remove('is-valid', 'is-invalid');
        } else if (nombre.length < 3) {
            this.classList.remove('is-valid');
            this.classList.add('is-invalid');
        } else {
            this.classList.remove('is-invalid');
            this.classList.add('is-valid');
        }
    });
}

// Validar email
if (emailInput) {
    emailInput.addEventListener('input', function() {
        const email = this.value.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
        if (email.length === 0) {
            this.classList.remove('is-valid', 'is-invalid');
        } else if (!emailRegex.test(email)) {
            this.classList.remove('is-valid');
            this.classList.add('is-invalid');
        } else {
            this.classList.remove('is-invalid');
            this.classList.add('is-valid');
        }
    });
}

// Validar teléfono (opcional pero si se llena debe ser válido)
if (telefonoInput) {
    telefonoInput.addEventListener('input', function() {
        let telefono = this.value.replace(/\D/g, ''); // Solo números
        this.value = telefono;
        
        if (telefono.length === 0) {
            this.classList.remove('is-valid', 'is-invalid');
        } else if (telefono.length !== 10) {
            this.classList.remove('is-valid');
            this.classList.add('is-invalid');
        } else {
            this.classList.remove('is-invalid');
            this.classList.add('is-valid');
        }
    });
}

// Validar RFC (opcional pero si se llena debe ser válido)
if (rfcInput) {
    rfcInput.addEventListener('input', function() {
        let rfc = this.value.toUpperCase();
        this.value = rfc;
        
        if (rfc.length === 0) {
            this.classList.remove('is-valid', 'is-invalid');
        } else if (rfc.length < 12 || rfc.length > 13) {
            this.classList.remove('is-valid');
            this.classList.add('is-invalid');
        } else {
            this.classList.remove('is-invalid');
            this.classList.add('is-valid');
        }
    });
}

// ========================================
// VALIDACIÓN DE CONTRASEÑA
// ========================================

function validatePassword(password) {
    const requirements = {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /[0-9]/.test(password)
    };
    
    return requirements;
}

function getPasswordStrength(password) {
    const requirements = validatePassword(password);
    const score = Object.values(requirements).filter(Boolean).length;
    
    if (score === 0) return { strength: 0, text: '', color: '' };
    if (score === 1) return { strength: 25, text: 'Muy débil', color: '#ef4444' };
    if (score === 2) return { strength: 50, text: 'Débil', color: '#f59e0b' };
    if (score === 3) return { strength: 75, text: 'Buena', color: '#3b82f6' };
    return { strength: 100, text: 'Excelente', color: '#10b981' };
}

if (passwordInput) {
    passwordInput.addEventListener('input', function() {
        const password = this.value;
        const requirements = validatePassword(password);
        const strength = getPasswordStrength(password);
        
        // Mostrar/actualizar indicador de fortaleza
        const strengthIndicator = document.getElementById('passwordStrength');
        const strengthFill = document.getElementById('passwordStrengthFill');
        const strengthText = document.getElementById('passwordStrengthText');
        
        if (strengthIndicator && strengthFill && strengthText) {
            if (password.length > 0) {
                strengthIndicator.style.display = 'block';
                strengthFill.style.width = strength.strength + '%';
                strengthFill.style.backgroundColor = strength.color;
                strengthText.textContent = strength.text;
                strengthText.style.color = strength.color;
            } else {
                strengthIndicator.style.display = 'none';
            }
        }
        
        // Actualizar requisitos visuales
        const reqLength = document.getElementById('req-length');
        const reqUppercase = document.getElementById('req-uppercase');
        const reqLowercase = document.getElementById('req-lowercase');
        const reqNumber = document.getElementById('req-number');
        
        if (reqLength) reqLength.className = requirements.length ? 'requirement met' : 'requirement';
        if (reqUppercase) reqUppercase.className = requirements.uppercase ? 'requirement met' : 'requirement';
        if (reqLowercase) reqLowercase.className = requirements.lowercase ? 'requirement met' : 'requirement';
        if (reqNumber) reqNumber.className = requirements.number ? 'requirement met' : 'requirement';
        
        // Validación del campo
        if (password.length === 0) {
            this.classList.remove('is-valid', 'is-invalid');
        } else if (Object.values(requirements).every(Boolean)) {
            this.classList.remove('is-invalid');
            this.classList.add('is-valid');
        } else {
            this.classList.remove('is-valid');
            this.classList.add('is-invalid');
            
            // Mensaje de error personalizado
            const passwordError = document.getElementById('passwordError');
            if (passwordError) {
                const missingReqs = [];
                if (!requirements.length) missingReqs.push('8 caracteres');
                if (!requirements.uppercase) missingReqs.push('mayúscula');
                if (!requirements.lowercase) missingReqs.push('minúscula');
                if (!requirements.number) missingReqs.push('número');
                
                passwordError.textContent = `Falta: ${missingReqs.join(', ')}`;
            }
        }
        
        // Validar confirmación si ya tiene valor
        if (confirmPasswordInput && confirmPasswordInput.value.length > 0) {
            validateConfirmPassword();
        }
    });
}

// Validar confirmación de contraseña
function validateConfirmPassword() {
    if (!passwordInput || !confirmPasswordInput) return;
    
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;
    
    if (confirmPassword.length === 0) {
        confirmPasswordInput.classList.remove('is-valid', 'is-invalid');
    } else if (password !== confirmPassword) {
        confirmPasswordInput.classList.remove('is-valid');
        confirmPasswordInput.classList.add('is-invalid');
    } else {
        confirmPasswordInput.classList.remove('is-invalid');
        confirmPasswordInput.classList.add('is-valid');
    }
}

if (confirmPasswordInput) {
    confirmPasswordInput.addEventListener('input', validateConfirmPassword);
}

// ========================================
// TOGGLE PASSWORD VISIBILITY
// ========================================

const togglePassword = document.getElementById('togglePassword');
const toggleConfirmPassword = document.getElementById('toggleConfirmPassword');

if (togglePassword && passwordInput) {
    togglePassword.addEventListener('click', function() {
        const type = passwordInput.type === 'password' ? 'text' : 'password';
        passwordInput.type = type;
        
        const icon = this.querySelector('i');
        icon.classList.toggle('fa-eye');
        icon.classList.toggle('fa-eye-slash');
    });
}

if (toggleConfirmPassword && confirmPasswordInput) {
    toggleConfirmPassword.addEventListener('click', function() {
        const type = confirmPasswordInput.type === 'password' ? 'text' : 'password';
        confirmPasswordInput.type = type;
        
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
    
    const errorMessage = document.getElementById('errorMessage');
    const errorText = document.getElementById('errorText');
    
    if (errorMessage && errorText) {
        errorText.textContent = message;
        errorMessage.style.display = 'flex';
        
        const successMessage = document.getElementById('successMessage');
        if (successMessage) successMessage.style.display = 'none';
        
        // Hacer scroll al mensaje
        errorMessage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        
        // Auto-ocultar
        setTimeout(() => {
            errorMessage.style.display = 'none';
        }, 5000);
    }
}

function showSuccess(message) {
    // Sistema Toast si está disponible
    if (typeof showToast !== 'undefined') {
        showToast.success('¡Éxito!', message, { sound: true });
    }
    
    const successMessage = document.getElementById('successMessage');
    const successText = document.getElementById('successText');
    
    if (successMessage && successText) {
        successText.textContent = message;
        successMessage.style.display = 'flex';
        
        const errorMessage = document.getElementById('errorMessage');
        if (errorMessage) errorMessage.style.display = 'none';
        
        // Hacer scroll al mensaje
        successMessage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

function hideMessages() {
    const errorMessage = document.getElementById('errorMessage');
    const successMessage = document.getElementById('successMessage');
    
    if (errorMessage) errorMessage.style.display = 'none';
    if (successMessage) successMessage.style.display = 'none';
}

// ========================================
// LOADING STATE
// ========================================

function setLoading(loading) {
    if (!registerBtn) return;
    
    if (loading) {
        registerBtn.disabled = true;
        registerBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Creando cuenta...';
        registerBtn.classList.add('loading');
    } else {
        registerBtn.disabled = false;
        registerBtn.innerHTML = '<i class="fas fa-user-plus me-2"></i>Crear Cuenta';
        registerBtn.classList.remove('loading');
    }
}

// ========================================
// SUBMIT FORM
// ========================================

if (registerForm) {
    registerForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        hideMessages();
        
        // Validar todos los campos
        const nombre = nombreInput ? nombreInput.value.trim() : '';
        const email = emailInput ? emailInput.value.trim() : '';
        const telefono = telefonoInput ? telefonoInput.value.trim() : '';
        const rfc = rfcInput ? rfcInput.value.trim() : '';
        const password = passwordInput ? passwordInput.value : '';
        const confirmPassword = confirmPasswordInput ? confirmPasswordInput.value : '';
        
        // Validación nombre
        if (nombre.length < 3) {
            showError('El nombre debe tener al menos 3 caracteres');
            if (nombreInput) {
                nombreInput.focus();
                nombreInput.classList.add('animate__animated', 'animate__shakeX');
                setTimeout(() => nombreInput.classList.remove('animate__animated', 'animate__shakeX'), 500);
            }
            return;
        }
        
        // Validación email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showError('Por favor ingresa un email válido');
            if (emailInput) {
                emailInput.focus();
                emailInput.classList.add('animate__animated', 'animate__shakeX');
                setTimeout(() => emailInput.classList.remove('animate__animated', 'animate__shakeX'), 500);
            }
            return;
        }
        
        // Validación teléfono (si se proporcionó)
        if (telefono.length > 0 && telefono.length !== 10) {
            showError('El teléfono debe tener 10 dígitos');
            if (telefonoInput) telefonoInput.focus();
            return;
        }
        
        // Validación RFC (si se proporcionó)
        if (rfc.length > 0 && (rfc.length < 12 || rfc.length > 13)) {
            showError('El RFC debe tener 12 o 13 caracteres');
            if (rfcInput) rfcInput.focus();
            return;
        }
        
        // Validación contraseña
        const requirements = validatePassword(password);
        if (!Object.values(requirements).every(Boolean)) {
            showError('La contraseña no cumple con todos los requisitos de seguridad');
            if (passwordInput) passwordInput.focus();
            return;
        }
        
        // Validación confirmación
        if (password !== confirmPassword) {
            showError('Las contraseñas no coinciden');
            if (confirmPasswordInput) {
                confirmPasswordInput.focus();
                confirmPasswordInput.classList.add('animate__animated', 'animate__shakeX');
                setTimeout(() => confirmPasswordInput.classList.remove('animate__animated', 'animate__shakeX'), 500);
            }
            return;
        }
        
        // Validación términos
        if (termsCheckbox && !termsCheckbox.checked) {
            showError('Debes aceptar los términos y condiciones para continuar');
            if (termsCheckbox) termsCheckbox.focus();
            return;
        }
        
        // Enviar registro
        setLoading(true);
        
        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email,
                    password,
                    profile: {
                        nombre,
                        telefono: telefono || undefined,
                        rfc: rfc || undefined
                    }
                })
            });
            
            const data = await response.json();
            
            if (response.ok && data.success) {
                showSuccess('¡Cuenta creada exitosamente! Redirigiendo al inicio de sesión...');
                
                // NUEVO: Guardar credenciales en sessionStorage para auto-login
                sessionStorage.setItem('ocelon_new_user_email', email);
                sessionStorage.setItem('ocelon_new_user_password', simpleEncrypt(password));
                
                // Animar card antes de redireccionar
                const loginCard = document.querySelector('.login-card');
                if (loginCard) {
                    loginCard.classList.add('animate__animated', 'animate__fadeOutUp');
                }
                
                // Redireccionar después de 1.5 segundos
                setTimeout(() => {
                    window.location.href = '/login.html';
                }, 1500);
            } else {
                showError(data.message || 'Error al crear la cuenta. Por favor intenta nuevamente.');
                setLoading(false);
                
                // Marcar campos como inválidos si es email duplicado
                if (emailInput && data.message && data.message.includes('email')) {
                    emailInput.classList.add('is-invalid');
                }
            }
        } catch (error) {
            console.error('Error en registro:', error);
            showError('Error de conexión. Por favor verifica tu internet e intenta nuevamente.');
            setLoading(false);
        }
    });
}

// ========================================
// SOCIAL REGISTER
// ========================================

const googleRegister = document.getElementById('googleRegister');
if (googleRegister) {
    googleRegister.addEventListener('click', function() {
        showError('Registro con Google próximamente disponible');
    });
}

const appleRegister = document.getElementById('appleRegister');
if (appleRegister) {
    appleRegister.addEventListener('click', function() {
        showError('Registro con Apple próximamente disponible');
    });
}

// ========================================
// MODALES - ACEPTAR TÉRMINOS
// ========================================

const acceptTermsBtn = document.getElementById('acceptTermsBtn');
if (acceptTermsBtn && termsCheckbox) {
    acceptTermsBtn.addEventListener('click', function() {
        termsCheckbox.checked = true;
        const termsModal = document.getElementById('termsModal');
        if (termsModal && typeof bootstrap !== 'undefined') {
            const modalInstance = bootstrap.Modal.getInstance(termsModal);
            if (modalInstance) modalInstance.hide();
        }
    });
}

// ========================================
// ANALYTICS
// ========================================

console.log('%c✨ Register Page Loaded', 'color: #6366f1; font-size: 12px;');

// Track form interactions
let formInteractionTracked = false;
if (registerForm) {
    registerForm.addEventListener('input', function() {
        if (!formInteractionTracked) {
            console.log('User started filling registration form');
            formInteractionTracked = true;
        }
    });
}

// ========================================
// KEYBOARD SHORTCUTS
// ========================================

document.addEventListener('keydown', function(e) {
    // Ctrl/Cmd + Enter para enviar
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        if (document.activeElement && document.activeElement.tagName === 'INPUT' && registerForm) {
            registerForm.dispatchEvent(new Event('submit', { cancelable: true }));
        }
    }
});