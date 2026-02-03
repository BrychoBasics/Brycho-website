// ========================================
// BUILD BOOK - Main Gallery Logic
// ========================================

let allImages = [];
let filteredImages = [];
let activeTags = [];
let filterMode = 'and'; // 'and' or 'or'
let searchTerm = '';
let passwordUnlocked = false;
const PASSWORD = 'viking'; // Change this to your desired password

// ========================================
// DATA LOADING
// ========================================

async function loadImages() {
    try {
        const response = await fetch('data/inspiration-images.json');
        const data = await response.json();
        allImages = data.images;
        filteredImages = allImages;
        
        // Hide loading spinner
        document.getElementById('loadingSpinner').style.display = 'none';
        
        // Initialize UI
        generateTagFilters();
        renderGallery();
    } catch (error) {
        console.error('Error loading images:', error);
        document.getElementById('loadingSpinner').innerHTML = `
            <i class="fas fa-exclamation-triangle"></i>
            <p>Error loading gallery. Please refresh the page.</p>
        `;
    }
}

// ========================================
// TAG FILTERS
// ========================================

function generateTagFilters() {
    const tagCategories = {
        buildingType: new Set(),
        technique: new Set(),
        style: new Set(),
        difficulty: new Set(),
        source: new Set()
    };

    // Collect all unique tags
    allImages.forEach(img => {
        if (img.tags) {
            img.tags.forEach(tag => {
                // Categorize tags (you can customize this logic)
                if (tag.includes('hall') || tag.includes('house') || tag.includes('tower')) {
                    tagCategories.buildingType.add(tag);
                } else if (tag.includes('roofing') || tag.includes('timber') || tag.includes('stone')) {
                    tagCategories.technique.add(tag);
                } else if (tag.includes('medieval') || tag.includes('viking') || tag.includes('modern')) {
                    tagCategories.style.add(tag);
                } else if (tag.includes('easy') || tag.includes('medium') || tag.includes('hard')) {
                    tagCategories.difficulty.add(tag);
                } else {
                    tagCategories.technique.add(tag); // Default category
                }
            });
        }
        
        // Add source creators
        if (img.source && img.source.creator) {
            tagCategories.source.add(img.source.creator);
        }
    });

    // Render tag filters
    renderTagCategory('buildingTypeTags', tagCategories.buildingType);
    renderTagCategory('techniqueTags', tagCategories.technique);
    renderTagCategory('styleTags', tagCategories.style);
    renderTagCategory('difficultyTags', tagCategories.difficulty);
    renderTagCategory('sourceTags', tagCategories.source, 'creator');
}

function renderTagCategory(containerId, tags, type = 'tag') {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = '';
    
    Array.from(tags).sort().forEach(tag => {
        const button = document.createElement('button');
        button.className = 'tag-filter';
        button.textContent = tag;
        button.dataset.tag = tag;
        button.dataset.type = type;
        
        button.addEventListener('click', () => toggleTagFilter(tag, type, button));
        
        container.appendChild(button);
    });
}

function toggleTagFilter(tag, type, buttonElement) {
    const filterKey = type === 'creator' ? `creator:${tag}` : tag;
    const index = activeTags.indexOf(filterKey);
    
    if (index > -1) {
        activeTags.splice(index, 1);
        buttonElement.classList.remove('active');
    } else {
        activeTags.push(filterKey);
        buttonElement.classList.add('active');
    }
    
    updateActiveFiltersDisplay();
    applyFilters();
}

function updateActiveFiltersDisplay() {
    const container = document.getElementById('activeFiltersList');
    const countElement = document.querySelector('.active-filters-count');
    
    if (activeTags.length === 0) {
        container.innerHTML = '';
        container.style.display = 'none';
        if (countElement) countElement.textContent = '0';
        return;
    }
    
    container.style.display = 'flex';
    if (countElement) countElement.textContent = activeTags.length;
    
    container.innerHTML = activeTags.map(tag => {
        const displayTag = tag.replace('creator:', '');
        return `
            <div class="active-filter-tag">
                ${displayTag}
                <i class="fas fa-times" onclick="removeActiveTag('${tag}')"></i>
            </div>
        `;
    }).join('');
}

function removeActiveTag(tag) {
    const index = activeTags.indexOf(tag);
    if (index > -1) {
        activeTags.splice(index, 1);
    }
    
    // Update button state
    const buttons = document.querySelectorAll('.tag-filter');
    buttons.forEach(btn => {
        const btnTag = btn.dataset.type === 'creator' ? `creator:${btn.dataset.tag}` : btn.dataset.tag;
        if (btnTag === tag) {
            btn.classList.remove('active');
        }
    });
    
    updateActiveFiltersDisplay();
    applyFilters();
}

// ========================================
// FILTERING
// ========================================

function applyFilters() {
    filteredImages = allImages.filter(img => {
        // Password protection
        if (img.protected && !passwordUnlocked) {
            return false;
        }
        
        // Search filter
        if (searchTerm) {
            const searchLower = searchTerm.toLowerCase();
            const matchesSearch = 
                img.title.toLowerCase().includes(searchLower) ||
                img.description.toLowerCase().includes(searchLower) ||
                (img.tags && img.tags.some(tag => tag.toLowerCase().includes(searchLower))) ||
                (img.source && img.source.creator && img.source.creator.toLowerCase().includes(searchLower));
            
            if (!matchesSearch) return false;
        }
        
        // Tag filters
        if (activeTags.length > 0) {
            if (filterMode === 'and') {
                // Must match ALL tags
                return activeTags.every(filterTag => {
                    if (filterTag.startsWith('creator:')) {
                        const creator = filterTag.replace('creator:', '');
                        return img.source && img.source.creator === creator;
                    }
                    return img.tags && img.tags.includes(filterTag);
                });
            } else {
                // Must match ANY tag
                return activeTags.some(filterTag => {
                    if (filterTag.startsWith('creator:')) {
                        const creator = filterTag.replace('creator:', '');
                        return img.source && img.source.creator === creator;
                    }
                    return img.tags && img.tags.includes(filterTag);
                });
            }
        }
        
        return true;
    });
    
    renderGallery();
}

// ========================================
// GALLERY RENDERING
// ========================================

function renderGallery() {
    const grid = document.getElementById('galleryGrid');
    const noResults = document.getElementById('noResults');
    
    if (filteredImages.length === 0) {
        grid.style.display = 'none';
        noResults.style.display = 'block';
        return;
    }
    
    grid.style.display = 'grid';
    noResults.style.display = 'none';
    
    grid.innerHTML = filteredImages.map(img => {
        const isBookmarked = window.bookmarkSystem.isBookmarked('inspiration', img.id);
        const protectedClass = img.protected ? 'protected' : '';
        
        return `
            <div class="gallery-item ${protectedClass}" data-id="${img.id}">
                <img src="${img.thumb || img.src}" alt="${img.title}" class="item-image" loading="lazy">
                <div class="item-content">
                    <h3 class="item-title">${img.title}</h3>
                    <p class="item-description">${img.description}</p>
                    <div class="item-meta">
                        <div class="item-source">
                            ${getSourceIcon(img.source)}
                            <span>${img.source.creator}</span>
                        </div>
                        <i class="item-bookmark ${isBookmarked ? 'fas bookmarked' : 'far'} fa-bookmark" 
                           onclick="event.stopPropagation(); toggleBookmark('${img.id}')"></i>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    // Add click handlers
    document.querySelectorAll('.gallery-item').forEach(item => {
        item.addEventListener('click', () => {
            const id = item.dataset.id;
            openLightbox(id);
        });
    });
}

function getSourceIcon(source) {
    const icons = {
        youtube: '<i class="fab fa-youtube source-icon"></i>',
        twitch: '<i class="fab fa-twitch source-icon"></i>',
        reddit: '<i class="fab fa-reddit source-icon"></i>',
        instagram: '<i class="fab fa-instagram source-icon"></i>',
        discord: '<i class="fab fa-discord source-icon"></i>',
        web: '<i class="fas fa-globe source-icon"></i>',
        custom: '<i class="fas fa-hammer source-icon"></i>'
    };
    
    return icons[source.platform] || icons.web;
}

// ========================================
// LIGHTBOX
// ========================================

function openLightbox(imageId) {
    const image = allImages.find(img => img.id === imageId);
    if (!image) return;
    
    const lightbox = document.getElementById('lightbox');
    const isBookmarked = window.bookmarkSystem.isBookmarked('inspiration', imageId);
    
    // Set main image
    document.getElementById('lightboxMainImage').src = image.src;
    document.getElementById('lightboxTitle').textContent = image.title;
    document.getElementById('lightboxDescription').textContent = image.description;
    
    // Set tags
    const tagsContainer = document.getElementById('lightboxTags');
    tagsContainer.innerHTML = image.tags ? image.tags.map(tag => 
        `<span class="lightbox-tag">${tag}</span>`
    ).join('') : '';
    
    // Set source
    const sourceContainer = document.getElementById('lightboxSource');
    sourceContainer.innerHTML = `
        ${getSourceIcon(image.source)}
        <div>
            <strong>${image.source.creator}</strong>
            ${image.source.link ? `<br><a href="${image.source.link}" target="_blank">View Source</a>` : ''}
        </div>
    `;
    
    // Set bookmark button
    const bookmarkBtn = document.getElementById('lightboxBookmark');
    bookmarkBtn.className = isBookmarked ? 'btn-bookmark bookmarked' : 'btn-bookmark';
    bookmarkBtn.innerHTML = isBookmarked ? 
        '<i class="fas fa-bookmark"></i> Bookmarked' : 
        '<i class="far fa-bookmark"></i> Bookmark';
    bookmarkBtn.onclick = () => toggleBookmark(imageId);
    
    // Set thumbnails if multiple images
    const thumbnailsContainer = document.getElementById('lightboxThumbnails');
    if (image.additionalImages && image.additionalImages.length > 0) {
        thumbnailsContainer.innerHTML = [image.src, ...image.additionalImages].map((src, index) => `
            <div class="lightbox-thumbnail ${index === 0 ? 'active' : ''}" onclick="switchLightboxImage('${src}', this)">
                <img src="${src}" alt="View ${index + 1}">
            </div>
        `).join('');
        thumbnailsContainer.style.display = 'flex';
    } else {
        thumbnailsContainer.style.display = 'none';
    }
    
    // Set related items
    const relatedContainer = document.getElementById('lightboxRelated');
    if (image.relatedImages && image.relatedImages.length > 0) {
        const relatedItems = image.relatedImages
            .map(id => allImages.find(img => img.id === id))
            .filter(img => img);
        
        relatedContainer.innerHTML = relatedItems.map(related => `
            <div class="related-item" onclick="openLightbox('${related.id}')">
                <img src="${related.thumb || related.src}" alt="${related.title}">
            </div>
        `).join('');
    } else {
        relatedContainer.innerHTML = '<p>No related techniques</p>';
    }
    
    // Show lightbox
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeLightbox() {
    const lightbox = document.getElementById('lightbox');
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
}

function switchLightboxImage(src, element) {
    document.getElementById('lightboxMainImage').src = src;
    
    // Update active thumbnail
    document.querySelectorAll('.lightbox-thumbnail').forEach(thumb => {
        thumb.classList.remove('active');
    });
    element.classList.add('active');
}

// ========================================
// BOOKMARKS
// ========================================

function toggleBookmark(imageId) {
    window.bookmarkSystem.toggleBookmark('inspiration', imageId);
    updateBookmarkCount();
    
    // Update UI
    renderGallery();
    
    // If lightbox is open, update bookmark button
    const lightboxBtn = document.getElementById('lightboxBookmark');
    if (lightboxBtn) {
        const isBookmarked = window.bookmarkSystem.isBookmarked('inspiration', imageId);
        lightboxBtn.className = isBookmarked ? 'btn-bookmark bookmarked' : 'btn-bookmark';
        lightboxBtn.innerHTML = isBookmarked ? 
            '<i class="fas fa-bookmark"></i> Bookmarked' : 
            '<i class="far fa-bookmark"></i> Bookmark';
    }
}

function openBookmarksModal() {
    const modal = document.getElementById('bookmarksModal');
    const bookmarkedIds = window.bookmarkSystem.getBookmarks('inspiration');
    const bookmarkedImages = allImages.filter(img => bookmarkedIds.includes(img.id));
    
    // Set shareable link
    const shareInput = document.getElementById('shareCodeInput');
    shareInput.value = window.bookmarkSystem.getShareableURL(window.location.origin + window.location.pathname);
    
    // Render bookmarked items
    const grid = document.getElementById('bookmarksGrid');
    const noBookmarks = document.getElementById('noBookmarks');
    
    if (bookmarkedImages.length === 0) {
        grid.style.display = 'none';
        noBookmarks.style.display = 'block';
    } else {
        grid.style.display = 'grid';
        noBookmarks.style.display = 'none';
        
        grid.innerHTML = bookmarkedImages.map(img => `
            <div class="gallery-item" data-id="${img.id}">
                <img src="${img.thumb || img.src}" alt="${img.title}" class="item-image">
                <div class="item-content">
                    <h3 class="item-title">${img.title}</h3>
                    <p class="item-description">${img.description}</p>
                    <div class="item-meta">
                        <div class="item-source">
                            ${getSourceIcon(img.source)}
                            <span>${img.source.creator}</span>
                        </div>
                        <i class="item-bookmark fas bookmarked fa-bookmark" 
                           onclick="event.stopPropagation(); toggleBookmark('${img.id}')"></i>
                    </div>
                </div>
            </div>
        `).join('');
        
        // Add click handlers
        grid.querySelectorAll('.gallery-item').forEach(item => {
            item.addEventListener('click', () => {
                closeBookmarksModal();
                openLightbox(item.dataset.id);
            });
        });
    }
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeBookmarksModal() {
    const modal = document.getElementById('bookmarksModal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

function copyShareCode() {
    const input = document.getElementById('shareCodeInput');
    input.select();
    document.execCommand('copy');
    
    const btn = document.getElementById('copyShareCodeBtn');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-check"></i> Copied!';
    setTimeout(() => {
        btn.innerHTML = originalText;
    }, 2000);
}

// ========================================
// PASSWORD PROTECTION
// ========================================

function showPasswordPrompt() {
    const prompt = document.getElementById('passwordPrompt');
    prompt.style.display = 'block';
}

function checkPassword() {
    const input = document.getElementById('passwordInput');
    if (input.value === PASSWORD) {
        passwordUnlocked = true;
        sessionStorage.setItem('brycho_password', 'unlocked');
        document.getElementById('passwordPrompt').style.display = 'none';
        input.value = '';
        applyFilters();
    } else {
        alert('Incorrect password');
        input.value = '';
    }
}

// Check if password was already entered this session
if (sessionStorage.getItem('brycho_password') === 'unlocked') {
    passwordUnlocked = true;
}

// ========================================
// EVENT LISTENERS
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    // Load data
    loadImages();
    
    // Search
    document.getElementById('searchInput').addEventListener('input', (e) => {
        searchTerm = e.target.value;
        applyFilters();
    });
    
    // Filter mode toggle
    document.getElementById('filterModeAnd').addEventListener('click', () => {
        filterMode = 'and';
        document.getElementById('filterModeAnd').classList.add('active');
        document.getElementById('filterModeOr').classList.remove('active');
        applyFilters();
    });
    
    document.getElementById('filterModeOr').addEventListener('click', () => {
        filterMode = 'or';
        document.getElementById('filterModeOr').classList.add('active');
        document.getElementById('filterModeAnd').classList.remove('active');
        applyFilters();
    });
    
    // Show/hide filters
    document.getElementById('showFiltersBtn').addEventListener('click', () => {
        const panel = document.getElementById('tagFilterPanel');
        panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    });
    
    // Clear filters
    document.getElementById('clearFiltersBtn').addEventListener('click', () => {
        activeTags = [];
        searchTerm = '';
        document.getElementById('searchInput').value = '';
        document.querySelectorAll('.tag-filter').forEach(btn => btn.classList.remove('active'));
        updateActiveFiltersDisplay();
        applyFilters();
    });
    
    document.getElementById('resetFiltersBtn').addEventListener('click', () => {
        document.getElementById('clearFiltersBtn').click();
    });
    
    // Lightbox
    document.querySelector('.lightbox-close').addEventListener('click', closeLightbox);
    document.querySelector('.lightbox-overlay').addEventListener('click', closeLightbox);
    
    // Bookmarks modal
    document.getElementById('bookmarksBtn').addEventListener('click', openBookmarksModal);
    document.querySelector('#bookmarksModal .modal-close').addEventListener('click', closeBookmarksModal);
    document.querySelector('#bookmarksModal .modal-overlay').addEventListener('click', closeBookmarksModal);
    document.getElementById('copyShareCodeBtn').addEventListener('click', copyShareCode);
    
    // Password
    document.getElementById('passwordSubmit').addEventListener('click', checkPassword);
    document.getElementById('passwordInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') checkPassword();
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeLightbox();
            closeBookmarksModal();
        }
    });
});

// Special key sequence for password prompt (Ctrl+Shift+P)
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        e.preventDefault();
        showPasswordPrompt();
    }
});
