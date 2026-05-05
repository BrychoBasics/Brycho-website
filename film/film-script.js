document.addEventListener('DOMContentLoaded', () => {
    const cursor = document.getElementById('af-cursor');
    const uiElements = document.querySelectorAll('.fade-ui');
    let idleTimer;

    // --- Cursor & Idle Fade Logic ---
    function resetIdleTimer() {
        uiElements.forEach(el => el.classList.remove('idle'));
        clearTimeout(idleTimer);
        
        idleTimer = setTimeout(() => {
            uiElements.forEach(el => el.classList.add('idle'));
        }, 1500);
    }

    window.addEventListener('mousemove', (e) => {
        // Offset by half width/height (25px) to center the 50x50 box on cursor
        cursor.style.left = `${e.clientX}px`;
        cursor.style.top = `${e.clientY}px`;
        resetIdleTimer();
    });

    // Handle cursor leaving the window
    document.addEventListener('mouseout', () => {
        cursor.style.opacity = '0';
    });
    document.addEventListener('mouseover', () => {
        cursor.style.opacity = '1';
    });

    // --- Dynamic Work Details Logic ---
    const projectCards = document.querySelectorAll('.film-project-card');
    const titleEl = document.getElementById('dynamic-title');
    const rolesEl = document.getElementById('dynamic-roles');

    projectCards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            // Pull data from HTML data-attributes and inject it into the right panel
            titleEl.textContent = card.getAttribute('data-title');
            rolesEl.textContent = card.getAttribute('data-roles');
        });
    });
});