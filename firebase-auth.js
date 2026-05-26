/* ==========================================================================
   Firebase Authentication Module
   Dayananda Sagar College of Engineering
   ========================================================================== */

class FirebaseAuthManager {
    constructor() {
        this.currentUser = null;
        this.initAuthListener();
    }

    // Initialize Firebase Auth State Listener
    initAuthListener() {
        auth.onAuthStateChanged((user) => {
            this.currentUser = user;
            if (user) {
                console.log('User logged in:', user.email);
                this.updateUserSession(user);
                this.trackUserActivity('login');
            } else {
                console.log('User logged out');
                this.currentPage = window.location.pathname.split('/').pop();
                if (this.currentPage !== 'login.html' && this.currentPage !== 'index.html' && this.currentPage !== '') {
                    window.location.href = 'login.html';
                }
            }
        });
    }

    // Email/Password Registration
    async registerWithEmail(email, password, userData) {
        try {
            // Create user in Firebase Auth
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;

            // Save user profile to Firestore
            await db.collection('users').doc(user.uid).set({
                uid: user.uid,
                email: email,
                name: userData.name,
                phone: userData.phone,
                dept: userData.dept,
                role: userData.role || 'student', // student, faculty, admin
                createdAt: new Date(),
                isOnline: true,
                lastLogin: new Date(),
                profilePhotoURL: user.photoURL || '',
                status: 'active'
            });

            showToast('Success', 'Account created successfully!', 'success');
            return user;
        } catch (error) {
            showToast('Error', error.message, 'error');
            throw error;
        }
    }

    // Email/Password Login
    async loginWithEmail(email, password) {
        try {
            const userCredential = await auth.signInWithEmailAndPassword(email, password);
            const user = userCredential.user;
            
            // Update user session in Firestore
            await db.collection('users').doc(user.uid).update({
                isOnline: true,
                lastLogin: new Date(),
                loginIP: await this.getUserIP()
            });

            showToast('Success', `Welcome back, ${user.email}!`, 'success');
            return user;
        } catch (error) {
            showToast('Error', error.message, 'error');
            throw error;
        }
    }

    // Google Sign-In
    async loginWithGoogle() {
        try {
            const provider = new firebase.auth.GoogleAuthProvider();
            provider.addScope('profile');
            provider.addScope('email');
            
            const userCredential = await auth.signInWithPopup(provider);
            const user = userCredential.user;
            const userRef = db.collection('users').doc(user.uid);

            // Check if user exists, if not create
            const userSnap = await userRef.get();
            if (!userSnap.exists) {
                await userRef.set({
                    uid: user.uid,
                    email: user.email,
                    name: user.displayName,
                    profilePhotoURL: user.photoURL,
                    role: 'student',
                    createdAt: new Date(),
                    isOnline: true,
                    lastLogin: new Date(),
                    loginMethod: 'google',
                    status: 'active'
                });
            } else {
                // Update existing user
                await userRef.update({
                    isOnline: true,
                    lastLogin: new Date(),
                    loginIP: await this.getUserIP()
                });
            }

            showToast('Success', `Welcome, ${user.displayName}!`, 'success');
            return user;
        } catch (error) {
            showToast('Error', error.message, 'error');
            throw error;
        }
    }

    // Logout
    async logout() {
        try {
            if (this.currentUser) {
                // Update user status in Firestore
                await db.collection('users').doc(this.currentUser.uid).update({
                    isOnline: false,
                    lastLogout: new Date()
                });
                
                this.trackUserActivity('logout');
            }
            
            await auth.signOut();
            showToast('Success', 'Logged out successfully', 'success');
            window.location.href = 'login.html';
        } catch (error) {
            showToast('Error', error.message, 'error');
        }
    }

    // Update User Session in Firestore
    async updateUserSession(user) {
        try {
            const userRef = db.collection('users').doc(user.uid);
            const userDoc = await userRef.get();

            if (!userDoc.exists) {
                // New user - create profile
                await userRef.set({
                    uid: user.uid,
                    email: user.email,
                    name: user.displayName || user.email,
                    profilePhotoURL: user.photoURL || '',
                    role: 'student',
                    createdAt: new Date(),
                    isOnline: true,
                    lastLogin: new Date(),
                    status: 'active'
                });
            } else {
                // Existing user - update status
                await userRef.update({
                    isOnline: true,
                    lastLogin: new Date()
                });
            }
        } catch (error) {
            console.error('Error updating session:', error);
        }
    }

    // Track User Activity
    async trackUserActivity(action, details = {}) {
        try {
            if (!this.currentUser) return;

            await db.collection('activity_logs').add({
                uid: this.currentUser.uid,
                email: this.currentUser.email,
                action: action, // login, logout, view_page, create_record, etc.
                timestamp: new Date(),
                page: window.location.pathname,
                details: details,
                userAgent: navigator.userAgent
            });
        } catch (error) {
            console.error('Error tracking activity:', error);
        }
    }

    // Get current user info
    getCurrentUser() {
        return this.currentUser;
    }

    // Get user role
    async getUserRole(uid) {
        try {
            const userDoc = await db.collection('users').doc(uid).get();
            if (userDoc.exists) {
                return userDoc.data().role;
            }
            return 'guest';
        } catch (error) {
            console.error('Error getting user role:', error);
            return 'guest';
        }
    }

    // Get user IP (optional - for security logging)
    async getUserIP() {
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            return data.ip;
        } catch (error) {
            return 'unknown';
        }
    }

    // Update user profile
    async updateUserProfile(updates) {
        try {
            if (!this.currentUser) throw new Error('No user logged in');

            await db.collection('users').doc(this.currentUser.uid).update(updates);
            showToast('Success', 'Profile updated successfully', 'success');
        } catch (error) {
            showToast('Error', error.message, 'error');
            throw error;
        }
    }

    // Change password
    async changePassword(newPassword) {
        try {
            await this.currentUser.updatePassword(newPassword);
            showToast('Success', 'Password changed successfully', 'success');
        } catch (error) {
            showToast('Error', error.message, 'error');
            throw error;
        }
    }

    // Send password reset email
    async sendPasswordResetEmail(email) {
        try {
            await auth.sendPasswordResetEmail(email);
            showToast('Success', 'Password reset email sent', 'success');
        } catch (error) {
            showToast('Error', error.message, 'error');
            throw error;
        }
    }
}

// Initialize Firebase Auth Manager
const firebaseAuth = new FirebaseAuthManager();
