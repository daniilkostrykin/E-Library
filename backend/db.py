import psycopg2
import psycopg2.extras
import os
from dotenv import load_dotenv


def init_db():
    load_dotenv()

    conn = psycopg2.connect(
        dbname=os.getenv("DB_NAME", "postgres"),
        user=os.getenv("DB_USER", "postgres"),
        password=os.getenv("DB_PASSWORD", "pgpwd4miit"),
        host=os.getenv("DB_HOST", "localhost"),
        port=os.getenv("DB_PORT", "55432")
    )
    conn.autocommit = True
    return conn
