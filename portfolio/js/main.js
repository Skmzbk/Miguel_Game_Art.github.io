/**
 * ============================================
 * PORTFOLIO ARTÍSTICO - MAIN JAVASCRIPT
 * ============================================
 * Funcionalidades:
 * - Animaciones al hacer scroll (Scroll Reveal)
 * - Modal/Lightbox para galería
 * - Carga optimizada de imágenes (Lazy Loading mejorado)
 * - Menú móvil
 * - Navegación suave
 * - Filtros de galería
 * ============================================
 */

(function() {
    'use strict';

    /**
     * ============================================
     * CONFIGURACIÓN Y UTILIDADES
     * ============================================
     */

    // Configuración de animaciones
    const CONFIG = {
        scrollReveal: {
            threshold: 0.15, // Porcentaje del elemento visible para activar
            rootMargin: '0px 0px -50px 0px'
        },
        lazyLoad: {
            threshold: 0.01,
            rootMargin: '50px'
        }
    };

    /**
     * Utilidad: Debounce para optimizar eventos
     */
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

    /**
     * Utilidad: Verificar si un elemento está en el viewport
     */
    function isInViewport(element, threshold = 0) {
        const rect = element.getBoundingClientRect();
        const windowHeight = window.innerHeight || document.documentElement.clientHeight;
        const windowWidth = window.innerWidth || document.documentElement.clientWidth;
        
        return (
            rect.top >= -rect.height * threshold &&
            rect.left >= -rect.width * threshold &&
            rect.bottom <= windowHeight + rect.height * threshold &&
            rect.right <= windowWidth + rect.width * threshold
        );
    }

    /**
     * ============================================
     * SCROLL REVEAL ANIMATIONS
     * ============================================
     */

    const ScrollReveal = {
        /**
         * Inicializar animaciones de scroll
         */
        init() {
            // Seleccionar elementos que deben animarse
            const elementsToReveal = document.querySelectorAll('.section-header, .about-content, .gallery-item, .video-card, .contact-content');
            
            // Crear Intersection Observer para scroll reveal
            const revealObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('reveal', 'active');
                        // Dejar de observar una vez que se ha revelado
                        revealObserver.unobserve(entry.target);
                    }
                });
            }, {
                threshold: CONFIG.scrollReveal.threshold,
                rootMargin: CONFIG.scrollReveal.rootMargin
            });

            // Observar cada elemento
            elementsToReveal.forEach(element => {
                element.classList.add('reveal');
                revealObserver.observe(element);
            });
        }
    };

    /**
     * ============================================
     * LAZY LOADING MEJORADO
     * ============================================
     */

    const LazyLoad = {
        /**
         * Mejorar el lazy loading nativo con Intersection Observer
         */
        init() {
            // Seleccionar todas las imágenes que aún no se han cargado
            const lazyImages = document.querySelectorAll('img[loading="lazy"]');

            // Si el navegador soporta Intersection Observer
            if ('IntersectionObserver' in window) {
                const imageObserver = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            const img = entry.target;
                            
                            // Si la imagen aún no se ha cargado
                            if (img.dataset.src || !img.complete) {
                                // Agregar efecto de carga
                                img.style.opacity = '0';
                                img.style.transition = 'opacity 0.3s ease-in';
                                
                                // Si hay data-src, usarlo (para carga diferida)
                                if (img.dataset.src) {
                                    img.src = img.dataset.src;
                                    img.removeAttribute('data-src');
                                }
                                
                                // Cuando la imagen se carga, mostrar con fade-in
                                img.addEventListener('load', () => {
                                    img.style.opacity = '1';
                                }, { once: true });
                            }
                            
                            imageObserver.unobserve(img);
                        }
                    });
                }, {
                    threshold: CONFIG.lazyLoad.threshold,
                    rootMargin: CONFIG.lazyLoad.rootMargin
                });

                lazyImages.forEach(img => imageObserver.observe(img));
            }
        }
    };

    /**
     * ============================================
     * LIGHTBOX / MODAL PARA GALERÍA
     * ============================================
     */

    const Lightbox = {
        currentIndex: 0,
        items: [],

        /**
         * Inicializar lightbox
         */
        init() {
            // Seleccionar todos los items de galería
            const galleryItems = document.querySelectorAll('.gallery-item');
            this.items = Array.from(galleryItems);

            // Agregar event listeners a cada item
            this.items.forEach((item, index) => {
                item.addEventListener('click', () => this.open(index));
                item.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        this.open(index);
                    }
                });
            });
        },

        /**
         * Crear el modal de lightbox
         */
        createModal() {
            // Si ya existe, no crear otro
            if (document.querySelector('.lightbox-modal')) {
                return;
            }

            const modal = document.createElement('div');
            modal.className = 'lightbox-modal';
            modal.setAttribute('role', 'dialog');
            modal.setAttribute('aria-modal', 'true');
            modal.setAttribute('aria-label', 'Vista ampliada de la imagen');

            modal.innerHTML = `
                <div class="lightbox-backdrop"></div>
                <div class="lightbox-container">
                    <button class="lightbox-close" aria-label="Cerrar lightbox">
                        <span aria-hidden="true">&times;</span>
                    </button>
                    <button class="lightbox-prev" aria-label="Imagen anterior">
                        <span aria-hidden="true">‹</span>
                    </button>
                    <button class="lightbox-next" aria-label="Imagen siguiente">
                        <span aria-hidden="true">›</span>
                    </button>
                    <div class="lightbox-content">
                        <img class="lightbox-image" src="" alt="">
                        <div class="lightbox-info">
                            <h3 class="lightbox-title"></h3>
                            <p class="lightbox-category"></p>
                            <p class="lightbox-year"></p>
                        </div>
                    </div>
                    <div class="lightbox-counter">
                        <span class="lightbox-current">1</span> / <span class="lightbox-total">1</span>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);

            // Agregar event listeners
            const backdrop = modal.querySelector('.lightbox-backdrop');
            const closeBtn = modal.querySelector('.lightbox-close');
            const prevBtn = modal.querySelector('.lightbox-prev');
            const nextBtn = modal.querySelector('.lightbox-next');

            backdrop.addEventListener('click', () => this.close());
            closeBtn.addEventListener('click', () => this.close());
            prevBtn.addEventListener('click', () => this.prev());
            nextBtn.addEventListener('click', () => this.next());

            // Navegación con teclado
            document.addEventListener('keydown', this.handleKeydown.bind(this));
        },

        /**
         * Abrir lightbox en un índice específico
         */
        open(index) {
            this.createModal();
            this.currentIndex = index;
            this.updateLightbox();
            document.body.style.overflow = 'hidden';
            document.querySelector('.lightbox-modal').classList.add('active');
        },

        /**
         * Cerrar lightbox
         */
        close() {
            const modal = document.querySelector('.lightbox-modal');
            if (modal) {
                modal.classList.remove('active');
                document.body.style.overflow = '';
                
                // Remover después de la animación
                setTimeout(() => {
                    if (modal.parentNode) {
                        modal.parentNode.removeChild(modal);
                    }
                }, 300);
            }
            
            // Remover listener de teclado
            document.removeEventListener('keydown', this.handleKeydown.bind(this));
        },

        /**
         * Navegar a la imagen anterior
         */
        prev() {
            this.currentIndex = (this.currentIndex - 1 + this.items.length) % this.items.length;
            this.updateLightbox();
        },

        /**
         * Navegar a la imagen siguiente
         */
        next() {
            this.currentIndex = (this.currentIndex + 1) % this.items.length;
            this.updateLightbox();
        },

        /**
         * Actualizar contenido del lightbox
         */
        updateLightbox() {
            const item = this.items[this.currentIndex];
            const img = item.querySelector('.gallery-image');
            const overlayContent = item.querySelector('.overlay-content');
            
            const modal = document.querySelector('.lightbox-modal');
            if (!modal) return;

            const lightboxImage = modal.querySelector('.lightbox-image');
            const lightboxTitle = modal.querySelector('.lightbox-title');
            const lightboxCategory = modal.querySelector('.lightbox-category');
            const lightboxYear = modal.querySelector('.lightbox-year');
            const currentSpan = modal.querySelector('.lightbox-current');
            const totalSpan = modal.querySelector('.lightbox-total');

            // Actualizar imagen con efecto fade
            lightboxImage.style.opacity = '0';
            setTimeout(() => {
                lightboxImage.src = img.src;
                lightboxImage.alt = img.alt;
                lightboxImage.style.opacity = '1';
            }, 150);

            // Actualizar información
            if (overlayContent) {
                const title = overlayContent.querySelector('.gallery-item-title');
                const category = overlayContent.querySelector('.gallery-item-category');
                const year = overlayContent.querySelector('.gallery-item-year');

                lightboxTitle.textContent = title ? title.textContent : '';
                lightboxCategory.textContent = category ? category.textContent : '';
                lightboxYear.textContent = year ? year.textContent : '';
            }

            // Actualizar contador
            currentSpan.textContent = this.currentIndex + 1;
            totalSpan.textContent = this.items.length;
        },

        /**
         * Manejar eventos de teclado
         */
        handleKeydown(e) {
            switch(e.key) {
                case 'Escape':
                    this.close();
                    break;
                case 'ArrowLeft':
                    this.prev();
                    break;
                case 'ArrowRight':
                    this.next();
                    break;
            }
        }
    };

    /**
     * ============================================
     * MENÚ MÓVIL
     * ============================================
     */

    const MobileMenu = {
        /**
         * Inicializar menú móvil
         */
        init() {
            const toggleBtn = document.querySelector('.nav-toggle');
            const navMenu = document.querySelector('.nav-menu');
            const navLinks = document.querySelectorAll('.nav-link');

            if (!toggleBtn || !navMenu) return;

            // Toggle del menú
            toggleBtn.addEventListener('click', () => {
                const isExpanded = toggleBtn.getAttribute('aria-expanded') === 'true';
                toggleBtn.setAttribute('aria-expanded', !isExpanded);
                navMenu.classList.toggle('active');
                document.body.style.overflow = navMenu.classList.contains('active') ? 'hidden' : '';
            });

            // Cerrar menú al hacer click en un link
            navLinks.forEach(link => {
                link.addEventListener('click', () => {
                    toggleBtn.setAttribute('aria-expanded', 'false');
                    navMenu.classList.remove('active');
                    document.body.style.overflow = '';
                });
            });

            // Cerrar menú al hacer click fuera
            document.addEventListener('click', (e) => {
                if (!navMenu.contains(e.target) && !toggleBtn.contains(e.target)) {
                    if (navMenu.classList.contains('active')) {
                        toggleBtn.setAttribute('aria-expanded', 'false');
                        navMenu.classList.remove('active');
                        document.body.style.overflow = '';
                    }
                }
            });
        }
    };

    /**
     * ============================================
     * NAVEGACIÓN SUAVE Y ACTIVE LINK
     * ============================================
     */

    const Navigation = {
        /**
         * Inicializar navegación suave y active states
         */
        init() {
            const navLinks = document.querySelectorAll('.nav-link[href^="#"]');
            
            // Smooth scroll para links de navegación
            navLinks.forEach(link => {
                link.addEventListener('click', (e) => {
                    const href = link.getAttribute('href');
                    if (href === '#') return;

                    const target = document.querySelector(href);
                    if (target) {
                        e.preventDefault();
                        const navHeight = document.querySelector('.main-nav').offsetHeight;
                        const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - navHeight;

                        window.scrollTo({
                            top: targetPosition,
                            behavior: 'smooth'
                        });
                    }
                });
            });

            // Actualizar link activo al hacer scroll
            this.updateActiveLink();
            window.addEventListener('scroll', debounce(() => this.updateActiveLink(), 100));
        },

        /**
         * Actualizar el link activo basado en la posición del scroll
         */
        updateActiveLink() {
            const sections = document.querySelectorAll('section[id]');
            const navHeight = document.querySelector('.main-nav')?.offsetHeight || 0;
            const scrollPosition = window.pageYOffset + navHeight + 100;

            sections.forEach(section => {
                const sectionTop = section.offsetTop;
                const sectionHeight = section.offsetHeight;
                const sectionId = section.getAttribute('id');

                if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                    // Remover active de todos los links
                    document.querySelectorAll('.nav-link').forEach(link => {
                        link.classList.remove('active');
                    });

                    // Agregar active al link correspondiente
                    const activeLink = document.querySelector(`.nav-link[href="#${sectionId}"]`);
                    if (activeLink) {
                        activeLink.classList.add('active');
                    }
                }
            });
        }
    };

    /**
     * ============================================
     * FILTROS DE GALERÍA
     * ============================================
     */

    const GalleryFilters = {
        /**
         * Inicializar filtros de galería
         */
        init() {
            const filterButtons = document.querySelectorAll('.filter-btn');
            const galleryItems = document.querySelectorAll('.gallery-item');

            if (filterButtons.length === 0) return;

            filterButtons.forEach(button => {
                button.addEventListener('click', () => {
                    const filter = button.getAttribute('data-filter');

                    // Actualizar botones activos
                    filterButtons.forEach(btn => {
                        btn.classList.remove('active');
                        btn.setAttribute('aria-selected', 'false');
                    });
                    button.classList.add('active');
                    button.setAttribute('aria-selected', 'true');

                    // Filtrar items
                    galleryItems.forEach((item, index) => {
                        const category = item.getAttribute('data-category');
                        
                        if (filter === 'all' || category === filter) {
                            item.style.display = '';
                            item.style.animationDelay = `${index * 0.05}s`;
                            item.classList.add('reveal');
                            setTimeout(() => item.classList.add('active'), 50);
                        } else {
                            item.classList.remove('reveal', 'active');
                            setTimeout(() => {
                                item.style.display = 'none';
                            }, 300);
                        }
                    });
                });
            });
        }
    };

    /**
     * ============================================
     * VALIDACIÓN DE FORMULARIO
     * ============================================
     */

    const FormValidation = {
        /**
         * Inicializar validación de formulario
         */
        init() {
            const form = document.querySelector('.contact-form');
            if (!form) return;

            const inputs = form.querySelectorAll('.form-input, .form-textarea');

            inputs.forEach(input => {
                // Validación en tiempo real
                input.addEventListener('blur', () => this.validateField(input));
                input.addEventListener('input', () => {
                    if (input.classList.contains('error')) {
                        this.validateField(input);
                    }
                });
            });

            // Validación al enviar
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                let isValid = true;

                inputs.forEach(input => {
                    if (!this.validateField(input)) {
                        isValid = false;
                    }
                });

                if (isValid) {
                    this.handleSubmit(form);
                }
            });
        },

        /**
         * Validar un campo individual
         */
        validateField(field) {
            const errorElement = document.getElementById(`${field.id}-error`);
            let isValid = true;
            let errorMessage = '';

            // Validar campo requerido
            if (field.hasAttribute('required') && !field.value.trim()) {
                isValid = false;
                errorMessage = 'This field is required';
            }
            // Validar email
            else if (field.type === 'email' && field.value) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(field.value)) {
                    isValid = false;
                    errorMessage = 'Please enter a valid email';
                }
            }

            // Mostrar/ocultar error
            if (errorElement) {
                errorElement.textContent = errorMessage;
                field.classList.toggle('error', !isValid);
            }

            return isValid;
        },

        /**
         * Manejar envío del formulario
         */
        handleSubmit(form) {
            const submitBtn = form.querySelector('.form-submit');
            const originalText = submitBtn.textContent;

            // Mostrar estado de carga
            submitBtn.disabled = true;
            submitBtn.textContent = 'Sending...';
            submitBtn.classList.add('loading');

            // Simular envío (aquí conectarías con tu backend)
            setTimeout(() => {
                // Restaurar botón
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
                submitBtn.classList.remove('loading');

                // Mostrar mensaje de éxito (puedes personalizar esto)
                alert('Message sent successfully! I will contact you soon.');
                form.reset();

                // Remover clases de error
                form.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
            }, 1500);
        }
    };

    /**
     * ============================================
     * UTILIDADES ADICIONALES
     * ============================================
     */

    const Utilities = {
        /**
         * Inicializar utilidades
         */
        init() {
            // Actualizar año actual en el footer
            const yearElement = document.getElementById('current-year');
            if (yearElement) {
                yearElement.textContent = new Date().getFullYear();
            }

            // Prevenir animaciones en carga inicial si el usuario prefiere movimiento reducido
            if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
                document.body.classList.add('reduce-motion');
            }
        }
    };

    /**
     * ============================================
     * INICIALIZACIÓN
     * ============================================
     */

    // Esperar a que el DOM esté completamente cargado
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    function init() {
        // Inicializar todos los módulos
        ScrollReveal.init();
        LazyLoad.init();
        Lightbox.init();
        MobileMenu.init();
        Navigation.init();
        GalleryFilters.init();
        FormValidation.init();
        Utilities.init();

        console.log('✅ Portfolio inicializado correctamente');
    }

})();

