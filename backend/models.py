import psycopg2.extras

def register_user(conn, name, group, email, password, role):
    try:

        with conn.cursor(cursor_factory=psycopg2.extras.DictCursor) as cur:
            cur.execute("SELECT id FROM users WHERE email = %s", (email,))
            existing_user = cur.fetchone()

            if existing_user:
                raise Exception("Пользователь с таким email уже существует.")

            cur.execute(
                """
                INSERT INTO users (name, group_name, email, password, role)
                VALUES (%s, %s, %s, %s, %s)
                RETURNING id
                """,
                (name, group, email, password, role),
            )
            user_id = cur.fetchone()["id"]
            conn.commit()
            return user_id
    except Exception as e:
        conn.rollback()
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
                "SELECT id, title, author, quantity, online_version, location FROM books WHERE LOWER(title) LIKE %s OR LOWER(author) LIKE %s ORDER BY id ASC",
                (f"%{query.lower()}%", f"%{query.lower()}%")
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
            conn.commit()
    except Exception as e:
        conn.rollback()
        raise Exception(f"Ошибка при возврате книги: {e}")


def take_book(conn, book_id, student_id, due_date):
    try:
        with conn.cursor() as cur:

            cur.execute(
                """
                INSERT INTO taken_books (book_id, student_id, due_date)
                VALUES (%s, %s, %s)
                """,
                (book_id, student_id, due_date),
            )

        conn.commit()
    except Exception as e:
        conn.rollback()
        if isinstance(e, psycopg2.IntegrityError) and e.pgcode == '23505':

            raise Exception("Пользователь уже взял эту книгу")

        raise Exception(f"Ошибка при взятии книги: {e}")


def get_taken_books_by_user_id(conn, user_id):
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.DictCursor) as cur:
            cur.execute(
                """
                SELECT json_build_object(
                    'name', b.title,
                    'author', b.author,
                    'due_date', tb.due_date
                ) AS book
                FROM taken_books tb
                JOIN books b ON tb.book_id = b.id
                WHERE tb.student_id = %s
                """,
                (user_id,)
            )
            return [row['book'] for row in cur.fetchall()]
    except Exception as e:
        raise Exception(f"Ошибка при получении взятых книг: {e}")


def delete_taken_books_for_student(conn, student_id):
    """Delete taken_book records associated with a student ID"""
    try:
        with conn.cursor() as cur:
            cur.execute(
                'DELETE FROM taken_books WHERE student_id = %s',
                (student_id,)
            )
        conn.commit()
    except Exception as e:
        conn.rollback()
        raise


def check_if_book_taken(conn, student_id, book_title):
    try:
        with conn.cursor() as cur:

            cur.execute('SELECT id FROM books where title = %s', (book_title,))
            book_id = cur.fetchone()

            if book_id is None:
                return False

            book_id = book_id[0]

            cur.execute(
                'SELECT EXISTS(SELECT 1 FROM taken_books WHERE student_id = %s AND book_id = %s)', (student_id, book_id,))

            return cur.fetchone()[0]
    except Exception as e:
        raise


def get_user_by_id(conn, user_id):
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.DictCursor) as cur:
            cur.execute("SELECT * FROM users WHERE id = %s", (user_id,))
            return cur.fetchone()
    except Exception as e:
        raise


def search_students(conn, query):
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.DictCursor) as cur:

            cur.execute(
                """
              SELECT user_id, name AS ФИО, group_name AS Группа 
              FROM students 
              WHERE LOWER(name) LIKE %s OR LOWER(group_name) LIKE %s
              """,
                (f"%{query.lower()}%", f"%{query.lower()}%")
            )

            students = cur.fetchall()

            return students

    except Exception as e:
        raise


def get_user_debt_count(conn, student_id):
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.DictCursor) as cur:
            cur.execute("""
                SELECT COUNT(*) AS debt_count
                FROM taken_books
                WHERE student_id = %s
            """, (student_id,))
            result = cur.fetchone()
            return result['debt_count'] or 0
    except Exception as e:
        raise Exception(
            f"Ошибка при получении задолженности пользователя: {e}")
