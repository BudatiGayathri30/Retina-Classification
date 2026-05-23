import os
import sqlite3
from datetime import datetime

# Path to the SQLite database file
DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "retinal_pathology.db")

def get_connection():
    """
    Returns a connection to the SQLite database.
    Enables row factory for dictionary-like access to records.
    """
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """
    Initializes the database schema if it doesn't already exist.
    """
    print(f"Initializing database at: {DB_PATH}")
    conn = get_connection()
    cursor = conn.cursor()
    
    # Create the scans table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS scans (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            filename TEXT NOT NULL,
            prediction TEXT NOT NULL,
            prediction_raw TEXT NOT NULL,
            confidence REAL NOT NULL,
            is_proper_fundus INTEGER NOT NULL,
            is_blurry INTEGER NOT NULL,
            warning_message TEXT,
            created_at TEXT NOT NULL
        )
    """)
    
    conn.commit()
    conn.close()
    print("Database initialized successfully.")

def add_scan(filename, prediction, prediction_raw, confidence, is_proper_fundus, is_blurry, warning_message):
    """
    Logs a new scan result into the database.
    """
    conn = get_connection()
    cursor = conn.cursor()
    
    current_time = datetime.now().isoformat()
    
    cursor.execute("""
        INSERT INTO scans (
            filename, 
            prediction, 
            prediction_raw, 
            confidence, 
            is_proper_fundus, 
            is_blurry, 
            warning_message, 
            created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        filename, 
        prediction, 
        prediction_raw, 
        confidence, 
        1 if is_proper_fundus else 0, 
        1 if is_blurry else 0, 
        warning_message, 
        current_time
    ))
    
    conn.commit()
    conn.close()
    print(f"Logged scan record for '{filename}' to database.")

def get_scans():
    """
    Retrieves all scan records from the database, sorted by creation date descending.
    """
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM scans ORDER BY created_at DESC")
    rows = cursor.fetchall()
    
    scans_list = []
    for row in rows:
        scans_list.append({
            "id": row["id"],
            "filename": row["filename"],
            "prediction": row["prediction"],
            "prediction_raw": row["prediction_raw"],
            "confidence": float(row["confidence"]),
            "is_proper_fundus": bool(row["is_proper_fundus"]),
            "is_blurry": bool(row["is_blurry"]),
            "warning_message": row["warning_message"],
            "created_at": row["created_at"]
        })
        
    conn.close()
    return scans_list

def delete_scan(scan_id):
    """
    Deletes a specific scan record from the database by ID.
    """
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("DELETE FROM scans WHERE id = ?", (scan_id,))
    deleted = cursor.rowcount > 0
    
    conn.commit()
    conn.close()
    return deleted

def clear_all_scans():
    """
    Deletes all records from the scans table.
    """
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("DELETE FROM scans")
    count = cursor.rowcount
    
    conn.commit()
    conn.close()
    return count
