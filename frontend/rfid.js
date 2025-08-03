// --- CENTRAL STUDENT DATA STORE ---
let studentsData = [];

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

// --- RFID Scanner Input Focus Logic ---
// This function will *attempt* to focus the hidden input.
// It's called strategically when the RFID Scan tab is active.
function setRfidScannerFocus() {
    // Use setTimeout to ensure focus is applied after other DOM updates
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

// --- Function to Process RFID Scan ---
function processRfidScan(rfidTag) {
    const mockStudentDatabase = studentsData.reduce((acc, student) => {
        acc[student.rfidTag] = student;
        return acc;
    }, {});

    const student = mockStudentDatabase[rfidTag];

    if (student) {
        studentNameInput.value = student.studentName;
        studentIdInput.value = student.studentId;
        rfidStatusSpan.className = 'text-success'; // Use a class from styles.css
        rfidStatusSpan.textContent = `Student Found: ${student.studentName} (Status: ${student.status})`;
        // Set profile picture
        studentProfilePictureDisplay.src = student.profilePicture || defaultProfilePictureSrc;

        let logs = JSON.parse(localStorage.getItem('rfidAttendanceLogs')) || [];
        const timestamp = new Date().toLocaleString('en-US', {
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit', second: '2-digit',
            hour12: false
        });

        const lastLogForStudent = logs.filter(log => log.studentId === student.studentId)
                                      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
                                      .pop();
        let logStatus = 'TIME IN';
        if (lastLogForStudent && lastLogForStudent.status === 'TIME IN') {
            logStatus = 'TIME OUT';
        }

        const logEntry = {
            timestamp: timestamp,
            studentId: student.studentId,
            studentName: student.studentName,
            status: logStatus
        };
        logs.push(logEntry);
        localStorage.setItem('rfidAttendanceLogs', JSON.stringify(logs));
        console.log('Attendance Logged:', logEntry);

        if (document.getElementById('rfid-logs-tab').classList.contains('active')) {
            loadAttendanceLogs();
        }
        if (document.getElementById('rfid-reports-tab').classList.contains('active')) {
            loadStudentDatabaseReport();
        }

    } else {
        studentNameInput.value = 'N/A';
        studentIdInput.value = 'N/A';
        rfidStatusSpan.className = 'text-error'; // Use a class from styles.css
        rfidStatusSpan.textContent = `Error: Student not found for RFID: ${rfidTag}`;
        studentProfilePictureDisplay.src = defaultProfilePictureSrc; // Reset picture on error
        alert(`Error: Student not found for RFID Tag: ${rfidTag}`);
    }
}


// --- Manual Entry Button ---
if (manualBtn) {
    manualBtn.addEventListener('click', () => {
        // Blur the RFID scanner input when manual entry is initiated
        rfidActualScannerInput.blur();

        const studentIdPrompt = prompt("Enter Student ID manually:");
        if (studentIdPrompt) {
            const student = studentsData.find(s => s.studentId === studentIdPrompt);

            if (student) {
                studentIdInput.value = student.studentId;
                studentNameInput.value = student.studentName;
                rfidStatusSpan.className = 'text-success';
                rfidStatusSpan.textContent = `Manual ID Entered: ${student.studentName} (${student.status})`;
                studentProfilePictureDisplay.src = student.profilePicture || defaultProfilePictureSrc; // Set picture for manual entry
                alert(`Manual Student ID entered: ${student.studentId} (${student.studentName})`);

                let logs = JSON.parse(localStorage.getItem('rfidAttendanceLogs')) || [];
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
                logs.push(logEntry);
                localStorage.setItem('rfidAttendanceLogs', JSON.stringify(logs));
                console.log('Manual Entry Logged:', logEntry);

                if (document.getElementById('rfid-logs-tab').classList.contains('active')) {
                    loadAttendanceLogs();
                }
                if (document.getElementById('rfid-reports-tab').classList.contains('active')) {
                    loadStudentDatabaseReport();
                }

            } else {
                studentIdInput.value = studentIdPrompt;
                studentNameInput.value = "Unknown (Manual)";
                rfidStatusSpan.className = 'text-error';
                rfidStatusSpan.textContent = `Manual ID: ${studentIdPrompt} - Student not found in database.`;
                studentProfilePictureDisplay.src = defaultProfilePictureSrc; // Reset picture for unknown manual entry
                alert(`Manual Student ID entered: ${studentIdPrompt}. Student not found in database.`);

                  let logs = JSON.parse(localStorage.getItem('rfidAttendanceLogs')) || [];
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
                  logs.push(logEntry);
                  localStorage.setItem('rfidAttendanceLogs', JSON.stringify(logs));
                  console.log('Manual Entry Logged:', logEntry);

                  if (document.getElementById('rfid-logs-tab').classList.contains('active')) {
                      loadAttendanceLogs();
                  }
                  if (document.getElementById('rfid-reports-tab').classList.contains('active')) {
                      loadStudentDatabaseReport();
                  }
            }
        }
        // Always re-focus the scanner input after manual entry attempt
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

            // Manage scanner focus based on the active tab
            if (targetTabId === 'rfid-scan-tab') {
                setRfidScannerFocus(); // Focus scanner input
            } else {
                rfidActualScannerInput.blur(); // Blur scanner input if not on scan tab
            }

            // Load content for the newly active tab
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
// This prevents the scanner from taking focus while user is typing in forms.
document.addEventListener('focusin', (e) => {
    // Check if the currently focused element is an input or select
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') {
        // And if it's *not* the hidden RFID scanner input itself
        if (e.target.id !== 'rfidActualScannerInput') {
            // Blur the RFID scanner input to allow interaction with the form field
            rfidActualScannerInput.blur();
        }
    }
});

// Re-focus the RFID scanner input if the user clicks outside form inputs
// and the RFID Scan tab is active.
document.addEventListener('click', (e) => {
    const rfidScanTab = document.getElementById('rfid-scan-tab');
    const clickedInsideForm = e.target.closest('#addRfidForm');
    const clickedInsideLogsFilter = e.target.closest('#rfid-logs-tab') && (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'BUTTON');

    // If RFID Scan tab is active and click is not within other form elements
    if (rfidScanTab && rfidScanTab.classList.contains('active') && !clickedInsideForm && !clickedInsideLogsFilter) {
        // Ensure the scanner input is focused
        setRfidScannerFocus();
    }
});


// --- Function to load and display attendance logs from localStorage ---
function loadAttendanceLogs() {
    const logsContainer = document.getElementById('logs-container');
    if (!logsContainer) return;

    logsContainer.innerHTML = '';
    const logs = JSON.parse(localStorage.getItem('rfidAttendanceLogs')) || [];

    const logDateFilter = document.getElementById('log-date-filter');
    const selectedDate = logDateFilter ? logDateFilter.value : null;

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
}

const refreshLogsBtn = document.getElementById('refresh-logs');
if (refreshLogsBtn) {
    refreshLogsBtn.addEventListener('click', loadAttendanceLogs);
}

const logDateFilter = document.getElementById('log-date-filter');
if (logDateFilter) {
    logDateFilter.addEventListener('change', loadAttendanceLogs);
}

// --- Function to load and display student database report ---
function loadStudentDatabaseReport() {
    const studentDbTableBody = document.getElementById('student-db');
    if (!studentDbTableBody) return;

    studentDbTableBody.innerHTML = '';
    const students = studentsData;

    if (students.length === 0) {
        studentDbTableBody.innerHTML = '<tr><td colspan="4" class="text-center">No students in database.</td></tr>';
        return;
    }

    const allLogs = JSON.parse(localStorage.getItem('rfidAttendanceLogs')) || [];

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
}

// --- RFID Management Tab Logic ---
function saveStudentsData() {
    localStorage.setItem('rfidStudents', JSON.stringify(studentsData));
}

function loadStudentsData() {
    const storedData = localStorage.getItem('rfidStudents');
    if (storedData) {
        studentsData = JSON.parse(storedData);
    } else {
        studentsData = [
            { rfidTag: "3498485411", studentName: "Nathaniel James Ong", studentId: "2021102670", status: "Enrolled", profilePicture: null },
            { rfidTag: "9876543210", studentName: "Maria Clara", studentId: "2022-67890", status: "Alumni", profilePicture: null },
            { rfidTag: "1122334455", studentName: "Crisostomo Ibarra", studentId: "2024-54321", status: "Enrolled", profilePicture: null }
        ];
        saveStudentsData();
    }
}

function loadRegisteredRfids() {
    registeredRfidList.innerHTML = '';

    if (studentsData.length === 0) {
        registeredRfidList.innerHTML = '<tr><td colspan="5" class="text-center">No RFID tags registered yet.</td></tr>';
        return;
    }

    studentsData.forEach((student, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${student.rfidTag}</td>
            <td>${student.studentId}</td>
            <td>
                <div class="flex items-center gap-2">
                    <img src="${student.profilePicture || defaultProfilePictureSrc}" alt="P" class="table-profile-thumb">
                    <span>${student.studentName}</span>
                </div>
            </td>
            <td>${student.status}</td>
            <td class="actions">
                <button class="delete-rfid-btn" data-index="${index}">Delete</button>
            </td>
        `;
        registeredRfidList.appendChild(row);
    });
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


addRfidForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const rfidTag = newRfidTagInput.value.trim();
    const studentName = newStudentNameInput.value.trim();
    const studentId = newStudentIdInput.value.trim();
    const status = newStudentStatusSelect.value;

    const isDuplicateRfid = studentsData.some(student => student.rfidTag === rfidTag);
    const isDuplicateId = studentsData.some(student => student.studentId === studentId);

    if (isDuplicateRfid) {
        alert('Error: RFID Tag already exists! Please use a unique tag.');
        return;
    }
    if (isDuplicateId) {
        alert('Error: Student ID already exists! Please use a unique ID.');
        return;
    }

    const newStudent = {
        rfidTag: rfidTag,
        studentName: studentName,
        studentId: studentId,
        status: status,
        profilePicture: newProfilePicturePreview.classList.contains('hidden') ? null : newProfilePicturePreview.src // Store Base64 or null
    };

    studentsData.push(newStudent);
    saveStudentsData();
    loadRegisteredRfids();
    addRfidForm.reset();
    newProfilePictureInput.value = ''; // Ensure file input is cleared
    newProfilePicturePreview.src = defaultProfilePictureSrc; // Reset preview image
    newProfilePicturePreview.classList.add('hidden'); // Hide preview after successful add
    alert('RFID Tag and Student added successfully!');
    console.log('New student added:', newStudent);
});

registeredRfidList.addEventListener('click', (e) => {
    if (e.target.classList.contains('delete-rfid-btn')) {
        const index = parseInt(e.target.dataset.index);
        if (confirm('Are you sure you want to delete this RFID tag and student record?')) {
            studentsData.splice(index, 1);
            saveStudentsData();
            loadRegisteredRfids();
            alert('Student record deleted successfully!');
        }
    }
});

clearAllRfidsBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to DELETE ALL registered RFID tags and student records? This cannot be undone.')) {
        studentsData = [];
        saveStudentsData();
        loadRegisteredRfids();
        alert('All RFID tags and student records have been cleared.');
    }
});


// --- Initial Load Logic ---
document.addEventListener('DOMContentLoaded', () => {
    loadStudentsData();
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
        loadRegisteredRfids();
    }
});

// Export Logs to CSV
const exportLogsBtn = document.getElementById('export-logs');
if (exportLogsBtn) {
    exportLogsBtn.addEventListener('click', () => {
        const logs = JSON.parse(localStorage.getItem('rfidAttendanceLogs')) || [];
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