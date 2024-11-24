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
