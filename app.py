from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from db import init_db
from models import register_user, get_user_by_email
import json 

app = Flask(__name__)
CORS(app)  # Разрешает запросы с фронтенда
bcrypt = Bcrypt(app)

# Настройка JWT
app.config["JWT_SECRET_KEY"] = "your-secret-key"  # Замените на ваш секретный ключ
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
    name = data.get("name")
    group = data.get("group")
    email = data.get("email")
    password = data.get("password")

    if not (name and group and email and password):
        return jsonify({"success": False, "message": "Все поля обязательны"}), 400

    # Хэшируем пароль
    hashed_password = bcrypt.generate_password_hash(password).decode("utf-8")

    try:
        user_id = register_user(conn, name, group, email, hashed_password)
        return jsonify({"success": True, "userId": user_id}), 201
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
    token = create_access_token(identity=json.dumps(identity))  # <--  Изменение здесь
    return jsonify({"success": True, "token": token}), 200

@app.route("/api/auth/user-info", methods=["GET"])
@jwt_required()
def user_info():
    current_user_json = get_jwt_identity()  # <-- Присваиваем результат get_jwt_identity()
    current_user = json.loads(current_user_json) # Обратно в словарь
    return jsonify({"success": True, "user": current_user}), 200

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=3000, debug=True)
