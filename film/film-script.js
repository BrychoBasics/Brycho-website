document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. Cursor & Idle Fade Logic ---
    const cursor = document.getElementById('af-cursor');
    const uiElements = document.querySelectorAll('.fade-ui');
    const cursorFade = document.querySelectorAll('.cursor-fade'); 
    let idleTimer;
    let isHoveringVideo = false;

    function resetIdleTimer() {
        uiElements.forEach(el => el.classList.remove('idle'));
        cursorFade.forEach(el => el.classList.remove('idle'));
        clearTimeout(idleTimer);
        
        idleTimer = setTimeout(() => {
            uiElements.forEach(el => el.classList.add('idle'));
            if (isHoveringVideo) {
                cursorFade.forEach(el => el.classList.add('idle'));
            }
        }, 1500);
    }

    window.addEventListener('mousemove', (e) => {
        cursor.style.left = `${e.clientX}px`;
        cursor.style.top = `${e.clientY}px`;
        isHoveringVideo = !!e.target.closest('.video-player-wrapper');
        resetIdleTimer();
    });

    // Wake up the UI when the user scrolls the page
    const scrollContainer = document.querySelector('.scroll-container');
    if (scrollContainer) {
        scrollContainer.addEventListener('scroll', resetIdleTimer);
    }

    // Start the timer immediately on load so things hide if you do nothing
    resetIdleTimer();

    document.addEventListener('mouseout', () => cursor.style.opacity = '0');
    document.addEventListener('mouseover', () => cursor.style.opacity = '1');

    // --- 1.5. Mutually Exclusive Audio Engine ---
    function muteOtherVideos(currentVideoElement) {
        const allVideos = document.querySelectorAll('.video-player-wrapper video');
        allVideos.forEach(vid => {
            // If it's a different video and it is currently playing sound
            if (vid !== currentVideoElement && !vid.muted) {
                vid.muted = true;
                const wrapper = vid.closest('.video-player-wrapper');
                if (wrapper) {
                    const volFill = wrapper.querySelector('.volume-fill');
                    const iconSound = wrapper.querySelector('.icon-sound');
                    const iconMute = wrapper.querySelector('.icon-mute');
                    if (volFill) volFill.style.height = '0%';
                    if (iconSound) iconSound.classList.add('hidden');
                    if (iconMute) iconMute.classList.remove('hidden');
                }
            }
        });
    }

    // --- 2. Unified Auto-Detecting Video Engine ---
    function setupVideoController(wrapperId, videoId) {
        const wrapper = document.getElementById(wrapperId);
        const video = document.getElementById(videoId);
        if (!wrapper || !video) return;

        // Auto-detect UI elements inside this specific wrapper
        const btnPlayPause = wrapper.querySelector('.ctrl-playpause');
        const iconPlay = wrapper.querySelector('.icon-play');
        const iconPause = wrapper.querySelector('.icon-pause');
        const volContainer = wrapper.querySelector('.ctrl-volume-container');
        const volFill = wrapper.querySelector('.volume-fill');
        const iconSound = wrapper.querySelector('.icon-sound');
        const iconMute = wrapper.querySelector('.icon-mute');
        const btnFS = wrapper.querySelector('.ctrl-fullscreen');
        const timeline = wrapper.querySelector('.timeline-container');
        const progress = wrapper.querySelector('.timeline-progress');

        // Play/Pause Toggle
        function togglePlay() {
            if (video.paused) {
                const playPromise = video.play();
                if (playPromise !== undefined) {
                    playPromise.catch(error => console.log("Autoplay prevented"));
                }
                if(iconPlay) iconPlay.classList.add('hidden');
                if(iconPause) iconPause.classList.remove('hidden');
            } else {
                video.pause();
                if(iconPause) iconPause.classList.add('hidden');
                if(iconPlay) iconPlay.classList.remove('hidden');
            }
        }
        
        if (btnPlayPause) {
            btnPlayPause.addEventListener('click', (e) => {
                e.stopPropagation(); 
                togglePlay();
            });
        }
        video.addEventListener('click', (e) => {
            e.stopPropagation();
            togglePlay();
        });

        // Volume Logic
        let isDraggingVol = false;
        function updateVolume(e) {
            if(!volContainer || !volFill) return;
            const rect = volContainer.getBoundingClientRect();
            let y = rect.bottom - e.clientY;
            let percentage = Math.max(0, Math.min(1, y / rect.height));
            
            video.volume = percentage;
            volFill.style.height = `${percentage * 100}%`;

            if (percentage === 0) {
                video.muted = true;
                if(iconSound) iconSound.classList.add('hidden');
                if(iconMute) iconMute.classList.remove('hidden');
            } else {
                video.muted = false;
                if(iconMute) iconMute.classList.add('hidden');
                if(iconSound) iconSound.classList.remove('hidden');
                muteOtherVideos(video);
            }
        }

        if (volContainer) {
            volContainer.addEventListener('click', (e) => {
                e.stopPropagation();
                if (!isDraggingVol) {
                    video.muted = !video.muted;
                    if (video.muted) {
                        if(volFill) volFill.style.height = '0%';
                        if(iconSound) iconSound.classList.add('hidden');
                        if(iconMute) iconMute.classList.remove('hidden');
                    } else {
                        if(volFill) volFill.style.height = `${video.volume * 100}%`;
                        if(iconMute) iconMute.classList.add('hidden');
                        if(iconSound) iconSound.classList.remove('hidden');
                        muteOtherVideos(video);
                    }
                }
            });
            volContainer.addEventListener('mousedown', (e) => {
                e.stopPropagation();
                isDraggingVol = true;
                updateVolume(e);
            });
            document.addEventListener('mousemove', (e) => {
                if (isDraggingVol) updateVolume(e);
            });
            document.addEventListener('mouseup', () => {
                setTimeout(() => isDraggingVol = false, 50); 
            });
        }

        // Timeline Scrubber
        if (timeline && progress) {
            timeline.addEventListener('click', (e) => {
                e.stopPropagation();
                if (video.duration) {
                    const rect = timeline.getBoundingClientRect();
                    const clickX = e.clientX - rect.left;
                    const percentage = clickX / rect.width;
                    video.currentTime = percentage * video.duration;
                }
            });
            video.addEventListener('timeupdate', () => {
                if (video.duration) {
                    progress.style.width = `${(video.currentTime / video.duration) * 100}%`;
                }
            });
        }

        // Fullscreen Toggle
        if (btnFS) {
            btnFS.addEventListener('click', (e) => {
                e.stopPropagation();
                if (!document.fullscreenElement) {
                    wrapper.requestFullscreen().catch(err => console.log(err));
                } else {
                    document.exitFullscreen().catch(err => console.log(err));
                }
            });
        }
    }

    // Initialize both players! (No more timeline IDs needed)
    setupVideoController('reel-player-wrapper', 'main-reel');
    setupVideoController('modal-player-wrapper', 'modal-video');

    // --- 3. HLS Reel Initialization ---
    const reelVideo = document.getElementById('main-reel');
    if (reelVideo) {
        const reelSrc = "assets/cambike/master-cambike.m3u8"; 
        
        if (typeof Hls !== 'undefined' && Hls.isSupported()) {
            const hlsReel = new Hls();
            hlsReel.loadSource(reelSrc);
            hlsReel.attachMedia(reelVideo);
            hlsReel.on(Hls.Events.MANIFEST_PARSED, function() {
                reelVideo.play().catch(() => console.log("Autoplay blocked by browser."));
                
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
    }

    // --- 4. Hover Text & Modal HLS Logic ---
    const titleEl = document.getElementById('dynamic-title');
    const rolesEl = document.getElementById('dynamic-roles');
    const descEl = document.getElementById('dynamic-desc');
    const modal = document.getElementById('fullscreen-modal');
    const modalVideo = document.getElementById('modal-video');
    const modalVolFill = document.querySelector('#modal-player-wrapper .volume-fill');

    document.addEventListener('mouseover', (e) => {
        const card = e.target.closest('.film-project-card');
        if (card) {
            if (titleEl) titleEl.textContent = card.getAttribute('data-title') || 'Untitled';
            if (rolesEl) rolesEl.textContent = card.getAttribute('data-roles') || '';
            if (descEl) descEl.textContent = card.getAttribute('data-desc') || '';

            // --- Dynamic Vertical Alignment ---
            const detailsContent = document.querySelector('.details-content');
            const workDetails = document.querySelector('.work-details');
            if (detailsContent && workDetails) {
                const cardRect = card.getBoundingClientRect();
                const detailsRect = workDetails.getBoundingClientRect();
                const contentHeight = detailsContent.getBoundingClientRect().height;
                
                // Find vertical center of the card relative to the sticky container
                const relativeCenterY = (cardRect.top - detailsRect.top) + (cardRect.height / 2);
                const targetY = relativeCenterY - (contentHeight / 2);
                
                // Clamp to keep text fully visible on screen
                const containerHeight = window.innerHeight;
                const clampedTargetY = Math.max(0, Math.min(targetY, containerHeight - contentHeight));
                
                detailsContent.style.transform = `translateY(${clampedTargetY}px)`;
            }
        }
    });

    // --- 4.5. Copy Email Button Engine ---
    const copyEmailBtn = document.getElementById('copy-email-btn');
    if (copyEmailBtn) {
        copyEmailBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            navigator.clipboard.writeText('bryce.connect@gmail.com').then(() => {
                const span = copyEmailBtn.querySelector('span');
                const originalText = span.textContent;
                span.textContent = 'Copied to clipboard!';
                setTimeout(() => {
                    span.textContent = originalText;
                }, 2000);
            });
        });
    }

    // Click project to open
    document.addEventListener('click', (e) => {
        const card = e.target.closest('.film-project-card');
        if (card && !card.classList.contains('coming-soon-card')) {
            const fullVideoSrc = card.getAttribute('data-video');
            
            if (fullVideoSrc && fullVideoSrc !== "") {
                modal.classList.add('active'); 
                muteOtherVideos(modalVideo); // Immediately mute the reel when a project is opened

                if (typeof Hls !== 'undefined' && Hls.isSupported()) {
                    const hlsModal = new Hls();
                    hlsModal.loadSource(fullVideoSrc);
                    hlsModal.attachMedia(modalVideo);
                    hlsModal.on(Hls.Events.MANIFEST_PARSED, function() {
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

    // --- 5. Exit Button & Close Logic ---
    function closeFullscreen() {
        if (document.fullscreenElement) {
            document.exitFullscreen().catch(err => console.log(err));
        }
        if (modal) modal.classList.remove('active');
        if (modalVideo) {
            modalVideo.pause();
            modalVideo.removeAttribute('src'); 
            modalVideo.load();
        }
    }

    const closeModalBtn = document.getElementById('close-modal');
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            closeFullscreen();
        });
    }

    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeFullscreen();
    });

    // --- 6. Global Fullscreen Event Listener ---
    document.addEventListener('fullscreenchange', () => {
        const customCursor = document.getElementById('af-cursor');
        
        if (document.fullscreenElement) {
            document.fullscreenElement.appendChild(customCursor);
            
            const activeWrapper = document.fullscreenElement;
            const expand = activeWrapper.querySelector('.icon-expand');
            const shrink = activeWrapper.querySelector('.icon-shrink');
            if (expand) expand.classList.add('hidden');
            if (shrink) shrink.classList.remove('hidden');
        } else {
            document.body.appendChild(customCursor);
            
            document.querySelectorAll('.icon-expand').forEach(el => el.classList.remove('hidden'));
            document.querySelectorAll('.icon-shrink').forEach(el => el.classList.add('hidden'));
        }
    });

    // --- 7. Auto-Mute Reel When Scrolled Out of View ---
    const reelWrapper = document.getElementById('reel-player-wrapper');
    if (reelWrapper && reelVideo) {
        const reelObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting && !reelVideo.muted) {
                    reelVideo.muted = true;
                    const volFill = reelWrapper.querySelector('.volume-fill');
                    const iconSound = reelWrapper.querySelector('.icon-sound');
                    const iconMute = reelWrapper.querySelector('.icon-mute');
                    if (volFill) volFill.style.height = '0%';
                    if (iconSound) iconSound.classList.add('hidden');
                    if (iconMute) iconMute.classList.remove('hidden');
                }
            });
        }, { threshold: 0.1 }); // Triggers when less than 10% of the video is visible
        reelObserver.observe(reelWrapper);
    }

}); // <-- The absolute end of the file.