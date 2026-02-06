// ========================================
// BUILD BOOK - Main Functionality
// ======================================== */

// Configuration
const PASSWORD = 'viking'; // Change this to your password
const ITEMS_PER_PAGE = 40;

// State
let allImages = [];
let filteredImages = [];
let currentPage = 1;
let activeFilters = {
    search: '',
    tags: [],
    mode: 'and', // 'and' or 'or'
    saved: false
};
let isPasswordUnlocked = false;

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    await loadImages();
    setupEventListeners();
    initInfoButtonAnimation();
    updateDisplay();
});

// ========================================
// DATA LOADING
// ========================================

async function loadImages() {
    try {
        const response = await fetch('data/inspiration-images.json');
        const data = await response.json();
        allImages = data.images || [];
        
        // Filter out protected images if password not unlocked
        if (!isPasswordUnlocked) {
            allImages = allImages.filter(img => !img.protected);
        }
        
        filteredImages = [...allImages];
        populateFilterTags();
    } catch (error) {
        console.error('Error loading images:', error);
        showError('Failed to load images. Please refresh the page.');
    }
}

// ========================================
// EVENT LISTENERS
// ========================================

function setupEventListeners() {
    // Search
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', debounce((e) => {
            activeFilters.search = e.target.value.toLowerCase();
            applyFilters();
        }, 300));
    }
    
    // Filter mode toggle
    const filterModeAnd = document.getElementById('filterModeAnd');
    const filterModeOr = document.getElementById('filterModeOr');
    
    if (filterModeAnd) {
        filterModeAnd.addEventListener('click', () => {
            activeFilters.mode = 'and';
            filterModeAnd.classList.add('active');
            filterModeOr.classList.remove('active');
            applyFilters();
        });
    }
    
    if (filterModeOr) {
        filterModeOr.addEventListener('click', () => {
            activeFilters.mode = 'or';
            filterModeOr.classList.add('active');
            filterModeAnd.classList.remove('active');
            applyFilters();
        });
    }
    
    // Saved toggle
    const savedToggle = document.getElementById('savedToggleBtn');
    if (savedToggle) {
        savedToggle.addEventListener('click', () => {
            activeFilters.saved = !activeFilters.saved;
            savedToggle.classList.toggle('active', activeFilters.saved);
            applyFilters();
        });
    }
    
    // Show/hide filters panel
    const showFiltersBtn = document.getElementById('showFiltersBtn');
    const tagFilterPanel = document.getElementById('tagFilterPanel');
    
    if (showFiltersBtn && tagFilterPanel) {
        showFiltersBtn.addEventListener('click', () => {
            const isVisible = tagFilterPanel.style.display !== 'none';
            tagFilterPanel.style.display = isVisible ? 'none' : 'block';
        });
    }
    
    // Clear all filters
    const clearFiltersBtn = document.getElementById('clearFiltersBtn');
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', clearAllFilters);
    }
    
    const resetFiltersBtn = document.getElementById('resetFiltersBtn');
    if (resetFiltersBtn) {
        resetFiltersBtn.addEventListener('click', clearAllFilters);
    }
    
    // Info button
    const infoBtn = document.getElementById('infoBtn');
    const infoModal = document.getElementById('infoModal');
    const infoModalClose = document.querySelector('#infoModal .modal-close');
    
    if (infoBtn && infoModal) {
        infoBtn.addEventListener('click', () => {
            infoModal.classList.add('active');
        });
    }
    
    if (infoModalClose) {
        infoModalClose.addEventListener('click', () => {
            infoModal.classList.remove('active');
        });
    }
    
    if (infoModal) {
        infoModal.querySelector('.modal-overlay')?.addEventListener('click', () => {
            infoModal.classList.remove('active');
        });
    }
    
    // Password prompt toggle (Ctrl+Shift+P)
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.shiftKey && e.key === 'P') {
            e.preventDefault();
            togglePasswordPrompt();
        }
    });
    
    // Password submit
    const passwordSubmit = document.getElementById('passwordSubmit');
    const passwordInput = document.getElementById('passwordInput');
    
    if (passwordSubmit && passwordInput) {
        passwordSubmit.addEventListener('click', checkPassword);
        passwordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') checkPassword();
        });
    }
    
    // Password close button
    const passwordClose = document.getElementById('passwordClose');
    if (passwordClose) {
        passwordClose.addEventListener('click', () => {
            document.getElementById('passwordPrompt').classList.add('hidden');
        });
    }
    
    // Lightbox close
    const lightboxClose = document.querySelector('.lightbox-close');
    const lightbox = document.getElementById('lightbox');
    
    if (lightboxClose) {
        lightboxClose.addEventListener('click', closeLightbox);
    }
    
    if (lightbox) {
        lightbox.querySelector('.lightbox-overlay')?.addEventListener('click', closeLightbox);
    }
}

// ========================================
// FILTERING SYSTEM
// ========================================

function populateFilterTags() {
    const categories = {
        buildingType: [],
        technique: [],
        style: [],
        difficulty: [],
        source: []
    };
    
    // Collect all unique tags
    allImages.forEach(img => {
        img.tags.forEach(tag => {
            const category = categorizeTag(tag);
            if (category && !categories[category].includes(tag)) {
                categories[category].push(tag);
            }
        });
    });
    
    // Populate each category
    Object.keys(categories).forEach(category => {
        const container = document.getElementById(`${category}Tags`);
        if (container) {
            container.innerHTML = categories[category]
                .sort()
                .map(tag => `
                    <button class="tag-filter" data-tag="${tag}">
                        ${formatTagName(tag)}
                    </button>
                `).join('');
            
            // Add click handlers
            container.querySelectorAll('.tag-filter').forEach(btn => {
                btn.addEventListener('click', () => toggleTagFilter(btn.dataset.tag, btn));
            });
        }
    });
}

function categorizeTag(tag) {
    const buildingTypes = ['hall', 'house', 'tower', 'bridge', 'wall', 'gate', 'dock', 'farm', 'workshop'];
    const techniques = ['roofing', 'timber-frame', 'stone', 'flooring', 'structural', 'decorative', 'iron-age'];
    const styles = ['medieval', 'viking', 'modern', 'fantasy', 'rustic', 'gothic'];
    const difficulties = ['easy', 'medium', 'hard', 'advanced', 'expert'];
    
    if (buildingTypes.some(t => tag.includes(t))) return 'buildingType';
    if (techniques.some(t => tag.includes(t))) return 'technique';
    if (styles.some(t => tag.includes(t))) return 'style';
    if (difficulties.includes(tag)) return 'difficulty';
    return 'source';
}

function formatTagName(tag) {
    return tag.split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
}

function toggleTagFilter(tag, button) {
    if (activeFilters.tags.includes(tag)) {
        activeFilters.tags = activeFilters.tags.filter(t => t !== tag);
        button.classList.remove('active');
    } else {
        activeFilters.tags.push(tag);
        button.classList.add('active');
    }
    
    applyFilters();
}

function applyFilters() {
    filteredImages = allImages.filter(img => {
        // Search filter
        if (activeFilters.search) {
            const searchLower = activeFilters.search;
            const matchesSearch = 
                img.title.toLowerCase().includes(searchLower) ||
                img.description.toLowerCase().includes(searchLower) ||
                img.tags.some(tag => tag.toLowerCase().includes(searchLower)) ||
                img.source.creator.toLowerCase().includes(searchLower);
            
            if (!matchesSearch) return false;
        }
        
        // Tag filters
        if (activeFilters.tags.length > 0) {
            if (activeFilters.mode === 'and') {
                // All tags must match
                const hasAllTags = activeFilters.tags.every(tag => img.tags.includes(tag));
                if (!hasAllTags) return false;
            } else {
                // Any tag must match
                const hasAnyTag = activeFilters.tags.some(tag => img.tags.includes(tag));
                if (!hasAnyTag) return false;
            }
        }
        
        // Saved filter
        if (activeFilters.saved) {
            const isSaved = window.bookmarkSystem?.isBookmarked('inspiration', img.id);
            if (!isSaved) return false;
        }
        
        return true;
    });
    
    currentPage = 1;
    updateActiveFiltersList();
    updateFilterCounts();
    updateDisplay();
}

function clearAllFilters() {
    activeFilters = {
        search: '',
        tags: [],
        mode: 'and',
        saved: false
    };
    
    // Clear UI
    const searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.value = '';
    
    document.querySelectorAll('.tag-filter.active').forEach(btn => {
        btn.classList.remove('active');
    });
    
    const savedToggle = document.getElementById('savedToggleBtn');
    if (savedToggle) savedToggle.classList.remove('active');
    
    applyFilters();
}

function updateActiveFiltersList() {
    const container = document.getElementById('activeFiltersList');
    if (!container) return;
    
    if (activeFilters.tags.length === 0 && !activeFilters.search && !activeFilters.saved) {
        container.innerHTML = '';
        return;
    }
    
    let html = '';
    
    activeFilters.tags.forEach(tag => {
        html += `
            <div class="active-filter-tag">
                ${formatTagName(tag)}
                <button onclick="removeFilter('${tag}')">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
    });
    
    if (activeFilters.search) {
        html += `
            <div class="active-filter-tag">
                Search: "${activeFilters.search}"
                <button onclick="clearSearch()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
    }
    
    if (activeFilters.saved) {
        html += `
            <div class="active-filter-tag">
                Saved Only
                <button onclick="toggleSavedFilter()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
    }
    
    container.innerHTML = html;
}

function updateFilterCounts() {
    const activeCount = document.querySelector('.active-filters-count');
    if (activeCount) {
        const count = activeFilters.tags.length + 
                     (activeFilters.search ? 1 : 0) +
                     (activeFilters.saved ? 1 : 0);
        activeCount.textContent = count;
        activeCount.style.display = count > 0 ? 'block' : 'none';
    }
    
    const savedCount = document.querySelector('.saved-count');
    if (savedCount && window.bookmarkSystem) {
        const count = window.bookmarkSystem.getBookmarks('inspiration').length;
        savedCount.textContent = count;
    }
}

// Helper functions for active filters
window.removeFilter = function(tag) {
    const button = document.querySelector(`.tag-filter[data-tag="${tag}"]`);
    if (button) {
        toggleTagFilter(tag, button);
    }
};

window.clearSearch = function() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.value = '';
        activeFilters.search = '';
        applyFilters();
    }
};

window.toggleSavedFilter = function() {
    const savedToggle = document.getElementById('savedToggleBtn');
    if (savedToggle) {
        savedToggle.click();
    }
};

// ========================================
// DISPLAY & PAGINATION
// ========================================

function updateDisplay() {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const pageImages = filteredImages.slice(startIndex, endIndex);
    
    renderGallery(pageImages);
    renderPagination();
    updateResultsCounter();
    
    // Hide loading spinner, show/hide no results
    const loadingSpinner = document.getElementById('loadingSpinner');
    const noResults = document.getElementById('noResults');
    
    if (loadingSpinner) loadingSpinner.style.display = 'none';
    
    if (noResults) {
        noResults.style.display = filteredImages.length === 0 ? 'flex' : 'none';
    }
}

function renderGallery(images) {
    const grid = document.getElementById('galleryGrid');
    if (!grid) return;
    
    if (images.length === 0) {
        grid.innerHTML = '';
        return;
    }
    
    grid.innerHTML = images.map(img => `
        <div class="gallery-item" onclick="openLightbox('${img.id}')">
            <button class="gallery-item-bookmark ${isBookmarked(img.id) ? 'saved' : ''}" 
                    onclick="event.stopPropagation(); toggleBookmark('${img.id}', this)">
                <i class="${isBookmarked(img.id) ? 'fas' : 'far'} fa-bookmark"></i>
            </button>
            <img class="gallery-item-image" src="${img.thumb || img.src}" alt="${img.title}" loading="lazy">
            <div class="gallery-item-content">
                <h3 class="gallery-item-title">${img.title}</h3>
                <p class="gallery-item-description">${img.description}</p>
                <div class="gallery-item-tags">
                    ${img.tags.slice(0, 4).map(tag => `
                        <span class="tag">${formatTagName(tag)}</span>
                    `).join('')}
                </div>
            </div>
        </div>
    `).join('');
}

function renderPagination() {
    const container = document.querySelector('.pagination');
    if (!container) return;
    
    const totalPages = Math.ceil(filteredImages.length / ITEMS_PER_PAGE);
    
    if (totalPages <= 1) {
        container.style.display = 'none';
        return;
    }
    
    container.style.display = 'flex';
    container.innerHTML = `
        <button class="pagination-btn" ${currentPage === 1 ? 'disabled' : ''} 
                onclick="changePage(${currentPage - 1})">
            <i class="fas fa-chevron-left"></i> Previous
        </button>
        <span class="pagination-info">Page ${currentPage} of ${totalPages}</span>
        <button class="pagination-btn" ${currentPage === totalPages ? 'disabled' : ''} 
                onclick="changePage(${currentPage + 1})">
            Next <i class="fas fa-chevron-right"></i>
        </button>
    `;
}

window.changePage = function(page) {
    currentPage = page;
    updateDisplay();
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

function updateResultsCounter() {
    const counter = document.querySelector('.results-counter');
    if (!counter) return;
    
    const total = allImages.length;
    const filtered = filteredImages.length;
    
    if (filtered === total) {
        counter.textContent = `Showing all ${total} images`;
    } else {
        counter.textContent = `Showing ${filtered} of ${total} images`;
    }
}

// ========================================
// BOOKMARKS
// ========================================

function isBookmarked(imageId) {
    return window.bookmarkSystem?.isBookmarked('inspiration', imageId) || false;
}

window.toggleBookmark = function(imageId, button) {
    if (!window.bookmarkSystem) return;
    
    window.bookmarkSystem.toggleBookmark('inspiration', imageId);
    
    const isSaved = isBookmarked(imageId);
    
    // Update button
    button.classList.toggle('saved', isSaved);
    button.querySelector('i').className = isSaved ? 'fas fa-bookmark' : 'far fa-bookmark';
    
    // Update lightbox button if open
    const lightboxBtn = document.getElementById('lightboxBookmark');
    if (lightboxBtn && lightboxBtn.dataset.imageId === imageId) {
        lightboxBtn.classList.toggle('saved', isSaved);
        lightboxBtn.querySelector('i').className = isSaved ? 'fas fa-bookmark' : 'far fa-bookmark';
        lightboxBtn.innerHTML = isSaved ? 
            '<i class="fas fa-bookmark"></i> Saved' : 
            '<i class="far fa-bookmark"></i> Save';
    }
    
    updateFilterCounts();
    
    // Re-filter if in saved mode
    if (activeFilters.saved) {
        applyFilters();
    }
};

// ========================================
// LIGHTBOX
// ========================================

function openLightbox(imageId) {
    const image = allImages.find(img => img.id === imageId);
    if (!image) return;
    
    const lightbox = document.getElementById('lightbox');
    if (!lightbox) return;
    
    // Populate lightbox
    document.getElementById('lightboxMainImage').src = image.src;
    document.getElementById('lightboxTitle').textContent = image.title;
    document.getElementById('lightboxDescription').textContent = image.description;
    
    // Tags
    const tagsContainer = document.getElementById('lightboxTags');
    tagsContainer.innerHTML = image.tags.map(tag => `
        <span class="tag">${formatTagName(tag)}</span>
    `).join('');
    
    // Source
    const sourceContainer = document.getElementById('lightboxSource');
    if (image.source.link) {
        sourceContainer.innerHTML = `
            <a href="${image.source.link}" target="_blank">
                <i class="fab fa-${image.source.platform}"></i>
                ${image.source.creator}
                ${image.source.timestamp ? ` - ${image.source.timestamp}` : ''}
            </a>
        `;
    } else {
        sourceContainer.innerHTML = `
            <span><i class="fas fa-user"></i> ${image.source.creator}</span>
        `;
    }
    
    // Bookmark button
    const bookmarkBtn = document.getElementById('lightboxBookmark');
    const isSaved = isBookmarked(image.id);
    bookmarkBtn.className = 'btn-bookmark' + (isSaved ? ' saved' : '');
    bookmarkBtn.innerHTML = isSaved ? 
        '<i class="fas fa-bookmark"></i> Saved' : 
        '<i class="far fa-bookmark"></i> Save';
    bookmarkBtn.dataset.imageId = image.id;
    bookmarkBtn.onclick = () => toggleBookmark(image.id, bookmarkBtn);
    
    // Additional images
    const thumbnails = document.getElementById('lightboxThumbnails');
    if (image.additionalImages && image.additionalImages.length > 0) {
        thumbnails.innerHTML = image.additionalImages.map((src, index) => `
            <img src="${src}" class="lightbox-thumbnail" 
                 onclick="document.getElementById('lightboxMainImage').src='${src}'" />
        `).join('');
    } else {
        thumbnails.innerHTML = '';
    }
    
    // Related images
    renderRelatedImages(image);
    
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeLightbox() {
    const lightbox = document.getElementById('lightbox');
    if (lightbox) {
        lightbox.classList.remove('active');
        document.body.style.overflow = '';
    }
}

function renderRelatedImages(currentImage) {
    const container = document.getElementById('lightboxRelated');
    if (!container || !currentImage.relatedImages) return;
    
    const relatedImages = currentImage.relatedImages
        .map(id => allImages.find(img => img.id === id))
        .filter(img => img);
    
    if (relatedImages.length === 0) {
        container.closest('.related-section').style.display = 'none';
        return;
    }
    
    container.closest('.related-section').style.display = 'block';
    container.innerHTML = relatedImages.map(img => `
        <div class="related-item" onclick="openLightbox('${img.id}')">
            <img src="${img.thumb || img.src}" alt="${img.title}" />
        </div>
    `).join('');
}

// ========================================
// PASSWORD SYSTEM
// ========================================

function togglePasswordPrompt() {
    const prompt = document.getElementById('passwordPrompt');
    if (prompt) {
        const isHidden = prompt.classList.contains('hidden');
        prompt.classList.toggle('hidden', !isHidden);
        if (!isHidden) {
            prompt.classList.add('hidden');
        } else {
            prompt.classList.remove('hidden');
            document.getElementById('passwordInput').focus();
        }
    }
}

function checkPassword() {
    const input = document.getElementById('passwordInput');
    if (!input) return;
    
    if (input.value === PASSWORD) {
        isPasswordUnlocked = true;
        document.getElementById('passwordPrompt').classList.add('hidden');
        input.value = '';
        
        // Reload images to include protected ones
        loadImages().then(() => {
            applyFilters();
            showSuccess('Protected content unlocked!');
        });
    } else {
        input.value = '';
        input.placeholder = 'Incorrect password';
        setTimeout(() => {
            input.placeholder = 'Enter password';
        }, 2000);
    }
}

// ========================================
// INFO BUTTON ANIMATION
// ========================================

function initInfoButtonAnimation() {
    const infoBtn = document.getElementById('infoBtn');
    if (!infoBtn) return;
    
    // Add pulsing class for 15 seconds
    infoBtn.classList.add('pulsing');
    
    setTimeout(() => {
        infoBtn.classList.remove('pulsing');
    }, 15000);
    
    // Remove pulsing if clicked
    infoBtn.addEventListener('click', () => {
        infoBtn.classList.remove('pulsing');
    }, { once: true });
}

// ========================================
// UTILITY FUNCTIONS
// ========================================

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

function showError(message) {
    alert(message); // Replace with better toast notification if desired
}

function showSuccess(message) {
    alert(message); // Replace with better toast notification if desired
}
