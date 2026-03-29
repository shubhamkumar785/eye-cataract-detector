import os
import sqlite3
from typing import Any, Dict, List, Optional

from werkzeug.security import check_password_hash, generate_password_hash

from config import Config


def _ensure_database_dir() -> None:
    os.makedirs(os.path.dirname(Config.DATABASE_URI), exist_ok=True)


def get_connection() -> sqlite3.Connection:
    _ensure_database_dir()
    connection = sqlite3.connect(Config.DATABASE_URI)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    return connection


def _row_to_dict(row: Optional[sqlite3.Row]) -> Optional[Dict[str, Any]]:
    if row is None:
        return None
    return dict(row)


def init_db() -> None:
    with get_connection() as connection:
        cursor = connection.cursor()
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS reports (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                image_filename TEXT,
                stage TEXT NOT NULL,
                confidence REAL NOT NULL,
                normal_prob REAL NOT NULL,
                mild_prob REAL NOT NULL,
                severe_prob REAL NOT NULL,
                advice TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
            """
        )
        connection.commit()

        # Ensure a default 'Public User' with ID 1 exists
        cursor.execute("SELECT id FROM users WHERE id = 1")
        if cursor.fetchone() is None:
            cursor.execute(
                """
                INSERT INTO users (id, name, email, password_hash)
                VALUES (1, 'Public User', 'public@example.com', 'none')
                """
            )
            connection.commit()


def create_user(name: str, email: str, password: str) -> Dict[str, Any]:
    password_hash = generate_password_hash(password)

    with get_connection() as connection:
        cursor = connection.cursor()
        try:
            cursor.execute(
                """
                INSERT INTO users (name, email, password_hash)
                VALUES (?, ?, ?)
                """,
                (name.strip(), email.strip().lower(), password_hash),
            )
            connection.commit()
        except sqlite3.IntegrityError as error:
            raise ValueError("A user with that email already exists.") from error

        user_id = cursor.lastrowid
        return get_user_by_id(user_id)


def get_user_by_id(user_id: int) -> Optional[Dict[str, Any]]:
    with get_connection() as connection:
        cursor = connection.cursor()
        cursor.execute(
            """
            SELECT id, name, email, created_at
            FROM users
            WHERE id = ?
            """,
            (user_id,),
        )
        return _row_to_dict(cursor.fetchone())


def verify_user(email: str, password: str) -> Optional[Dict[str, Any]]:
    with get_connection() as connection:
        cursor = connection.cursor()
        cursor.execute(
            """
            SELECT id, name, email, password_hash, created_at
            FROM users
            WHERE email = ?
            """,
            (email.strip().lower(),),
        )
        user = cursor.fetchone()

    if user is None or not check_password_hash(user["password_hash"], password):
        return None

    user_dict = dict(user)
    user_dict.pop("password_hash", None)
    return user_dict


def save_report(user_id: int, image_filename: str, prediction_dict: Dict[str, Any]) -> int:
    probabilities = prediction_dict["probabilities"]

    with get_connection() as connection:
        cursor = connection.cursor()
        cursor.execute(
            """
            INSERT INTO reports (
                user_id,
                image_filename,
                stage,
                confidence,
                normal_prob,
                mild_prob,
                severe_prob,
                advice
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                user_id,
                image_filename,
                prediction_dict["stage"],
                float(prediction_dict["confidence"]),
                float(probabilities["Normal"]),
                float(probabilities["Mild"]),
                float(probabilities["Severe"]),
                prediction_dict["advice"],
            ),
        )
        connection.commit()
        return cursor.lastrowid


def get_user_reports(user_id: int) -> List[Dict[str, Any]]:
    with get_connection() as connection:
        cursor = connection.cursor()
        cursor.execute(
            """
            SELECT
                id,
                user_id,
                image_filename,
                stage,
                confidence,
                normal_prob,
                mild_prob,
                severe_prob,
                advice,
                created_at
            FROM reports
            WHERE user_id = ?
            ORDER BY datetime(created_at) DESC, id DESC
            """,
            (user_id,),
        )
        rows = cursor.fetchall()
    return [dict(row) for row in rows]


def get_report_by_id(report_id: int) -> Optional[Dict[str, Any]]:
    with get_connection() as connection:
        cursor = connection.cursor()
        cursor.execute(
            """
            SELECT
                id,
                user_id,
                image_filename,
                stage,
                confidence,
                normal_prob,
                mild_prob,
                severe_prob,
                advice,
                created_at
            FROM reports
            WHERE id = ?
            """,
            (report_id,),
        )
        return _row_to_dict(cursor.fetchone())
