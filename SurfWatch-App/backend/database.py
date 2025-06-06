import mysql.connector as mysql
import os
import pandas as pd
from dotenv import load_dotenv
import logging
from mysql.connector import Error
from typing import Optional

load_dotenv('../.env', override=True)

dev_mode = os.environ.get('DEV_MODE', 'False').lower() == 'true'
db_host = os.environ['MYSQL_HOST']
db_user = os.environ['MYSQL_USER']
db_pass = os.environ['MYSQL_PASSWORD']
db_name = os.environ['MYSQL_DATABASE']
db_port = os.environ['MYSQL_PORT']

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DatabaseConnectionError(Exception):
    """Unable to connect to the database :C"""
    pass

def get_db_connection():
    """Returns a new database connection."""
    try:
        return mysql.connect(host=db_host, database=db_name, user=db_user, passwd=db_pass, port=int(db_port))
    except Error as e:
        logger.error(f"Error connecting to MySQL: {e}")
        raise DatabaseConnectionError(f"Unable to connect to the database: {e}")


def setup_database():
    """Creates necessary tables and populates initial user data if provided."""
    connection = None
    cursor = None

    table_schemas = {
        "users": """
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(255) NOT NULL UNIQUE,
                email VARCHAR(255) NOT NULL UNIQUE,
                password TEXT,
                location VARCHAR(255) NOT NULL,
                profile_pic VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """,
        "sessions": """
            CREATE TABLE IF NOT EXISTS sessions (
                id VARCHAR(36) PRIMARY KEY,
                user_id INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """,
        "user_surf_sessions": """
            CREATE TABLE IF NOT EXISTS user_surf_sessions (
                user_id INT NOT NULL,
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255),
                location VARCHAR(255),
                start DATETIME,
                end DATETIME,
                rating INT NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        """,
    }

    try:
        connection = get_db_connection()
        cursor = connection.cursor()

        # Drop tables if they exist
        # Drop tables in correct order
        for table_name in ["user_surf_sessions", "sessions", "users"]:
            logger.info(f"Dropping table {table_name} if exists...")
            cursor.execute(f"DROP TABLE IF EXISTS {table_name}")
            connection.commit()


        # Create tables
        for table_name, create_query in table_schemas.items():
            try:
                logger.info(f"Creating table {table_name}...")
                cursor.execute(create_query)
                connection.commit()
                logger.info(f"Table {table_name} created successfully")
            except Error as e:
                logger.error(f"Error creating table {table_name}: {e}")
                raise

    except Exception as e:
        logger.error(f"Database setup failed: {e}")
        raise

    finally:
        if cursor:
            cursor.close()
        if connection and connection.is_connected():
            connection.close()
            logger.info("Database connection closed")


# Database utility functions
async def get_user_by_email(email: str) -> Optional[dict]:
    """Retrieve user from database by email."""
    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)
    try:
        cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
        return cursor.fetchone()
    finally:
        cursor.close()
        connection.close()


async def get_user_by_id(user_id: int) -> Optional[dict]:
    """Retrieve user from database by ID."""
    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)
    try:
        cursor.execute("SELECT * FROM users WHERE id = %s", (user_id,))
        return cursor.fetchone()
    finally:
        cursor.close()
        connection.close()
        
async def get_surf_sessions_for_user(user_id: int) -> list[dict]:
    """Retrieve all surf sessions for a given user."""
    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)
    try:
        cursor.execute("SELECT * FROM user_surf_sessions WHERE user_id = %s", (user_id,))
        return cursor.fetchall()  # returns a list of dicts
    finally:
        cursor.close()
        connection.close()

async def create_session(email: str, session_id: str) -> bool:
    """Create a new session in the database."""
    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)
    try:
        cursor.execute("SELECT id FROM users WHERE email = %s", (email,))
        user = cursor.fetchone()

        if user:
            cursor.execute("INSERT INTO sessions (id, user_id) VALUES (%s, %s)", (session_id, user['id']))
            connection.commit()
            return True
        else:
            raise ValueError(f"User with email {email} not found.")

    finally:
        cursor.close()
        connection.close()


async def get_session(session_id: str) -> Optional[dict]:
    """Retrieve session from database."""
    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)
    try:
        cursor.execute("SELECT * FROM sessions WHERE id = %s", (session_id,))
        return cursor.fetchone()
    finally:
        cursor.close()
        connection.close()


async def delete_session(session_id: str) -> bool:
    """Delete a session from the database."""
    connection = get_db_connection()
    cursor = connection.cursor()
    try:
        cursor.execute("DELETE FROM sessions WHERE id = %s", (session_id,))
        connection.commit()
        return True
    finally:
        cursor.close()
        connection.close()


def table_has_data(table_name):
    """Check if a table contains data."""
    connection = get_db_connection()
    cursor = connection.cursor()
    try:
        cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
        return cursor.fetchone()[0] > 0
    finally:
        cursor.close()
        connection.close()


