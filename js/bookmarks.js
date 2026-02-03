// ========================================
// BOOKMARK SYSTEM - Shared across all pages
// ========================================

class BookmarkSystem {
    constructor() {
        this.storageKey = 'brycho_bookmarks';
        this.userCodeKey = 'brycho_user_code';
        this.bookmarks = this.loadBookmarks();
        this.userCode = this.getUserCode();
    }

    // Generate or retrieve user code
    getUserCode() {
        let code = localStorage.getItem(this.userCodeKey);
        if (!code) {
            code = this.generateUserCode();
            localStorage.setItem(this.userCodeKey, code);
        }
        return code;
    }

    // Generate random user code (e.g., "BV7K-2M9X")
    generateUserCode() {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let code = '';
        for (let i = 0; i < 8; i++) {
            if (i === 4) code += '-';
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    }

    // Load bookmarks from localStorage
    loadBookmarks() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            return stored ? JSON.parse(stored) : {
                inspiration: [],
                signs: [],
                custom: []
            };
        } catch (error) {
            console.error('Error loading bookmarks:', error);
            return {
                inspiration: [],
                signs: [],
                custom: []
            };
        }
    }

    // Save bookmarks to localStorage
    saveBookmarks() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.bookmarks));
        } catch (error) {
            console.error('Error saving bookmarks:', error);
        }
    }

    // Add bookmark
    addBookmark(type, id) {
        if (!this.bookmarks[type]) {
            this.bookmarks[type] = [];
        }
        if (!this.bookmarks[type].includes(id)) {
            this.bookmarks[type].push(id);
            this.saveBookmarks();
            return true;
        }
        return false;
    }

    // Remove bookmark
    removeBookmark(type, id) {
        if (this.bookmarks[type]) {
            const index = this.bookmarks[type].indexOf(id);
            if (index > -1) {
                this.bookmarks[type].splice(index, 1);
                this.saveBookmarks();
                return true;
            }
        }
        return false;
    }

    // Toggle bookmark
    toggleBookmark(type, id) {
        if (this.isBookmarked(type, id)) {
            return this.removeBookmark(type, id);
        } else {
            return this.addBookmark(type, id);
        }
    }

    // Check if item is bookmarked
    isBookmarked(type, id) {
        return this.bookmarks[type] && this.bookmarks[type].includes(id);
    }

    // Get all bookmarks of a type
    getBookmarks(type) {
        return this.bookmarks[type] || [];
    }

    // Get total bookmark count
    getTotalCount() {
        return Object.values(this.bookmarks).reduce((total, arr) => total + arr.length, 0);
    }

    // Get shareable URL
    getShareableURL(baseURL) {
        const encoded = btoa(JSON.stringify(this.bookmarks))
            .replace(/=/g, '')
            .substring(0, 12);
        return `${baseURL}?bookmarks=${encoded}`;
    }

    // Load bookmarks from shared URL
    loadFromShareCode(code) {
        try {
            const decoded = JSON.parse(atob(code));
            this.bookmarks = decoded;
            this.saveBookmarks();
            return true;
        } catch (error) {
            console.error('Invalid share code:', error);
            return false;
        }
    }

    // Clear all bookmarks
    clearAll() {
        this.bookmarks = {
            inspiration: [],
            signs: [],
            custom: []
        };
        this.saveBookmarks();
    }

    // Export bookmarks as JSON
    exportBookmarks() {
        return JSON.stringify(this.bookmarks, null, 2);
    }

    // Import bookmarks from JSON
    importBookmarks(jsonString) {
        try {
            const imported = JSON.parse(jsonString);
            this.bookmarks = imported;
            this.saveBookmarks();
            return true;
        } catch (error) {
            console.error('Error importing bookmarks:', error);
            return false;
        }
    }
}

// Initialize global bookmark system
window.bookmarkSystem = new BookmarkSystem();

// Update bookmark count in header
function updateBookmarkCount() {
    const countElement = document.querySelector('.bookmark-count');
    if (countElement) {
        const count = window.bookmarkSystem.getTotalCount();
        countElement.textContent = count;
        countElement.style.display = count > 0 ? 'block' : 'none';
    }
}

// Check for shared bookmarks in URL
function checkForSharedBookmarks() {
    const urlParams = new URLSearchParams(window.location.search);
    const sharedCode = urlParams.get('bookmarks');
    
    if (sharedCode) {
        const confirmed = confirm('Load bookmarks from this shared link?');
        if (confirmed) {
            if (window.bookmarkSystem.loadFromShareCode(sharedCode)) {
                alert('Bookmarks loaded successfully!');
                updateBookmarkCount();
                // Remove the parameter from URL
                window.history.replaceState({}, document.title, window.location.pathname);
            } else {
                alert('Failed to load bookmarks. Invalid share code.');
            }
        }
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    updateBookmarkCount();
    checkForSharedBookmarks();
});
