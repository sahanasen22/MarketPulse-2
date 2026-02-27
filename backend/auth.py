from werkzeug.security import generate_password_hash, check_password_hash
from database import get_db

def register_user(username, email, password):
    db = get_db()
    cur = db.cursor()
    hashed = generate_password_hash(password)

    try:
        cur.execute(
            "INSERT INTO users (username,email,password) VALUES (?,?,?)",
            (username, email, hashed)
        )
        db.commit()
        return True
    except:
        return False

def login_user(username, password):
    db = get_db()
    cur = db.cursor()
    cur.execute(
        "SELECT id, password FROM users WHERE username=?",
        (username,)
    )
    user = cur.fetchone()

    if user and check_password_hash(user[1], password):
        return user[0]
    return None
