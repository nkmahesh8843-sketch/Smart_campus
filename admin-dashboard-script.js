/* ==========================================================================
   Admin Dashboard Script
   Dayananda Sagar College of Engineering
   ========================================================================== */

let unsubscribeOnlineUsers = null;
let unsubscribeActivityLogs = null;

document.addEventListener('DOMContentLoaded', () => {
    initAdminDashboard();
});

async function initAdminDashboard() {
    // Check if user is admin
    const currentUser = firebaseAuth.getCurrentUser();
    if (!currentUser) {
        window.location.href = 'login.html';
        return;
    }

    const userRole = await firebaseAuth.getUserRole(currentUser.uid);
    if (userRole !== 'admin') {
        window.location.href = 'dashboard.html';
        return;
    }

    // Load initial data
    await loadStatistics();
    await loadOnlineUsers();
    await loadAllUsers();
    await loadActivityLogs();
    await loadActiveSessions();

    // Set up real-time listeners
    setupRealtimeListeners();

    // Update clock
    updateClock();
    setInterval(updateClock, 1000);

    // Setup event listeners
    setupEventListeners();
}

// --- STATISTICS ---
async function loadStatistics() {
    try {
        const activeCount = await firestoreDB.getActiveUsersCount();
        const totalCount = await firestoreDB.getTotalUsersCount();
        const sessions = await firestoreDB.getAllActiveSessions();
        const sevenDayLogins = await firestoreDB.getLoginStatistics(7);

        document.getElementById('activeUserCount').textContent = activeCount;
        document.getElementById('totalUserCount').textContent = totalCount;
        document.getElementById('activeSessions').textContent = sessions.length;
        document.getElementById('sevenDayLogins').textContent = sevenDayLogins;
    } catch (error) {
        console.error('Error loading statistics:', error);
    }
}

// --- ONLINE USERS ---
async function loadOnlineUsers() {
    try {
        const users = await firestoreDB.getAllOnlineUsers();
        displayOnlineUsers(users);
    } catch (error) {
        console.error('Error loading online users:', error);
    }
}

function displayOnlineUsers(users) {
    const tbody = document.getElementById('onlineUsersList');
    
    if (users.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-secondary);">No online users</td></tr>`;
        return;
    }

    tbody.innerHTML = users.map(user => `
        <tr>
            <td>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <img src="${user.profilePhotoURL || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + user.uid}" 
                         alt="${user.name}" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover;">
                    <span>${user.name || user.email}</span>
                </div>
            </td>
            <td>${user.email}</td>
            <td><span class="badge ${user.role === 'admin' ? 'danger' : user.role === 'faculty' ? 'warning' : 'info'}">${user.role}</span></td>
            <td>${user.dept || 'N/A'}</td>
            <td>${formatDate(user.lastLogin)}</td>
            <td><span style="color: var(--accent-emerald); font-weight: 600;">🟢 Online</span></td>
            <td>
                <button class="btn-icon blue" onclick="openUserActionModal('${user.uid}', '${user.email}')">
                    <i class="ri-more-line"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// --- ALL USERS ---
async function loadAllUsers() {
    try {
        const users = await firestoreDB.getAllUsers();
        displayAllUsers(users);
    } catch (error) {
        console.error('Error loading all users:', error);
    }
}

function displayAllUsers(users) {
    const tbody = document.getElementById('allUsersList');
    
    if (users.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-secondary);">No users found</td></tr>`;
        return;
    }

    tbody.innerHTML = users.map(user => `
        <tr>
            <td>${user.name || user.email}</td>
            <td>${user.email}</td>
            <td><span class="badge ${user.role === 'admin' ? 'danger' : user.role === 'faculty' ? 'warning' : 'info'}">${user.role}</span></td>
            <td>${user.dept || 'N/A'}</td>
            <td><span class="badge ${user.status === 'active' ? 'success' : 'warning'}">${user.status || 'active'}</span></td>
            <td>${formatDate(user.createdAt)}</td>
            <td>
                <button class="btn-icon blue" onclick="openUserActionModal('${user.uid}', '${user.email}')">
                    <i class="ri-more-line"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// --- ACTIVITY LOGS ---
async function loadActivityLogs() {
    try {
        const logs = await firestoreDB.getAllActivityLogs(50);
        displayActivityLogs(logs);
    } catch (error) {
        console.error('Error loading activity logs:', error);
    }
}

function displayActivityLogs(logs) {
    const tbody = document.getElementById('activityLogsList');
    
    if (logs.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-secondary);">No activity logs</td></tr>`;
        return;
    }

    tbody.innerHTML = logs.map(log => `
        <tr>
            <td>${log.email}</td>
            <td><span class="badge info">${log.action}</span></td>
            <td>${log.page}</td>
            <td>${formatDate(log.timestamp)}</td>
        </tr>
    `).join('');
}

// --- ACTIVE SESSIONS ---
async function loadActiveSessions() {
    try {
        const sessions = await firestoreDB.getAllActiveSessions();
        displayActiveSessions(sessions);
    } catch (error) {
        console.error('Error loading sessions:', error);
    }
}

function displayActiveSessions(sessions) {
    const tbody = document.getElementById('sessionsList');
    
    if (sessions.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-secondary);">No active sessions</td></tr>`;
        return;
    }

    tbody.innerHTML = sessions.map(session => `
        <tr>
            <td>${session.email}</td>
            <td>${formatDate(session.loginTime)}</td>
            <td>${session.ipAddress}</td>
            <td><span style="font-size: 12px; color: var(--text-secondary);">Web Browser</span></td>
            <td><span style="color: var(--accent-emerald); font-weight: 600;">Active</span></td>
            <td>
                <button class="btn-icon rose" onclick="endSession('${session.id}')">
                    <i class="ri-logout-box-line"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// --- REAL-TIME LISTENERS ---
function setupRealtimeListeners() {
    // Real-time online users
    unsubscribeOnlineUsers = firestoreDB.onlineUsersListener((users) => {
        displayOnlineUsers(users);
        document.getElementById('activeUserCount').textContent = users.length;
    });

    // Real-time activity logs
    unsubscribeActivityLogs = firestoreDB.activityLogsListener((logs) => {
        displayActivityLogs(logs);
    });
}

// --- USER ACTIONS ---
async function openUserActionModal(uid, email) {
    const modal = document.getElementById('userActionModal');
    const content = document.getElementById('userActionContent');
    
    document.getElementById('selectedUserEmail').textContent = email;

    const user = await firestoreDB.getUserByUID(uid);
    
    content.innerHTML = `
        <button class="btn btn-secondary" onclick="changeUserRole('${uid}', '${email}')">
            <i class="ri-shield-line"></i> Change Role
        </button>
        <button class="btn btn-secondary" onclick="viewUserActivity('${uid}', '${email}')">
            <i class="ri-history-line"></i> View Activity
        </button>
        ${user.status === 'active' ? `
            <button class="btn btn-danger" onclick="deactivateUser('${uid}', '${email}')">
                <i class="ri-forbidden-line"></i> Deactivate User
            </button>
        ` : `
            <button class="btn btn-secondary" onclick="activateUser('${uid}')">
                <i class="ri-checkbox-circle-line"></i> Activate User
            </button>
        `}
        <button class="btn btn-secondary" onclick="viewUserSessions('${uid}', '${email}')">
            <i class="ri-login-box-line"></i> View Sessions
        </button>
    `;

    modal.classList.add('active');
}

function closeUserActionModal() {
    const modal = document.getElementById('userActionModal');
    modal.classList.remove('active');
}

async function changeUserRole(uid, email) {
    const roles = ['student', 'faculty', 'admin'];
    const user = await firestoreDB.getUserByUID(uid);
    
    let newRole = prompt(`Current role: ${user.role}\n\nEnter new role (${roles.join(', ')}):`, user.role);
    
    if (newRole && roles.includes(newRole)) {
        await firestoreDB.updateUserRole(uid, newRole);
        showToast('Success', `Role updated to ${newRole}`, 'success');
        closeUserActionModal();
        await loadAllUsers();
    }
}

async function deactivateUser(uid, email) {
    const reason = prompt('Enter deactivation reason (optional):');
    if (reason !== null) {
        await firestoreDB.deactivateUser(uid, reason);
        closeUserActionModal();
        await loadAllUsers();
    }
}

async function activateUser(uid) {
    await firestoreDB.activateUser(uid);
    closeUserActionModal();
    await loadAllUsers();
}

async function viewUserActivity(uid, email) {
    const logs = await firestoreDB.getUserActivityLogs(uid, 20);
    
    alert(`Activity for ${email}:\n\n${logs.map(log => 
        `${log.action} - ${formatDate(log.timestamp)}`
    ).join('\n')}`);
}

async function viewUserSessions(uid, email) {
    const sessions = await firestoreDB.getUserActiveSessions(uid);
    
    let text = `Sessions for ${email}:\n\n`;
    if (sessions.length === 0) {
        text += 'No active sessions';
    } else {
        text += sessions.map(session => 
            `Login: ${formatDate(session.loginTime)}\nIP: ${session.ipAddress}`
        ).join('\n\n');
    }
    alert(text);
}

async function endSession(sessionId) {
    if (confirm('End this session?')) {
        await firestoreDB.endSession(sessionId);
        showToast('Success', 'Session ended', 'success');
        await loadActiveSessions();
    }
}

// --- EVENT LISTENERS ---
function setupEventListeners() {
    // User search
    document.getElementById('userSearchInput')?.addEventListener('keyup', async (e) => {
        const query = e.target.value.toLowerCase();
        const users = await firestoreDB.getAllUsers();
        
        const filtered = users.filter(user => 
            user.name?.toLowerCase().includes(query) || 
            user.email?.toLowerCase().includes(query)
        );
        
        displayAllUsers(filtered);
    });

    // Role filter
    document.getElementById('roleFilter')?.addEventListener('change', async (e) => {
        const role = e.target.value;
        const users = role ? await firestoreDB.getUsersByRole(role) : await firestoreDB.getAllUsers();
        displayAllUsers(users);
    });

    // Department filter
    document.getElementById('deptFilter')?.addEventListener('change', async (e) => {
        const dept = e.target.value;
        if (!dept) {
            await loadAllUsers();
            return;
        }
        const users = await firestoreDB.getUsersByDepartment(dept);
        displayAllUsers(users);
    });
}

// --- UTILITIES ---
function formatDate(date) {
    if (!date) return 'N/A';
    
    const d = date.toDate ? date.toDate() : new Date(date);
    const now = new Date();
    const diff = now - d;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return d.toLocaleDateString();
}

function updateClock() {
    const now = new Date();
    const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    const clockElement = document.getElementById('currentTime');
    if (clockElement) {
        clockElement.textContent = time;
    }
}

function showToast(title, message, type = 'info') {
    const container = document.getElementById('toastContainer');
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

    setTimeout(() => toast.remove(), 4000);
}

// --- SIDEBAR & THEME ---
function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    sidebar.classList.toggle('collapsed');
}

function toggleTheme() {
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
}

async function logout() {
    await firebaseAuth.logout();
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (unsubscribeOnlineUsers) unsubscribeOnlineUsers();
    if (unsubscribeActivityLogs) unsubscribeActivityLogs();
});
