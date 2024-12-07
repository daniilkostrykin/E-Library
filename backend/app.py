#app.py
from datetime import timedelta
from bs4 import BeautifulSoup
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
import psycopg2
from psycopg2.extras import DictCursor
import requests
from db import init_db
from models import (
    get_student_by_id, get_user_debt_count, register_user, get_user_by_email, 
    return_book, search_books, take_book, get_taken_books_by_user_id,
    get_user_by_id, search_students, delete_taken_books_for_student, check_if_book_taken, 
)
import json 

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "http://127.0.0.1:5500", "supports_credentials": True}})
# ... rest of your app.py
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
                    "INSERT INTO students (user_id, name, group_name) VALUES (%s, %s, %s)",
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
    token = create_access_token(identity=json.dumps(identity), expires_delta=timedelta(days=1))
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

@app.route("/api/taken_books/<int:book_id>/<int:student_id>", methods=["DELETE"])
@jwt_required()
def return_book_route(book_id, student_id):
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


@app.route("/api/taken_books/student/<int:student_id>", methods=["GET"])
@jwt_required()
def get_taken_books_by_student_route(student_id):
    try:
        books = get_taken_books_by_user_id(conn, student_id)
        return jsonify(books), 200
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


@app.route('/api/taken_books/<int:student_id>', methods=['POST'])
@jwt_required()
def update_taken_books_route(student_id):
    data = request.get_json()
    books = data.get('books')
    try:
        with conn.cursor() as cur:

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

@app.route("/api/books/<int:book_id>", methods=["POST"])
@jwt_required()
def decrease_book_quantity(book_id):
    # Получаем данные из тела запроса
    data = request.get_json()

    # Проверяем, что данные пришли как массив и их длина правильная
    if isinstance(data, list) and len(data) >= 3:
        # Извлекаем информацию из массива
        book_id_from_request = data[0]  # ID книги
        title = data[1]  # Название книги
        author = data[2]  # Автор книги

        # Получаем текущую информацию о книге по ID
        try:
            with conn.cursor() as cur:
                cur.execute("SELECT quantity FROM books WHERE id = %s", (book_id,))
                result = cur.fetchone()

            if result is None:
                return jsonify({"success": False, "message": "Книга не найдена"}), 404

            current_quantity = result[0]

            # Проверяем, что количество для уменьшения не меньше 1
            if current_quantity <= 0:
                return jsonify({"success": False, "message": "Недостаточно экземпляров для уменьшения"}), 400

            # Уменьшаем количество книг на 1
            new_quantity = current_quantity - 1

            with conn.cursor() as cur:
                cur.execute(
                    "UPDATE books SET quantity = %s WHERE id = %s",
                    (new_quantity, book_id)
                )
            conn.commit()

            return jsonify({"success": True, "message": f"Количество книги '{title}' (ID: {book_id}) уменьшено на 1"}), 200

        except Exception as e:
            app.logger.error(f"Ошибка при уменьшении количества книги с ID {book_id}: {str(e)}")
            return jsonify({"success": False, "message": str(e)}), 500

    else:
        return jsonify({"success": False, "message": "Ожидается массив с данными о книге"}), 400


@app.route("/api/taken_books", methods=["GET"])
@jwt_required()
def get_all_taken_books_route():
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM taken_books")
            taken_books = cur.fetchall()

        return jsonify(taken_books), 200
    except Exception as e:
        app.logger.error(f"Ошибка при получении всех взятых книг: {e}")
        return jsonify({"success": False, "message": str(e)}), 500

@app.route("/api/user/<int:student_id>/debt", methods=["GET"])
@jwt_required()
def get_user_debt_count_route(student_id):
    try:
        debt_count = get_user_debt_count(conn, student_id)
        return jsonify({"debt_count": debt_count}), 200
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500



@app.route("/api/taken_books/return", methods=["POST"])
def return_book():
    # Получаем данные из запроса
    data = request.get_json()
    if not data:
        return jsonify({"message": "Некорректные данные запроса."}), 400
    book_name = data.get('bookName')
    student_id = data.get('studentId')

    if not book_name or not student_id:
        return jsonify({"message": "Название книги и studentId обязательны."}), 400

    try:
        # Получаем id книги по её названию
        with conn.cursor() as cursor:
            cursor.execute("SELECT id FROM books WHERE title = %s", (book_name,))
            book = cursor.fetchone()

            if not book:
                return jsonify({"message": "Книга не найдена."}), 404

            book_id = book[0]

            # Проверяем, взята ли книга студентом
            cursor.execute(
                "SELECT * FROM taken_books WHERE book_id = %s AND student_id = %s", 
                (book_id, student_id)
            )
            taken_book = cursor.fetchone()

            if not taken_book:
                return jsonify({"message": "Книга не была взята данным студентом."}), 404

            # Если книга взята, удаляем запись из таблицы taken_books
            cursor.execute(
                "DELETE FROM taken_books WHERE book_id = %s AND student_id = %s", 
                (book_id, student_id)
            )
             #  Увеличиваем количество  книг
            cursor.execute("UPDATE books SET quantity = quantity + 1 WHERE title = %s", (book_name,))

            conn.commit()

        return jsonify({"message": "Книга успешно возвращена.", "success": True})

    except Exception as e:
        conn.rollback()  # Откат в случае ошибки
        print("Ошибка при возврате книги:", e)
        return jsonify({"message": "Ошибка сервера.", "success": False, "error": str(e)}), 500  # Более подробная ошибка

@app.route('/api/books/<int:book_id>', methods=['DELETE'])
def delete_book(book_id):
    try:
        # Подключаемся к базе данных
        with conn.cursor() as cur:

        # Проверяем, существует ли книга с данным ID
            cur.execute("SELECT * FROM books WHERE id = %s", (book_id,))
            book = cur.fetchone()

            if book is None:
                return jsonify({"error": "Книга не найдена"}), 404

            # Удаляем книгу
            cur.execute("DELETE FROM books WHERE id = %s", (book_id,))
            conn.commit()

            cur.close()
        
            return jsonify({"message": f"Книга с ID {book_id} успешно удалена", "success": True}), 200  # Добавил success: True для проверки на фронтенде
    except Exception as e:
            conn.rollback()
            return jsonify({"error": "Ошибка при удалении книги", "details": str(e), "success": False}), 500  # Добавил success: False и details


@app.route("/api/books/all", methods=["GET"])
@jwt_required()
def get_all_books():
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.DictCursor) as cur:
            cur.execute("SELECT * FROM books")
            books = cur.fetchall()
        return jsonify(books), 200
    except Exception as e:
        app.logger.error(f"Ошибка при получении всех книг: {e}")
        return jsonify({"success": False, "message": str(e)}), 500



@app.route('/api/books/update', methods=['POST'])
def update_books():
    books_to_update = request.json
    
    if not isinstance(books_to_update, list) or len(books_to_update) == 0:
        return jsonify({"error": "Передан некорректный массив книг"}), 400

    try:
        cursor = conn.cursor()

        for book in books_to_update:
            try:
                book_id = book.get('id')
                title = book.get('title')
                author = book.get('author')
                quantity = book.get('quantity')
                online_version = book.get('online_version')
                location = book.get('location') or "Неизвестно"  # Значение по умолчанию, если location пустое

                if not all([book_id, title, author, quantity is not None]):
                    print("Некорректные данные книги:", book)
                    return jsonify({"error": "Некорректные данные книги", "book": book}), 400
                cursor.execute(
                    """
                    UPDATE books
                    SET title = %s, author = %s, quantity = %s, online_version = %s, location = %s
                    WHERE id = %s
                    """,
                    (title, author, quantity, online_version, location, book_id),
                )
            except Exception as e:
                print(f"Ошибка при обработке книги {book}: {e}")
                conn.rollback()  # Откат изменений, если ошибка внутри цикла
                return jsonify({"error": f"Ошибка при обработке книги {book}", "details": str(e)}), 500

        conn.commit() # Фиксируем транзакцию после успешного обновления всех книг!
        return jsonify({"success": True}), 200 # <--- ВАЖНО: вернуть ответ здесь

    except Exception as e:
        conn.rollback()
        app.logger.error(f"Ошибка при обновлении книг: {e}")
        return jsonify({"success": False, "message": str(e)}), 500

    finally:
        if cursor:
            cursor.close()    



# Эндпоинт для добавления книги
@app.route('/api/books', methods=['POST'])
@jwt_required()
def add_book():
    try:
        data = request.json
        print("Полученные данные:", data)
        # Проверка обязательных полей
        title = data.get("Название")
        author = data.get("Автор")
        quantity = data.get("Количество")
        online_version = data.get("Электронная версия")
        location = data.get("Местоположение")

        if not title or not author or quantity is None:
            return jsonify({"message": "Обязательные поля: Название, Автор, Количество"}), 400

        # Проверка корректности данных
        try:
            quantity = int(quantity)
            if quantity < 0:
                return jsonify({"message": "Количество должно быть неотрицательным числом"}), 400
        except ValueError:
            return jsonify({"message": "Количество должно быть числом"}), 400

        # Подключение к базе данных
        cur = conn.cursor()

        # Вставка данных в таблицу books
        cur.execute("""
            INSERT INTO books (title, author, quantity, online_version, location)
            VALUES (%s, %s, %s, %s, %s)
        """, (title, author, quantity, online_version, location))

        conn.commit()
        cur.close()

        return jsonify({"message": "Книга успешно добавлена!"}), 201

    except Exception as e:
        return jsonify({"message": "Ошибка при добавлении книги", "error": str(e)}), 500




def find_first_read_link(search_url):
    """
    Ищет первую ссылку на чтение книги в результатах поиска на сайте Aldebaran.
    """
    try:
        response = requests.get(search_url)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, "html.parser")

        # Ищем ссылки, которые ведут на страницы с чтением книг
        read_links = [
            "https://aldebaran.ru" + link.get("href")
            for link in soup.select('a[href*="/read/"]')  # Ищем ссылки с "/read/"
        ]

        # Возвращаем первую ссылку на чтение, если она есть
        if read_links:
            print(f"Найдена ссылка на чтение: {read_links[0]}")
            return read_links[0]
        else:
            print("Ссылки на чтение не найдены")
            return None
    except Exception as e:
        print(f"Ошибка при поиске ссылки на чтение: {e}")
        return None

@app.route('/api/search_first_read_link', methods=['GET'])
def search_first_read_link():
    book_name = request.args.get('book_name')
    if not book_name:
        return jsonify({"error": "Название книги обязательно"}), 400

    search_url = f"https://aldebaran.ru/pages/rmd_search/?q={book_name}"
    print(f"Ищем книгу по URL: {search_url}")  # Логируем запрос

    # Поиск первой ссылки на чтение
    first_read_link = find_first_read_link(search_url)
    if not first_read_link:
        print(f"Ссылка на чтение не найдена для запроса: {book_name}")  # Логируем ошибку
        return jsonify({"error": "Ссылка на книгу не найдена"}), 404

    print(f"Первая ссылка на чтение: {first_read_link}")  # Логируем успех
    return jsonify({"read_link": first_read_link})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=3000, debug=True)
