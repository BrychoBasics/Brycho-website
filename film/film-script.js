document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. Cursor & Idle Fade Logic ---
    const cursor = document.getElementById('af-cursor');
    const uiElements = document.querySelectorAll('.fade-ui');
    const cursorFade = document.querySelectorAll('.cursor-fade'); // For your fixed cursor fade
    let idleTimer;

    function resetIdleTimer() {
        uiElements.forEach(el => el.classList.remove('idle'));
        cursorFade.forEach(el => el.classList.remove('idle'));
        clearTimeout(idleTimer);
        
        idleTimer = setTimeout(() => {
            uiElements.forEach(el => el.classList.add('idle'));
            cursorFade.forEach(el => el.classList.add('idle'));
        }, 1500);
    }

    window.addEventListener('mousemove', (e) => {
        // Center the custom cursor
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

    // --- 2. Reel Play/Pause & Seeking Logic ---
    const reel = document.getElementById('main-reel');
    const progressBar = document.getElementById('reel-progress');
    const timelineContainer = document.querySelector('.timeline-container');

    // Click video to Play/Pause
    reel.addEventListener('click', () => {
        if (reel.paused) {
            reel.play();
        } else {
            reel.pause();
        }
    });

    // Update red progress bar
    reel.addEventListener('timeupdate', () => {
        const percentage = (reel.currentTime / reel.duration) * 100;
        progressBar.style.width = `${percentage}%`;
    });

    // Click timeline to Seek
    timelineContainer.addEventListener('click', (e) => {
        const rect = timelineContainer.getBoundingClientRect();
        const clickX = e.clientX - rect.left; // Where inside the container you clicked
        const percentage = clickX / rect.width;
        reel.currentTime = percentage * reel.duration;
    });

   // --- 3. Bulletproof Hover & Fullscreen Logic ---
    const titleEl = document.getElementById('dynamic-title');
    const rolesEl = document.getElementById('dynamic-roles');
    const descEl = document.getElementById('dynamic-desc'); 

    const modal = document.getElementById('fullscreen-modal');
    const modalVideo = document.getElementById('modal-video');
    const closeModalBtn = document.getElementById('close-modal');

    // Bulletproof Hover: Triggers no matter what child layer you touch
    document.addEventListener('mouseover', (e) => {
        const card = e.target.closest('.film-project-card');
        if (card) {
            titleEl.textContent = card.getAttribute('data-title') || 'Untitled';
            rolesEl.textContent = card.getAttribute('data-roles') || '';
            if (descEl) {
                descEl.textContent = card.getAttribute('data-desc') || '';
            }
        }
    });

    // Bulletproof Click: Opens modal
    document.addEventListener('click', (e) => {
        const card = e.target.closest('.film-project-card');
        // Make sure we clicked a card, and it's NOT a coming soon card
        if (card && !card.classList.contains('coming-soon-card')) {
            const fullVideoSrc = card.getAttribute('data-video');
            if (fullVideoSrc && fullVideoSrc !== "") {
                modalVideo.src = fullVideoSrc; 
                modal.classList.add('active'); 
                modalVideo.play();             
            }
        }
    });

    // CLOSE MODAL LOGIC
    function closeFullscreen() {
        modal.classList.remove('active');
        modalVideo.pause();
        modalVideo.src = ""; // Stops download in background
    }

    closeModalBtn.addEventListener('click', closeFullscreen);

    modal.addEventListener('click', (e) => {
        if (e.target === modal) { 
            closeFullscreen();
        }
    });
}); // <-- Make sure this final closing bracket remains at the very bottom of your file!