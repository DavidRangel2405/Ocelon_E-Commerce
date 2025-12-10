// ========================================
// OCELON - Main Landing Page Script
// ========================================

console.log('%cOcelon Main Script', 'color: #10b981; font-size: 16px; font-weight: bold;');

// ========================================
// SMOOTH SCROLL
// ========================================

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href !== '#' && href !== '') {
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                const navbarHeight = 80;
                const targetPosition = target.offsetTop - navbarHeight;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
                
                // Close mobile menu if open
                const navbarCollapse = document.querySelector('.navbar-collapse');
                if (navbarCollapse && navbarCollapse.classList.contains('show')) {
                    const bsCollapse = new bootstrap.Collapse(navbarCollapse);
                    bsCollapse.hide();
                }
            }
        }
    });
});

// ========================================
// NAVBAR SCROLL EFFECT
// ========================================

const navbar = document.getElementById('mainNav');
let lastScroll = 0;

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    
    // Add shadow when scrolled
    if (currentScroll > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
    /*
    // Hide navbar on scroll down, show on scroll up
    if (currentScroll > lastScroll && currentScroll > 500) {
        navbar.style.transform = 'translateY(-100%)';
    } else {
        navbar.style.transform = 'translateY(0)';
    }
    
    lastScroll = currentScroll; */
});

// ========================================
// ANIMATED COUNTERS
// ========================================

function animateCounter(element, target, duration = 2000) {
    let start = 0;
    const increment = target / (duration / 16); // 60 FPS
    
    const updateCounter = () => {
        start += increment;
        if (start < target) {
            element.textContent = Math.floor(start).toLocaleString();
            requestAnimationFrame(updateCounter);
        } else {
            element.textContent = target.toLocaleString();
        }
    };
    
    updateCounter();
}

// Intersection Observer for counters
const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting && !entry.target.classList.contains('counted')) {
            const target = parseInt(entry.target.getAttribute('data-count'));
            animateCounter(entry.target, target);
            entry.target.classList.add('counted');
        }
    });
}, {
    threshold: 0.5,
    rootMargin: '0px'
});

document.querySelectorAll('[data-count]').forEach(counter => {
    counterObserver.observe(counter);
});

// ========================================
// PARALLAX EFFECT FOR HERO
// ========================================

window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const heroOrbs = document.querySelectorAll('.hero-orb');
    
    heroOrbs.forEach((orb, index) => {
        const speed = 0.5 + (index * 0.1);
        orb.style.transform = `translateY(${scrolled * speed}px)`;
    });
});

// ========================================
// FORM VALIDATION (si hay formularios)
// ========================================

const contactForm = document.getElementById('contactForm');

if (contactForm) {
    contactForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = {
            name: document.getElementById('contactName')?.value,
            email: document.getElementById('contactEmail')?.value,
            message: document.getElementById('contactMessage')?.value
        };
        
        // Simulación de envío
        console.log('Form submitted:', formData);
        
        // Aquí iría la lógica real de envío
        alert('¡Gracias por contactarnos! Te responderemos pronto.');
        contactForm.reset();
    });
}

// ========================================
// PRICING CARD INTERACTIONS
// ========================================

document.querySelectorAll('.pricing-card').forEach(card => {
    card.addEventListener('mouseenter', function() {
        this.style.zIndex = '10';
    });
    
    card.addEventListener('mouseleave', function() {
        this.style.zIndex = '1';
    });
});

// ========================================
// LAZY LOADING IMAGES
// ========================================

const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const img = entry.target;
            if (img.dataset.src) {
                img.src = img.dataset.src;
                img.classList.add('loaded');
                imageObserver.unobserve(img);
            }
        }
    });
});

document.querySelectorAll('img[data-src]').forEach(img => {
    imageObserver.observe(img);
});

// ========================================
// MOBILE MENU CLOSE ON CLICK
// ========================================

document.querySelectorAll('.navbar-nav .nav-link').forEach(link => {
    link.addEventListener('click', () => {
        const navbarCollapse = document.querySelector('.navbar-collapse');
        if (navbarCollapse && navbarCollapse.classList.contains('show')) {
            const bsCollapse = new bootstrap.Collapse(navbarCollapse);
            bsCollapse.hide();
        }
    });
});

// ========================================
// SCROLL TO TOP BUTTON
// ========================================

const scrollToTopBtn = document.createElement('button');
scrollToTopBtn.innerHTML = '<i class="fas fa-arrow-up"></i>';
scrollToTopBtn.className = 'scroll-to-top';
scrollToTopBtn.style.cssText = `
    position: fixed;
    bottom: 30px;
    right: 30px;
    width: 50px;
    height: 50px;
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    color: white;
    border: none;
    border-radius: 50%;
    cursor: pointer;
    display: none;
    align-items: center;
    justify-content: center;
    font-size: 1.25rem;
    box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4);
    z-index: 1000;
    transition: all 0.3s ease;
`;

document.body.appendChild(scrollToTopBtn);

window.addEventListener('scroll', () => {
    if (window.pageYOffset > 500) {
        scrollToTopBtn.style.display = 'flex';
    } else {
        scrollToTopBtn.style.display = 'none';
    }
});

scrollToTopBtn.addEventListener('click', () => {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
});

scrollToTopBtn.addEventListener('mouseenter', function() {
    this.style.transform = 'translateY(-5px) scale(1.1)';
    this.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.6)';
});

scrollToTopBtn.addEventListener('mouseleave', function() {
    this.style.transform = 'translateY(0) scale(1)';
    this.style.boxShadow = '0 4px 15px rgba(16, 185, 129, 0.4)';
});

// ========================================
// DETECT MOBILE
// ========================================

const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

if (isMobile) {
    console.log('Mobile device detected');
    document.body.classList.add('mobile-device');
}

// ========================================
// PERFORMANCE MONITORING
// ========================================

if ('performance' in window) {
    window.addEventListener('load', () => {
        const perfData = window.performance.timing;
        const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
        console.log(`Page loaded in ${pageLoadTime}ms`);
    });
}

// ========================================
// EASTER EGG
// ========================================

let konamiCode = [];
const konamiPattern = [38, 38, 40, 40, 37, 39, 37, 39, 66, 65];

document.addEventListener('keydown', (e) => {
    konamiCode.push(e.keyCode);
    konamiCode = konamiCode.slice(-10);
    
    if (konamiCode.join(',') === konamiPattern.join(',')) {
        console.log('%cKonami Code Activated!', 'color: #10b981; font-size: 24px; font-weight: bold;');
        document.body.style.animation = 'rainbow 2s infinite';
    }
});

// ========================================
// UTILITIES
// ========================================

// Debounce function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Throttle function
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// ========================================
// ANALYTICS (preparado para Google Analytics)
// ========================================

function trackEvent(category, action, label) {
    if (typeof gtag !== 'undefined') {
        gtag('event', action, {
            'event_category': category,
            'event_label': label
        });
    }
    console.log(`Event tracked: ${category} - ${action} - ${label}`);
}

// Track CTA clicks
document.querySelectorAll('[href="register.html"]').forEach(btn => {
    btn.addEventListener('click', () => {
        trackEvent('CTA', 'click', 'Register Button');
    });
});

document.querySelectorAll('[href="login.html"]').forEach(btn => {
    btn.addEventListener('click', () => {
        trackEvent('CTA', 'click', 'Login Button');
    });
});

// Track section views
const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const sectionId = entry.target.id;
            if (sectionId) {
                trackEvent('Section', 'view', sectionId);
            }
        }
    });
}, {
    threshold: 0.5
});

document.querySelectorAll('section[id]').forEach(section => {
    sectionObserver.observe(section);
});

// ========================================
// INITIALIZATION
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('%cOcelon Landing Page Initialized', 'color: #6366f1; font-size: 14px;');
    
    // Add loaded class to body for CSS animations
    document.body.classList.add('page-loaded');
    
    // Preload critical assets
    const preloadImages = [
        // Add paths to important images here
    ];
    
    preloadImages.forEach(src => {
        const img = new Image();
        img.src = src;
    });
});

// ========================================
// ERROR HANDLING
// ========================================

window.addEventListener('error', (e) => {
    console.error('Error detected:', e.message);
    // Aquí podrías enviar errores a un servicio de monitoreo
});

window.addEventListener('unhandledrejection', (e) => {
    console.error('Unhandled promise rejection:', e.reason);
    // Aquí podrías enviar errores a un servicio de monitoreo
});

// Initialize AOS de forma segura
        document.addEventListener('DOMContentLoaded', function() {
            // Verificar que AOS está disponible
            if (typeof AOS !== 'undefined') {
                try {
                    AOS.init({
                        duration: 800,
                        once: true,
                        offset: 100,
                        disable: false,
                        startEvent: 'DOMContentLoaded',
                        initClassName: 'aos-init',
                        animatedClassName: 'aos-animate'
                    });
                    
                    // Añadir clase al HTML para indicar que AOS está listo
                    document.documentElement.classList.add('aos-ready');
                    
                    console.log('AOS initialized successfully');
                } catch (error) {
                    console.error('AOS initialization failed:', error);
                    // Si AOS falla, asegurar que el contenido sea visible
                    document.querySelectorAll('[data-aos]').forEach(el => {
                        el.style.opacity = '1';
                        el.style.transform = 'none';
                    });
                }
            } else {
                console.warn('AOS not loaded - showing content without animations');
                // Si AOS no se cargó, mostrar todo el contenido
                document.querySelectorAll('[data-aos]').forEach(el => {
                    el.style.opacity = '1';
                    el.style.transform = 'none';
                });
            }
        });
        
        // Fallback adicional - mostrar contenido después de 3 segundos si algo falla
        setTimeout(function() {
            const hiddenElements = document.querySelectorAll('[data-aos]:not(.aos-animate)');
            if (hiddenElements.length > 0) {
                console.warn('Some elements still hidden, forcing visibility');
                hiddenElements.forEach(el => {
                    el.classList.add('aos-animate');
                    el.style.opacity = '1';
                    el.style.transform = 'none';
                });
            }
        }, 3000);
        
        // Navbar scroll effect
        window.addEventListener('scroll', function() {
            const navbar = document.getElementById('mainNav');
            if (window.scrollY > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        });
        
        // Counter animation
        const counters = document.querySelectorAll('[data-count]');
        const speed = 200;
        
        const runCounter = (counter) => {
            const target = +counter.getAttribute('data-count');
            const count = +counter.innerText;
            const inc = target / speed;
            
            if (count < target) {
                counter.innerText = Math.ceil(count + inc);
                setTimeout(() => runCounter(counter), 10);
            } else {
                counter.innerText = target.toLocaleString();
            }
        };
        
        counters.forEach(counter => {
            counterObserver.observe(counter);
        });
        
        // FAQ Accordion
        document.querySelectorAll('.faq-question').forEach(button => {
            button.addEventListener('click', () => {
                const faqItem = button.parentElement;
                const answer = button.nextElementSibling;
                
                // Close other FAQs
                document.querySelectorAll('.faq-question').forEach(otherButton => {
                    if (otherButton !== button) {
                        otherButton.classList.remove('active');
                        otherButton.nextElementSibling.classList.remove('show');
                    }
                });
                
                // Toggle current FAQ
                button.classList.toggle('active');
                answer.classList.toggle('show');
            });
        });
        
        // Smooth scroll for anchor links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                const href = this.getAttribute('href');
                if (href !== '#' && href !== '') {
                    e.preventDefault();
                    const target = document.querySelector(href);
                    if (target) {
                        const offsetTop = target.offsetTop - 80;
                        window.scrollTo({
                            top: offsetTop,
                            behavior: 'smooth'
                        });
                    }
                }
            });
        });
        
        console.log('%c Ocelon Landing Page', 'color: #10b981; font-size: 20px; font-weight: bold;');
        console.log('%c Loaded successfully', 'color: #6366f1; font-size: 12px;');

document.addEventListener("DOMContentLoaded", () => {
    const modal = document.getElementById('videoModal');
    const video = document.getElementById('promoVideo');

    modal.addEventListener('shown.bs.modal', () => {
        setTimeout(() => {
            video.currentTime = 0;
            video.load();
            video.play();
        }, 50);
    });

    modal.addEventListener('hidden.bs.modal', () => {
        video.pause();
        video.currentTime = 0;
    });
});

async function loadStats() {
    const res = await fetch("/api/stats");
    const data = await res.json();

    document.getElementById("stat-users").setAttribute("data-count", data.usuariosActivos);
    document.getElementById("stat-parking").setAttribute("data-count", data.estacionamientosActivos);
    document.getElementById("stat-stays").setAttribute("data-count", data.estanciasDiarias);


    document.querySelectorAll('.hero-stat-value').forEach(el => {
        runCounter(el);
    });
}

loadStats();
// ========================================
// SERVICE WORKER (preparado para PWA)
// ========================================

if ('serviceWorker' in navigator) {
    // Descomentar cuando tengas un service worker
    /*
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(reg => console.log('Service Worker registered'))
            .catch(err => console.log('Service Worker registration failed', err));
    });
    */
}

console.log('%cAll systems ready!', 'color: #10b981; font-size: 14px; font-weight: bold;');

console.log('FAQ JS cargado');