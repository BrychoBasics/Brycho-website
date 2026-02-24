
// Initialize Swup
const swup = new Swup();

// Tell Swup to lock the scroll position instead of jumping to the top
swup.hooks.on('visit:start', (visit) => {
    visit.scroll.reset = false;
});


// ========================================
// UNIFIED ROUTING & ACTIVE LINKS
// ========================================

// 1. Master function to update active states for ALL links
function updateActiveLinks() {
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    const allNavLinks = document.querySelectorAll('.nav-link');
    
    allNavLinks.forEach(link => {
        // Remove active state and inline styles
        link.classList.remove('active', 'glass-3d-btn');
        link.removeAttribute('style'); 
        
        const linkHref = link.getAttribute('href');
        
        // If it's a match, apply active styling
        if (linkHref === currentPath || (window.location.pathname === '/' && linkHref === 'index.html')) {
            link.classList.add('active', 'glass-3d-btn');
        }
    });
}

// 2. Run on initial page load
document.addEventListener('DOMContentLoaded', () => {
    updateActiveLinks();
    
    // Wire up the new mobile buttons to the desktop menus
    const mobileLoginBtn = document.getElementById('mobile-login-toggle-btn');
    const mobileShareBtn = document.getElementById('mobile-share-btn');
    const loginMenu = document.querySelector('.login-menu');
    const shareMenu = document.querySelector('.share-menu');

    if (mobileLoginBtn && loginMenu) {
        mobileLoginBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            loginMenu.classList.toggle('is-open');
            if (shareMenu) shareMenu.classList.remove('is-open'); // Close share if open
        });
    }

    if (mobileShareBtn && shareMenu) {
        mobileShareBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            shareMenu.classList.toggle('is-open');
            if (loginMenu) loginMenu.classList.remove('is-open'); // Close login if open
        });
    }
});

// 3. Run after every Swup page transition
swup.hooks.on('page:view', () => {
    updateActiveLinks();
    updateCustomScrollbar();
    
    if (window.syncBackgroundScroll) {
        window.syncBackgroundScroll();
    }
});


// ========================================
// MOBILE MENU TOGGLE
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    const hamburger = document.querySelector('.hamburger');
    const mobileMenu = document.querySelector('.mobile-menu');
    
    if (hamburger && mobileMenu) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('is-active');
            mobileMenu.classList.toggle('is-open');
            document.body.classList.toggle('mobile-menu-open'); 
        });

        // Safe inside the 'if' block!
        const mobileNavLinks = document.querySelectorAll('.mobile-menu .nav-link');
        mobileNavLinks.forEach(link => {
            link.addEventListener('click', () => {
                mobileMenu.classList.remove('is-open');
                hamburger.classList.remove('is-active');
                document.body.classList.remove('mobile-menu-open');
            });
        });
    }
});


// ========================================
// NAVIGATION SYSTEM
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    const reactiveElements = document.querySelectorAll('.glass-3d-btn, .login-menu, .share-menu');

    reactiveElements.forEach(el => {
        el.addEventListener('mousemove', (e) => {
            const rect = el.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            // 1. Calculate the raw distance
            const offsetX = x - centerX;
            const offsetY = y - centerY;

            // 2. Normalize the distance (returns a value between -1 and 1)
            // This ensures a giant menu and a tiny button return the exact same ratios
            const normalizedX = offsetX / centerX;
            const normalizedY = offsetY / centerY;

            // 3. Apply the EXACT absolute pixel limits from your 48px social buttons
            // This locks the white glare to a maximum of ~0.7px thick, regardless of element size
            const insetX = normalizedX * 0.7; 
            const insetY = normalizedY * 1.5; 
            const shadowX = normalizedX * 2;
            const shadowY = normalizedY * 4;

            const isMenu = el.classList.contains('login-menu') || el.classList.contains('share-menu');
            const dropShadow = isMenu 
                ? `${shadowX}px ${shadowY + 8}px 24px rgba(0, 0, 0, 0.4)` 
                : `${shadowX}px ${shadowY + 4}px 8px rgba(0, 0, 0, 0.2)`; 

            el.style.boxShadow = `
                inset ${insetX}px ${insetY + 1}px 3px rgba(255, 255, 255, 0.4),
                inset ${-insetX}px ${-insetY - 1}px 3px rgba(0, 0, 0, 0.2),
                ${dropShadow}
            `;
        });

        el.addEventListener('mouseleave', () => {
            el.style.transition = 'box-shadow 0.6s ease, background 0.4s ease, transform 0.2s ease';
            el.style.boxShadow = '';
            
            setTimeout(() => {
                el.style.transition = 'box-shadow 0.15s ease-out, transform 0.2s ease, background 0.3s ease';
            }, 600);
        });
    });
});



// =========================================
// CUSTOM SCROLLBAR ENGINE
// =========================================
const scrollbar = document.querySelector('.custom-scrollbar');
const thumb = document.querySelector('.custom-scroll-thumb');

let scrollTimeout;
let isDragging = false;
let startY;
let startScrollY;

function updateCustomScrollbar() {
    if (!thumb || !scrollbar) return;

    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    
    // Hide entirely if page is too short to scroll
    if (documentHeight <= windowHeight) {
        scrollbar.style.display = 'none';
        return;
    } else {
        scrollbar.style.display = 'block';
    }

    const scrollRatio = windowHeight / documentHeight;
    const thumbHeight = Math.max(scrollRatio * windowHeight, 40);
    thumb.style.height = `${thumbHeight}px`;

    const scrollY = window.scrollY;
    const maxScroll = documentHeight - windowHeight;
    const maxThumbScroll = windowHeight - thumbHeight - 4;
    
    const thumbPosition = (scrollY / maxScroll) * maxThumbScroll;
    thumb.style.transform = `translateY(${thumbPosition}px)`;

    // Auto-Hide Timer: Show scrollbar while scrolling, hide after 1 second of inactivity
    if (!isDragging) {
        scrollbar.classList.add('is-scrolling');
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
            scrollbar.classList.remove('is-scrolling');
        }, 1000);
    }
}

// Attach Drag Mechanics
if (thumb && scrollbar) {
    // 1. User clicks the thumb
    thumb.addEventListener('mousedown', (e) => {
        isDragging = true;
        startY = e.clientY;
        startScrollY = window.scrollY;
        
        scrollbar.classList.add('is-dragging');
        document.body.classList.add('is-dragging-scrollbar');
    });

    // 2. User moves the mouse while holding the click
    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;
        const maxScroll = documentHeight - windowHeight;
        const maxThumbScroll = windowHeight - thumb.offsetHeight - 4;
        
        // Calculate physical mouse movement
        const deltaY = e.clientY - startY;
        
        // Convert mouse movement into page scroll distance
        const scrollMultiplier = maxScroll / maxThumbScroll;
        window.scrollTo(0, startScrollY + (deltaY * scrollMultiplier));
    });

    // 3. User releases the click
    document.addEventListener('mouseup', () => {
        if (!isDragging) return;
        isDragging = false;
        
        scrollbar.classList.remove('is-dragging');
        document.body.classList.remove('is-dragging-scrollbar');
        
        // Trigger the fade-out timer now that dragging stopped
        updateCustomScrollbar();
    });
}

// Event Listeners
window.addEventListener('scroll', updateCustomScrollbar);
window.addEventListener('resize', updateCustomScrollbar);
updateCustomScrollbar(); // Run on initial load

