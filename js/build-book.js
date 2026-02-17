// ========================================
// BUILD BOOK - Main Functionality
// ========================================

// Configuration
const PASSWORD = 'viking'; // Build Book password
const ITEMS_PER_PAGE = 40;
const SUPABASE_URL = "https://iuhtzvblmthenynuojtn.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1aHR6dmJsbXRoZW55bnVvanRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0MTAxNDYsImV4cCI6MjA4NTk4NjE0Nn0.8tzqkuh6rCbB_0TLc3K4TITI2IG-MhtUdWpuyATZPKk";

// Initialize Supabase
let supabaseClient = null;
if (window.supabase) {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// State
let allImages = [];
let filteredImages = [];
let currentPage = 1;
let activeFilters = {
    search: '',
    tags: [],
    mode: 'and',
    saved: false
};
let isPasswordUnlocked = false;
let isAdminLoggedIn = false;
let adminUser = null;

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    checkExistingSession();
    await loadImages();
    setupEventListeners();
    initInfoButtonAnimation();
    updateDisplay();
    
    // Update bookmark counts after everything loads
    setTimeout(() => {
        updateFilterCounts();
    }, 100);
});

// ========================================
// DATA LOADING
// ========================================

async function loadImages() {
    try {
        if (!supabaseClient) {
            console.error('Supabase not initialized');
            showError('Failed to connect to database');
            return;
        }

        let query = supabaseClient.from('images').select('*');

        // Determine which statuses to load based on login
        if (isAdminLoggedIn) {
            if (adminUser.role === 'admin') {
                // Admins see everything
                query = query.in('status', ['published', 'published-protected', 'pending']);
            } else if (adminUser.role === 'contributor') {
                // Contributors see published + their own pending
                query = query.or(
                    `status.in.(published,published-protected),and(status.eq.pending,submitted_by.eq.${adminUser.name})`
                );
            }
        } else {
            // Public sees only published
            query = query.eq('status', 'published');
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) throw error;

        // Transform database format to display format
        allImages = data.map(img => ({
            id: img.id,
            src: img.image_urls?.[0] || img.src,
            thumb: img.thumbnail_urls?.[0] || img.thumb,
            title: img.title,
            description: img.description || '',
            tags: img.tags || [],
            source: {
                platform: img.source_platform || 'original',
                creator: img.source_creator || 'Unknown',
                link: img.source_link || ''
            },
            protected: img.status === 'published-protected',
            status: img.status,
            submittedBy: img.submitted_by,
            additionalImages: img.image_urls?.slice(1) || [],
            additionalThumbnails: img.thumbnail_urls?.slice(1) || [],
            buildId: img.build_id,
            relatedImages: []
        }));

        // Populate related images from same build
        allImages.forEach(img => {
            if (img.buildId) {
                img.relatedImages = allImages
                    .filter(other => other.buildId === img.buildId && other.id !== img.id)
                    .map(other => other.id)
                    .slice(0, 6);
            }
        });

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

async function populateFilterTags() {
    if (!supabaseClient) return;
    
    // Get all accessible idea tags
    const accessibleTags = new Set();
    allImages.forEach(img => {
        img.tags.forEach(tag => accessibleTags.add(tag));
    });
    
    // Load categories but only show tags that exist in accessible ideas
    const { data: categories } = await supabaseClient
        .from('tag_categories')
        .select('*, tags(*)')
        .order('sort_order');
    
    if (!categories) return;
    
    const panel = document.getElementById('tagFilterPanel');
    if (!panel) return;
    
    // Filter out categories with no visible tags
    const visibleCategories = categories
        .map(cat => ({
            ...cat,
            tags: cat.tags.filter(tag => accessibleTags.has(tag.name))
        }))
        .filter(cat => cat.tags.length > 0);
    
    panel.innerHTML = visibleCategories.map(cat => `
        <div class="filter-category">
            <h3>${cat.name}</h3>
            <div class="tag-group">
                ${cat.tags
                    .sort((a, b) => a.sort_order - b.sort_order)
                    .map(tag => `
                        <button class="tag-filter" data-tag="${tag.name}">
                            ${tag.name}
                        </button>
                    `).join('')}
            </div>
        </div>
    `).join('');
    
    panel.querySelectorAll('.tag-filter').forEach(btn => {
        btn.addEventListener('click', () => toggleTagFilter(btn.dataset.tag, btn));
    });
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

    if (activeFilters.tags.length === 0 && !activeFilters.search) {
        container.innerHTML = '';
        return;
    }

    let html = '';

    activeFilters.tags.forEach(tag => {
        html += `
            <div class="active-filter-tag">
                ${tag}
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

    // Removed saved filter indicator

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
window.removeFilter = function (tag) {
    const button = document.querySelector(`.tag-filter[data-tag="${tag}"]`);
    if (button) {
        toggleTagFilter(tag, button);
    }
};

window.clearSearch = function () {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.value = '';
        activeFilters.search = '';
        applyFilters();
    }
};

window.toggleSavedFilter = function () {
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

function formatCreatorDisplay(source) {
    const platformIcon = source.platform === 'original'
        ? '<img src="images/hammer.png" class="creator-icon">'
        : `<i class="fab fa-${source.platform} creator-icon"></i>`;
    
    let prefix = '';
    if (source.platform === 'reddit') prefix = 'u/';
    else if (['twitter', 'instagram', 'discord'].includes(source.platform)) prefix = '@';
    else if (['youtube', 'twitch'].includes(source.platform)) prefix = '';
    
    const displayName = prefix + source.creator;
    
    if (source.link) {
        return `<a href="${source.link}" target="_blank" class="creator-link" onclick="event.stopPropagation()">
            ${platformIcon} <span>${displayName}</span>
        </a>`;
    } else {
        return `<span class="creator-display">${platformIcon} <span>${displayName}</span></span>`;
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
            
            ${isAdminLoggedIn ? `
    <div class="gallery-item-admin">
        ${(adminUser.role === 'admin' || (adminUser.role === 'contributor' && img.submittedBy === adminUser.name && img.status === 'pending')) ? `
            <button class="admin-icon-btn delete" onclick="event.stopPropagation(); deleteIdea('${img.id}')" title="Delete">
                <i class="fas fa-trash"></i>
            </button>
        ` : ''}
    </div>
    ${img.status === 'pending' ? '<div class="pending-banner">Pending Review</div>' : ''}
    ${img.protected ? '<div class="protected-badge"><i class="fas fa-lock"></i></div>' : ''}
` : ''}
            
            <img class="gallery-item-image" src="${img.thumb || img.src}" alt="${img.title}" loading="lazy">
            <div class="gallery-item-content">
    <h3 class="gallery-item-title">${img.title}</h3>
    <div class="gallery-item-creator">
        ${formatCreatorDisplay(img.source)}
    </div>
</div>
        </div>
    `).join('');
}

// Placeholder functions for edit/delete
window.editIdea = function(id) {
    console.log('Edit idea:', id);
    // TODO: Open edit modal
};

window.deleteIdea = async function(id) {
    if (!confirm('Delete this idea permanently?')) return;
    
    try {
        const password = sessionStorage.getItem('admin_password');
        
        const response = await fetch(`${SUPABASE_URL}/functions/v1/admin-delete`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify({ password, imageId: id })
        });

        const result = await response.json();

        if (!response.ok || result.error) {
            throw new Error(result.error || 'Failed to delete');
        }

        showSuccess('Idea deleted');
        await loadImages();
        applyFilters();
    } catch (error) {
        console.error('Delete error:', error);
        showError('Failed to delete');
    }
};

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

window.changePage = function (page) {
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
        counter.textContent = `Showing all ${total} build ideas`;
    } else {
        counter.textContent = `Showing ${filtered} of ${total} build ideas`;
    }
}

// ========================================
// BOOKMARKS
// ========================================

function isBookmarked(imageId) {
    return window.bookmarkSystem?.isBookmarked('inspiration', imageId) || false;
}

window.toggleBookmark = function (imageId, button) {
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

    // Update gallery card
    const galleryBtn = document.querySelector(`.gallery-item-bookmark[onclick*="${imageId}"]`);
    if (galleryBtn) {
        galleryBtn.classList.toggle('saved', isSaved);
        galleryBtn.querySelector('i').className = isSaved ? 'fas fa-bookmark' : 'far fa-bookmark';
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

    // Check edit permissions
    const canEdit = isAdminLoggedIn && (
        adminUser.role === 'admin' || 
        (adminUser.role === 'contributor' && image.submittedBy === adminUser.name && image.status === 'pending')
    );

    // Get full data from database for editing
    if (canEdit) {
        supabaseClient
            .from('images')
            .select('*')
            .eq('id', imageId)
            .single()
            .then(({ data }) => {
                if (data) {
                    renderLightboxContent(image, data, canEdit);
                }
            });
    } else {
        renderLightboxContent(image, null, false);
    }

    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function renderLightboxContent(image, dbData, canEdit) {
    // Combine all images (main + additional)
    const allImageUrls = [image.src, ...(image.additionalImages || [])];
    const allThumbUrls = [image.thumb, ...(image.additionalThumbnails || [])];
    
    // Show thumbnail immediately, then swap to full image when loaded
    const mainImage = document.getElementById('lightboxMainImage');
    mainImage.src = allThumbUrls[0] || allImageUrls[0]; // Show thumbnail first
    
    // Load full image in background
    const fullImage = new Image();
    fullImage.onload = () => {
        mainImage.src = allImageUrls[0]; // Swap to full resolution
    };
    fullImage.src = allImageUrls[0];
    
    // Pre-load remaining carousel images in background
    if (allImageUrls.length > 1) {
        preloadCarouselImages(allImageUrls.slice(1));
    }
    
    // Add pending banner if needed
const existingBanner = document.querySelector('.lightbox-pending-banner');
if (existingBanner) existingBanner.remove();

if (image.status === 'pending' && isAdminLoggedIn) {
    const banner = document.createElement('div');
    banner.className = 'lightbox-pending-banner';
    banner.innerHTML = '<i class="fas fa-clock"></i> Pending Review';
    document.querySelector('.lightbox-info').prepend(banner);
}

    // Title - editable or readonly
    const titleEl = document.getElementById('lightboxTitle');
    if (canEdit) {
        titleEl.innerHTML = `<input type="text" id="lightboxTitleInput" value="${image.title}" style="width: 100%; background: var(--color-bg-primary); border: 1px solid var(--color-wood); padding: 8px; border-radius: 4px; color: var(--color-text-primary);">`;
    } else {
        titleEl.textContent = image.title;
    }
    
    // Description - editable or readonly
    const descEl = document.getElementById('lightboxDescription');
    if (canEdit) {
        descEl.innerHTML = `<textarea id="lightboxDescInput" style="width: 100%; min-height: 80px; background: var(--color-bg-primary); border: 1px solid var(--color-wood); padding: 8px; border-radius: 4px; color: var(--color-text-primary);">${image.description}</textarea>`;
    } else {
        descEl.textContent = image.description;
    }

    // Tags
    const tagsContainer = document.getElementById('lightboxTags');
    tagsContainer.innerHTML = image.tags.map(tag => `
    <span class="tag">${tag}</span>
`).join('');

    // Source
    const sourceContainer = document.getElementById('lightboxSource');
    const platformIcon = image.source.platform === 'original'
        ? '<img src="images/hammer.png" style="width: 16px; height: 16px; display: inline-block;">'
        : `<i class="fab fa-${image.source.platform}"></i>`;

    if (image.source.link) {
        sourceContainer.innerHTML = `
            <a href="${image.source.link}" target="_blank">
                ${platformIcon}
                ${image.source.creator}
            </a>
        `;
    } else {
        sourceContainer.innerHTML = `
            <span>${platformIcon} ${image.source.creator}</span>
        `;
    }

    // Admin controls
    const adminControls = document.querySelector('.lightbox-admin-controls') || createAdminControlsSection();
    
    if (canEdit && adminUser.role === 'admin') {
    adminControls.innerHTML = `
        <h3>Status</h3>
        <div class="status-buttons">
            <button class="status-btn ${dbData.status === 'published' ? 'active' : ''}" onclick="changeLightboxStatus('published')">
                Published
            </button>
            <button class="status-btn ${dbData.status === 'published-protected' ? 'active' : ''}" onclick="changeLightboxStatus('published-protected')">
                Protected
            </button>
            <button class="status-btn ${dbData.status === 'pending' ? 'active' : ''}" onclick="changeLightboxStatus('pending')">
                Pending
            </button>
        </div>
        <input type="hidden" id="lightboxStatusValue" value="${dbData.status}">
        <button class="btn-primary" onclick="saveLightboxChanges('${image.id}')" style="width: 100%; margin-top: 16px;">
            <i class="fas fa-save"></i> Save Changes
        </button>
        <button class="btn-secondary" onclick="confirmLightboxDelete('${image.id}')" style="width: 100%; margin-top: 8px; background: var(--color-error); border-color: var(--color-error); color: white;">
            <i class="fas fa-trash"></i> Delete Idea
        </button>
    `;
    adminControls.style.display = 'block';
} else if (canEdit) {
    adminControls.innerHTML = `
        <button class="btn-primary" onclick="saveLightboxChanges('${image.id}')" style="width: 100%; margin-top: 16px;">
            <i class="fas fa-save"></i> Save Changes
        </button>
    `;
    adminControls.style.display = 'block';
} else {
    adminControls.style.display = 'none';
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

    // Image carousel thumbnails
    const thumbnails = document.getElementById('lightboxThumbnails');
    if (allImageUrls.length > 1) {
        thumbnails.innerHTML = allImageUrls.map((src, index) => `
            <img src="${allThumbUrls[index] || src}" 
                 class="lightbox-thumbnail ${index === 0 ? 'active' : ''}" 
                 onclick="switchLightboxImage(${index}, '${src}')" />
        `).join('');
        thumbnails.style.display = 'flex';
    } else {
        thumbnails.innerHTML = '';
        thumbnails.style.display = 'none';
    }

    // Related images
    renderRelatedImages(image);
}


// New helper function for switching carousel images
window.switchLightboxImage = function(index, src) {
    document.getElementById('lightboxMainImage').src = src;
    
    // Update active thumbnail
    document.querySelectorAll('.lightbox-thumbnail').forEach((thumb, i) => {
        thumb.classList.toggle('active', i === index);
    });
};

// Pre-load all carousel images
function preloadCarouselImages(imageUrls) {
    return new Promise((resolve) => {
        if (!imageUrls || imageUrls.length === 0) {
            resolve();
            return;
        }
        
        let loadedCount = 0;
        const totalImages = imageUrls.length;
        
        imageUrls.forEach((url, index) => {
            const img = new Image();
            img.onload = img.onerror = () => {
                loadedCount++;
                if (index === 0) {
                    // First image loaded - show it immediately
                    resolve();
                }
            };
            img.src = url;
        });
        
        // Fallback in case first image fails to load
        setTimeout(resolve, 2000);
    });
}

function createAdminControlsSection() {
    const section = document.createElement('div');
    section.className = 'lightbox-admin-controls';
    const bookmarkBtn = document.getElementById('lightboxBookmark');
    bookmarkBtn.parentNode.insertBefore(section, bookmarkBtn);
    return section;
}

window.changeLightboxStatus = function(status) {
    document.getElementById('lightboxStatusValue').value = status;
    document.querySelectorAll('.status-btn').forEach(btn => {
        btn.classList.toggle('active', btn.textContent.trim().toLowerCase().replace(' ', '-').includes(status));
    });
};

window.saveLightboxChanges = async function(id) {
    const password = sessionStorage.getItem('admin_password');
    
    const updates = {
        title: document.getElementById('lightboxTitleInput')?.value || null,
        description: document.getElementById('lightboxDescInput')?.value || null,
    };
    
    // Only admins can change status
    if (adminUser.role === 'admin') {
        updates.status = document.getElementById('lightboxStatusValue')?.value;
    }
    
    // Remove null values
    Object.keys(updates).forEach(key => updates[key] === null && delete updates[key]);
    
    try {
        const response = await fetch(`${SUPABASE_URL}/functions/v1/admin-update`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify({ password, imageId: id, updates })
        });

        const result = await response.json();

        if (!response.ok || result.error) {
            throw new Error(result.error || 'Failed to update');
        }

        closeLightbox();
        showSuccess('Changes saved');
        await loadImages();
        applyFilters();
    } catch (error) {
        console.error('Update error:', error);
        showError('Failed to save changes');
    }
};

window.confirmLightboxDelete = function(id) {
    if (confirm('Delete this idea permanently?')) {
        deleteIdea(id);
        closeLightbox();
    }
};

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
// PASSWORD / LOGIN SYSTEM
// ========================================

function togglePasswordPrompt() {
    const prompt = document.getElementById('passwordPrompt');
    if (!prompt) return;
    
    const isHidden = prompt.classList.contains('hidden');
    prompt.classList.toggle('hidden', !isHidden);
    
    if (!isHidden) {
        prompt.classList.add('hidden');
    } else {
        prompt.classList.remove('hidden');
        document.getElementById('passwordInput').focus();
    }
}

async function checkPassword() {
    const input = document.getElementById('passwordInput');
    if (!input || !input.value) return;

    try {
        const response = await fetch(`${SUPABASE_URL}/functions/v1/verify-login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify({ password: input.value })
        });

        const data = await response.json();

        if (response.ok && data.user) {
            isAdminLoggedIn = true;
            adminUser = data.user;
            sessionStorage.setItem('admin_user', JSON.stringify(adminUser));
            sessionStorage.setItem('admin_password', input.value);
            
            document.getElementById('passwordPrompt').classList.add('hidden');
            input.value = '';
            
            // Reload to show protected content
            await loadImages();
            applyFilters();
            
            showAdminUI();
            showSuccess(`Logged in as ${adminUser.name} (${adminUser.role})`);
        } else {
            input.value = '';
            input.placeholder = 'Incorrect password';
            setTimeout(() => { input.placeholder = 'Password'; }, 2000);
        }
    } catch (error) {
        console.error('Login error:', error);
        input.value = '';
        showError('Login failed');
    }
}

function showAdminUI() {
    console.log('Admin UI enabled', adminUser);
    
    // Show header admin info
    const headerAdmin = document.getElementById('headerAdmin');
    const userName = document.getElementById('headerUserName');
    
    if (headerAdmin && userName) {
        const roleDisplay = adminUser.role === 'admin' ? 'Admin' : 'Contributor';
        userName.textContent = `${adminUser.name} (${roleDisplay})`;
        headerAdmin.style.display = 'flex';

        // Hide login button
        const loginBtn = document.getElementById('loginBtn');
        if (loginBtn) loginBtn.style.display = 'none';
    }
    
    // Show upload button
    const uploadBtnGroup = document.getElementById('uploadBtnGroup');
    if (uploadBtnGroup) {
        uploadBtnGroup.style.display = 'block';
    }
    
    // Show manage tags button (admin only)
    if (adminUser.role === 'admin') {
        const tagsBtnGroup = document.getElementById('tagsBtnGroup');
        if (tagsBtnGroup) {
            tagsBtnGroup.style.display = 'block';
        }
    }
    
    // Setup button clicks
    const uploadBtn = document.getElementById('uploadBtn');
    if (uploadBtn) uploadBtn.onclick = openUploadModal;
    
    const tagsBtn = document.getElementById('tagsBtn');
    if (tagsBtn) tagsBtn.onclick = openTagsModal;
    
    // Hide protected checkbox for contributors
    if (adminUser.role === 'contributor') {
        const protectedGroup = document.getElementById('uploadProtectedGroup');
        if (protectedGroup) protectedGroup.style.display = 'none';
    }
}

// Logout function
window.logout = function() {
    sessionStorage.removeItem('admin_user');
    sessionStorage.removeItem('admin_password');
    isAdminLoggedIn = false;
    adminUser = null;
    
    // Hide admin UI
    const headerAdmin = document.getElementById('headerAdmin');
    if (headerAdmin) headerAdmin.style.display = 'none';

    // Show login button
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) loginBtn.style.display = 'flex';
    
    // Reload images (hides protected content)
    loadImages().then(() => applyFilters());
    
    showSuccess('Logged out');
};

// Check for existing session on page load
function checkExistingSession() {
    const savedUser = sessionStorage.getItem('admin_user');
    if (savedUser) {
        adminUser = JSON.parse(savedUser);
        isAdminLoggedIn = true;
        showAdminUI();
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
// UPLOAD SYSTEM
// ========================================

let uploadImages = [];
let uploadTags = [];

function openUploadModal() {
    document.getElementById('uploadModal').classList.add('active');
    setupUploadForm();
    loadBuildsForUpload();
    loadTagsForUpload();
    loadCreatorsForAutocomplete();
    
    // Initialize source type
    toggleSourceType('mine');
}

window.closeUploadModal = function() {
    document.getElementById('uploadModal').classList.remove('active');
    resetUploadForm();
};

function setupUploadForm() {
    const dropZone = document.getElementById('uploadDropZone');
    const fileInput = document.getElementById('uploadImageInput');
    const preview = document.getElementById('uploadPreviews');
    
// Title character counter
    const titleInput = document.getElementById('uploadTitle');
    const charCount = document.getElementById('titleCharCount');
    const titleWarning = document.getElementById('titleWarning');
    
    if (titleInput && charCount) {
        titleInput.addEventListener('input', () => {
            const length = titleInput.value.length;
            charCount.textContent = `${length}/100`;
            
            if (length > 50 && titleWarning) {
                titleWarning.style.display = 'block';
            } else if (titleWarning) {
                titleWarning.style.display = 'none';
            }
        });
    }

    // Click to upload
    dropZone.onclick = () => fileInput.click();
    
    // File selection
    fileInput.onchange = (e) => {
        handleUploadFiles(Array.from(e.target.files));
    };
    
    // Drag and drop
    dropZone.ondragover = (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    };
    
    dropZone.ondragleave = () => {
        dropZone.classList.remove('dragover');
    };
    
    dropZone.ondrop = (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        handleUploadFiles(Array.from(e.dataTransfer.files));
    };
    
    // Build selector
    const buildSelect = document.getElementById('uploadBuildSelect');
    const newBuildInput = document.getElementById('uploadNewBuildName');
    
    buildSelect.onchange = () => {
        newBuildInput.style.display = buildSelect.value === '__new__' ? 'block' : 'none';
    };


    

}

let sourceType = 'mine'; // Track if 'mine' or 'found'

window.toggleSourceType = function(type) {
    sourceType = type;
    
    document.querySelectorAll('.source-toggle-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.source === type);
    });
    
    const creatorInput = document.getElementById('uploadCreator');
    const linkInput = document.getElementById('uploadSourceLink');
    
    if (type === 'mine') {
        creatorInput.value = adminUser.name;
        creatorInput.disabled = true;
        creatorInput.placeholder = '';
        linkInput.removeAttribute('required');
        linkInput.classList.remove('upload-required');
    } else {
        creatorInput.value = '';
        creatorInput.disabled = false;
        creatorInput.placeholder = adminUser.name;
        linkInput.setAttribute('required', 'required');
        linkInput.classList.add('upload-required', 'empty');
        
        // Update red outline when link is entered/removed
        linkInput.oninput = () => {
            if (linkInput.value.trim()) {
                linkInput.classList.remove('empty');
                linkInput.classList.add('filled');
            } else {
                linkInput.classList.add('empty');
                linkInput.classList.remove('filled');
            }
        };
    }
};

// Auto-detect platform from URL
function detectPlatformFromUrl(url) {
    if (!url) return 'original';
    
    const urlLower = url.toLowerCase();
    
    if (urlLower.includes('youtube.com') || urlLower.includes('youtu.be')) return 'youtube';
    if (urlLower.includes('twitch.tv')) return 'twitch';
    if (urlLower.includes('twitter.com') || urlLower.includes('x.com')) return 'twitter';
    if (urlLower.includes('reddit.com')) return 'reddit';
    if (urlLower.includes('instagram.com')) return 'instagram';
    if (urlLower.includes('discord.gg') || urlLower.includes('discord.com')) return 'discord';
    
    return 'custom'; // Globe icon
}

// Load creator names for autocomplete
async function loadCreatorsForAutocomplete() {
    if (!supabaseClient) return;
    
    const { data } = await supabaseClient
        .from('creators')
        .select('name')
        .order('name');
    
    const datalist = document.getElementById('creatorList');
    if (datalist && data) {
        datalist.innerHTML = data.map(c => `<option value="${c.name}">`).join('');
    }
}

function handleUploadFiles(files) {
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes
    const validFiles = [];
    const rejectedFiles = [];
    
    // Filter out oversized files
    Array.from(files).forEach(file => {
        if (file.size > MAX_FILE_SIZE) {
            rejectedFiles.push(file.name);
        } else {
            validFiles.push(file);
        }
    });
    
    // Show warning if files were rejected
    if (rejectedFiles.length > 0) {
        showError(`${rejectedFiles.length} image(s) rejected (max 5MB per image): ${rejectedFiles.join(', ')}`);
    }
    
    // Check total limit
    const newTotal = uploadImages.length + validFiles.length;
    
    if (newTotal > 10) {
        const remaining = 10 - uploadImages.length;
        if (remaining > 0) {
            uploadImages = [...uploadImages, ...validFiles.slice(0, remaining)];
            showToast(`Maximum 10 images. Added ${remaining} of ${validFiles.length} valid images.`, 'warning');
        } else {
            showError('Maximum 10 images already selected');
            return;
        }
    } else {
        uploadImages = [...uploadImages, ...validFiles];
    }
    
    displayUploadPreviews();
}

function displayUploadPreviews() {
    const container = document.getElementById('uploadPreviews');
    const dropZone = document.getElementById('uploadDropZone');
    
    if (uploadImages.length > 0) {
        dropZone.classList.remove('required-empty');
        dropZone.classList.add('required-filled');
    } else {
        dropZone.classList.add('required-empty');
        dropZone.classList.remove('required-filled');
    }
    
    container.innerHTML = uploadImages.map((file, index) => `
        <div class="image-preview" draggable="true" data-index="${index}">
            <img src="${URL.createObjectURL(file)}" alt="Preview ${index + 1}">
            <button class="image-preview-remove" onclick="removeUploadImage(${index})" type="button">
                <i class="fas fa-times"></i>
            </button>
            ${index === 0 ? '<span class="primary-badge">Main</span>' : ''}
            <div class="drag-handle"><i class="fas fa-grip-vertical"></i></div>
        </div>
    `).join('');
    
    // Add drag and drop handlers
    setupImageReordering();
}

function setupImageReordering() {
    const previews = document.querySelectorAll('.image-preview');
    let draggedIndex = null;
    
    previews.forEach((preview, index) => {
        preview.addEventListener('dragstart', () => {
            draggedIndex = index;
            preview.style.opacity = '0.5';
        });
        
        preview.addEventListener('dragend', () => {
            preview.style.opacity = '1';
        });
        
        preview.addEventListener('dragover', (e) => {
            e.preventDefault();
        });
        
        preview.addEventListener('drop', (e) => {
            e.preventDefault();
            const dropIndex = index;
            
            if (draggedIndex !== null && draggedIndex !== dropIndex) {
                // Reorder the array
                const [movedFile] = uploadImages.splice(draggedIndex, 1);
                uploadImages.splice(dropIndex, 0, movedFile);
                
                displayUploadPreviews();
            }
        });
    });
}

window.removeUploadImage = function(index) {
    uploadImages.splice(index, 1);
    displayUploadPreviews();
};

async function loadBuildsForUpload() {
    if (!supabaseClient) return;
    
    const { data } = await supabaseClient
        .from('builds')
        .select('*')
        .order('created_at', { ascending: false });
    
    const select = document.getElementById('uploadBuildSelect');
    if (select && data) {
        const options = data.map(build => 
            `<option value="${build.id}">${build.name}</option>`
        ).join('');
        
        select.innerHTML = `
            <option value="">None</option>
            <option value="__new__">+ Create new build</option>
            ${options}
        `;
    }
}

async function loadTagsForUpload() {
    if (!supabaseClient) return;
    
    const { data: categories } = await supabaseClient
        .from('tag_categories')
        .select('*, tags(*)')
        .order('sort_order');
    
    const container = document.getElementById('uploadAvailableTags');
    if (!container || !categories) return;
    
    container.innerHTML = categories.map(cat => `
        <div class="tag-category-section">
            <h4>${cat.name}</h4>
            <div class="tag-options">
                ${cat.tags.sort((a,b) => a.sort_order - b.sort_order).map(tag => `
                    <button type="button" class="tag-option" data-tag="${tag.name}" onclick="toggleUploadTag('${tag.name}')">
                        ${tag.name}
                    </button>
                `).join('')}
            </div>
        </div>
    `).join('');
}

window.toggleUploadTag = function(tagName) {
    const button = document.querySelector(`#uploadAvailableTags [data-tag="${tagName}"]`);
    if (!button) return;
    
    button.classList.toggle('selected');
    
    if (button.classList.contains('selected')) {
        if (!uploadTags.includes(tagName)) {
            uploadTags.push(tagName);
        }
    } else {
        uploadTags = uploadTags.filter(t => t !== tagName);
    }
};


window.removeUploadTag = function(index) {
    uploadTags.splice(index, 1);
};

async function handleBuildBookUpload(event) {
    event.preventDefault();
    
    if (uploadImages.length === 0) {
        showError('Please select at least one image');
        return;
    }
    
    if (uploadTags.length === 0) {
        showError('Please add at least one tag');
        return;
    }
    
    try {
        const password = sessionStorage.getItem('admin_password');
        
        // Get build info
        const buildSelect = document.getElementById('uploadBuildSelect');
        const buildId = buildSelect.value === '__new__' ? null : (buildSelect.value || null);
        const buildName = buildSelect.value === '__new__' ? document.getElementById('uploadNewBuildName').value : null;
        
        if (buildSelect.value === '__new__' && !buildName) {
            showError('Please enter a build name');
            return;
        }
        
        showToast('Uploading images...', 'success');
        
        // Upload all images and generate thumbnails
        const imageUrls = [];
        const thumbnailUrls = [];
        
        for (let i = 0; i < uploadImages.length; i++) {
            const file = uploadImages[i];
            
            // Upload full image
            const fullFileName = `buildbook-full/${Date.now()}_${i}_${file.name}`;
            const { error: fullError } = await supabaseClient.storage
                .from('Images')
                .upload(fullFileName, file);
            
            if (fullError) throw fullError;
            
            imageUrls.push(`${SUPABASE_URL}/storage/v1/object/public/Images/${fullFileName}`);
            
            // Generate and upload thumbnail
            const thumbnail = await generateThumbnail(file);
            const thumbFileName = `buildbook-thumb/${Date.now()}_${i}_${file.name}`;
            const { error: thumbError } = await supabaseClient.storage
                .from('Images')
                .upload(thumbFileName, thumbnail);
            
            if (thumbError) throw thumbError;
            
            thumbnailUrls.push(`${SUPABASE_URL}/storage/v1/object/public/Images/${thumbFileName}`);
        }
        
        // Auto-detect platform from link
const sourceLink = document.getElementById('uploadSourceLink').value;
const detectedPlatform = sourceLink ? detectPlatformFromUrl(sourceLink) : 'original';

const imageData = {
    id: `img_${Date.now()}`,
    src: imageUrls[0],
    thumb: thumbnailUrls[0],
    image_urls: imageUrls,
    thumbnail_urls: thumbnailUrls,
    title: document.getElementById('uploadTitle').value,
    description: document.getElementById('uploadDescription').value,
    upload_notes: document.getElementById('uploadNotes').value || null,
    tags: uploadTags,
    source_platform: detectedPlatform,
    source_creator: document.getElementById('uploadCreator').value,
    source_link: sourceLink,
    protected: document.getElementById('uploadProtected')?.checked || false,
    build_id: buildId
};
        
        const response = await fetch(`${SUPABASE_URL}/functions/v1/admin-upload`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify({ password, imageData, buildName })
        });
        
        const result = await response.json();
        
        if (!response.ok || result.error) {
            throw new Error(result.error || 'Upload failed');
        }
        
        closeUploadModal();
        showSuccess('Upload successful!');
        await loadImages();
        applyFilters();
    } catch (error) {
        console.error('Upload error:', error);
        showError('Upload failed: ' + error.message);
    }
}

// Thumbnail generation (copied from admin.js)
async function generateThumbnail(file, maxWidth = 400, maxHeight = 300) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                
                if (width > height) {
                    if (width > maxWidth) {
                        height *= maxWidth / width;
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width *= maxHeight / height;
                        height = maxHeight;
                    }
                }
                
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                canvas.toBlob(resolve, 'image/jpeg', 0.8);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

function resetUploadForm() {
    document.getElementById('uploadFormBuildBook').reset();
    uploadImages = [];
    uploadTags = [];
    document.getElementById('uploadPreviews').innerHTML = '';
}

// ========================================
// TAG MANAGEMENT SYSTEM
// ========================================

let tagModalMode = null;
let tagModalData = null;

function openTagsModal() {
    document.getElementById('tagsModal').classList.add('active');
    loadTagsManager();
}

window.closeTagsModal = function() {
    document.getElementById('tagsModal').classList.remove('active');
};

window.closeTagEditModal = function() {
    document.getElementById('tagEditModal').classList.remove('active');
};

async function loadTagsManager() {
    if (!supabaseClient) return;
    
    const { data: categories } = await supabaseClient
        .from('tag_categories')
        .select('*, tags(*)')
        .order('sort_order');
    
    const container = document.getElementById('categoriesContainer');
    if (!container || !categories) return;
    
    container.innerHTML = categories.map(cat => `
        <div class="category-card">
            <div class="category-header">
                <h3 class="category-title">${cat.name}</h3>
                <div class="category-actions">
                    <button class="btn-icon" onclick="editCategory('${cat.id}', '${cat.name}')" title="Edit category">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon" onclick="deleteCategory('${cat.id}')" title="Delete category">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="tag-list">
                ${cat.tags.sort((a,b) => a.sort_order - b.sort_order).map(tag => `
                    <div class="tag-chip">
                        <span class="tag-chip-name">${tag.name}</span>
                        <div class="tag-chip-actions">
                            <button class="tag-chip-btn" onclick="editTag('${tag.id}', '${tag.name}', '${tag.category_id}')" title="Edit">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="tag-chip-btn" onclick="deleteTag('${tag.id}')" title="Delete">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
            <button class="btn-secondary" onclick="openAddTagModal('${cat.id}')">
                <i class="fas fa-plus"></i> Add Tag
            </button>
        </div>
    `).join('');
}

window.openCategoryModal = function() {
    tagModalMode = 'add-category';
    tagModalData = null;
    document.getElementById('tagModalTitle').textContent = 'Add Category';
    document.getElementById('tagModalLabel').textContent = 'Category Name';
    document.getElementById('tagModalInput').value = '';
    document.getElementById('categorySelectGroup').style.display = 'none';
    document.getElementById('tagEditModal').classList.add('active');
};

window.editCategory = function(id, name) {
    tagModalMode = 'edit-category';
    tagModalData = { id, name };
    document.getElementById('tagModalTitle').textContent = 'Edit Category';
    document.getElementById('tagModalLabel').textContent = 'Category Name';
    document.getElementById('tagModalInput').value = name;
    document.getElementById('categorySelectGroup').style.display = 'none';
    document.getElementById('tagEditModal').classList.add('active');
};

window.openAddTagModal = async function(categoryId) {
    tagModalMode = 'add-tag';
    tagModalData = { categoryId };
    document.getElementById('tagModalTitle').textContent = 'Add Tag';
    document.getElementById('tagModalLabel').textContent = 'Tag Name';
    document.getElementById('tagModalInput').value = '';
    
    await populateCategorySelect();
    document.getElementById('tagModalCategory').value = categoryId;
    document.getElementById('categorySelectGroup').style.display = 'block';
    document.getElementById('tagEditModal').classList.add('active');
};

window.editTag = async function(id, name, categoryId) {
    tagModalMode = 'edit-tag';
    tagModalData = { id, name, categoryId };
    document.getElementById('tagModalTitle').textContent = 'Edit Tag';
    document.getElementById('tagModalLabel').textContent = 'Tag Name';
    document.getElementById('tagModalInput').value = name;
    
    await populateCategorySelect();
    document.getElementById('tagModalCategory').value = categoryId;
    document.getElementById('categorySelectGroup').style.display = 'block';
    document.getElementById('tagEditModal').classList.add('active');
};

async function populateCategorySelect() {
    const { data: categories } = await supabaseClient
        .from('tag_categories')
        .select('*')
        .order('sort_order');
    
    const select = document.getElementById('tagModalCategory');
    if (select && categories) {
        select.innerHTML = categories.map(cat => 
            `<option value="${cat.id}">${cat.name}</option>`
        ).join('');
    }
}

window.saveTagModal = async function() {
    const value = document.getElementById('tagModalInput').value.trim();
    if (!value) {
        showError('Please enter a name');
        return;
    }
    
    const password = sessionStorage.getItem('admin_password');
    
    try {
        if (tagModalMode === 'add-category' || tagModalMode === 'edit-category') {
            const response = await fetch(`${SUPABASE_URL}/functions/v1/tag-manage-category`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
                },
                body: JSON.stringify({
                    password,
                    operation: tagModalMode === 'add-category' ? 'create' : 'update',
                    categoryId: tagModalData?.id,
                    name: value
                })
            });
            
            const result = await response.json();
            if (!response.ok || result.error) {
                throw new Error(result.error || 'Failed to save category');
            }
        }
        else if (tagModalMode === 'add-tag' || tagModalMode === 'edit-tag') {
            const categoryId = document.getElementById('tagModalCategory').value;
            
            const response = await fetch(`${SUPABASE_URL}/functions/v1/tag-manage-tag`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
                },
                body: JSON.stringify({
                    password,
                    operation: tagModalMode === 'add-tag' ? 'create' : 'update',
                    tagId: tagModalData?.id,
                    name: value,
                    categoryId: categoryId
                })
            });
            
            const result = await response.json();
            if (!response.ok || result.error) {
                throw new Error(result.error || 'Failed to save tag');
            }
        }
        
        closeTagEditModal();
        loadTagsManager();
        showSuccess('Saved successfully');
    } catch (error) {
        console.error('Save error:', error);
        showError('Failed to save: ' + error.message);
    }
};

window.deleteCategory = async function(id) {
    if (!confirm('Delete this category? All tags in it will also be deleted.')) return;
    
    const password = sessionStorage.getItem('admin_password');
    
    try {
        const response = await fetch(`${SUPABASE_URL}/functions/v1/tag-manage-category`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify({
                password,
                operation: 'delete',
                categoryId: id
            })
        });
        
        const result = await response.json();
        if (!response.ok || result.error) {
            throw new Error(result.error || 'Failed to delete');
        }
        
        loadTagsManager();
        showSuccess('Category deleted');
    } catch (error) {
        console.error('Delete error:', error);
        showError('Failed to delete');
    }
};

window.deleteTag = async function(id) {
    if (!confirm('Delete this tag?')) return;
    
    const password = sessionStorage.getItem('admin_password');
    
    try {
        const response = await fetch(`${SUPABASE_URL}/functions/v1/tag-manage-tag`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify({
                password,
                operation: 'delete',
                tagId: id
            })
        });
        
        const result = await response.json();
        if (!response.ok || result.error) {
            throw new Error(result.error || 'Failed to delete');
        }
        
        loadTagsManager();
        showSuccess('Tag deleted');
    } catch (error) {
        console.error('Delete error:', error);
        showError('Failed to delete');
    }
};



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
    showToast(message, 'error');
}

function showSuccess(message) {
    showToast(message, 'success');
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

window.showLinkInfo = function() {
    alert("Posting someone else's idea requires providing credit via link. If possible, be specific (timestamped YouTube link, Twitch clip, Reddit post) rather than just linking their profile page. You're encouraged to add links for your own work as well!");
};

window.showCreatorInfo = function() {
    alert("Do not include @ or u/ prefixes; these are added automatically based on the platform. For YouTube and Twitch users, feel free to use the display name instead of username. You're encouraged to add links for your own work as well!");
};