import sqlite3
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
from datetime import datetime
import base64

app = Flask(__name__)
CORS(app) # Enable CORS for all routes

DATABASE = 'rfid_attendance.db'
UPLOAD_FOLDER = 'uploads' # Folder to store profile pictures
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Ensure the upload folder exists
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

def get_db_connection():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row # This allows access to columns by name
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    # Create students table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS students (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            rfidTag TEXT UNIQUE NOT NULL,
            studentName TEXT NOT NULL,
            studentId TEXT UNIQUE NOT NULL,
            status TEXT NOT NULL,
            profilePicturePath TEXT -- Path to the image file
        );
    ''')
    # Create attendance_logs table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS attendance_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            studentId TEXT NOT NULL,
            studentName TEXT NOT NULL,
            status TEXT NOT NULL
        );
    ''')

    # Insert initial data if tables are empty (similar to your localStorage defaults)
    cursor.execute('SELECT COUNT(*) FROM students;')
    if cursor.fetchone()[0] == 0:
        print("Inserting initial student data...")
        initial_students = [
            ("3498485411", "Nathaniel James Ong", "2021102670", "Enrolled", None),
            ("9876543210", "Maria Clara", "2022-67890", "Alumni", None),
            ("1122334455", "Crisostomo Ibarra", "2024-54321", "Enrolled", None)
        ]
        cursor.executemany(
            'INSERT INTO students (rfidTag, studentName, studentId, status, profilePicturePath) VALUES (?, ?, ?, ?, ?);',
            initial_students
        )
        conn.commit()
        print("Initial student data inserted.")
    else:
        print("Students table already contains data.")

    conn.close()

# Initialize database on app startup
with app.app_context():
    init_db()


# --- API Endpoints ---

# Get all students
@app.route('/api/students', methods=['GET'])
def get_students():
    conn = get_db_connection()
    students = conn.execute('SELECT * FROM students').fetchall()
    conn.close()
    return jsonify([dict(row) for row in students])

# Add a new student
@app.route('/api/students', methods=['POST'])
def add_student():
    data = request.json
    rfid_tag = data.get('rfidTag')
    student_name = data.get('studentName')
    student_id = data.get('studentId')
    status = data.get('status')
    profile_picture_data = data.get('profilePicture') # This will be the Base64 string for now

    conn = get_db_connection()
    cursor = conn.cursor()

    # Check for duplicate RFID tag
    cursor.execute('SELECT 1 FROM students WHERE rfidTag = ?', (rfid_tag,))
    if cursor.fetchone():
        conn.close()
        return jsonify({"error": "RFID Tag already exists!"}), 409 # 409 Conflict

    # Check for duplicate Student ID
    cursor.execute('SELECT 1 FROM students WHERE studentId = ?', (student_id,))
    if cursor.fetchone():
        conn.close()
        return jsonify({"error": "Student ID already exists!"}), 409 # 409 Conflict

    profile_picture_path = None
    if profile_picture_data:
        try:
            # Decode Base64 string (assuming it starts with "data:image/jpeg;base64," or similar)
            header, encoded = profile_picture_data.split(",", 1)
            file_extension = header.split(';')[0].split('/')[1] # e.g., 'jpeg', 'png'
            image_data = base64.b64decode(encoded)

            # Generate a unique filename
            filename = f"{student_id}_{datetime.now().strftime('%Y%m%d%H%M%S')}.{file_extension}"
            profile_picture_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)

            with open(profile_picture_path, 'wb') as f:
                f.write(image_data)
            print(f"Profile picture saved: {profile_picture_path}")
        except Exception as e:
            print(f"Error saving profile picture: {e}")
            profile_picture_path = None # Don't save if there's an error

    try:
        cursor.execute(
            'INSERT INTO students (rfidTag, studentName, studentId, status, profilePicturePath) VALUES (?, ?, ?, ?, ?)',
            (rfid_tag, student_name, student_id, status, profile_picture_path)
        )
        conn.commit()
        new_student_id = cursor.lastrowid
        new_student = dict(conn.execute('SELECT * FROM students WHERE id = ?', (new_student_id,)).fetchone())
        conn.close()
        return jsonify(new_student), 201 # 201 Created
    except sqlite3.Error as e:
        conn.close()
        return jsonify({"error": str(e)}), 500 # 500 Internal Server Error

# Delete a student by ID (assuming 'id' from the database)
@app.route('/api/students/<int:student_db_id>', methods=['DELETE'])
def delete_student(student_db_id):
    conn = get_db_connection()
    cursor = conn.cursor()

    # Get student info to delete their profile picture file
    cursor.execute('SELECT profilePicturePath FROM students WHERE id = ?', (student_db_id,))
    student = cursor.fetchone()
    if student and student['profilePicturePath']:
        try:
            os.remove(student['profilePicturePath'])
            print(f"Deleted profile picture file: {student['profilePicturePath']}")
        except OSError as e:
            print(f"Error deleting profile picture file {student['profilePicturePath']}: {e}")


    cursor.execute('DELETE FROM students WHERE id = ?', (student_db_id,))
    conn.commit()
    rows_affected = cursor.rowcount
    conn.close()

    if rows_affected > 0:
        return jsonify({"message": "Student deleted successfully"}), 200
    else:
        return jsonify({"error": "Student not found"}), 404

# Clear all students
@app.route('/api/students/clear', methods=['POST'])
def clear_students():
    conn = get_db_connection()
    try:
        # Delete associated profile picture files first
        cursor = conn.cursor()
        cursor.execute('SELECT profilePicturePath FROM students WHERE profilePicturePath IS NOT NULL')
        files_to_delete = cursor.fetchall()
        for row in files_to_delete:
            file_path = row['profilePicturePath']
            if file_path and os.path.exists(file_path):
                try:
                    os.remove(file_path)
                    print(f"Deleted profile picture file: {file_path}")
                except OSError as e:
                    print(f"Error deleting profile picture file {file_path}: {e}")

        conn.execute('DELETE FROM students')
        conn.commit()
        conn.close()
        return jsonify({"message": "All students cleared"}), 200
    except sqlite3.Error as e:
        conn.close()
        return jsonify({"error": str(e)}), 500


# Log attendance
@app.route('/api/attendance', methods=['POST'])
def log_attendance():
    data = request.json
    timestamp = data.get('timestamp')
    student_id = data.get('studentId')
    student_name = data.get('studentName')
    status = data.get('status')

    if not all([timestamp, student_id, student_name, status]):
        return jsonify({"error": "Missing data for attendance log"}), 400

    conn = get_db_connection()
    try:
        conn.execute(
            'INSERT INTO attendance_logs (timestamp, studentId, studentName, status) VALUES (?, ?, ?, ?)',
            (timestamp, student_id, student_name, status)
        )
        conn.commit()
        return jsonify({"message": "Attendance logged successfully"}), 201
    except sqlite3.Error as e:
        conn.close()
        return jsonify({"error": str(e)}), 500

# Get attendance logs (can add filters later)
@app.route('/api/attendance', methods=['GET'])
def get_attendance_logs():
    conn = get_db_connection()
    logs = conn.execute('SELECT * FROM attendance_logs ORDER BY timestamp DESC').fetchall()
    conn.close()
    return jsonify([dict(row) for row in logs])

# Clear all attendance logs
@app.route('/api/attendance/clear', methods=['POST'])
def clear_attendance_logs():
    conn = get_db_connection()
    try:
        conn.execute('DELETE FROM attendance_logs')
        conn.commit()
        conn.close()
        return jsonify({"message": "All attendance logs cleared successfully"}), 200
    except sqlite3.Error as e:
        conn.close()
        return jsonify({"error": str(e)}), 500

# Endpoint to serve profile pictures
@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)


if __name__ == '__main__':
    # When running directly, ensure the database is initialized
    # The init_db() call outside this block also handles it on app context init
    # No need to call it again here unless we want to force re-creation
    app.run(debug=True, port=5000) # Run on port 5000