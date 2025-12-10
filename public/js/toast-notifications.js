// ========================================
// OCELON - Sistema de Notificaciones Toast
// ========================================

class ToastNotification {
    constructor(options = {}) {
        this.options = {
            position: options.position || 'top-right', // top-right, top-left, bottom-right, bottom-left, top-center, bottom-center
            duration: options.duration || 5000, // ms
            maxToasts: options.maxToasts || 5, // Máximo de toasts simultáneos
            pauseOnHover: options.pauseOnHover !== false, // Pausar en hover
            closeButton: options.closeButton !== false, // Mostrar botón cerrar
            progressBar: options.progressBar !== false, // Mostrar barra de progreso
            sound: options.sound || false, // Reproducir sonido
            ...options
        };

        this.container = null;
        this.toasts = [];
        this.init();
    }

    init() {
        // Crear contenedor si no existe
        let container = document.querySelector(`.toast-container.${this.options.position}`);
        
        if (!container) {
            container = document.createElement('div');
            container.className = `toast-container ${this.options.position}`;
            document.body.appendChild(container);
        }
        
        this.container = container;
    }

    // Método principal para mostrar toast
    show(type, title, message, options = {}) {
        // Verificar límite de toasts
        if (this.toasts.length >= this.options.maxToasts) {
            this.removeOldest();
        }

        const toastOptions = { ...this.options, ...options };
        const toast = this.createToast(type, title, message, toastOptions);
        
        this.container.appendChild(toast);
        this.toasts.push(toast);

        // Trigger reflow para animación
        toast.offsetHeight;
        toast.classList.add('show');

        // Reproducir sonido si está habilitado
        if (toastOptions.sound) {
            this.playSound(type);
        }

        // Auto-dismiss
        if (toastOptions.duration > 0) {
            this.autoDismiss(toast, toastOptions.duration);
        }

        return toast;
    }

    createToast(type, title, message, options) {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.setAttribute('role', 'alert');
        toast.setAttribute('aria-live', 'polite');

        // Icono según tipo
        const icons = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ'
        };

        const icon = icons[type] || 'ℹ';

        // Construir HTML
        let html = `
            <div class="toast-icon">${icon}</div>
            <div class="toast-content">
                ${title ? `<div class="toast-title">${this.escapeHtml(title)}</div>` : ''}
                ${message ? `<div class="toast-message">${this.escapeHtml(message)}</div>` : ''}
            </div>
        `;

        // Botón cerrar
        if (options.closeButton) {
            html += `<button class="toast-close" aria-label="Cerrar">×</button>`;
        }

        toast.innerHTML = html;

        // Barra de progreso
        if (options.progressBar && options.duration > 0) {
            const progress = document.createElement('div');
            progress.className = 'toast-progress';
            progress.style.width = '100%';
            toast.appendChild(progress);

            // Animar barra de progreso
            setTimeout(() => {
                progress.style.transition = `width ${options.duration}ms linear`;
                progress.style.width = '0%';
            }, 10);
        }

        // Event listeners
        if (options.closeButton) {
            const closeBtn = toast.querySelector('.toast-close');
            closeBtn.addEventListener('click', () => this.dismiss(toast));
        }

        // Pausar en hover
        if (options.pauseOnHover) {
            let remainingTime = options.duration;
            let startTime;
            let timeoutId;

            toast.addEventListener('mouseenter', () => {
                if (timeoutId) {
                    clearTimeout(timeoutId);
                    remainingTime -= Date.now() - startTime;
                    
                    // Pausar barra de progreso
                    const progress = toast.querySelector('.toast-progress');
                    if (progress) {
                        const computedStyle = window.getComputedStyle(progress);
                        progress.style.width = computedStyle.width;
                        progress.style.transition = 'none';
                    }
                }
            });

            toast.addEventListener('mouseleave', () => {
                startTime = Date.now();
                timeoutId = setTimeout(() => this.dismiss(toast), remainingTime);

                // Reanudar barra de progreso
                const progress = toast.querySelector('.toast-progress');
                if (progress) {
                    progress.style.transition = `width ${remainingTime}ms linear`;
                    progress.style.width = '0%';
                }
            });

            // Guardar timeout ID para poder pausarlo
            toast._timeoutId = timeoutId;
        }

        // Click en el toast
        if (options.onClick) {
            toast.style.cursor = 'pointer';
            toast.addEventListener('click', (e) => {
                if (!e.target.classList.contains('toast-close')) {
                    options.onClick(toast);
                }
            });
        }

        return toast;
    }

    autoDismiss(toast, duration) {
        const timeoutId = setTimeout(() => {
            this.dismiss(toast);
        }, duration);

        toast._timeoutId = timeoutId;
    }

    dismiss(toast) {
        if (!toast || !toast.classList.contains('show')) return;

        // Limpiar timeout si existe
        if (toast._timeoutId) {
            clearTimeout(toast._timeoutId);
        }

        // Animar salida
        toast.classList.remove('show');
        toast.classList.add('hide');

        // Remover del DOM
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
            
            // Remover del array
            const index = this.toasts.indexOf(toast);
            if (index > -1) {
                this.toasts.splice(index, 1);
            }
        }, 300);
    }

    removeOldest() {
        if (this.toasts.length > 0) {
            this.dismiss(this.toasts[0]);
        }
    }

    dismissAll() {
        [...this.toasts].forEach(toast => this.dismiss(toast));
    }

    // Métodos de conveniencia
    success(title, message, options) {
        return this.show('success', title, message, options);
    }

    error(title, message, options) {
        const toast = this.show('error', title, message, options);
        // Efecto shake para errores
        toast.classList.add('shake');
        setTimeout(() => toast.classList.remove('shake'), 500);
        return toast;
    }

    warning(title, message, options) {
        return this.show('warning', title, message, options);
    }

    info(title, message, options) {
        return this.show('info', title, message, options);
    }

    // Utilidades
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    playSound(type) {
        // Frecuencias para diferentes tipos de notificación
        const frequencies = {
            success: [523.25, 659.25], // C5, E5
            error: [329.63, 261.63], // E4, C4
            warning: [440, 440], // A4
            info: [523.25] // C5
        };

        const freq = frequencies[type] || frequencies.info;
        
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            freq.forEach((f, i) => {
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                oscillator.frequency.value = f;
                oscillator.type = 'sine';
                
                gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
                
                oscillator.start(audioContext.currentTime + i * 0.1);
                oscillator.stop(audioContext.currentTime + i * 0.1 + 0.1);
            });
        } catch (e) {
            console.warn('Toast sound not supported:', e);
        }
    }

    // Cambiar posición del contenedor
    setPosition(position) {
        this.container.className = `toast-container ${position}`;
        this.options.position = position;
    }

    // Obtener número de toasts activos
    getActiveCount() {
        return this.toasts.length;
    }
}

// Crear instancia global
window.toast = new ToastNotification();

// Métodos de conveniencia globales
window.showToast = {
    success: (title, message, options) => window.toast.success(title, message, options),
    error: (title, message, options) => window.toast.error(title, message, options),
    warning: (title, message, options) => window.toast.warning(title, message, options),
    info: (title, message, options) => window.toast.info(title, message, options)
};