const hamburger = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');

hamburger.addEventListener('click', () => {
    navLinks.classList.toggle('active');
    hamburger.classList.toggle('active');
});

document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', () => {
        navLinks.classList.remove('active');
        hamburger.classList.remove('active');
    });
});

window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 50) {
        navbar.style.background = 'rgba(5, 5, 5, 0.98)';
        navbar.style.boxShadow = '0 2px 30px rgba(0, 0, 0, 0.7)';
    } else {
        navbar.style.background = 'rgba(5, 5, 5, 0.9)';
        navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.5)';
    }
});

const menuBtns = document.querySelectorAll('.menu-btn');
const menuItemsContainer = document.querySelector('.menu-items');
const allMenuItems = document.querySelectorAll('.menu-item');
const prevBtn = document.querySelector('.prev-btn');
const nextBtn = document.querySelector('.next-btn');
const carouselDots = document.querySelector('.carousel-dots');

const ITEM_WIDTH = 300;
const GAP = 20;
const MIN_WIDTH = 280;

let currentIndex = 0;
let visibleCount = 3;
let isAnimating = false;
let animationTimeout = null;
let scrollEndHandler = null; // Храним обработчик для возможности удаления

function getVisibleItems() {
    return Array.from(allMenuItems).filter(item => {
        const style = window.getComputedStyle(item);
        return style.display !== 'none';
    });
}

function calculateVisibleCount() {
    const containerWidth = menuItemsContainer.clientWidth;
    const items = getVisibleItems();
    const totalItems = items.length;
    
    let count = Math.floor((containerWidth + GAP) / (ITEM_WIDTH + GAP));
    count = Math.max(1, Math.min(count, totalItems));
    
    while (count > 1) {
        const neededWidth = count * ITEM_WIDTH + (count - 1) * GAP;
        if (neededWidth <= containerWidth) break;
        count--;
    }
    
    return count;
}

function getMaxIndex() {
    const items = getVisibleItems();
    return Math.max(0, items.length - visibleCount);
}

function getItemWidth() {
    const containerWidth = menuItemsContainer.clientWidth;
    const totalWidth = containerWidth - (visibleCount - 1) * GAP;
    return Math.floor(totalWidth / visibleCount);
}

function updateCardWidths() {
    const items = getVisibleItems();
    const width = getItemWidth();
    items.forEach(item => {
        item.style.width = width + 'px';
        item.style.minWidth = width + 'px';
        item.style.maxWidth = width + 'px';
    });
}

function updateDots() {
    if (!carouselDots) return;
    
    const maxIndex = getMaxIndex();
    const dotsNeeded = maxIndex + 1;
    
    const existingDots = carouselDots.querySelectorAll('.carousel-dot');
    
    if (existingDots.length !== dotsNeeded) {
        carouselDots.innerHTML = '';
        for (let i = 0; i < dotsNeeded; i++) {
            const dot = document.createElement('div');
            dot.classList.add('carousel-dot');
            if (i === currentIndex) dot.classList.add('active');
            dot.addEventListener('click', () => goToIndex(i));
            carouselDots.appendChild(dot);
        }
    } else {
        existingDots.forEach((dot, index) => {
            dot.classList.toggle('active', index === currentIndex);
        });
    }
}

function updateButtons() {
    if (!prevBtn || !nextBtn) return;
    
    prevBtn.style.display = 'flex';
    nextBtn.style.display = 'flex';
    
    if (carouselDots) {
        carouselDots.style.display = 'flex';
    }
    
    prevBtn.disabled = currentIndex === 0;
    nextBtn.disabled = currentIndex >= getMaxIndex();
}

function goToIndex(index) {
    const maxIndex = getMaxIndex();
    const targetIndex = Math.max(0, Math.min(index, maxIndex));
    
    // Если уже на этой позиции - не делаем ничего
    const itemWidth = getItemWidth();
    const targetScrollPosition = targetIndex * (itemWidth + GAP);
    const currentScrollLeft = menuItemsContainer.scrollLeft;
    
    // Проверяем: если индекс тот же и мы близко к целевой позиции
    if (targetIndex === currentIndex && Math.abs(currentScrollLeft - targetScrollPosition) < 10) {
        return;
    }
    
    // Полностью очищаем предыдущее состояние анимации
    cleanupAnimation();
    
    // Устанавливаем новое состояние
    currentIndex = targetIndex;
    isAnimating = true;
    
    // Обновляем UI сразу
    updateDots();
    updateButtons();
    
    // Запускаем прокрутку
    menuItemsContainer.scrollTo({
        left: targetScrollPosition,
        behavior: 'smooth'
    });
    
    // Настраиваем обработчик завершения анимации
    setupAnimationCompleteHandler();
}

function cleanupAnimation() {
    // Очищаем таймаут
    if (animationTimeout) {
        clearTimeout(animationTimeout);
        animationTimeout = null;
    }
    
    // Удаляем предыдущий scrollend handler
    if (scrollEndHandler) {
        menuItemsContainer.removeEventListener('scrollend', scrollEndHandler);
        scrollEndHandler = null;
    }
    
    // Принудительно завершаем текущую плавную прокрутку
    if (isAnimating) {
        const currentPos = menuItemsContainer.scrollLeft;
        menuItemsContainer.scrollTo({
            left: currentPos,
            behavior: 'instant'
        });
    }
    
    isAnimating = false;
}

function setupAnimationCompleteHandler() {
    const itemWidth = getItemWidth();
    const targetScrollPosition = currentIndex * (itemWidth + GAP);
    
    // Функция завершения анимации
    const completeAnimation = () => {
        if (!isAnimating) return; // Уже завершено
        
        cleanupAnimation();
        
        // Корректируем позицию если нужно (на случай если скролл не точно остановился)
        const currentPos = menuItemsContainer.scrollLeft;
        if (Math.abs(currentPos - targetScrollPosition) > 5) {
            menuItemsContainer.scrollTo({
                left: targetScrollPosition,
                behavior: 'instant'
            });
        }
    };
    
    // Используем scrollend если доступно
    if ('onscrollend' in window) {
        scrollEndHandler = () => {
            // Небольшая задержка чтобы скролл точно завершился
            requestAnimationFrame(() => {
                requestAnimationFrame(completeAnimation);
            });
        };
        menuItemsContainer.addEventListener('scrollend', scrollEndHandler, { once: true });
    }
    
    // Fallback таймаут (всегда работает)
    animationTimeout = setTimeout(completeAnimation, 600);
}

function nextSlide() {
    goToIndex(currentIndex + 1);
}

function prevSlide() {
    goToIndex(currentIndex - 1);
}

function initCarousel() {
    visibleCount = calculateVisibleCount();
    currentIndex = 0;
    
    cleanupAnimation();
    
    updateCardWidths();
    menuItemsContainer.scrollTo({ left: 0, behavior: 'instant' });
    
    updateDots();
    updateButtons();
}

function updateCarouselOnResize() {
    const newVisibleCount = calculateVisibleCount();
    const maxIndex = Math.max(0, getVisibleItems().length - newVisibleCount);
    
    if (currentIndex > maxIndex) {
        currentIndex = maxIndex;
    }
    
    visibleCount = newVisibleCount;
    
    updateCardWidths();
    
    const itemWidth = getItemWidth();
    const scrollPosition = currentIndex * (itemWidth + GAP);
    menuItemsContainer.scrollTo({ left: scrollPosition, behavior: 'instant' });
    
    updateDots();
    updateButtons();
}

menuBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        menuBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const filter = btn.getAttribute('data-filter');

        allMenuItems.forEach(item => {
            if (filter === 'all' || item.getAttribute('data-category') === filter) {
                item.style.display = 'block';
            } else {
                item.style.display = 'none';
            }
        });

        setTimeout(initCarousel, 50);
    });
});

if (prevBtn && nextBtn) {
    prevBtn.addEventListener('click', prevSlide);
    nextBtn.addEventListener('click', nextSlide);
}

let touchStartX = 0;
let touchEndX = 0;

if (menuItemsContainer) {
    menuItemsContainer.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    menuItemsContainer.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        const diff = touchStartX - touchEndX;
        if (Math.abs(diff) > 50) {
            diff > 0 ? nextSlide() : prevSlide();
        }
    }, { passive: true });
}

if (menuItemsContainer) {
    let scrollTimeout;
    let lastScrollLeft = 0;
    let scrollDirection = 0;
    
    menuItemsContainer.addEventListener('scroll', () => {
        // Полностью игнорируем скролл во время программной анимации
        if (isAnimating) return;
        
        const currentScrollLeft = menuItemsContainer.scrollLeft;
        scrollDirection = currentScrollLeft > lastScrollLeft ? 1 : -1;
        lastScrollLeft = currentScrollLeft;
        
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
            // Дополнительная проверка после дебаунса
            if (isAnimating) return;
            
            const items = getVisibleItems();
            if (items.length === 0) return;
            
            const itemWidth = getItemWidth();
            const scrollLeft = menuItemsContainer.scrollLeft;
            const newIndex = Math.round(scrollLeft / (itemWidth + GAP));
            const maxIndex = getMaxIndex();
            
            // Проверяем что индекс валиден и изменился
            if (newIndex >= 0 && newIndex <= maxIndex && newIndex !== currentIndex) {
                currentIndex = newIndex;
                updateDots();
                updateButtons();
            }
        }, 150); // Увеличил дебаунс для надёжности
    });
}

document.addEventListener('DOMContentLoaded', () => setTimeout(initCarousel, 100));
window.addEventListener('load', () => setTimeout(initCarousel, 100));

let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(updateCarouselOnResize, 150);
});

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            const headerOffset = 80;
            const elementPosition = target.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
            window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
        }
    });
});

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('aos-animate');
            observer.unobserve(entry.target);
        }
    });
}, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

document.querySelectorAll('[data-aos], .gallery-item, .feature, .info-item, .res-feature').forEach(el => {
    observer.observe(el);
});

window.addEventListener('scroll', () => {
    const hero = document.querySelector('.hero');
    const scrolled = window.pageYOffset;
    if (hero && scrolled < window.innerHeight) {
        hero.style.backgroundPositionY = scrolled * 0.3 + 'px';
    }
});

const reservationForm = document.getElementById('reservationForm');
const successModal = document.getElementById('successModal');
const modalClose = document.querySelector('.modal-close');
const modalBtn = document.querySelector('.modal-btn');
const modalOverlay = document.querySelector('.modal-overlay');

const dateInput = document.getElementById('date');
if (dateInput) {
    dateInput.setAttribute('min', new Date().toISOString().split('T')[0]);
}

if (reservationForm) {
    reservationForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(reservationForm);
        const data = Object.fromEntries(formData);
        
        if (!data.name || !data.phone || !data.date || !data.time || !data.guests || !data.table) {
            alert('Пожалуйста, заполните все обязательные поля');
            return;
        }
        
        successModal.classList.add('active');
        document.body.style.overflow = 'hidden';
        reservationForm.reset();
    });
}

function hideModal() {
    if (successModal) {
        successModal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

if (modalClose) modalClose.addEventListener('click', hideModal);
if (modalBtn) modalBtn.addEventListener('click', hideModal);
if (modalOverlay) modalOverlay.addEventListener('click', hideModal);

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        hideModal();
        if (navLinks.classList.contains('active')) {
            navLinks.classList.remove('active');
            hamburger.classList.remove('active');
        }
    }
});

const phoneInput = document.getElementById('phone');
if (phoneInput) {
    phoneInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 0) {
            if (value[0] === '7' || value[0] === '8') value = value.substring(1);
            let formatted = '+7 (';
            if (value.length > 0) formatted += value.substring(0, 3);
            if (value.length >= 3) formatted += ') ' + value.substring(3, 6);
            if (value.length >= 6) formatted += '-' + value.substring(6, 8);
            if (value.length >= 8) formatted += '-' + value.substring(8, 10);
            e.target.value = formatted;
        }
    });
}
