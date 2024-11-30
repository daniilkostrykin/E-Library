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
            # Передаем два параметра: для title и для author
            cur.execute(
                "SELECT id, title, author, quantity, online_version, location FROM books WHERE LOWER(title) LIKE %s OR LOWER(author) LIKE %s",
                (f"%{query.lower()}%", f"%{query.lower()}%")  # Два параметра для title и author
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

def take_book(conn, book_id, student_id, due_date):
    try:
        with conn.cursor() as cur:
            # Проверка на наличие книги и студента (опционально, если есть foreign keys)

            # Вставка новой записи
            cur.execute(
                """
                INSERT INTO taken_books (book_id, student_id, due_date)
                VALUES (%s, %s, %s)
                """,
                (book_id, student_id, due_date),  # Используем due_date здесь
            )

        conn.commit()  # Подтверждение изменений
    except Exception as e:
        conn.rollback()  # Откат изменений в случае ошибки
        if isinstance(e, psycopg2.IntegrityError) and e.pgcode == '23505':
          # Обработка unique constraint ошибки, если нужна
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
      conn.rollback()  # Rollback changes on error
      raise


def check_if_book_taken(conn, student_id, book_title): # add bookTitle
  try:
    with conn.cursor() as cur:
      # find book id from title:
      cur.execute('SELECT id FROM books where title = %s', (book_title,))
      book_id = cur.fetchone()

      if book_id is None:
        return False  # Or raise an exception indicating book doesn't exist

      book_id = book_id[0] #  extract the id since fetchone returns a tuple
            

      cur.execute('SELECT EXISTS(SELECT 1 FROM taken_books WHERE student_id = %s AND book_id = %s)', (student_id, book_id,))

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
          # using LIKE is better, use LOWER for case-insensitive searching.  
          cur.execute(
              """
              SELECT user_id, name AS ФИО, group_name AS Группа 
              FROM students 
              WHERE LOWER(name) LIKE %s OR LOWER(group_name) LIKE %s
              """,
              (f"%{query.lower()}%", f"%{query.lower()}%")
          )

          students = cur.fetchall()  # Fetch the list of results here

          return students  # and return after committing transaction

  except Exception as e:
        raise

