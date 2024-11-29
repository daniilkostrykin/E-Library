#models.py
import psycopg2.extras

def register_user(conn, name, group, email, password, role):
    try:
        # Проверка на наличие email в базе
        with conn.cursor(cursor_factory=psycopg2.extras.DictCursor) as cur:
            cur.execute("SELECT id FROM users WHERE email = %s", (email,))
            existing_user = cur.fetchone()

            if existing_user:
                raise Exception("Пользователь с таким email уже существует.")

            # Вставка нового пользователя
            cur.execute(
                """
                INSERT INTO users (name, group_name, email, password, role)
                VALUES (%s, %s, %s, %s, %s)
                RETURNING id
                """,
                (name, group, email, password, role),
            )
            user_id = cur.fetchone()["id"]
            conn.commit()  # Сохраняем изменения
            return user_id
    except Exception as e:
        conn.rollback()  # Откат в случае ошибки
        raise Exception(f"Ошибка при регистрации пользователя: {e}")

def get_user_by_email(conn, email):
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.DictCursor) as cur:
            cur.execute(
                "SELECT * FROM users WHERE email = %s",
                (email,)
            )
            return cur.fetchone()
    except Exception as e:
        raise Exception(f"Ошибка при получении пользователя по email: {e}")

def get_student_by_id(conn, student_id):
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.DictCursor) as cur:
            cur.execute(
                "SELECT id, name AS fullName, group_name AS group FROM users WHERE id = %s",
                (student_id,)
            )
            return cur.fetchone()
    except Exception as e:
        raise Exception(f"Ошибка при получении информации о студенте: {e}")

def search_books(conn, query):
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.DictCursor) as cur:
            cur.execute(
                "SELECT title, author, quantity, online_version, location FROM books WHERE LOWER(title) LIKE %s",
                (f"%{query.lower()}%",)
            )
            return cur.fetchall()
    except Exception as e:
        raise Exception(f"Ошибка при поиске книг: {e}")
 

def return_book(conn, book_id, student_id):
    try:
        with conn.cursor() as cur:
            cur.execute(
                "DELETE FROM taken_books WHERE book_id = %s AND student_id = %s",
                (book_id, student_id)
            )
            conn.commit()  # Коммитим изменения
    except Exception as e:
        conn.rollback()  # Откат в случае ошибки
        raise Exception(f"Ошибка при возврате книги: {e}")
