// ========================================
// GLOBAL AUTHENTICATION & LOGIN MENU UI
// (Restored from Claude's original logic)
// ========================================

const SUPABASE_URL = "https://iuhtzvblmthenynuojtn.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1aHR6dmJsbXRoZW55bnVvanRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0MTAxNDYsImV4cCI6MjA4NTk4NjE0Nn0.8tzqkuh6rCbB_0TLc3K4TITI2IG-MhtUdWpuyATZPKk";

window.supabaseClient = null;
window.adminUser = null;
window.isAdminLoggedIn = false;

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Supabase
    if (window.supabase) {
        window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }

    // 2. Setup Login Menu Toggle UI
    setupLoginMenuToggle();

    // 3. Setup Auth Buttons
    const submitBtn = document.getElementById('sb-submit');
    const passwordInput = document.getElementById('sb-password');
    const logoutBtn = document.getElementById('logout-btn');

    if (submitBtn) submitBtn.addEventListener('click', handleLogin);
    if (passwordInput) passwordInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleLogin(); });
    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);

    // 4. Check for existing session
    checkExistingSession();
});

// --- UI TOGGLE LOGIC ---
function setupLoginMenuToggle() {
    const loginToggleBtn = document.getElementById('login-toggle-btn');
    const loginMenu = document.getElementById('supabase-login-menu');

    if (!loginToggleBtn || !loginMenu) return;

    loginToggleBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation(); // Prevents instant closing
        
        loginMenu.classList.toggle('is-open');
        if (loginMenu.classList.contains('is-open')) {
            document.getElementById('sb-password').focus();
        }
    });

    loginMenu.addEventListener('click', (e) => e.stopPropagation());
    document.addEventListener('click', () => loginMenu.classList.remove('is-open'));
}

// --- CLAUDE'S ORIGINAL AUTH LOGIC ---
async function handleLogin() {
    const passwordInput = document.getElementById('sb-password');
    const errorMsg = document.getElementById('sb-error-msg');
    const password = passwordInput.value;

    if (!password) return;

    try {
        // Claude's exact Edge Function call
        const response = await fetch(`${SUPABASE_URL}/functions/v1/verify-login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify({ password })
        });

        const data = await response.json();

        if (response.ok && data.user) {
            // Success
            window.isAdminLoggedIn = true;
            window.adminUser = data.user;
            
            // Storing exactly how Claude did
            sessionStorage.setItem('admin_user', JSON.stringify(data.user));
            sessionStorage.setItem('admin_password', password); 
            
            passwordInput.value = '';
            errorMsg.style.display = 'none';
            document.getElementById('supabase-login-menu').classList.remove('is-open');
            
            updateHeaderUI();
            
            // Broadcast the login event so build-book.js can reload its images
            window.dispatchEvent(new Event('authStateChanged'));

        } else {
            // Fail
            errorMsg.textContent = "Incorrect password";
            errorMsg.style.display = 'block';
            passwordInput.value = '';
        }
    } catch (error) {
        console.error('Login error:', error);
        errorMsg.textContent = "Connection failed";
        errorMsg.style.display = 'block';
    }
}

function handleLogout() {
    // Claude's exact logout cleanup
    sessionStorage.removeItem('admin_user');
    sessionStorage.removeItem('admin_password');
    window.isAdminLoggedIn = false;
    window.adminUser = null;
    
    updateHeaderUI();
    window.dispatchEvent(new Event('authStateChanged'));
}

function checkExistingSession() {
    // Claude's exact session check
    const savedUser = sessionStorage.getItem('admin_user');
    if (savedUser) {
        window.adminUser = JSON.parse(savedUser);
        window.isAdminLoggedIn = true;
        updateHeaderUI();
    }
}

// --- HEADER UI UPDATES ---
function updateHeaderUI() {
    const authContainer = document.querySelector('.auth-container');
    const loginToggleBtn = document.getElementById('login-toggle-btn');
    const userStatusGroup = document.querySelector('.user-status-group');
    const usernameEl = document.querySelector('.user-status-text .username');
    const roleEl = document.querySelector('.user-status-text .role');

    if (!authContainer) return;

    if (window.isAdminLoggedIn) {
        authContainer.dataset.loggedIn = "true";
        loginToggleBtn.style.display = "none";
        userStatusGroup.style.display = "flex"; 
        
        // Exact formatting Claude used
        const roleDisplay = window.adminUser.role === 'admin' ? 'Admin' : 'Contributor';
        usernameEl.textContent = window.adminUser.name + ' -';
        roleEl.textContent = ` ${roleDisplay}`;
    } else {
        authContainer.dataset.loggedIn = "false";
        loginToggleBtn.style.display = "flex";
        userStatusGroup.style.display = "none";
    }
}