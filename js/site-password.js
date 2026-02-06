// ========================================
// SITE PASSWORD PROTECTION (Simple)
// ========================================

class SitePassword {
    constructor(password, pages = []) {
        this.password = password;
        this.protectedPages = pages; // Array of page paths to protect
        this.storageKey = 'brycho_site_access';
        this.init();
    }
    
    init() {
        // Check if current page should be protected
        const currentPath = window.location.pathname;
        const shouldProtect = this.protectedPages.length === 0 || 
                             this.protectedPages.some(page => currentPath.includes(page));
        
        if (!shouldProtect) return;
        
        // Check if already authenticated
        const isAuthenticated = sessionStorage.getItem(this.storageKey) === 'true';
        
        if (!isAuthenticated) {
            this.showPasswordPrompt();
        }
    }
    
    showPasswordPrompt() {
        // Create password overlay
        const overlay = document.createElement('div');
        overlay.id = 'sitePasswordOverlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(26, 22, 18, 0.98);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
        `;
        
        overlay.innerHTML = `
            <div style="
                background: #2a221c;
                border: 2px solid #5c4a3a;
                border-radius: 12px;
                padding: 3rem;
                max-width: 400px;
                width: 90%;
                text-align: center;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
            ">
                <i class="fas fa-lock" style="
                    font-size: 3rem;
                    color: #d4764e;
                    margin-bottom: 1.5rem;
                "></i>
                <h2 style="
                    font-family: 'Cinzel', serif;
                    font-size: 1.75rem;
                    margin-bottom: 1rem;
                    color: #e8dfd6;
                ">Page Protected</h2>
                <p style="
                    font-family: 'Lora', serif;
                    color: #c4b5a8;
                    margin-bottom: 2rem;
                ">This page is currently in development. Enter password to continue.</p>
                <input type="password" id="sitePasswordInput" placeholder="Enter password" style="
                    width: 100%;
                    padding: 0.75rem 1rem;
                    font-family: 'Lora', serif;
                    font-size: 1rem;
                    background: #1a1612;
                    border: 1px solid #5c4a3a;
                    border-radius: 8px;
                    color: #e8dfd6;
                    margin-bottom: 1rem;
                " />
                <button id="sitePasswordSubmit" style="
                    width: 100%;
                    padding: 0.75rem 1.5rem;
                    font-family: 'Lora', serif;
                    font-weight: 600;
                    font-size: 1rem;
                    background: linear-gradient(135deg, #d4764e, #b85c38);
                    color: white;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
                ">Unlock</button>
                <p id="sitePasswordError" style="
                    color: #c4574e;
                    margin-top: 1rem;
                    font-family: 'Lora', serif;
                    display: none;
                ">Incorrect password</p>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        const input = document.getElementById('sitePasswordInput');
        const submitBtn = document.getElementById('sitePasswordSubmit');
        const error = document.getElementById('sitePasswordError');
        
        const checkPassword = () => {
            if (input.value === this.password) {
                sessionStorage.setItem(this.storageKey, 'true');
                overlay.remove();
            } else {
                error.style.display = 'block';
                input.value = '';
                input.focus();
                setTimeout(() => {
                    error.style.display = 'none';
                }, 3000);
            }
        };
        
        submitBtn.addEventListener('click', checkPassword);
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') checkPassword();
        });
        
        input.focus();
    }
}

// Initialize site password protection
// Set pages to protect - empty array = protect all pages
// Example: ['sign-center', 'admin'] = only protect those pages
window.sitePassword = new SitePassword('viking', []); // Protect all pages initially
