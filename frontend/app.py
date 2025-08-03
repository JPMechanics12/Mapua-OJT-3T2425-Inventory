import mysql.connector
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
from datetime import datetime
import base64

app = Flask(__name__)
CORS(app) # Enable CORS for all routes

# --- MySQL Database Configuration ---
DB_CONFIG = {
    'host': '127.0.0.1', # Generally safe for local MySQL server
    'port': 3306,        # Default MySQL port
    'user': 'root',      # <--- USE YOUR MYSQL USER (e.g., 'root')
    'password': 'admin', # <--- REPLACE THIS WITH YOUR ACTUAL MYSQL ROOT PASSWORD
    'database': 'mapuainventory' # <--- CONFIRMED DATABASE NAME
}

UPLOAD_FOLDER = 'uploads' # Folder to store profile pictures
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Ensure the upload folder exists
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

def get_db_connection():
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        return conn
    except mysql.connector.Error as err:
        print(f"Error connecting to MySQL: {err}")
        raise err

def init_db():
    conn = None
    cursor = None
    try:
        print("Attempting to get DB connection for init_db...")
        conn = get_db_connection()
        print("DB connection successful.")
        cursor = conn.cursor(dictionary=True) # Use dictionary=True for dict-like rows

        # We keep this CREATE TABLE here. Since the table now exists with the right columns
        # it will be skipped by IF NOT EXISTS. If you ever start from scratch, it will create it.
        # Note: This is simplified from the exact MySQL table structure to broadly match Flask's needs.
        # The crucial part is that the INSERT below matches the *actual* DB structure.
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS students (
                StudentNo CHAR(10) PRIMARY KEY NOT NULL,
                rfidTag VARCHAR(255) UNIQUE,
                studentId VARCHAR(255) UNIQUE,
                FirstName VARCHAR(50) NOT NULL,
                LastName VARCHAR(50) NOT NULL,
                ContactNo VARCHAR(30),
                status VARCHAR(255) NOT NULL DEFAULT 'Unknown',
                profilePicturePath VARCHAR(255),
                CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL
            );
        ''')
        print("Checked/created 'students' table (or confirmed existence).")

        # Create attendance_logs table (MySQL specific syntax)
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS attendance_logs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                timestamp VARCHAR(255) NOT NULL,
                studentId VARCHAR(255) NOT NULL,
                studentName VARCHAR(255) NOT NULL,
                status VARCHAR(255) NOT NULL
            );
        ''')
        print("Checked/created 'attendance_logs' table.")


        # Insert initial data if 'students' table is empty (in MySQL)
        cursor.execute('SELECT COUNT(*) FROM students;')
        result = cursor.fetchone()
        print(f"Result of COUNT(*): {result}")

        if result and result['COUNT(*)'] == 0:
            print("Students table is empty. Proceeding to insert initial data...")
            # Data must map to the EXACT column names in your ALTERED MySQL table
            # (StudentNo, FirstName, LastName, ContactNo, rfidTag, studentId, status, profilePicturePath, CreatedAt)
            initial_students_for_mysql = [
                ("2021102670", "Nathaniel James", "Ong", "N/A", "3498485411", "2021102670", "Enrolled", None, datetime.now()),
                ("2022-67890", "Maria", "Clara", "N/A", "9876543210", "2022-67890", "Alumni", None, datetime.now()),
                ("2024-54321", "Crisostomo", "Ibarra", "N/A", "1122334455", "2024-54321", "Enrolled", None, datetime.now())
            ]
            sql = """
                INSERT INTO students (StudentNo, FirstName, LastName, ContactNo, rfidTag, studentId, status, profilePicturePath, CreatedAt)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s);
            """
            cursor.executemany(sql, initial_students_for_mysql)
            print("Executing commit for initial student data...")
            conn.commit()
            print("Initial student data inserted and committed.")
        else:
            print(f"Students table already contains data ({result['COUNT(*)']}). No initial data inserted.")

    except mysql.connector.Error as err:
        print(f"***** ERROR DURING DB INITIALIZATION: {err} *****")
    finally:
        if cursor:
            cursor.close()
            print("Cursor closed.")
        if conn:
            conn.close()
            print("Connection closed.")

# Initialize database on app startup
with app.app_context():
    init_db()


# --- API Endpoints ---

# Get all students
@app.route('/api/students', methods=['GET'])
def get_students():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute('SELECT * FROM students')
    db_students = cursor.fetchall() # Get students with DB column names
    cursor.close()
    conn.close()

    students_for_frontend = []
    for s in db_students:
        students_for_frontend.append({
            'id': s.get('StudentNo'), # Using StudentNo as the 'id' for the frontend
            'rfidTag': s.get('rfidTag'),
            'studentName': f"{s.get('FirstName', '')} {s.get('LastName', '')}".strip(), # Combine names
            'studentId': s.get('studentId'),
            'status': s.get('status'),
            'profilePicturePath': s.get('profilePicturePath')
        })
    return jsonify(students_for_frontend)

# Add a new student
@app.route('/api/students', methods=['POST'])
def add_student():
    data = request.json
    rfid_tag = data.get('rfidTag')
    student_name = data.get('studentName')
    student_id = data.get('studentId')
    status = data.get('status')
    profile_picture_data = data.get('profilePicture')

    # Parse student_name into FirstName and LastName
    name_parts = student_name.split(' ', 1)
    first_name = name_parts[0]
    last_name = name_parts[1] if len(name_parts) > 1 else ""

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    # Check for duplicate RFID tag (on the 'rfidTag' column)
    cursor.execute('SELECT 1 FROM students WHERE rfidTag = %s', (rfid_tag,))
    if cursor.fetchone():
        cursor.close()
        conn.close()
        return jsonify({"error": "RFID Tag already exists!"}), 409

    # Check for duplicate Student ID (on the 'studentId' column)
    cursor.execute('SELECT 1 FROM students WHERE studentId = %s', (student_id,))
    if cursor.fetchone():
        cursor.close()
        conn.close()
        return jsonify({"error": "Student ID already exists!"}), 409

    profile_picture_path = None
    if profile_picture_data:
        try:
            # Decode Base64 string
            header, encoded = profile_picture_data.split(",", 1)
            file_extension = header.split(';')[0].split('/')[1]
            image_data = base64.b64decode(encoded)

            filename = f"{student_id}_{datetime.now().strftime('%Y%m%d%H%M%S')}.{file_extension}"
            profile_picture_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)

            with open(profile_picture_path, 'wb') as f:
                f.write(image_data)
            print(f"Profile picture saved: {profile_picture_path}")
        except Exception as e:
            print(f"Error saving profile picture: {e}")
            profile_picture_path = None

    try:
        # Insert into the actual database columns.
        # Using student_id for StudentNo as it's typically the main identifier for the student itself.
        cursor.execute(
            """
            INSERT INTO students (StudentNo, FirstName, LastName, ContactNo, rfidTag, studentId, status, profilePicturePath, CreatedAt)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (student_id, first_name, last_name, "N/A", rfid_tag, student_id, status, profile_picture_path, datetime.now())
        )
        conn.commit()
        
        # Fetch the newly added student using rfidTag as a unique identifier for the response
        cursor.execute('SELECT * FROM students WHERE rfidTag = %s', (rfid_tag,))
        new_student_data = cursor.fetchone()

        # Map database column names to frontend expected names for the response
        mapped_student = None
        if new_student_data:
            mapped_student = {
                'id': new_student_data.get('StudentNo'), # Using StudentNo as id for consistency with frontend
                'rfidTag': new_student_data.get('rfidTag'),
                'studentName': f"{new_student_data.get('FirstName', '')} {new_student_data.get('LastName', '')}".strip(),
                'studentId': new_student_data.get('studentId'),
                'status': new_student_data.get('status'),
                'profilePicturePath': new_student_data.get('profilePicturePath')
            }

        cursor.close()
        conn.close()
        return jsonify(mapped_student), 201 if mapped_student else 500
    except mysql.connector.Error as e:
        print(f"Error adding student: {e}")
        cursor.close()
        conn.close()
        return jsonify({"error": str(e)}), 500

# Delete a student by StudentNo (Primary Key)
@app.route('/api/students/<student_no>', methods=['DELETE'])
def delete_student(student_no):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    # Check and delete profile picture first
    cursor.execute('SELECT profilePicturePath FROM students WHERE StudentNo = %s', (student_no,))
    student = cursor.fetchone()
    if student and student['profilePicturePath']:
        try:
            os.remove(student['profilePicturePath'])
            print(f"Deleted profile picture file: {student['profilePicturePath']}")
        except OSError as e:
            print(f"Error deleting profile picture file {student['profilePicturePath']}: {e}")

    cursor.execute('DELETE FROM students WHERE StudentNo = %s', (student_no,))
    conn.commit()
    rows_affected = cursor.rowcount
    cursor.close()
    conn.close()

    if rows_affected > 0:
        return jsonify({"message": "Student deleted successfully"}), 200
    else:
        return jsonify({"error": "Student not found"}), 404

# Clear all students
@app.route('/api/students/clear', methods=['POST'])
def clear_students():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
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

        cursor.execute('DELETE FROM students')
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({"message": "All students cleared"}), 200
    except mysql.connector.Error as e:
        cursor.close()
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
    cursor = conn.cursor()
    try:
        # Assuming attendance_logs table correctly uses studentId and studentName from Flask's side
        cursor.execute(
            'INSERT INTO attendance_logs (timestamp, studentId, studentName, status) VALUES (%s, %s, %s, %s)',
            (timestamp, student_id, student_name, status)
        )
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({"message": "Attendance logged successfully"}), 201
    except mysql.connector.Error as e:
        cursor.close()
        conn.close()
        return jsonify({"error": str(e)}), 500

# Get attendance logs
@app.route('/api/attendance', methods=['GET'])
def get_attendance_logs():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute('SELECT * FROM attendance_logs ORDER BY timestamp DESC')
    logs = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify(logs)

# Clear all attendance logs
@app.route('/api/attendance/clear', methods=['POST'])
def clear_attendance_logs():
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute('DELETE FROM attendance_logs')
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({"message": "All attendance logs cleared successfully"}), 200
    except mysql.connector.Error as e:
        cursor.close()
        conn.close()
        return jsonify({"error": str(e)}), 500

# Endpoint to serve profile pictures
@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)


if __name__ == '__main__':
    app.run(debug=True, port=5000)