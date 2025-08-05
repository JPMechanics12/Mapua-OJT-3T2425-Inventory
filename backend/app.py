import mysql.connector
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
from datetime import datetime
import base64
import pytz

app = Flask(__name__)
CORS(app) # Enable CORS for all routes

# --- MySQL Database Configuration ---
DB_CONFIG = {
    'host': '127.0.0.1', 
    'port': 3306,
    'user': 'root',
    'password': 'admin', 
    'database': 'mapuainventory',
    'time_zone': '+08:00' # Set MySQL timezone to UTC+8 (Philippines)
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
        cursor = conn.cursor(dictionary=True)

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
        print("Checked/created 'students' table.")

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
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS items (
                ItemID INT AUTO_INCREMENT PRIMARY KEY,
                ItemName VARCHAR(100) NOT NULL,
                ItemCategory ENUM('RJ45', 'Serial Cable', 'Keyboard', 'Mouse', 'PowerSupply', 'HDMI', 'Projector', 'Other') NOT NULL DEFAULT 'Other',
                MaxQuantity INT NOT NULL,
                CurrentAvailable INT NOT NULL
            );
        ''')
        print("Checked/created 'items' table.")
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS borroweditems (
                BorrowID INT AUTO_INCREMENT PRIMARY KEY,
                StudentNo VARCHAR(20) NOT NULL,
                ItemID INT NOT NULL,
                Quantity INT NOT NULL DEFAULT 1,
                BorrowedAt DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
                DueAt DATETIME,
                ReturnedAt DATETIME,
                Status ENUM('Borrowed','Returned','Overdue') NOT NULL DEFAULT 'Borrowed',
                FOREIGN KEY (StudentNo) REFERENCES students(StudentNo),
                FOREIGN KEY (ItemID) REFERENCES items(ItemID)
            );
        ''')
        print("Checked/created 'borroweditems' table.")
        
        try:
            cursor.execute("ALTER TABLE borroweditems ADD COLUMN Quantity INT NOT NULL DEFAULT 1;")
            print("Added 'Quantity' column to 'borroweditems' table.")
        except mysql.connector.Error as e:
            if e.errno == 1060:
                print("Column 'Quantity' already exists.")
            else:
                raise e
        
        cursor.execute('SELECT COUNT(*) FROM students;')
        result = cursor.fetchone()
        if result and result['COUNT(*)'] == 0:
            print("Students table is empty. Inserting initial data...")
            initial_students_for_mysql = [
                ("2021102670", "Nathaniel James", "Ong", "N/A", "3498485411", "2021102670", "Enrolled", None, datetime.now()),
            ]
            sql = """
                INSERT INTO students (StudentNo, FirstName, LastName, ContactNo, rfidTag, studentId, status, profilePicturePath, CreatedAt)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s);
            """
            cursor.executemany(sql, initial_students_for_mysql)
            conn.commit()
            print("Initial student data inserted.")
        
        cursor.execute('SELECT COUNT(*) FROM items;')
        result = cursor.fetchone()
        if result and result['COUNT(*)'] == 0:
            print("Items table is empty. Inserting initial data...")
            cursor.execute("""
                INSERT INTO items (ItemName, ItemCategory, MaxQuantity, CurrentAvailable) VALUES
                ('Ethernet Cable', 'RJ45', 50, 50),
                ('Serial Cable', 'Serial Cable', 20, 20),
                ('USB Keyboard', 'Keyboard', 30, 30),
                ('USB Mouse', 'Mouse', 45, 45),
                ('PC Power Supply', 'PowerSupply', 10, 10),
                ('HDMI Cable', 'HDMI', 25, 25),
                ('Classroom Projector', 'Projector', 5, 5),
                ('Generic Item', 'Other', 100, 100);
            """)
            conn.commit()
            print("Initial item data inserted.")
        
        print("Database initialization complete.")

    except mysql.connector.Error as err:
        print(f"***** ERROR DURING DB INITIALIZATION: {err} *****")
    finally:
        if cursor: cursor.close()
        if conn: conn.close()

with app.app_context():
    init_db()

@app.route('/api/students', methods=['GET'])
def get_students():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute('SELECT * FROM students')
    db_students = cursor.fetchall()
    cursor.close()
    conn.close()

    students_for_frontend = []
    for s in db_students:
        students_for_frontend.append({
            'id': s.get('StudentNo'),
            'rfidTag': s.get('rfidTag'),
            'studentName': f"{s.get('FirstName', '')} {s.get('LastName', '')}".strip(),
            'studentId': s.get('studentId'),
            'status': s.get('status'),
            'profilePicturePath': s.get('profilePicturePath')
        })
    return jsonify(students_for_frontend)

@app.route('/api/students', methods=['POST'])
def add_student():
    data = request.json
    rfid_tag = data.get('rfidTag')
    student_name = data.get('studentName')
    student_id = data.get('studentId')
    status = data.get('status')
    profile_picture_data = data.get('profilePicture')

    name_parts = student_name.split(' ', 1)
    first_name = name_parts[0]
    last_name = name_parts[1] if len(name_parts) > 1 else ""

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute('SELECT 1 FROM students WHERE rfidTag = %s', (rfid_tag,))
    if cursor.fetchone():
        cursor.close()
        conn.close()
        return jsonify({"error": "RFID Tag already exists!"}), 409

    cursor.execute('SELECT 1 FROM students WHERE studentId = %s', (student_id,))
    if cursor.fetchone():
        cursor.close()
        conn.close()
        return jsonify({"error": "Student ID already exists!"}), 409

    profile_picture_path = None
    if profile_picture_data:
        try:
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
        cursor.execute(
            """
            INSERT INTO students (StudentNo, FirstName, LastName, ContactNo, rfidTag, studentId, status, profilePicturePath, CreatedAt)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (student_id, first_name, last_name, "N/A", rfid_tag, student_id, status, profile_picture_path, datetime.now())
        )
        conn.commit()
        
        cursor.execute('SELECT * FROM students WHERE rfidTag = %s', (rfid_tag,))
        new_student_data = cursor.fetchone()

        mapped_student = None
        if new_student_data:
            mapped_student = {
                'id': new_student_data.get('StudentNo'),
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

@app.route('/api/students/<student_no>', methods=['DELETE'])
def delete_student(student_no):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

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

@app.route('/api/attendance', methods=['GET'])
def get_attendance_logs():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute('SELECT * FROM attendance_logs ORDER BY timestamp DESC')
    logs = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify(logs)

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

@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

@app.route('/items/getall', methods=['GET'])
def get_all_items():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM items ORDER BY ItemID DESC")
    items = cursor.fetchall()
    conn.close()
    return jsonify(items)

@app.route('/borrow', methods=['POST'])
def borrow_item():
    conn = None
    cursor = None
    try:
        data = request.json
        student_id = data.get('studentId')
        item_id = data.get('itemId')
        quantity = data.get('quantity', 1)
        
        try:
            quantity = int(quantity)
            if quantity <= 0:
                return jsonify({"status": "error", "message": "Quantity must be a positive number."}), 400
        except (ValueError, TypeError):
            return jsonify({"status": "error", "message": "Invalid quantity."}), 400

        print(f"Received borrow request: studentId={student_id}, itemId={item_id}, quantity={quantity}")

        if not all([student_id, item_id]):
            print("Error: Missing studentId or itemId")
            return jsonify({"status": "error", "message": "Missing studentId or itemId"}), 400

        conn = get_db_connection()
        cursor = conn.cursor()
        conn.start_transaction()

        cursor.execute("SELECT StudentNo FROM students WHERE rfidTag = %s", (student_id,))
        student_exists = cursor.fetchone()
        if not student_exists:
            print(f"Error: Student with rfidTag '{student_id}' not found.")
            conn.rollback()
            return jsonify({"status": "error", "message": f"Student with ID '{student_id}' does not exist."}), 404

        cursor.execute("SELECT CurrentAvailable FROM items WHERE ItemID = %s", (item_id,))
        result = cursor.fetchone()
        if not result or result[0] < quantity:
            print("Error: Item not available or not enough quantity.")
            conn.rollback()
            return jsonify({"status": "error", "message": "Not enough items available."}), 400

        current_available = result[0]

        cursor.execute("UPDATE items SET CurrentAvailable = %s WHERE ItemID = %s", (current_available - quantity, item_id))

        student_no = student_exists[0]
        cursor.execute(
            "INSERT INTO borroweditems (StudentNo, ItemID, Quantity, DueAt, Status) VALUES (%s, %s, %s, NOW() + INTERVAL 7 DAY, 'Borrowed')",
            (student_no, item_id, quantity)
        )

        conn.commit()
        print("Borrow request successful.")
        return jsonify({"status": "success", "message": f"Successfully borrowed {quantity} item(s)."}), 200

    except Exception as e:
        if conn:
            conn.rollback()
        print(f"*** An error occurred in the borrow endpoint: {e} ***")
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

@app.route('/return', methods=['POST'])
def return_item():
    conn = get_db_connection()
    cursor = conn.cursor()
    data = request.json
    borrow_id = data.get('borrowId')
    quantity = data.get('quantity', 1)

    try:
        quantity = int(quantity)
        if quantity <= 0:
            return jsonify({"status": "error", "message": "Quantity must be a positive number."}), 400
    except (ValueError, TypeError):
        return jsonify({"status": "error", "message": "Invalid quantity."}), 400

    if not borrow_id:
        return jsonify({"status": "error", "message": "Missing borrowId"}), 400

    try:
        conn.start_transaction()

        cursor.execute("SELECT ItemID, Quantity FROM borroweditems WHERE BorrowID = %s AND Status = 'Borrowed'", (borrow_id,))
        result = cursor.fetchone()
        if not result:
            conn.rollback()
            return jsonify({"status": "error", "message": "Borrowed item not found or already returned"}), 400

        item_id = result[0]
        borrowed_quantity = result[1]

        if quantity > borrowed_quantity:
            conn.rollback()
            return jsonify({"status": "error", "message": f"Cannot return more than {borrowed_quantity} item(s)."}), 400

        if quantity == borrowed_quantity:
            cursor.execute("UPDATE borroweditems SET ReturnedAt = NOW(), Status = 'Returned' WHERE BorrowID = %s", (borrow_id,))
        else:
            cursor.execute("UPDATE borroweditems SET Quantity = Quantity - %s WHERE BorrowID = %s", (quantity, borrow_id,))

        cursor.execute("UPDATE items SET CurrentAvailable = CurrentAvailable + %s WHERE ItemID = %s", (quantity, item_id,))

        conn.commit()
        return jsonify({"status": "success", "message": f"Successfully returned {quantity} item(s)."}), 200

    except Exception as e:
        conn.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        conn.close()

@app.route('/history/<rfid_tag>', methods=['GET'])
def get_student_history(rfid_tag):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT StudentNo FROM students WHERE rfidTag = %s", (rfid_tag,))
        student_no_result = cursor.fetchone()
        
        if not student_no_result:
            return jsonify({"status": "error", "message": "Student not found."}), 404
        
        student_no = student_no_result['StudentNo']
        
        query = """
        SELECT
            b.BorrowID,
            b.BorrowedAt,
            b.ReturnedAt,
            b.Quantity,
            b.Status AS BorrowStatus,
            i.ItemName,
            i.ItemCategory
        FROM
            borroweditems b
        JOIN
            items i ON b.ItemID = i.ItemID
        WHERE
            b.StudentNo = %s
        ORDER BY
            b.BorrowedAt DESC;
        """
        cursor.execute(query, (student_no,))
        history = cursor.fetchall()

        for record in history:
            ph_timezone = pytz.timezone('Asia/Manila')
            if record['BorrowedAt']:
                record['BorrowedAt'] = ph_timezone.localize(record['BorrowedAt']).strftime('%B %d, %Y, %I:%M:%S %p')
            if record['ReturnedAt']:
                record['ReturnedAt'] = ph_timezone.localize(record['ReturnedAt']).strftime('%B %d, %Y, %I:%M:%S %p')

        return jsonify(history)

    except Exception as e:
        print(f"Error in get_student_history: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        conn.close()

@app.route('/borrowed-items/<rfid_tag>', methods=['GET'])
def get_borrowed_items(rfid_tag):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT StudentNo FROM students WHERE rfidTag = %s", (rfid_tag,))
        student_no_result = cursor.fetchone()
        
        if not student_no_result:
            return jsonify({"status": "error", "message": "Student not found."}), 404
        
        student_no = student_no_result['StudentNo']

        query = """
        SELECT
            b.BorrowID,
            b.Quantity,
            b.BorrowedAt,
            i.ItemName,
            i.ItemID
        FROM
            borroweditems b
        JOIN
            items i ON b.ItemID = i.ItemID
        WHERE
            b.StudentNo = %s AND b.Status = 'Borrowed' AND b.Quantity > 0
        ORDER BY
            b.BorrowedAt DESC;
        """
        cursor.execute(query, (student_no,))
        borrowed_items = cursor.fetchall()
        
        for item in borrowed_items:
            ph_timezone = pytz.timezone('Asia/Manila')
            if item['BorrowedAt']:
                item['BorrowedAt'] = ph_timezone.localize(item['BorrowedAt']).strftime('%B %d, %Y, %I:%M:%S %p')

        return jsonify({"status": "success", "items": borrowed_items})

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        conn.close()

if __name__ == '__main__':
    app.run(debug=True, port=5000)