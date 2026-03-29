import os


BASE_DIR = os.path.abspath(os.path.dirname(__file__))


class Config:
    UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads")
    MODEL_PATH = os.path.join(BASE_DIR, "model", "cataract_model.h5")
    DATABASE_URI = os.path.join(BASE_DIR, "database", "cataract.db")
    ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg"}
    IMG_SIZE = (224, 224)
    CLASSES = ["Normal", "Mild", "Severe"]
    SECRET_KEY = "cataract-detection-secret-key"
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024
