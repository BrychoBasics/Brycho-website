
// Initialize Swup
const swup = new Swup();


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