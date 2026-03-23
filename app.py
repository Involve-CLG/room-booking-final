import sqlite3
from flask import Flask, render_template, request, jsonify, redirect, session
from datetime import datetime
import os

app = Flask(__name__)
app.secret_key = "supersecretkey"

ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "admin123"

# ================= DATABASE =================

def init_db():
    conn = sqlite3.connect("database.db")
    cursor = conn.cursor()

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS bookings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        room TEXT,
        date TEXT,
        slot TEXT,
        name TEXT,
        email TEXT,
        organization TEXT,
        phone TEXT,
        insurance TEXT,
        special_request TEXT,
        created_at TEXT
    )
    """)

    conn.commit()
    conn.close()

init_db()

# ================= ROUTES =================

@app.route("/")
def index():
    return render_template("index.html")


@app.route("/contact")
def contact():
    return render_template("contact.html")


@app.route("/admin-login", methods=["GET", "POST"])
def admin_login():

    if request.method == "POST":
        username = request.form.get("username")
        password = request.form.get("password")

        if username == ADMIN_USERNAME and password == ADMIN_PASSWORD:
            session["admin_logged_in"] = True
            return redirect("/admin")
        else:
            return render_template("admin_login.html", error="Invalid credentials")

    return render_template("admin_login.html")


@app.route("/admin")
def admin_dashboard():

    if not session.get("admin_logged_in"):
        return redirect("/admin-login")

    conn = sqlite3.connect("database.db")
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM bookings ORDER BY id DESC")
    bookings = cursor.fetchall()

    conn.close()

    return render_template("admin_dashboard.html", bookings=bookings)


@app.route("/delete/<int:booking_id>")
def delete_booking(booking_id):

    if not session.get("admin_logged_in"):
        return redirect("/admin-login")

    conn = sqlite3.connect("database.db")
    cursor = conn.cursor()

    cursor.execute("DELETE FROM bookings WHERE id=?", (booking_id,))
    conn.commit()
    conn.close()

    return redirect("/admin")


@app.route("/logout")
def logout():
    session.pop("admin_logged_in", None)
    return redirect("/")


@app.route("/get-bookings")
def get_bookings():

    room = request.args.get("room")
    date = request.args.get("date")

    conn = sqlite3.connect("database.db")
    cursor = conn.cursor()

    cursor.execute(
        "SELECT slot FROM bookings WHERE room=? AND date=?",
        (room, date)
    )

    slots = [row[0] for row in cursor.fetchall()]
    conn.close()

    return jsonify(slots)


@app.route("/book", methods=["POST"])
def book():

    data = request.get_json()

    if not data:
        return jsonify({"success": False, "error": "No data received"})

    room = data.get("room")
    date = data.get("date")
    slots = data.get("slots", [])
    name = data.get("name")
    email = data.get("email")
    organization = data.get("organization")
    phone = data.get("phone")
    insurance = data.get("insurance")
    special_request = data.get("special_request")

    if not room or not date or not slots:
        return jsonify({"success": False, "error": "Missing required fields"})

    conn = sqlite3.connect("database.db")
    cursor = conn.cursor()

    created_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    for slot in slots:
        cursor.execute("""
            INSERT INTO bookings
            (room, date, slot, name, email, organization, phone, insurance, special_request, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            room,
            date,
            slot,
            name,
            email,
            organization,
            phone,
            insurance,
            special_request,
            created_time
        ))

    conn.commit()
    conn.close()

    return jsonify({"status": "success"})


# ================= RUN APP =================

if __name__ == "__main__":
    app.run()
    