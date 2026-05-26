/* ==========================================================================
   Login Page Script with Firebase Authentication
   Dayananda Sagar College of Engineering
   ========================================================================== */

let selectedRole = 'student';

document.addEventListener('DOMContentLoaded', () => {
    initLoginPage();
});

function initLoginPage() {
    // Role selector
    const roleTabs = document.querySelectorAll('.role-tab');
    roleTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            roleTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            selectedRole = tab.getAttribute('data-role');
        });
    });

    // Login form submission
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await handleEmailLogin();
        });
    }

    // Google Sign-In
    const googleSignInBtn = document.getElementById('googleSignInBtn');
    if (googleSignInBtn) {
        googleSignInBtn.addEventListener('click', () => handleGoogleSignIn());
    }

    // Registration modal
    const switchToRegister = document.getElementById('switchToRegister');
    if (switchToRegister) {
        switchToRegister.addEventListener('click', (e) => {
            e.preventDefault();
            openRegisterModal();
        });
    }

    // Registration form
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await handleRegistration();
        });
    }

    // Forgot password
    const forgotPasswordLink = document.getElementById('forgotPasswordLink');
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', (e) => {
            e.preventDefault();
            openForgotPasswordModal();
        });
    }

    const forgotPasswordForm = document.getElementById('forgotPasswordForm');
    if (forgotPasswordForm) {
        forgotPasswordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await handleForgotPassword();
        });
    }

    // Modal close buttons
    const closeRegisterBtn = document.getElementById('closeRegisterModal');
    const closeForgotPasswordBtn = document.getElementById('closeForgotPasswordModal');
    
    if (closeRegisterBtn) {
        closeRegisterBtn.addEventListener('click', () => closeRegisterModal());
    }
    
    if (closeForgotPasswordBtn) {
        closeForgotPasswordBtn.addEventListener('click', () => closeForgotPasswordModal());
    }

    // Close modals on overlay click
    document.addEventListener('click', (e) => {
        const registerModal = document.getElementById('registerModal');
        const forgotPasswordModal = document.getElementById('forgotPasswordModal');
        
        if (registerModal && e.target === registerModal) {
            closeRegisterModal();
        }
        if (forgotPasswordModal && e.target === forgotPasswordModal) {
            closeForgotPasswordModal();
        }
    });
}

// --- EMAIL LOGIN ---
async function handleEmailLogin() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const rememberMe = document.getElementById('rememberMe').checked;

    if (!email || !password) {
        showToast('Error', 'Please enter email and password', 'error');
        return;
    }

    if (password.length < 6) {
        showToast('Error', 'Password must be at least 6 characters', 'error');
        return;
    }

    try {
        const user = await firebaseAuth.loginWithEmail(email, password);
        
        // Store login preference
        if (rememberMe) {
            localStorage.setItem('rememberEmail', email);
        }

        // Create session
        const sessionId = await firestoreDB.createSession(user.uid, {
            email: user.email
        });

        // Redirect based on role
        const userRole = await firebaseAuth.getUserRole(user.uid);
        redirectToDashboard(userRole);
    } catch (error) {
        console.error('Login error:', error);
        let errorMessage = 'Login failed. Please try again.';
        
        if (error.code === 'auth/user-not-found') {
            errorMessage = 'Email not registered. Please create an account first.';
        } else if (error.code === 'auth/wrong-password') {
            errorMessage = 'Incorrect password. Please try again.';
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = 'Invalid email address.';
        } else if (error.code === 'auth/user-disabled') {
            errorMessage = 'This account has been disabled. Contact admin.';
        } else if (error.code === 'auth/too-many-requests') {
            errorMessage = 'Too many failed attempts. Try again later.';
        } else if (error.message) {
            errorMessage = error.message;
        }
        
        showToast('Sign In Failed', errorMessage, 'error');
    }
}

// --- GOOGLE SIGN-IN ---
async function handleGoogleSignIn() {
    try {
        const user = await firebaseAuth.loginWithGoogle();
        
        // Create session
        const sessionId = await firestoreDB.createSession(user.uid, {
            email: user.email
        });

        // Update role based on selected role
        await firestoreDB.updateUserRole(user.uid, selectedRole);

        // Redirect
        redirectToDashboard(selectedRole);
    } catch (error) {
        console.error('Google sign-in error:', error);
        let errorMessage = 'Google Sign-In failed.';
        
        if (error.code === 'auth/popup-closed-by-user') {
            errorMessage = 'Sign-In was cancelled.';
        } else if (error.code === 'auth/network-request-failed') {
            errorMessage = 'Network error. Check your connection.';
        } else if (error.message) {
            errorMessage = error.message;
        }
        
        showToast('Sign-In Error', errorMessage, 'error');
    }
}

// --- REGISTRATION ---
async function handleRegistration() {
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const phone = document.getElementById('registerPhone').value;
    const dept = document.getElementById('registerDept').value;
    const role = document.getElementById('registerRole').value;
    const grade = document.getElementById('registerGrade').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('registerConfirmPassword').value;
    const agreeTerms = document.getElementById('agreeTerms').checked;

    // Validation
    if (!name || !email || !phone || !dept || !password) {
        showToast('Error', 'Please fill all required fields', 'error');
        return;
    }

    if (password !== confirmPassword) {
        showToast('Error', 'Passwords do not match', 'error');
        return;
    }

    if (password.length < 6) {
        showToast('Error', 'Password must be at least 6 characters', 'error');
        return;
    }

    if (!agreeTerms) {
        showToast('Error', 'Please agree to Terms of Service', 'error');
        return;
    }

    try {
        const user = await firebaseAuth.registerWithEmail(email, password, {
            name: name,
            phone: phone,
            dept: dept,
            role: role,
            grade: grade || null
        });

        showToast('Success', 'Account created! Logging in...', 'success');
        
        setTimeout(() => {
            closeRegisterModal();
            document.getElementById('loginEmail').value = email;
            document.getElementById('loginPassword').value = password;
            handleEmailLogin();
        }, 2000);
    } catch (error) {
        console.error('Registration error:', error);
        let errorMessage = 'Registration failed. Please try again.';
        
        if (error.code === 'auth/email-already-in-use') {
            errorMessage = 'Email is already registered. Please login instead.';
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = 'Invalid email address.';
        } else if (error.code === 'auth/weak-password') {
            errorMessage = 'Password is too weak. Use at least 6 characters.';
        } else if (error.message) {
            errorMessage = error.message;
        }
        
        showToast('Registration Error', errorMessage, 'error');
    }
}

// --- FORGOT PASSWORD ---
async function handleForgotPassword() {
    const email = document.getElementById('forgotPasswordEmail').value;

    if (!email) {
        showToast('Error', 'Please enter your email', 'error');
        return;
    }

    try {
        await firebaseAuth.sendPasswordResetEmail(email);
        showToast('Success', 'Password reset email sent to ' + email, 'success');
        
        setTimeout(() => {
            closeForgotPasswordModal();
        }, 2000);
    } catch (error) {
        console.error('Forgot password error:', error);
        let errorMessage = 'Failed to send reset email.';
        
        if (error.code === 'auth/user-not-found') {
            errorMessage = 'Email not registered.';
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = 'Invalid email address.';
        } else if (error.message) {
            errorMessage = error.message;
        }
        
        showToast('Reset Error', errorMessage, 'error');
    }
}

// --- MODAL HANDLERS ---
function openRegisterModal() {
    const modal = document.getElementById('registerModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeRegisterModal() {
    const modal = document.getElementById('registerModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
        document.getElementById('registerForm').reset();
    }
}

function openForgotPasswordModal() {
    const modal = document.getElementById('forgotPasswordModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeForgotPasswordModal() {
    const modal = document.getElementById('forgotPasswordModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
        document.getElementById('forgotPasswordForm').reset();
    }
}

// --- UTILITIES ---
function showToast(title, message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) {
        console.error('Toast container not found');
        return;
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const iconMap = {
        success: 'ri-checkbox-circle-line',
        error: 'ri-close-circle-line',
        info: 'ri-information-line'
    };

    toast.innerHTML = `
        <i class="${iconMap[type]}"></i>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            <div class="toast-msg">${message}</div>
        </div>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 4000);
}

function redirectToDashboard(role) {
    switch(role) {
        case 'admin':
            window.location.href = 'admin-dashboard.html';
            break;
        case 'faculty':
            window.location.href = 'dashboard.html';
            break;
        case 'student':
        default:
            window.location.href = 'dashboard.html';
            break;
    }
}

// Auto-fill remembered email
window.addEventListener('load', () => {
    const rememberedEmail = localStorage.getItem('rememberEmail');
    if (rememberedEmail) {
        const emailInput = document.getElementById('loginEmail');
        if (emailInput) {
            emailInput.value = rememberedEmail;
        }
    }
});
