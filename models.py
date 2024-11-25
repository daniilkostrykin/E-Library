import psycopg2.extras

def register_user(conn, name, group, email, password):
    with conn.cursor(cursor_factory=psycopg2.extras.DictCursor) as cur:
        cur.execute(
            """
            INSERT INTO users (name, group_name, email, password)
            VALUES (%s, %s, %s, %s)
            RETURNING id
            """,
            (name, group, email, password),
        )
        user_id = cur.fetchone()["id"]
        return user_id

def get_user_by_email(conn, email):
    with conn.cursor(cursor_factory=psycopg2.extras.DictCursor) as cur:
        cur.execute(
            "SELECT * FROM users WHERE email = %s",
            (email,)
        )
        user = cur.fetchone()
        return user
import psycopg2.extras

# Получение информации о студенте по ID
def get_student_by_id(conn, student_id):
    with conn.cursor(cursor_factory=psycopg2.extras.DictCursor) as cur:
        cur.execute(
            "SELECT id, name AS fullName, group_name AS group FROM users WHERE id = %s",
            (student_id,)
        )
        return cur.fetchone()

# Поиск книг по названию
def search_books(conn, query):
    with conn.cursor(cursor_factory=psycopg2.extras.DictCursor) as cur:
        cur.execute(
            "SELECT id, title FROM books WHERE LOWER(title) LIKE %s",
            (f"%{query.lower()}%",)
        )
        return cur.fetchall()

# Удаление книги из списка взятых
def return_book(conn, book_id, student_id):
    with conn.cursor() as cur:
        cur.execute(
            "DELETE FROM taken_books WHERE book_id = %s AND student_id = %s",
            (book_id, student_id)
        )
