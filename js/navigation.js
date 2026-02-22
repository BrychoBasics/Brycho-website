
// Initialize Swup
const swup = new Swup();

// Tell Swup to lock the scroll position instead of jumping to the top
swup.hooks.on('visit:start', (visit) => {
    visit.scroll.reset = false;
});


// Tell the header to update the active link after every page transition
swup.hooks.on('page:view', () => {
    // Get the current URL path (e.g., '/valheim.html' or '/')
    const currentPath = window.location.pathname;
    
    // Select all your desktop navigation links
    const navLinks = document.querySelectorAll('.desktop-links .nav-link');
    
    navLinks.forEach(link => {
        // 1. Remove the active classes from ALL links
        link.classList.remove('active', 'glass-3d-btn');
        
        // 2. Wipe out any inline box-shadows left behind by the hover script
        link.removeAttribute('style'); 
        
        // 3. Look at where this specific link is trying to go
        const linkHref = link.getAttribute('href');
        
        if (currentPath.endsWith(linkHref) || (currentPath.endsWith('/') && linkHref === 'index.html')) {
            link.classList.add('active', 'glass-3d-btn');
        }

        
    });

    // Force the scrollbar to recalculate its size for the new page
    updateCustomScrollbar();

    if (window.syncBackgroundScroll) {
        window.syncBackgroundScroll();
    }
    
});



// ========================================
// NAVIGATION SYSTEM
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    const hamburger = document.querySelector('.hamburger');
    const mobileMenu = document.querySelector('.mobile-menu');
    
    if (hamburger && mobileMenu) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            mobileMenu.classList.toggle('active');
            
            // Prevent body scroll when menu is open
            if (mobileMenu.classList.contains('active')) {
                document.body.style.overflow = 'hidden';
            } else {
                document.body.style.overflow = '';
            }
        });
        
        // Close menu when clicking a link
        mobileMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('active');
                mobileMenu.classList.remove('active');
                document.body.style.overflow = '';
            });
        });
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const glassBtns = document.querySelectorAll('.glass-3d-btn');

    glassBtns.forEach(btn => {
        // We no longer kill the transition on mouseenter.
        // It uses the CSS 0.15s ease-out to smoothly catch up to the cursor.

        btn.addEventListener('mousemove', (e) => {
            const rect = btn.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const offsetX = x - centerX;
            const offsetY = y - centerY;

            const shadowX = offsetX / 12; 
            const shadowY = offsetY / 6;
            const insetX = offsetX / 35;
            const insetY = offsetY / 15;

            // Apply dynamic shadow (CSS handles the smoothing)
            btn.style.boxShadow = `
                inset ${insetX}px ${insetY + 1}px 3px rgba(255, 255, 255, 0.4),
                inset ${-insetX}px ${-insetY - 1}px 3px rgba(0, 0, 0, 0.2),
                ${shadowX}px ${shadowY + 4}px 8px rgba(0, 0, 0, 0.2)
            `;
        });

        btn.addEventListener('mouseleave', () => {
            // Keep the background and transform transitions intact while updating the shadow speed
            btn.style.transition = 'box-shadow 0.6s ease, background 0.4s ease, transform 0.2s ease';
            
            btn.style.boxShadow = `
                inset 0 1px 2px rgba(255, 255, 255, 0.3), 
                inset 0 -1px 2px rgba(0, 0, 0, 0.2), 
                0 4px 6px rgba(0, 0, 0, 0.15)
            `;
            
            setTimeout(() => {
                btn.style.transition = 'box-shadow 0.15s ease-out, transform 0.2s ease, background 0.3s ease';
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