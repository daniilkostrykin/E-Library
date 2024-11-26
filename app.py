from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
import psycopg2
from db import init_db
import db
from models import get_student_by_id, register_user, get_user_by_email, return_book, search_books
import json 

app = Flask(__name__)
CORS(app)  # Разрешает запросы с фронтенда
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
        app.logger.debug(f"User registered with ID: {user_id}")  # Логируем ID нового пользователя
        return jsonify({"success": True, "userId": user_id}), 201
    except Exception as e:
        app.logger.error(f"Error during registration: {e}")  # Логируем ошибку
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
    token = create_access_token(identity=json.dumps(identity))  # <--  Изменение здесь
    return jsonify({"success": True, "token": token}), 200


@app.route('/api/auth/user-info', methods=['GET'])
@jwt_required()
def user_info():

  try:
      current_user = get_jwt_identity()
      user_data_dict = json.loads(current_user)  # Преобразование  обратно в  словарь
      user_id = user_data_dict["id"]
      app.logger.debug(f"user_id from JWT: {user_id}")  #<---  логируем id из jwt
      with conn.cursor(cursor_factory=psycopg2.extras.DictCursor) as cur:
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
          app.logger.debug(f"User from DB: {user}") #<--- логируем результат запроса

          return jsonify({"user": user_data})

  except Exception as e: #  except  теперь  обрабатывает  все ошибки в try  блоке.
      app.logger.error(e) # логируем для отладки backend
      return jsonify({"msg": "Ошибка сервера"}), 500 #  Возвращаем  response 
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


@app.route("/api/books", methods=["GET"])
@jwt_required()
def search_books_route():
    query = request.args.get("query", "")
    try:
        books = search_books(conn, query)
        return jsonify(books), 200
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

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=3000, debug=True)
