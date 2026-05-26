/* ==========================================================================
   Smart Campus Management Website - Master Database & Logic Hub
   Dayananda Sagar College of Engineering
   ========================================================================== */

// --- Global Databases Namespace in LocalStorage ---
const DB_KEYS = {
    STUDENTS: 'smart_campus_students',
    COURSES: 'smart_campus_courses',
    ENROLLMENTS: 'smart_campus_enrollments',
    ACADEMIC: 'smart_campus_academic',
    FEES: 'smart_campus_fees',
    FILES: 'smart_campus_files',
    USERS: 'smart_campus_users',
    SESSION: 'smart_campus_session'
};

function getAuthUsers() {
    return JSON.parse(localStorage.getItem(DB_KEYS.USERS) || '{}');
}

function saveAuthUsers(users) {
    localStorage.setItem(DB_KEYS.USERS, JSON.stringify(users));
}

function registerAuthUser(email, name, role = 'Student') {
    const normalizedEmail = email.trim().toLowerCase();
    const users = getAuthUsers();
    users[normalizedEmail] = {
        name: name.trim(),
        email: normalizedEmail,
        role: role,
        created_on: new Date().toISOString()
    };
    saveAuthUsers(users);
    return users[normalizedEmail];
}

function lookupAuthUser(email) {
    const normalizedEmail = email.trim().toLowerCase();
    const users = getAuthUsers();
    return users[normalizedEmail] || null;
}

// Default course seed data matching course_enrollment.py
const DEFAULT_COURSES = {
    "CS101": { code: "CS101", name: "Python Programming", dept: "CSE", credits: 4, max_seats: 60, faculty: "Dr. B.G. Prasad" },
    "CS201": { code: "CS201", name: "Data Structures", dept: "CSE", credits: 4, max_seats: 55, faculty: "Prof. K. R. Anil" },
    "CS301": { code: "CS301", name: "Database Management", dept: "CSE", credits: 3, max_seats: 50, faculty: "Dr. Sila Bose" },
    "EC101": { code: "EC101", name: "Basic Electronics", dept: "ECE", credits: 4, max_seats: 60, faculty: "Dr. Sandesh S." },
    "EC201": { code: "EC201", name: "Digital Circuits", dept: "ECE", credits: 4, max_seats: 50, faculty: "Prof. Asha N." },
    "ME101": { code: "ME101", name: "Engineering Mechanics", dept: "ME", credits: 4, max_seats: 55, faculty: "Dr. R. V. Prasad" },
    "MA101": { code: "MA101", name: "Engineering Mathematics I", dept: "ALL", credits: 4, max_seats: 120, faculty: "Prof. H. K. Sen" },
    "MA201": { code: "MA201", name: "Engineering Mathematics II", dept: "ALL", credits: 4, max_seats: 120, faculty: "Prof. H. K. Sen" },
    "HS101": { code: "HS101", name: "Professional Communication", dept: "ALL", credits: 2, max_seats: 100, faculty: "Dr. Mamta Nair" },
    "AI301": { code: "AI301", name: "Machine Learning", dept: "AIML", credits: 4, max_seats: 45, faculty: "Dr. Vinayak M." }
};

// Default folder/file tree matching directory_scanner.py
const DEFAULT_FILES = [
    { name: "main_application.py", type: "file", size_kb: 12.04, extension: ".py", category: "Python Scripts", path: "/main_application.py" },
    { name: "student_registration.py", type: "file", size_kb: 9.30, extension: ".py", category: "Python Scripts", path: "/student_registration.py" },
    { name: "course_enrollment.py", type: "file", size_kb: 8.70, extension: ".py", category: "Python Scripts", path: "/course_enrollment.py" },
    { name: "student_records.py", type: "file", size_kb: 10.17, extension: ".py", category: "Python Scripts", path: "/student_records.py" },
    { name: "search_sort_students.py", type: "file", size_kb: 9.19, extension: ".py", category: "Python Scripts", path: "/search_sort_students.py" },
    { name: "fee_calculation.py", type: "file", size_kb: 10.45, extension: ".py", category: "Python Scripts", path: "/fee_calculation.py" },
    { name: "file_manager.py", type: "file", size_kb: 11.06, extension: ".py", category: "Python Scripts", path: "/file_manager.py" },
    { name: "directory_scanner.py", type: "file", size_kb: 11.26, extension: ".py", category: "Python Scripts", path: "/directory_scanner.py" },
    { name: "performance_analytics.py", type: "file", size_kb: 14.76, extension: ".py", category: "Python Scripts", path: "/performance_analytics.py" },
    { name: "Student_Data.csv", type: "file", size_kb: 4.15, extension: ".csv", category: "Data Files", path: "/data/Student_Data.csv" },
    { name: "Student_Data.json", type: "file", size_kb: 5.60, extension: ".json", category: "Data Files", path: "/data/Student_Data.json" },
    { name: "Academic_Records.json", type: "file", size_kb: 8.20, extension: ".json", category: "Data Files", path: "/data/Academic_Records.json" },
    { name: "Fee_Ledger.csv", type: "file", size_kb: 3.45, extension: ".csv", category: "Data Files", path: "/data/Fee_Ledger.csv" },
    { name: "system.log", type: "file", size_kb: 15.20, extension: ".log", category: "Logs", path: "/data/system.log" }
];

// Seed raw database lists
let studentsDB = {};
let coursesDB = {};
let enrollmentsDB = {};
let academicDB = {};
let feesDB = {};
let filesDB = [];

// --- Initialize State & Data Engine ---
function initDatabase() {
    // 1. Session check or login redirect
    const activeSession = localStorage.getItem(DB_KEYS.SESSION);
    const currentPage = window.location.pathname.split('/').pop();

    if (!activeSession && currentPage !== 'login.html' && currentPage !== 'index.html' && currentPage !== '') {
        window.location.href = 'login.html';
        return;
    }

    // 2. Load lists or seed default demo datasets
    if (!localStorage.getItem(DB_KEYS.STUDENTS)) {
        seedDemoData();
    } else {
        studentsDB = JSON.parse(localStorage.getItem(DB_KEYS.STUDENTS));
        coursesDB = JSON.parse(localStorage.getItem(DB_KEYS.COURSES));
        enrollmentsDB = JSON.parse(localStorage.getItem(DB_KEYS.ENROLLMENTS));
        academicDB = JSON.parse(localStorage.getItem(DB_KEYS.ACADEMIC));
        feesDB = JSON.parse(localStorage.getItem(DB_KEYS.FEES));
        filesDB = JSON.parse(localStorage.getItem(DB_KEYS.FILES)) || DEFAULT_FILES;
    }
}

// Seed Demo Database matching main_application.py seed logic
function seedDemoData() {
    showToast("System Initialization", "Seeding Dayananda Sagar demo dataset...", "info");

    // Clear and set courses first
    coursesDB = { ...DEFAULT_COURSES };

    const demoStudents = [
        { name: "Arjun Sharma", dept: "CSE", grade: 2, email: "arjun.sharma@dsce.edu", phone: "9876543210" },
        { name: "Priya Nair", dept: "ECE", grade: 3, email: "priya.nair@dsce.edu", phone: "9876543211" },
        { name: "Rahul Verma", dept: "AIML", grade: 1, email: "rahul.verma@dsce.edu", phone: "9876543212" },
        { name: "Sneha Patil", dept: "ME", grade: 4, email: "sneha.patil@dsce.edu", phone: "9876543213" },
        { name: "Kiran Kumar", dept: "ISE", grade: 2, email: "kiran.kumar@dsce.edu", phone: "9876543214" },
        { name: "Divya Menon", dept: "CSE", grade: 3, email: "divya.menon@dsce.edu", phone: "9876543215" },
        { name: "Aditya Singh", dept: "EEE", grade: 1, email: "aditya.singh@dsce.edu", phone: "9876543216" },
        { name: "Meera Reddy", dept: "DS", grade: 4, email: "meera.reddy@dsce.edu", phone: "9876543217" },
        { name: "Suresh Babu", dept: "CE", grade: 2, email: "suresh.babu@dsce.edu", phone: "9876543218" },
        { name: "Ananya Krishnan", dept: "AIML", grade: 3, email: "ananya.krishnan@dsce.edu", phone: "9876543219" }
    ];

    const GRADE_NAMES = { 1: "First Year", 2: "Second Year", 3: "Third Year", 4: "Fourth Year" };

    // Seed Student records
    demoStudents.forEach((stud, idx) => {
        const studentId = `DSCE${2026000 + idx}`;

        studentsDB[studentId] = {
            student_id: studentId,
            name: stud.name,
            department: stud.dept,
            grade_level: stud.grade,
            grade_name: GRADE_NAMES[stud.grade],
            email: stud.email,
            phone: stud.phone,
            address: "Bangalore",
            photo: "",
            registered_on: new Date().toISOString().split('T')[0] + " 10:00:00",
            is_active: true
        };

        // Seed default academic records scaffold
        academicDB[studentId] = {
            student_id: studentId,
            semesters: {},
            attendance: {},
            remarks: [],
            honours: []
        };
    });

    const sids = Object.keys(studentsDB);

    // Course grades sequencing
    const gradePoints = { "O": 10, "A+": 9, "A": 8, "B+": 7, "B": 6, "C": 5, "P": 4, "F": 0 };
    const sampleCourses = [
        { code: "CS101", name: "Python Programming", credits: 4 },
        { code: "MA101", name: "Engineering Mathematics I", credits: 4 },
        { code: "HS101", name: "Professional Communication", credits: 2 },
        { code: "CS201", name: "Data Structures", credits: 4 },
        { code: "MA201", name: "Engineering Mathematics II", credits: 4 }
    ];

    const coursePairsECE = [
        { code: "EC101", name: "Basic Electronics", credits: 4 },
        { code: "MA101", name: "Engineering Mathematics I", credits: 4 },
        { code: "HS101", name: "Professional Communication", credits: 2 },
        { code: "EC201", name: "Digital Circuits", credits: 4 },
        { code: "MA201", name: "Engineering Mathematics II", credits: 4 }
    ];

    const gradeSeq = ["O", "A+", "A", "B+", "B", "A+", "A", "O"];

    sids.forEach((sid, idx) => {
        const dept = studentsDB[sid].department;
        const courses = (dept === "ECE" || dept === "EEE") ? coursePairsECE : sampleCourses;

        // Semester 1 Results Seeding
        academicDB[sid].semesters["1"] = [];
        courses.forEach((c, cIdx) => {
            const gIdx = (idx + cIdx) % gradeSeq.length;
            const grade = gradeSeq[gIdx];

            academicDB[sid].semesters["1"].push({
                course_code: c.code,
                course_name: c.name,
                credits: c.credits,
                grade: grade,
                grade_points: gradePoints[grade]
            });

            // Enrollments seeding
            const enrollmentId = `${sid}_${c.code}`;
            enrollmentsDB[enrollmentId] = {
                enrollment_id: enrollmentId,
                student_id: sid,
                course_code: c.code,
                course_name: c.name,
                credits: c.credits,
                status: "Completed",
                enrolled_on: "2026-02-15 09:00:00",
                grade: grade
            };
        });

        // Semester 2 Seeding for first 6
        if (idx < 6) {
            academicDB[sid].semesters["2"] = [
                { course_code: "CS301", course_name: "Database Management", credits: 3, grade: gradeSeq[(idx + 2) % 8], grade_points: gradePoints[gradeSeq[(idx + 2) % 8]] },
                { course_code: "AI301", course_name: "Machine Learning", credits: 4, grade: gradeSeq[(idx + 3) % 8], grade_points: gradePoints[gradeSeq[(idx + 3) % 8]] }
            ];

            ["CS301", "AI301"].forEach(code => {
                const cDetail = coursesDB[code];
                const enrollmentId = `${sid}_${code}`;
                enrollmentsDB[enrollmentId] = {
                    enrollment_id: enrollmentId,
                    student_id: sid,
                    course_code: code,
                    course_name: cDetail.name,
                    credits: cDetail.credits,
                    status: "Completed",
                    enrolled_on: "2026-03-01 09:00:00",
                    grade: gradeSeq[(idx + 2) % 8]
                };
            });
        }

        // Attendance seeding
        academicDB[sid].attendance["CS101"] = { present: 42 + idx, total: 50, pct: Math.round(100 * (42 + idx) / 50) };
        academicDB[sid].attendance["MA101"] = { present: 38 + idx, total: 50, pct: Math.round(100 * (38 + idx) / 50) };
    });

    // Seed top honours
    academicDB[sids[0]].honours.push("Academic Excellence Award 2025");
    academicDB[sids[2]].honours.push("Best Project - AIML Dept 2025");

    // Fee structure billing items
    const baseTuitions = { "CSE": 85000, "ECE": 80000, "ME": 75000, "CE": 75000, "EEE": 78000, "ISE": 82000, "AIML": 88000, "DS": 86000 };
    const rates = { "merit_gold": 0.50, "merit_silver": 0.25, "sc_st": 0.75, "obc": 0.15, "sports": 0.10 };

    // Seed fees for first 6 students
    sids.slice(0, 6).forEach((sid, idx) => {
        const student = studentsDB[sid];
        const base = baseTuitions[student.department] || 80000;

        const hostelOpt = (idx % 2 === 0);
        const transportOpt = (idx % 3 === 0);
        const scholarship = (idx < 3) ? "merit_silver" : "None";
        const discount = (scholarship !== "None") ? base * rates[scholarship] : 0.0;
        const netTuition = base - discount;

        const hostelFee = hostelOpt ? 50000 : 0;
        const transportFee = transportOpt ? 18000 : 0;

        const subtotal = netTuition + hostelFee + transportFee + 2500 + 1500 + 1000 + 5000 + 500;
        const total = subtotal;

        feesDB[sid] = {
            student_id: sid,
            department: student.department,
            tuition_fee: netTuition,
            scholarship_type: scholarship,
            scholarship_disc: discount,
            hostel_fee: hostelFee,
            transport_fee: transportFee,
            exam_fee: 2500,
            library_fee: 1500,
            sports_fee: 1000,
            lab_fee: 5000,
            student_union_fee: 500,
            late_fee: 0,
            total_fee: total,
            calculated_on: new Date().toISOString().split('T')[0] + " 12:00:00",
            paid: (idx < 3),
            paid_on: (idx < 3) ? new Date().toISOString().split('T')[0] + " 14:00:00" : null
        };
    });

    filesDB = [...DEFAULT_FILES];

    saveAllData();
    showToast("System Seeding Complete", "Successfully loaded 10 demo student accounts.", "success");
}

function saveAllData() {
    localStorage.setItem(DB_KEYS.STUDENTS, JSON.stringify(studentsDB));
    localStorage.setItem(DB_KEYS.COURSES, JSON.stringify(coursesDB));
    localStorage.setItem(DB_KEYS.ENROLLMENTS, JSON.stringify(enrollmentsDB));
    localStorage.setItem(DB_KEYS.ACADEMIC, JSON.stringify(academicDB));
    localStorage.setItem(DB_KEYS.FEES, JSON.stringify(feesDB));
    localStorage.setItem(DB_KEYS.FILES, JSON.stringify(filesDB));
}

// --- Page Builders & UI Component Injectors ---
document.addEventListener("DOMContentLoaded", () => {
    initDatabase();
    injectSidebar();
    injectTopbar();
    initTheme();
    updateClock();
    setInterval(updateClock, 1000);
    injectChatbot();

    // Smooth fade in animation for main wrapper
    const mainWrapper = document.querySelector('.main-wrapper');
    if (mainWrapper) {
        mainWrapper.style.opacity = '0';
        mainWrapper.style.transition = 'opacity 0.4s ease';
        setTimeout(() => {
            mainWrapper.style.opacity = '1';
        }, 50);
    }
});

// Build Unified Navigation Sidebar
function injectSidebar() {
    const sidebar = document.getElementById("sidebar");
    if (!sidebar) return;

    const currentPage = window.location.pathname.split('/').pop();
    const session = JSON.parse(localStorage.getItem(DB_KEYS.SESSION)) || { name: "Guest User", role: "Guest" };

    const menuItems = [
        { file: "dashboard.html", icon: "ri-dashboard-line", label: "Dashboard" },
        { file: "students.html", icon: "ri-user-add-line", label: "Student Registry" },
        { file: "courses.html", icon: "ri-book-open-line", label: "Course Enrollment" },
        { file: "fees.html", icon: "ri-bank-card-line", label: "Fees & Calculator" },
        { file: "analytics.html", icon: "ri-bar-chart-box-line", label: "Campus Analytics" },
        { file: "records.html", icon: "ri-article-line", label: "Academic Records" },
        { file: "reports.html", icon: "ri-file-chart-line", label: "Reports & Scanning" }
    ];

    let menuHTML = `<ul class="sidebar-menu">`;
    menuItems.forEach(item => {
        const activeClass = currentPage === item.file ? 'active' : '';
        menuHTML += `
            <li class="sidebar-item ${activeClass}">
                <a href="${item.file}">
                    <i class="${item.icon}"></i>
                    <span class="logo-text">${item.label}</span>
                </a>
            </li>
        `;
    });
    menuHTML += `</ul>`;

    sidebar.innerHTML = `
        <div class="sidebar-logo">
            <i class="ri-radar-line"></i>
            <span class="logo-text">SMART CAMPUS</span>
        </div>
        ${menuHTML}
        <div class="sidebar-footer">
            <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&h=100&q=80" alt="Avatar" class="user-avatar">
            <div class="user-info">
                <span class="user-name">${session.name}</span>
                <span class="user-role">${session.role}</span>
            </div>
            <button onclick="handleLogout()" style="margin-left:auto; color:var(--text-secondary); cursor:pointer;" title="Logout">
                <i class="ri-logout-box-r-line" style="font-size:20px;"></i>
            </button>
        </div>
    `;

    // Hook collapse toggler
    const toggleBtn = document.querySelector(".sidebar-toggle");
    if (toggleBtn) {
        toggleBtn.addEventListener("click", () => {
            sidebar.classList.toggle("collapsed");
        });
    }
}

// Build Unified Dashboard Navigation Header
function injectTopbar() {
    const header = document.getElementById("main-header");
    if (!header) return;

    const currentPage = window.location.pathname.split('/').pop();
    const pageTitleMap = {
        'dashboard.html': 'Campus Dashboard',
        'students.html': 'Student Registration & Records',
        'courses.html': 'Course Management & Enrollment',
        'fees.html': 'Fee Ledger & Payment Calculator',
        'analytics.html': 'NumPy & Pandas Analytics Engine',
        'records.html': 'VTU Grade Sheets & GPA Records',
        'reports.html': 'Virtual Directory Scanner & Reports'
    };
    const title = pageTitleMap[currentPage] || 'Smart Campus Management';

    header.innerHTML = `
        <div class="header-left">
            <button class="sidebar-toggle no-print">
                <i class="ri-menu-2-line"></i>
            </button>
            <h1 class="page-title">${title}</h1>
        </div>
        <div class="header-right no-print">
            <div class="system-clock">
                <i class="ri-time-line"></i>
                <span id="header-clock-time">00:00:00</span>
            </div>
            <button class="theme-toggle" id="theme-toggle-btn" title="Toggle Theme">
                <i class="ri-moon-line"></i>
            </button>
            <div class="notification-bell" onclick="showNotificationPanel()" title="System Alerts">
                <i class="ri-notification-3-line"></i>
                <span class="badge-dot"></span>
            </div>
        </div>
    `;
}

// Real-Time Calendar and Clock Widget updater
function updateClock() {
    const timeSpan = document.getElementById("header-clock-time");
    if (!timeSpan) return;

    const now = new Date();
    const options = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };
    const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    timeSpan.innerText = `${dateStr} | ${now.toLocaleTimeString('en-US', options)}`;
}

// Dark/Light Mode Theme Switcher
function initTheme() {
    const savedTheme = localStorage.getItem('smart_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);

    const toggleBtn = document.getElementById("theme-toggle-btn");
    if (!toggleBtn) return;

    toggleBtn.innerHTML = savedTheme === 'dark' ? '<i class="ri-sun-line"></i>' : '<i class="ri-moon-line"></i>';

    toggleBtn.addEventListener("click", () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';

        document.documentElement.setAttribute('data-theme', nextTheme);
        localStorage.setItem('smart_theme', nextTheme);
        toggleBtn.innerHTML = nextTheme === 'dark' ? '<i class="ri-sun-line"></i>' : '<i class="ri-moon-line"></i>';
        showToast("Theme Toggle", `Successfully set workspace styling to ${nextTheme} mode.`, "info");
    });
}

function handleLogout() {
    localStorage.removeItem(DB_KEYS.SESSION);
    showToast("Authentication Session", "Logging out, redirecting...", "info");
    setTimeout(() => {
        window.location.href = 'login.html';
    }, 1000);
}

// Dynamic System Notification Toast triggers
function showToast(title, message, type = "success") {
    let container = document.getElementById("toast-container");
    if (!container) {
        container = document.createElement("div");
        container.id = "toast-container";
        container.className = "toast-container no-print";
        document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    toast.className = `toast ${type}`;

    const icons = {
        success: "ri-checkbox-circle-fill",
        error: "ri-error-warning-fill",
        info: "ri-information-fill"
    };

    toast.innerHTML = `
        <i class="${icons[type]} style="font-size:24px;"></i>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            <div class="toast-msg">${message}</div>
        </div>
        <i class="ri-close-line toast-close" onclick="this.parentElement.remove()"></i>
    `;

    container.appendChild(toast);

    // Self-destruct after 4.5 seconds
    setTimeout(() => {
        toast.style.animation = "slideIn 0.3s reverse forwards";
        setTimeout(() => toast.remove(), 300);
    }, 4500);
}

// Modal Toggle utilities
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add("active");
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove("active");
}

// Notification Drawer panel logic
function showNotificationPanel() {
    // Collect active at risk count
    const atRisk = getAtRiskStudents();
    const uncollected = Object.values(feesDB).filter(f => !f.paid).length;

    let content = `<div style="display:flex; flex-direction:column; gap:12px; margin-top:16px;">`;
    content += `
        <div style="padding:10px; background:rgba(255,255,255,0.03); border-radius:6px; border-left:3px solid var(--accent-rose)">
            <strong>${atRisk.length} At-Risk Students Detected</strong>
            <div style="font-size:11px; color:var(--text-secondary); margin-top:4px;">CGPA < 5.0 or attendance < 75% alerts.</div>
        </div>
        <div style="padding:10px; background:rgba(255,255,255,0.03); border-radius:6px; border-left:3px solid var(--accent-amber)">
            <strong>${uncollected} Unpaid Tuition Invoices</strong>
            <div style="font-size:11px; color:var(--text-secondary); margin-top:4px;">Invoices require registrar collection.</div>
        </div>
        <div style="padding:10px; background:rgba(255,255,255,0.03); border-radius:6px; border-left:3px solid var(--accent-blue)">
            <strong>100% Core System Synchronization</strong>
            <div style="font-size:11px; color:var(--text-secondary); margin-top:4px;">Data persistent across LocalStorage layers.</div>
        </div>
    </div>`;

    let modal = document.getElementById("notifications-modal");
    if (!modal) {
        modal = document.createElement("div");
        modal.id = "notifications-modal";
        modal.className = "modal-overlay no-print";
        modal.innerHTML = `
            <div class="modal-card glass-panel">
                <i class="ri-close-line modal-close" onclick="closeModal('notifications-modal')"></i>
                <h3 style="font-family:var(--font-heading); font-size:20px; border-bottom:1px solid var(--glass-border); padding-bottom:12px;">System Alerts Drawer</h3>
                <div id="notifications-modal-body"></div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    document.getElementById("notifications-modal-body").innerHTML = content;
    openModal("notifications-modal");
}

// --- Dynamic Statistical & Analytical Core Methods ---
function getAtRiskStudents() {
    const atRisk = [];
    Object.keys(studentsDB).forEach(sid => {
        const student = studentsDB[sid];
        if (!student.is_active) return;

        const academic = academicDB[sid];
        const cgpa = calculateCGPA(sid);

        let lowAttendance = false;
        let attendanceFlags = [];
        if (academic && academic.attendance) {
            Object.keys(academic.attendance).forEach(code => {
                const att = academic.attendance[code];
                if (att.pct < 75) {
                    lowAttendance = true;
                    attendanceFlags.push(`${code} (${att.pct}%)`);
                }
            });
        }

        const lowCGPA = cgpa > 0 && cgpa < 5.0;

        if (lowCGPA || lowAttendance) {
            let flags = [];
            if (lowCGPA) flags.push(`Low CGPA (${cgpa})`);
            if (lowAttendance) flags.push(`Low Attendance: ${attendanceFlags.join(', ')}`);

            atRisk.push({
                student_id: sid,
                name: student.name,
                department: student.department,
                cgpa: cgpa,
                flags: flags
            });
        }
    });
    return atRisk;
}

function calculateCGPA(studentId) {
    const acad = academicDB[studentId];
    if (!acad || !acad.semesters) return 0.0;

    let totalCredits = 0;
    let weightedGP = 0;

    Object.keys(acad.semesters).forEach(sem => {
        acad.semesters[sem].forEach(course => {
            totalCredits += course.credits;
            weightedGP += course.credits * course.grade_points;
        });
    });

    if (totalCredits === 0) return 0.0;
    return Math.round((weightedGP / totalCredits) * 100) / 100;
}

function calculateSGPA(studentId, semester) {
    const acad = academicDB[studentId];
    if (!acad || !acad.semesters || !acad.semesters[semester]) return 0.0;

    let totalCredits = 0;
    let weightedGP = 0;

    acad.semesters[semester].forEach(course => {
        totalCredits += course.credits;
        weightedGP += course.credits * course.grade_points;
    });

    if (totalCredits === 0) return 0.0;
    return Math.round((weightedGP / totalCredits) * 100) / 100;
}

// --- Floating AI Campus Chatbot Engine Implementation ---
function injectChatbot() {
    let trigger = document.getElementById("chatbot-trigger");
    if (!trigger) {
        trigger = document.createElement("div");
        trigger.id = "chatbot-trigger";
        trigger.className = "chatbot-trigger no-print";
        trigger.innerHTML = `<i class="ri-chat-voice-line"></i>`;
        document.body.appendChild(trigger);
    }

    let chatPanel = document.getElementById("chatbot-panel");
    if (!chatPanel) {
        chatPanel = document.createElement("div");
        chatPanel.id = "chatbot-panel";
        chatPanel.className = "chatbot-container glass-panel no-print";
        chatPanel.innerHTML = `
            <div class="chatbot-header">
                <div class="chatbot-title">
                    <span></span> Smart Campus AI Assistant
                </div>
                <i class="ri-close-line" style="cursor:pointer;" onclick="toggleChatbot()"></i>
            </div>
            <div class="chatbot-body" id="chatbot-messages-box">
                <div class="chat-message bot">
                    Hello! I am your Smart Campus AI Assistant. I have live access to the local university database. Ask me anything like:
                    <ul style="margin-top: 8px; padding-left: 16px; font-size: 11px;">
                        <li>"Who is Sneha Patil?"</li>
                        <li>"Who are the at-risk students?"</li>
                        <li>"What is Arjun's CGPA?"</li>
                        <li>"How much tuition fees collected?"</li>
                    </ul>
                </div>
            </div>
            <div class="chatbot-footer">
                <input type="text" id="chatbot-user-input" placeholder="Type a message..." onkeydown="handleChatSubmit(event)">
                <button onclick="submitChatMessage()"><i class="ri-send-plane-fill"></i></button>
            </div>
        `;
        document.body.appendChild(chatPanel);
    }

    trigger.onclick = toggleChatbot;
}

function toggleChatbot() {
    const chat = document.getElementById("chatbot-panel");
    if (chat) chat.classList.toggle("active");
}

function handleChatSubmit(e) {
    if (e.key === 'Enter') {
        submitChatMessage();
    }
}

function submitChatMessage() {
    const input = document.getElementById("chatbot-user-input");
    const val = input.value.trim();
    if (!val) return;

    input.value = "";
    appendChatMessage(val, "user");

    // AI Processing dynamic responses
    setTimeout(() => {
        const response = processBotResponse(val);
        appendChatMessage(response, "bot");
    }, 500);
}

function appendChatMessage(text, sender) {
    const box = document.getElementById("chatbot-messages-box");
    const msg = document.createElement("div");
    msg.className = `chat-message ${sender}`;
    msg.innerHTML = text;
    box.appendChild(msg);
    box.scrollTop = box.scrollHeight;
}

function processBotResponse(query) {
    const q = query.toLowerCase();

    // Help query
    if (q.includes("help") || q.includes("what can you")) {
        return "I can answer questions regarding student GPA ranks, total fees collected, courses available, waitlist status, and flag any student at risk! Just ask: 'Who are at risk?' or 'What is Kiran's email?'.";
    }

    // At risk query
    if (q.includes("risk") || q.includes("at-risk") || q.includes("at risk")) {
        const risk = getAtRiskStudents();
        if (risk.length === 0) return "Great news! Currently, there are no students flagged as at-risk in our database system.";

        let reply = `I detected <strong>${risk.length} student(s) at-risk</strong> in the database:<br>`;
        risk.forEach(r => {
            reply += `• <strong>${r.name}</strong> (${r.student_id}) - CGPA: ${r.cgpa || 'N/A'}<br><em>Flags: ${r.flags.join(', ')}</em><br>`;
        });
        return reply;
    }

    // Total fees query
    if (q.includes("fee") || q.includes("revenue") || q.includes("collection")) {
        let collected = 0;
        let pending = 0;
        Object.values(feesDB).forEach(f => {
            if (f.paid) collected += f.total_fee;
            else pending += f.total_fee;
        });
        return `<strong>Fee Collection Ledger Summary:</strong><br>• Total Fees Collected: <strong>Rs. ${collected.toLocaleString()}</strong><br>• Outstanding Pending Fees: <strong>Rs. ${pending.toLocaleString()}</strong>`;
    }

    // List students count
    if (q.includes("how many students") || q.includes("student count") || q.includes("students count")) {
        const total = Object.keys(studentsDB).length;
        const active = Object.values(studentsDB).filter(s => s.is_active).length;
        return `There are currently <strong>${total} students</strong> in the system directory, with <strong>${active} active</strong> and ${total - active} deactivated accounts.`;
    }

    // List courses available
    if (q.includes("course") || q.includes("class")) {
        const count = Object.keys(coursesDB).length;
        let listHTML = `We have <strong>${count} core courses</strong> available. Here are some of them:<br>`;
        Object.values(coursesDB).slice(0, 5).forEach(c => {
            listHTML += `• ${c.code}: ${c.name} (${c.credits} Credits)<br>`;
        });
        return listHTML;
    }

    // Student Lookup engine
    let matchedStudent = null;
    Object.keys(studentsDB).forEach(sid => {
        const student = studentsDB[sid];
        if (q.includes(student.name.toLowerCase()) || q.includes(sid.toLowerCase())) {
            matchedStudent = student;
        }
    });

    if (matchedStudent) {
        const sid = matchedStudent.student_id;
        const cgpa = calculateCGPA(sid);
        const fees = feesDB[sid];
        const feeStatus = fees ? (fees.paid ? "Paid (No balance)" : `Pending (Rs. ${fees.total_fee.toLocaleString()})`) : "No billing generated";

        return `
            <strong>Academic Profile: ${matchedStudent.name}</strong><br>
            • ID: ${matchedStudent.student_id}<br>
            • Dept: ${matchedStudent.department} | Year: ${matchedStudent.grade_name}<br>
            • Email: ${matchedStudent.email}<br>
            • Cumulative CGPA: <strong>${cgpa || 'No records'}</strong><br>
            • Fee Account Status: <strong>${feeStatus}</strong>
        `;
    }

    return "I could not find exact metrics for your query in my local workspace index. Try checking the spelling or ask about 'at risk students', 'total fees collections', or specific student names like 'Arjun Sharma'.";
}
