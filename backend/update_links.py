from app import conn, get_book_info


def update_online_versions_from_db():
    try:
        cursor = conn.cursor()

        cursor.execute(
            "SELECT id, title FROM books WHERE online_version IS NULL OR online_version = '';")
        books = cursor.fetchall()

        updated_books = []

        for book_id, title in books:
            try:
                online_version = get_book_info(title)

                if online_version:

                    cursor.execute(
                        "UPDATE books SET online_version = %s WHERE id = %s;", (online_version, book_id))
                    updated_books.append(
                        {"id": book_id, "title": title, "online_version": online_version})
                    print(
                        f"Обновлена ссылка для книги '{title}': {online_version}")
                else:
                    print(f"Ссылка для книги '{title}' не найдена.")
            except Exception as e:
                print(f"Ошибка при обработке книги '{title}': {e}")
                conn.rollback()
                return

        conn.commit()
        print(f"Обновлено {len(updated_books)} книг.")
        return updated_books

    except Exception as e:
        print(f"Ошибка при обновлении ссылок: {e}")
        conn.rollback()
        return

    finally:
        if cursor:
            cursor.close()


if __name__ == "__main__":
    update_online_versions_from_db()
    conn.close()
