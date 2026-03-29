import os
import uuid
from collections import Counter
from functools import wraps

from flask import Flask, g, jsonify, request
from flask_cors import CORS
from itsdangerous import BadSignature, SignatureExpired, URLSafeTimedSerializer
from werkzeug.utils import secure_filename

from config import Config
from database.db import (
    create_user,
    get_report_by_id,
    get_user_by_id,
    get_user_reports,
    init_db,
    save_report,
    verify_user,
)


def allowed_file(filename: str) -> bool:
    return "." in filename and filename.rsplit(".", 1)[1].lower() in Config.ALLOWED_EXTENSIONS


def create_token_serializer() -> URLSafeTimedSerializer:
    return URLSafeTimedSerializer(Config.SECRET_KEY, salt="cataract-auth")


def generate_token(user: dict) -> str:
    serializer = create_token_serializer()
    return serializer.dumps(
        {
            "user_id": user["id"],
            "name": user["name"],
            "email": user["email"],
        }
    )


def verify_token(token: str):
    serializer = create_token_serializer()
    try:
        return serializer.loads(token, max_age=60 * 60 * 24 * 7)
    except (BadSignature, SignatureExpired):
        return None


def auth_required(view_function):
    @wraps(view_function)
    def wrapped(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "").strip()
        token = auth_header.replace("Bearer ", "", 1).strip() if auth_header else ""

        if not token:
            return jsonify({"error": "Authentication token is required."}), 401

        payload = verify_token(token)
        if payload is None:
            return jsonify({"error": "Invalid or expired token."}), 401

        user = get_user_by_id(payload["user_id"])
        if user is None:
            return jsonify({"error": "User does not exist."}), 401

        g.current_user = user
        return view_function(*args, **kwargs)

    return wrapped


def create_app() -> Flask:
    app = Flask(__name__)
    app.config["SECRET_KEY"] = Config.SECRET_KEY
    app.config["UPLOAD_FOLDER"] = Config.UPLOAD_FOLDER
    app.config["MAX_CONTENT_LENGTH"] = Config.MAX_CONTENT_LENGTH

    os.makedirs(Config.UPLOAD_FOLDER, exist_ok=True)
    init_db()
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    @app.route("/api/health", methods=["GET"])
    def health_check():
        return jsonify({"status": "ok"})

    @app.route("/api/auth/register", methods=["POST"])
    def register():
        payload = request.get_json(silent=True) or {}
        name = (payload.get("name") or "").strip()
        email = (payload.get("email") or "").strip().lower()
        password = payload.get("password") or ""

        if not name or not email or not password:
            return jsonify({"error": "Name, email, and password are required."}), 400

        if len(password) < 6:
            return jsonify({"error": "Password must be at least 6 characters long."}), 400

        try:
            user = create_user(name, email, password)
        except ValueError as error:
            return jsonify({"error": str(error)}), 409

        token = generate_token(user)
        return (
            jsonify(
                {
                    "user_id": user["id"],
                    "token": token,
                    "name": user["name"],
                    "email": user["email"],
                }
            ),
            201,
        )

    @app.route("/api/auth/login", methods=["POST"])
    def login():
        payload = request.get_json(silent=True) or {}
        email = (payload.get("email") or "").strip().lower()
        password = payload.get("password") or ""

        if not email or not password:
            return jsonify({"error": "Email and password are required."}), 400

        user = verify_user(email, password)
        if user is None:
            return jsonify({"error": "Invalid email or password."}), 401

        token = generate_token(user)
        return jsonify(
            {
                "user_id": user["id"],
                "token": token,
                "name": user["name"],
                "email": user["email"],
            }
        )

    @app.route("/api/predict", methods=["POST"])
    @auth_required
    def predict():
        if "image" not in request.files:
            return jsonify({"error": "Image file is required."}), 400

        image_file = request.files["image"]
        if image_file.filename == "":
            return jsonify({"error": "Please choose an image file."}), 400

        if not allowed_file(image_file.filename):
            return jsonify({"error": "Only PNG, JPG, and JPEG files are allowed."}), 400

        extension = image_file.filename.rsplit(".", 1)[1].lower()
        filename = f"{uuid.uuid4().hex}.{extension}"
        file_path = os.path.join(app.config["UPLOAD_FOLDER"], secure_filename(filename))
        image_file.save(file_path)

        try:
            from model.predict import predict as run_prediction

            prediction = run_prediction(file_path)
        except FileNotFoundError as error:
            if os.path.exists(file_path):
                os.remove(file_path)
            return jsonify({"error": str(error)}), 503
        except Exception as error:  # noqa: BLE001
            if os.path.exists(file_path):
                os.remove(file_path)
            return jsonify({"error": f"Prediction failed: {error}"}), 500

        report_id = save_report(g.current_user["id"], filename, prediction)
        saved_report = get_report_by_id(report_id)

        return jsonify(
            {
                **prediction,
                "report_id": report_id,
                "image_filename": filename,
                "created_at": saved_report["created_at"] if saved_report else None,
            }
        )

    @app.route("/api/reports", methods=["GET"])
    @auth_required
    def reports():
        user_reports = get_user_reports(g.current_user["id"])
        return jsonify(user_reports)

    @app.route("/api/reports/<int:report_id>", methods=["GET"])
    @auth_required
    def report_detail(report_id: int):
        report = get_report_by_id(report_id)
        if report is None or report["user_id"] != g.current_user["id"]:
            return jsonify({"error": "Report not found."}), 404

        return jsonify(report)

    @app.route("/api/stats", methods=["GET"])
    @auth_required
    def stats():
        user_reports = get_user_reports(g.current_user["id"])
        stage_counts = Counter(report["stage"] for report in user_reports)
        total_scans = len(user_reports)
        accuracy_avg = (
            round(sum(report["confidence"] for report in user_reports) / total_scans, 2)
            if total_scans
            else 0.0
        )

        return jsonify(
            {
                "total_scans": total_scans,
                "stage_counts": {
                    "Normal": stage_counts.get("Normal", 0),
                    "Mild": stage_counts.get("Mild", 0),
                    "Severe": stage_counts.get("Severe", 0),
                },
                "accuracy_avg": accuracy_avg,
                "recent_scans": user_reports[:5],
            }
        )

    @app.errorhandler(413)
    def file_too_large(_error):
        return jsonify({"error": "File too large. Upload an image smaller than 16MB."}), 413

    return app


app = create_app()


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
