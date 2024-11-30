#app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
import psycopg2
from psycopg2.extras import DictCursor
from db import init_db
from models import (
    get_student_by_id, register_user, get_user_by_email, 
    return_book, search_books, take_book, get_taken_books_by_user_id,
    get_user_by_id, search_students, delete_taken_books_for_student, check_if_book_taken, 
)
import json 

app = Flask(__name__)
CORS(app)
bcrypt = Bcrypt(app)

# Настройка JWT
app.config["JWT_SECRET_KEY"] = "my-secret-key"  
jwt = JWTManager(app)

# Подключение к базе данных
conn = init_db()

@app.route("/", methods=["GET"])
def home():
    return "API is running. Use /api/auth/register or /api/auth/login endpoints."

# Маршруты для аутентификации находятся под префиксом /api/auth/

@app.route("/api/auth/register", methods=["POST"])
def register():
    data = request.get_json()
    app.logger.debug(f"Received data: {data}")  # Логируем полученные данные

    name = data.get("name")
    group = data.get("group")
    email = data.get("email")
    password = data.get("password")

    if not (name and group and email and password):
        return jsonify({"success": False, "message": "Все поля обязательны"}), 400

    role = "user"
    if "librarian" in name.lower():
        role = "librarian"
    if "admin" in name.lower():
        role = "admin"
    app.logger.debug(f"Assigned role: {role}")  # Логируем присвоенную роль

    hashed_password = bcrypt.generate_password_hash(password).decode("utf-8")
    app.logger.debug("Password hashed successfully")  # Подтверждаем хэширование

    try:
        user_id = register_user(conn, name, group, email, hashed_password, role)
        app.logger.debug(f"User registered with ID: {user_id}")
        
        # Если роль "user", добавляем в таблицу students
        if role == "user":
            with conn.cursor() as cur:
                cur.execute(
                    "INSERT INTO students (user_id, ФИО, группа) VALUES (%s, %s, %s)",
                    (user_id, name, group)
                )
                conn.commit()
                app.logger.debug(f"Student entry created for user ID: {user_id}")
        
        return jsonify({"success": True, "userId": user_id}), 201
    except Exception as e:
        app.logger.error(f"Error during registration: {e}")
        return jsonify({"success": False, "message": str(e)}), 500

@app.route("/api/students/<int:student_id>", methods=["GET"])
@jwt_required()
def get_student(student_id):
    try:
        student = get_student_by_id(conn, student_id)
        if not student:
            return jsonify({"success": False, "message": "Студент не найден"}), 404
        return jsonify(student), 200
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@app.route("/api/auth/login", methods=["POST"])
def login():
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")

    user = get_user_by_email(conn, email)
    if not user or not bcrypt.check_password_hash(user["password"], password):
        return jsonify({"success": False, "message": "Неверный email или пароль"}), 401

    # Генерация JWT токена
    identity = {"id": user["id"], "role": user.get("role", "user")}
    token = create_access_token(identity=json.dumps(identity))
    return jsonify({"success": True, "token": token}), 200

@app.route('/api/auth/user-info', methods=['GET'])
@jwt_required()
def user_info():
    try:
        current_user = get_jwt_identity()
        user_data_dict = json.loads(current_user)
        user_id = user_data_dict["id"]
        
        with conn.cursor(cursor_factory=DictCursor) as cur:
            cur.execute("SELECT id, role, name, group_name FROM users WHERE id = %s", (user_id,))
            user = cur.fetchone()
            if user is None:
                return jsonify({"msg": "Пользователь не найден"}), 404
            
            user_data = {
                "id": user["id"],
                "role": user["role"],
                "name": user["name"],
                "group": user["group_name"]
            }
            return jsonify({"user": user_data})
    except Exception as e:
        app.logger.error(e)
        return jsonify({"msg": "Ошибка сервера"}), 500

@app.route("/api/books", methods=["GET"])
@jwt_required()
def search_books_route():
    query = request.args.get("query", "")
    try:
        books = search_books(conn, query)
        return jsonify(books), 200
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@app.route("/api/students", methods=["GET"])
@jwt_required()
def search_students():
    query = request.args.get("query", "")
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.DictCursor) as cur:
            cur.execute(
                """
                SELECT user_id, name AS ФИО, group_name AS Группа 
                FROM students WHERE
                 (LOWER(name) LIKE %s OR LOWER(group_name) LIKE %s)
                """,
                (f"%{query.lower()}%", f"%{query.lower()}%")
            )

            students = cur.fetchall()
            return jsonify(students), 200
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@app.route("/api/taken-books", methods=["DELETE"])
@jwt_required()
def return_book_route():
    data = request.get_json()
    book_id = data.get("bookId")
    student_id = data.get("studentId")

    if not (book_id and student_id):
        return jsonify({"success": False, "message": "bookId и studentId обязательны"}), 400

    try:
        return_book(conn, book_id, student_id)
        return jsonify({"success": True, "message": "Книга успешно возвращена"}), 200
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@app.before_request
def handle_options_request():
    if request.method == "OPTIONS":
        response = app.response_class()
        response.headers["Access-Control-Allow-Origin"] = "http://127.0.0.1:5500"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
        response.headers["Access-Control-Allow-Credentials"] = "true"
        return response, 200

@app.route("/api/taken_books", methods=["POST"])
@jwt_required()
def take_book_route():
    data = request.get_json()
    student_id = data.get("studentId")
    book_id = data.get("bookId")  # Use bookId instead of bookTitle for consistency
    due_date = data.get("dueDate")

    if not all([student_id, book_id, due_date]):
        return jsonify({"success": False, "message": "Отсутствуют необходимые данные"}), 400

    try:
        take_book(conn, book_id, student_id, due_date)
        return jsonify({"success": True, "message": "Книга успешно взята"}), 201
    except Exception as e:
        app.logger.error(f"Ошибка при взятии книги: {e}")
        return jsonify({"success": False, "message": str(e)}), 500

@app.route("/api/taken_books/<int:user_id>", methods=["GET"])
@jwt_required()
def get_taken_books_route(user_id):
    try:
        books = get_taken_books_by_user_id(conn, user_id)
        return jsonify({"books": books}), 200
    except Exception as e:
        app.logger.error(f"Error getting taken books: {str(e)}")
        return jsonify({"success": False, "message": str(e)}), 500


@app.route("/api/taken-books/student/<int:student_id>", methods=["GET"])
@jwt_required()
def get_taken_books_by_student_route(student_id):
    try:
        books = get_taken_books_by_user_id(conn, student_id)
        return jsonify(books), 200  # Return books without JSON wrapper
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


@app.route('/api/taken_books/<int:student_id>', methods=['PUT'])
@jwt_required()
def update_taken_books_route(student_id):
    data = request.get_json()
    books = data.get('books')
    try:
        with conn.cursor() as cur:
            cur.execute('DELETE FROM taken_books WHERE student_id = %s', (student_id,))

            if books:  # Check if books is not empty
                for book in books:
                    cur.execute(
                        'INSERT INTO taken_books (book_id, student_id, due_date) VALUES (%s, %s, %s)',
                        (book.get('id'), student_id, book.get('dueDate'))
                    )

        conn.commit()
        return jsonify({'success': True, 'message': 'Данные о книгах обновлены'}), 200
    except Exception as e:
        conn.rollback()
        print(f"Error updating taken books: {str(e)}")
        return jsonify({'success': False, 'message': 'Ошибка обновления данных о книгах'}), 500





@app.route("/api/taken-books/<int:student_id>", methods=["DELETE"])
@jwt_required()
def delete_taken_books_route(student_id):
    try:
        delete_taken_books_for_student(conn, student_id)
        return jsonify({"success": True, "message": "Данные о книгах удалены"}), 200
    except Exception as e:
        print(f"Error deleting taken books for student {student_id}: {str(e)}")
        return jsonify({"success": False, "message": "Ошибка удаления данных о книгах"}), 500

@app.route('/api/check_if_book_taken', methods=['POST'])
@jwt_required()
def check_if_book_taken_route():
    data = request.get_json()
    student_id = data.get('student_id')
    book_title = data.get('book_title')

    if not student_id or not book_title:
        return jsonify({'success': False, 'message': 'Не указаны student_id или book_title'}), 400

    try:
        book_taken = check_if_book_taken(conn, student_id, book_title)
        return jsonify({'success': book_taken}), 200
    except Exception as e:
        print(f"Ошибка при проверке взятия книги: {e}")
        return jsonify({'success': False, 'message': 'Ошибка при проверке взятия книги'}), 500

@app.route("/api/books/<int:book_id>", methods=["PUT"])
@jwt_required()
def update_book_route(book_id):
    data = request.get_json()  # Получаем данные из тела запроса
    title = data.get("title")
    author = data.get("author")
    quantity = data.get("quantity")
    online_version = data.get("online_version")
    location = data.get("location")

    # Логируем полученные данные
    app.logger.debug(f"Получены данные для обновления книги: {data}")

    if not all([title, author, quantity, online_version, location]):
        app.logger.error("Не все обязательные поля были переданы")
        return jsonify({"success": False, "message": "Все поля обязательны"}), 400

    try:
        # Логируем начало запроса на обновление
        app.logger.debug(f"Обновляем книгу с ID: {book_id}")

        with conn.cursor() as cur:
            cur.execute(
                """
                UPDATE books
                SET title = %s, author = %s, quantity = %s, online_version = %s, location = %s
                WHERE id = %s
                """,
                (title, author, quantity, online_version, location, book_id)
            )
        conn.commit()
        
        # Логируем успешное обновление
        app.logger.debug(f"Данные о книге с ID {book_id} успешно обновлены")

        return jsonify({"success": True, "message": "Данные о книге успешно обновлены"}), 200
    except Exception as e:
        # Логируем ошибку на сервере
        app.logger.error(f"Ошибка при обновлении книги с ID {book_id}: {str(e)}")
        conn.rollback()
        return jsonify({"success": False, "message": str(e)}), 500





















if __name__ == "__main__":
    app.run(host="0.0.0.0", port=3000, debug=True)
