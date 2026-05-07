document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. Cursor & Idle Fade Logic ---
    const cursor = document.getElementById('af-cursor');
    const uiElements = document.querySelectorAll('.fade-ui');
    const cursorFade = document.querySelectorAll('.cursor-fade'); 
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
        cursor.style.left = `${e.clientX}px`;
        cursor.style.top = `${e.clientY}px`;
        resetIdleTimer();
    });

    document.addEventListener('mouseout', () => {
        cursor.style.opacity = '0';
    });
    document.addEventListener('mouseover', () => {
        cursor.style.opacity = '1';
    });

   // --- Unified Video Player Engine ---
    function setupVideoController(wrapperId, videoId) {
        const wrapper = document.getElementById(wrapperId);
        const video = document.getElementById(videoId);
        if (!wrapper || !video) return;

        const btnPlayPause = wrapper.querySelector('.ctrl-playpause');
        const iconPlay = wrapper.querySelector('.icon-play');
        const iconPause = wrapper.querySelector('.icon-pause');
        
        const volContainer = wrapper.querySelector('.ctrl-volume-container');
        const volFill = wrapper.querySelector('.volume-fill');
        const iconSound = wrapper.querySelector('.icon-sound');
        const iconMute = wrapper.querySelector('.icon-mute');

        const btnFS = wrapper.querySelector('.ctrl-fullscreen');
        const iconExpand = wrapper.querySelector('.icon-expand');
        const iconShrink = wrapper.querySelector('.icon-shrink');

        // Play/Pause Toggle
        function togglePlay() {
            if (video.paused) {
                video.play();
                iconPlay.classList.add('hidden');
                iconPause.classList.remove('hidden');
            } else {
                video.pause();
                iconPause.classList.add('hidden');
                iconPlay.classList.remove('hidden');
            }
        }
        if (btnPlayPause) btnPlayPause.addEventListener('click', togglePlay);
        video.addEventListener('click', togglePlay); // Click video to toggle

        // Volume Drag & Toggle Logic
        let isDraggingVol = false;

        function updateVolume(e) {
            const rect = volContainer.getBoundingClientRect();
            // Calculate height from bottom of the square
            let y = rect.bottom - e.clientY;
            let percentage = Math.max(0, Math.min(1, y / rect.height));
            
            video.volume = percentage;
            volFill.style.height = `${percentage * 100}%`;

            if (percentage === 0) {
                video.muted = true;
                iconSound.classList.add('hidden');
                iconMute.classList.remove('hidden');
            } else {
                video.muted = false;
                iconMute.classList.add('hidden');
                iconSound.classList.remove('hidden');
            }
        }

        if (volContainer) {
            // Click to toggle mute/unmute
            volContainer.addEventListener('click', (e) => {
                // If they just clicked (not dragged), toggle mute
                if (!isDraggingVol) {
                    video.muted = !video.muted;
                    if (video.muted) {
                        volFill.style.height = '0%';
                        iconSound.classList.add('hidden');
                        iconMute.classList.remove('hidden');
                    } else {
                        volFill.style.height = `${video.volume * 100}%`;
                        iconMute.classList.add('hidden');
                        iconSound.classList.remove('hidden');
                    }
                }
            });

            // Drag to set exact volume
            volContainer.addEventListener('mousedown', (e) => {
                isDraggingVol = true;
                updateVolume(e);
            });
            document.addEventListener('mousemove', (e) => {
                if (isDraggingVol) updateVolume(e);
            });
            document.addEventListener('mouseup', () => {
                setTimeout(() => isDraggingVol = false, 50); // slight delay to prevent click fire
            });
        }

        // Fullscreen Toggle
        if (btnFS) {
            btnFS.addEventListener('click', () => {
                if (!document.fullscreenElement) {
                    wrapper.requestFullscreen().catch(err => console.log(err));
                    iconExpand.classList.add('hidden');
                    iconShrink.classList.remove('hidden');
                } else {
                    document.exitFullscreen();
                    iconShrink.classList.add('hidden');
                    iconExpand.classList.remove('hidden');
                }
            });
        }
    }

    // Initialize both players
    setupVideoController('reel-player-wrapper', 'main-reel');
    setupVideoController('modal-player-wrapper', 'modal-video');


    // --- HLS Reel Initialization ---
    const reelVideo = document.getElementById('main-reel');
    if (reelVideo) {
        // Pointing to your specific cambike folder!
        const reelSrc = "assets/cambike/master-cambike.m3u8"; 
        
        if (typeof Hls !== 'undefined' && Hls.isSupported()) {
            const hlsReel = new Hls();
            hlsReel.loadSource(reelSrc);
            hlsReel.attachMedia(reelVideo);
            
            // Explicitly tell it to play once loaded
            hlsReel.on(Hls.Events.MANIFEST_PARSED, function() {
                reelVideo.play();
                
                // Update the custom controls to show the pause icon
                const wrapper = document.getElementById('reel-player-wrapper');
                if(wrapper) {
                    wrapper.querySelector('.icon-play').classList.add('hidden');
                    wrapper.querySelector('.icon-pause').classList.remove('hidden');
                }
            });
        } else if (reelVideo.canPlayType('application/vnd.apple.mpegurl')) {
            reelVideo.src = reelSrc;
            reelVideo.addEventListener('loadedmetadata', function() {
                reelVideo.play();
            });
        }
        
        const progressBar = document.getElementById('reel-progress');
        reelVideo.addEventListener('timeupdate', () => {
            if (reelVideo.duration) {
                progressBar.style.width = `${(reelVideo.currentTime / reelVideo.duration) * 100}%`;
            }
        });
    }

    // --- Hover Text Logic ---
    const titleEl = document.getElementById('dynamic-title');
    const rolesEl = document.getElementById('dynamic-roles');
    const descEl = document.getElementById('dynamic-desc');

    document.addEventListener('mouseover', (e) => {
        const card = e.target.closest('.film-project-card');
        if (card) {
            if (titleEl) titleEl.textContent = card.getAttribute('data-title') || 'Untitled';
            if (rolesEl) rolesEl.textContent = card.getAttribute('data-roles') || '';
            if (descEl) descEl.textContent = card.getAttribute('data-desc') || '';
        }
    });

    // --- Modal Open, Close, 65% Volume & HLS Logic ---
    const modal = document.getElementById('fullscreen-modal');
    const modalVideo = document.getElementById('modal-video');
    const closeModalBtn = document.getElementById('close-modal');
    const modalVolFill = document.querySelector('#modal-player-wrapper .volume-fill'); // Grabs the UI fill

    document.addEventListener('click', (e) => {
        const card = e.target.closest('.film-project-card');
        if (card && !card.classList.contains('coming-soon-card')) {
            const fullVideoSrc = card.getAttribute('data-video');
            
            if (fullVideoSrc && fullVideoSrc !== "") {
                modal.classList.add('active'); 

                // Load HLS
                if (typeof Hls !== 'undefined' && Hls.isSupported()) {
                    const hlsModal = new Hls();
                    hlsModal.loadSource(fullVideoSrc);
                    hlsModal.attachMedia(modalVideo);
                    hlsModal.on(Hls.Events.MANIFEST_PARSED, function() {
                        // Set Volume to 65%
                        modalVideo.volume = 0.65;
                        modalVideo.muted = false;
                        if (modalVolFill) modalVolFill.style.height = '65%';

                        modalVideo.play();
                        
                        const wrapper = document.getElementById('modal-player-wrapper');
                        if(wrapper) {
                            wrapper.querySelector('.icon-play').classList.add('hidden');
                            wrapper.querySelector('.icon-pause').classList.remove('hidden');
                        }
                    });
                }
            }
        }
    });

    // --- The Fullscreen Cursor Fix ---
    // Update your setupVideoController function's Fullscreen section to this:
    if (btnFS) {
        btnFS.addEventListener('click', () => {
            const customCursor = document.getElementById('af-cursor');
            
            if (!document.fullscreenElement) {
                wrapper.requestFullscreen().then(() => {
                    // Moves the cursor INSIDE the fullscreen container
                    wrapper.appendChild(customCursor); 
                }).catch(err => console.log(err));
                iconExpand.classList.add('hidden');
                iconShrink.classList.remove('hidden');
            } else {
                document.exitFullscreen().then(() => {
                    // Moves the cursor back to the main body when exiting
                    document.body.appendChild(customCursor); 
                });
                iconShrink.classList.add('hidden');
                iconExpand.classList.remove('hidden');
            }
        });
    }


    // 2. Close Modal Logic
    function closeFullscreen() {
        if (modal) modal.classList.remove('active');
        if (modalVideo) {
            modalVideo.pause();
            modalVideo.removeAttribute('src'); // Stops the browser from downloading chunks in the background
            modalVideo.load();
        }
    }

    if (closeModalBtn) closeModalBtn.addEventListener('click', closeFullscreen);

    modal.addEventListener('click', (e) => {
        if (e.target === modal) { 
            closeFullscreen();
        }
    });
}); // <-- Final closing bracket