import sqlite3

conn = sqlite3.connect("studybuddy.db", check_same_thread=False)

cursor = conn.cursor()

cursor.execute("""
CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    subject TEXT,
    duration INTEGER,
    focus_score REAL
)
""")

conn.commit()
