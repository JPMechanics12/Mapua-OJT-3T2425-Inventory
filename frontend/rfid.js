// --- CENTRAL STUDENT DATA STORE (No longer directly stored in JS, fetched from backend) ---
let studentsData = []; // This will be populated by fetchStudents()

// --- DOM Elements ---
const rfidActualScannerInput = document.getElementById('rfidActualScannerInput');
const rfidInputDisplay = document.getElementById('rfidInput');
const studentNameInput = document.getElementById('student-name');
const studentIdInput = document.getElementById('student-id');
const rfidStatusSpan = document.getElementById('rfid-status').querySelector('span');
const manualBtn = document.getElementById('manual-btn');
const rfidInternalTabNav = document.getElementById('rfid-internal-tab-nav');

// Elements for RFID Management Tab
const addRfidForm = document.getElementById('addRfidForm');
const newRfidTagInput = document.getElementById('newRfidTag');
const newStudentNameInput = document.getElementById('newStudentName');
const newStudentIdInput = document.getElementById('newStudentId');
const newStudentStatusSelect = document.getElementById('newStudentStatus');
const registeredRfidList = document.getElementById('registered-rfid-list');
const clearAllRfidsBtn = document.getElementById('clear-all-rfids');

// Elements for Profile Picture Management
const studentProfilePictureDisplay = document.getElementById('student-profile-picture'); // On Scan Tab
const newProfilePictureInput = document.getElementById('newProfilePictureInput'); // On Management Form
const newProfilePicturePreview = document.getElementById('newProfilePicturePreview'); // On Management Form
const clearNewProfilePictureBtn = document.getElementById('clearNewProfilePicture'); // On Management Form
const defaultProfilePictureSrc = "https://via.placeholder.com/120x120?text=No+Photo"; // Default image source

// --- API Base URL ---
const API_BASE_URL = 'http://127.0.0.1:5000/api'; // Ensure this matches your Flask app.py port


// --- RFID Scanner Input Focus Logic ---
function setRfidScannerFocus() {
    setTimeout(() => {
        rfidActualScannerInput.focus();
    }, 50);
}

// --- RFID Scan Event Listener ---
rfidActualScannerInput.addEventListener('keyup', (e) => {
    if (e.key === 'Enter' || e.keyCode === 13) {
        const scannedTag = e.target.value.trim();
        if (scannedTag.length > 0) {
            console.log('RFID scanned (on Enter):', scannedTag);
            rfidInputDisplay.value = scannedTag;
            rfidStatusSpan.textContent = 'Processing...';
            rfidStatusSpan.className = ''; // Reset status class
            studentNameInput.value = '';
            studentIdInput.value = '';
            studentProfilePictureDisplay.src = defaultProfilePictureSrc; // Reset picture

            processRfidScan(scannedTag);

            rfidActualScannerInput.value = ''; // Clear input for next scan
            setRfidScannerFocus(); // Ensure focus remains after processing
        }
        e.preventDefault();
    }
});

// --- Function to Process RFID Scan (Fetches from Backend and Logs Attendance) ---
async function processRfidScan(rfidTag) {
    try {
        const response = await fetch(`${API_BASE_URL}/students`); // Fetch all students to find match
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const students = await response.json();
        const student = students.find(s => s.rfidTag === rfidTag);

        if (student) {
            studentNameInput.value = student.studentName;
            studentIdInput.value = student.studentId;
            rfidStatusSpan.className = 'text-success';
            rfidStatusSpan.textContent = `Student Found: ${student.studentName} (Status: ${student.status})`;
            studentProfilePictureDisplay.src = student.profilePicturePath ? `${API_BASE_URL}/${student.profilePicturePath}` : defaultProfilePictureSrc;

            // Determine TIME IN/OUT status for logging
            const attendanceResponse = await fetch(`${API_BASE_URL}/attendance`);
            const allLogs = await attendanceResponse.json();
            const lastLogForStudent = allLogs
                .filter(log => log.studentId === student.studentId)
                .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
                .pop();

            let logStatus = 'TIME IN';
            if (lastLogForStudent && lastLogForStudent.status === 'TIME IN') {
                logStatus = 'TIME OUT';
            }

            const timestamp = new Date().toLocaleString('en-US', {
                year: 'numeric', month: '2-digit', day: '2-digit',
                hour: '2-digit', minute: '2-digit', second: '2-digit',
                hour12: false
            });

            const logEntry = {
                timestamp: timestamp,
                studentId: student.studentId,
                studentName: student.studentName,
                status: logStatus
            };

            // Send attendance log to backend
            const logResponse = await fetch(`${API_BASE_URL}/attendance`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(logEntry)
            });

            if (logResponse.ok) {
                console.log('Attendance Logged:', logEntry);
                if (document.getElementById('rfid-logs-tab').classList.contains('active')) {
                    loadAttendanceLogs(); // Reload logs if on tab
                }
                if (document.getElementById('rfid-reports-tab').classList.contains('active')) {
                    loadStudentDatabaseReport(); // Reload report if on tab
                }
            } else {
                console.error('Failed to log attendance:', await logResponse.json());
                alert('Error logging attendance.');
            }

        } else {
            studentNameInput.value = 'N/A';
            studentIdInput.value = 'N/A';
            rfidStatusSpan.className = 'text-error';
            rfidStatusSpan.textContent = `Error: Student not found for RFID: ${rfidTag}`;
            studentProfilePictureDisplay.src = defaultProfilePictureSrc;
            alert(`Error: Student not found for RFID Tag: ${rfidTag}`);
        }
    } catch (error) {
        console.error('Error processing RFID scan:', error);
        rfidStatusSpan.className = 'text-error';
        rfidStatusSpan.textContent = `Network Error: Could not connect to backend.`;
        studentProfilePictureDisplay.src = defaultProfilePictureSrc;
        alert(`Network Error: Could not connect to backend or process scan. Check console for details.`);
    }
}


// --- Manual Entry Button (Now fetches from backend) ---
if (manualBtn) {
    manualBtn.addEventListener('click', async () => {
        rfidActualScannerInput.blur();

        const studentIdPrompt = prompt("Enter Student ID manually:");
        if (studentIdPrompt) {
            try {
                const response = await fetch(`${API_BASE_URL}/students`);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const students = await response.json();
                const student = students.find(s => s.studentId === studentIdPrompt);

                if (student) {
                    studentIdInput.value = student.studentId;
                    studentNameInput.value = student.studentName;
                    rfidStatusSpan.className = 'text-success';
                    rfidStatusSpan.textContent = `Manual ID Entered: ${student.studentName} (${student.status})`;
                    studentProfilePictureDisplay.src = student.profilePicturePath ? `${API_BASE_URL}/${student.profilePicturePath}` : defaultProfilePictureSrc;
                    alert(`Manual Student ID entered: ${student.studentId} (${student.studentName})`);

                    const timestamp = new Date().toLocaleString('en-US', {
                        year: 'numeric', month: '2-digit', day: '2-digit',
                        hour: '2-digit', minute: '2-digit', second: '2-digit',
                        hour12: false
                    });

                    const logEntry = {
                        timestamp: timestamp,
                        studentId: student.studentId,
                        studentName: student.studentName,
                        status: 'MANUAL ENTRY'
                    };

                    const logResponse = await fetch(`${API_BASE_URL}/attendance`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(logEntry)
                    });

                    if (logResponse.ok) {
                        console.log('Manual Entry Logged:', logEntry);
                        if (document.getElementById('rfid-logs-tab').classList.contains('active')) {
                            loadAttendanceLogs();
                        }
                        if (document.getElementById('rfid-reports-tab').classList.contains('active')) {
                            loadStudentDatabaseReport();
                        }
                    } else {
                        console.error('Failed to log manual attendance:', await logResponse.json());
                        alert('Error logging manual attendance.');
                    }

                } else {
                    studentIdInput.value = studentIdPrompt;
                    studentNameInput.value = "Unknown (Manual)";
                    rfidStatusSpan.className = 'text-error';
                    rfidStatusSpan.textContent = `Manual ID: ${studentIdPrompt} - Student not found in database.`;
                    studentProfilePictureDisplay.src = defaultProfilePictureSrc;
                    alert(`Manual Student ID entered: ${studentIdPrompt}. Student not found in database.`);

                    const timestamp = new Date().toLocaleString('en-US', {
                        year: 'numeric', month: '2-digit', day: '2-digit',
                        hour: '2-digit', minute: '2-digit', second: '2-digit',
                        hour12: false
                    });

                    const logEntry = {
                        timestamp: timestamp,
                        studentId: studentIdPrompt,
                        studentName: "Unknown",
                        status: 'MANUAL ENTRY (UNKNOWN)'
                    };

                    const logResponse = await fetch(`${API_BASE_URL}/attendance`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(logEntry)
                    });

                    if (logResponse.ok) {
                        console.log('Manual Entry Logged:', logEntry);
                        if (document.getElementById('rfid-logs-tab').classList.contains('active')) {
                            loadAttendanceLogs();
                        }
                        if (document.getElementById('rfid-reports-tab').classList.contains('active')) {
                            loadStudentDatabaseReport();
                        }
                    } else {
                        console.error('Failed to log manual unknown attendance:', await logResponse.json());
                        alert('Error logging manual unknown attendance.');
                    }
                }
            } catch (error) {
                console.error('Error with manual entry:', error);
                rfidStatusSpan.className = 'text-error';
                rfidStatusSpan.textContent = `Network Error: Could not connect to backend.`;
                studentProfilePictureDisplay.src = defaultProfilePictureSrc;
                alert(`Network Error: Could not connect to backend for manual entry. Check console for details.`);
            }
        }
        setRfidScannerFocus();
    });
}


// --- Internal Tabs Logic ---
if (rfidInternalTabNav) {
    rfidInternalTabNav.addEventListener('click', (event) => {
        const targetButton = event.target.closest('.tab-btn');
        if (targetButton) {
            document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

            targetButton.classList.add('active');
            const targetTabId = targetButton.dataset.tab;
            document.getElementById(targetTabId).classList.add('active');

            if (targetTabId === 'rfid-scan-tab') {
                setRfidScannerFocus();
            } else {
                rfidActualScannerInput.blur();
            }

            if (targetTabId === 'rfid-logs-tab') {
                loadAttendanceLogs();
            } else if (targetTabId === 'rfid-reports-tab') {
                loadStudentDatabaseReport();
            } else if (targetTabId === 'rfid-manage-tab') {
                loadRegisteredRfids();
            }
        }
    });
}

// --- Event listeners to manage RFID scanner focus when form inputs are active ---
document.addEventListener('focusin', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') {
        if (e.target.id !== 'rfidActualScannerInput') {
            rfidActualScannerInput.blur();
        }
    }
});

document.addEventListener('click', (e) => {
    const rfidScanTab = document.getElementById('rfid-scan-tab');
    const clickedInsideForm = e.target.closest('#addRfidForm');
    const clickedInsideLogsFilter = e.target.closest('#rfid-logs-tab') && (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'BUTTON');

    if (rfidScanTab && rfidScanTab.classList.contains('active') && !clickedInsideForm && !clickedInsideLogsFilter) {
        setRfidScannerFocus();
    }
});


// --- Function to load and display attendance logs from backend ---
async function loadAttendanceLogs() {
    const logsContainer = document.getElementById('logs-container');
    if (!logsContainer) return;

    logsContainer.innerHTML = '';
    const logDateFilter = document.getElementById('log-date-filter');
    const selectedDate = logDateFilter ? logDateFilter.value : null;

    try {
        const response = await fetch(`${API_BASE_URL}/attendance`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        let logs = await response.json();

        const filteredLogs = selectedDate
            ? logs.filter(log => {
                const logDate = new Date(log.timestamp);
                const logDateFormatted = logDate.getFullYear() + '-' +
                                        String(logDate.getMonth() + 1).padStart(2, '0') + '-' +
                                        String(logDate.getDate()).padStart(2, '0');
                return logDateFormatted === selectedDate;
            })
            : logs;

        if (filteredLogs.length === 0) {
            logsContainer.innerHTML = '<tr><td colspan="4" class="text-center">No attendance logs found for the selected date or no logs yet.</td></tr>';
            return;
        }

        filteredLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        filteredLogs.forEach(log => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${log.timestamp}</td>
                <td>${log.studentId}</td>
                <td>${log.studentName}</td>
                <td>${log.status}</td>
            `;
            logsContainer.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading attendance logs:', error);
        logsContainer.innerHTML = `<tr><td colspan="4" class="text-center text-error">Failed to load logs. Network error or backend issue.</td></tr>`;
    }
}

const refreshLogsBtn = document.getElementById('refresh-logs');
if (refreshLogsBtn) {
    refreshLogsBtn.addEventListener('click', loadAttendanceLogs);
}

const logDateFilter = document.getElementById('log-date-filter');
if (logDateFilter) {
    logDateFilter.addEventListener('change', loadAttendanceLogs);
}

// --- Function to load and display student database report from backend ---
async function loadStudentDatabaseReport() {
    const studentDbTableBody = document.getElementById('student-db');
    if (!studentDbTableBody) return;

    studentDbTableBody.innerHTML = '';

    try {
        const studentsResponse = await fetch(`${API_BASE_URL}/students`);
        if (!studentsResponse.ok) throw new Error(`HTTP error! status: ${studentsResponse.status}`);
        const students = await studentsResponse.json();

        const logsResponse = await fetch(`${API_BASE_URL}/attendance`);
        if (!logsResponse.ok) throw new Error(`HTTP error! status: ${logsResponse.status}`);
        const allLogs = await logsResponse.json();

        if (students.length === 0) {
            studentDbTableBody.innerHTML = '<tr><td colspan="4" class="text-center">No students in database.</td></tr>';
            return;
        }

        students.forEach(student => {
            const studentLogs = allLogs.filter(log => log.studentId === student.studentId);
            const totalScans = studentLogs.length;
            const lastScanLog = studentLogs.length > 0
                ? studentLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0]
                : null;
            const lastScanTimestamp = lastScanLog ? lastScanLog.timestamp : 'N/A';
            const lastScanStatus = lastScanLog ? lastScanLog.status : '';

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${student.studentId}</td>
                <td>${student.studentName}</td>
                <td>${lastScanTimestamp} <span class="text-xs text-secondary">(${lastScanStatus})</span></td>
                <td>${totalScans}</td>
            `;
            studentDbTableBody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading student database report:', error);
        studentDbTableBody.innerHTML = `<tr><td colspan="4" class="text-center text-error">Failed to load student data. Network error or backend issue.</td></tr>`;
    }
}

// --- RFID Management Tab Logic (Now uses API) ---

// Function to fetch and display registered RFIDs
async function loadRegisteredRfids() {
    registeredRfidList.innerHTML = '';
    try {
        const response = await fetch(`${API_BASE_URL}/students`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        studentsData = await response.json(); // Update global studentsData variable

        if (studentsData.length === 0) {
            registeredRfidList.innerHTML = '<tr><td colspan="5" class="text-center">No RFID tags registered yet.</td></tr>';
            return;
        }

        studentsData.forEach((student) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${student.rfidTag}</td>
                <td>${student.studentId}</td>
                <td>
                    <div class="flex items-center gap-2">
                        <img src="${student.profilePicturePath ? `${API_BASE_URL}/${student.profilePicturePath}` : defaultProfilePictureSrc}" alt="P" class="table-profile-thumb">
                        <span>${student.studentName}</span>
                    </div>
                </td>
                <td>${student.status}</td>
                <td class="actions">
                    <button class="delete-rfid-btn" data-id="${student.id}">Delete</button>
                </td>
            `;
            registeredRfidList.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading registered RFIDs:', error);
        registeredRfidList.innerHTML = `<tr><td colspan="5" class="text-center text-error">Failed to load registered RFIDs. Network error or backend issue.</td></tr>`;
    }
}

// --- Profile Picture Preview Logic (RFID Management Tab) ---
newProfilePictureInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            newProfilePicturePreview.src = event.target.result;
            newProfilePicturePreview.classList.remove('hidden'); // Show preview
        };
        reader.onerror = () => {
            console.error("FileReader failed to read the file.");
            newProfilePicturePreview.src = defaultProfilePictureSrc;
            newProfilePicturePreview.classList.remove('hidden'); // Show even on error to indicate something loaded
            alert("Could not read image file. Please try another.");
        };
        reader.readAsDataURL(file); // Convert image to Base64
    } else {
        newProfilePicturePreview.src = defaultProfilePictureSrc; // Reset to default
        newProfilePicturePreview.classList.add('hidden'); // Hide preview if no file
    }
});

clearNewProfilePictureBtn.addEventListener('click', () => {
    newProfilePictureInput.value = ''; // Clear the file input
    newProfilePicturePreview.src = defaultProfilePictureSrc; // Reset preview image
    newProfilePicturePreview.classList.add('hidden'); // Hide preview
});


addRfidForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const rfidTag = newRfidTagInput.value.trim();
    const studentName = newStudentNameInput.value.trim();
    const studentId = newStudentIdInput.value.trim();
    const status = newStudentStatusSelect.value;
    const profilePicture = newProfilePicturePreview.classList.contains('hidden') ? null : newProfilePicturePreview.src;

    // Client-side validation for duplicates (optional, backend will also handle)
    const existingStudents = await (await fetch(`${API_BASE_URL}/students`)).json();
    if (existingStudents.some(student => student.rfidTag === rfidTag)) {
        alert('Error: RFID Tag already exists! Please use a unique tag.');
        return;
    }
    if (existingStudents.some(student => student.studentId === studentId)) {
        alert('Error: Student ID already exists! Please use a unique ID.');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/students`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                rfidTag: rfidTag,
                studentName: studentName,
                studentId: studentId,
                status: status,
                profilePicture: profilePicture // This is the Base64 string
            })
        });

        if (response.ok) {
            const addedStudent = await response.json();
            alert('RFID Tag and Student added successfully!');
            console.log('New student added:', addedStudent);
            addRfidForm.reset();
            newProfilePictureInput.value = '';
            newProfilePicturePreview.src = defaultProfilePictureSrc;
            newProfilePicturePreview.classList.add('hidden');
            loadRegisteredRfids(); // Reload the list
        } else {
            const errorData = await response.json();
            alert(`Error adding student: ${errorData.error || response.statusText}`);
            console.error('Error adding student:', errorData);
        }
    } catch (error) {
        alert('Network Error: Could not connect to backend to add student.');
        console.error('Network error on add student:', error);
    }
});


registeredRfidList.addEventListener('click', async (e) => {
    if (e.target.classList.contains('delete-rfid-btn')) {
        // Data-id on the button now refers to student.id (which is mapped from StudentNo)
        const studentNoToDelete = e.target.dataset.id;
        if (confirm(`Are you sure you want to delete student with StudentNo: ${studentNoToDelete}? This cannot be undone.`)) {
            try {
                const response = await fetch(`${API_BASE_URL}/students/${studentNoToDelete}`, {
                    method: 'DELETE'
                });

                if (response.ok) {
                    alert('Student record deleted successfully!');
                    loadRegisteredRfids(); // Reload the list
                } else {
                    const errorData = await response.json();
                    alert(`Error deleting student: ${errorData.error || response.statusText}`);
                    console.error('Error deleting student:', errorData);
                }
            } catch (error) {
                alert('Network Error: Could not connect to backend to delete student.');
                console.error('Network error on delete student:', error);
            }
        }
    }
});


clearAllRfidsBtn.addEventListener('click', async () => {
    if (confirm('Are you sure you want to DELETE ALL registered RFID tags and student records? This cannot be undone.')) {
        try {
            const response = await fetch(`${API_BASE_URL}/students/clear`, {
                method: 'POST'
            });

            if (response.ok) {
                alert('All RFID tags and student records have been cleared.');
                loadRegisteredRfids(); // Reload the list
            } else {
                const errorData = await response.json();
                alert(`Error clearing students: ${errorData.error || response.statusText}`);
                console.error('Error clearing students:', errorData);
            }
        } catch (error) {
            alert('Network Error: Could not connect to backend to clear students.');
            console.error('Network error on clear students:', error);
        }
    }
});


// --- Initial Load Logic ---
document.addEventListener('DOMContentLoaded', () => {
    // We no longer load from localStorage. Fetch from API on initial load.
    // fetchStudents(); // Call this only when the specific tab is activated

    // Determine which tab is initially active (or default to 'rfid-scan-tab')
    const initialActiveTabButton = document.querySelector('.tab-btn.active');
    let initialTabId = 'rfid-scan-tab'; // Default to RFID Scan tab
    if (initialActiveTabButton) {
        initialTabId = initialActiveTabButton.dataset.tab;
    }

    // Manually activate the initial tab content and load data
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    document.getElementById(initialTabId).classList.add('active');

    if (initialTabId === 'rfid-scan-tab') {
        setRfidScannerFocus();
    } else if (initialTabId === 'rfid-logs-tab') {
        loadAttendanceLogs();
    } else if (initialTabId === 'rfid-reports-tab') {
        loadStudentDatabaseReport();
    } else if (initialTabId === 'rfid-manage-tab') {
        loadRegisteredRfids(); // This will populate studentsData from the API
    }
});

// Export Logs to CSV (Now fetches from backend)
const exportLogsBtn = document.getElementById('export-logs');
if (exportLogsBtn) {
    exportLogsBtn.addEventListener('click', async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/attendance`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const logs = await response.json();

            if (logs.length === 0) {
                alert('No logs to export!');
                return;
            }

            let csvContent = "data:text/csv;charset=utf-8,\uFEFF"; // Add BOM for Excel compatibility
            csvContent += "Timestamp,Student ID,Student Name,Status\n";

            logs.forEach(log => {
                const escapeCsv = (field) => `"${String(field).replace(/"/g, '""')}"`;
                csvContent += `${escapeCsv(log.timestamp)},${escapeCsv(log.studentId)},${escapeCsv(log.studentName)},${escapeCsv(log.status)}\n`;
            });

            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", "rfid_attendance_logs.csv");
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            alert('Network Error: Could not connect to backend to export logs.');
            console.error('Network error on export logs:', error);
        }
    });
}

// Floating Time Display
function updateFloatingTime() {
    const now = new Date();
    const timeElement = document.getElementById('floating-time');
    if (timeElement) {
        const options = {
            hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true,
            month: 'short', day: 'numeric', year: 'numeric'
        };
        timeElement.innerHTML = `<span class="time">${now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}</span>
                                 <span class="date">${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>`;
    }
}
setInterval(updateFloatingTime, 1000);
updateFloatingTime();

/* Modern theme hook for RFID page */
document.addEventListener('DOMContentLoaded', () => {
  // Avatar initials + name (reuse session user if available)
  try {
    const user = JSON.parse(sessionStorage.getItem('user') || '{"name":"Administrator"}');
    document.querySelectorAll('.sidebar-profile .avatar').forEach(el => {
      el.textContent = user.name.split(' ').map(s => s[0]).slice(0,2).join('').toUpperCase();
    });
    const nm = document.querySelector('.sidebar-profile .user-name');
    if (nm) nm.textContent = `Hi, ${user.name.split(' ')[0]}!`;
  } catch {}

  // Theme toggle
  const toggleBtn = document.querySelector('.theme-toggle-btn');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const isDark = document.documentElement.classList.toggle('dark');
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
      toggleBtn.textContent = isDark ? '☀️' : '🌙';
    });
    if (localStorage.getItem('theme') === 'dark') {
      document.documentElement.classList.add('dark');
      toggleBtn.textContent = '☀️';
    }
  }
});
