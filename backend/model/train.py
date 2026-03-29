import argparse
import os
import shutil
import sys
from pathlib import Path
from typing import Dict, List, Sequence, Tuple

import cv2
import matplotlib.pyplot as plt
import numpy as np
import tensorflow as tf
from sklearn.metrics import classification_report, confusion_matrix
from sklearn.model_selection import train_test_split
from tensorflow.keras import callbacks, layers, models, optimizers
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.models import load_model


CURRENT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = CURRENT_DIR.parent
PROJECT_ROOT = BACKEND_DIR.parent

if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from config import Config


IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png"}
SEED = 42
BATCH_SIZE = 32
EPOCHS = 10
AUTOTUNE = tf.data.AUTOTUNE
CANONICAL_FOLDERS = {"normal": "Normal", "mild": "Mild", "severe": "Severe"}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Train a cataract stage classifier.")
    parser.add_argument(
        "--dataset-dir",
        default=str(PROJECT_ROOT / "dataset" / "preprocessed_images"),
        help="Path to the dataset root directory.",
    )
    return parser.parse_args()


def opacity_score(image_path: Path) -> float:
    image = cv2.imread(str(image_path), cv2.IMREAD_GRAYSCALE)
    if image is None:
        return 0.0

    resized = cv2.resize(image, Config.IMG_SIZE)
    blurred = cv2.GaussianBlur(resized, (5, 5), 0)
    _, thresholded = cv2.threshold(blurred, 165, 255, cv2.THRESH_BINARY)
    bright_ratio = float(np.count_nonzero(thresholded)) / thresholded.size
    return float(np.mean(blurred) * 0.6 + bright_ratio * 255 * 0.4)


def folder_has_images(folder_path: Path) -> bool:
    return folder_path.exists() and any(
        path.suffix.lower() in IMAGE_EXTENSIONS for path in folder_path.iterdir()
    )


def ensure_three_class_dataset(dataset_dir: Path) -> None:
    normal_dir = dataset_dir / "normal"
    mild_dir = dataset_dir / "mild"
    severe_dir = dataset_dir / "severe"
    cataract_dir = dataset_dir / "cataract"

    if (
        folder_has_images(normal_dir)
        and folder_has_images(mild_dir)
        and folder_has_images(severe_dir)
    ):
        return

    if not folder_has_images(normal_dir) or not folder_has_images(cataract_dir):
        missing = []
        if not folder_has_images(normal_dir):
            missing.append("normal")
        if not folder_has_images(cataract_dir):
            missing.append("cataract or prepared mild/severe images")
        raise FileNotFoundError(
            "Dataset images are missing. Expected `normal`, `mild`, and `severe`, "
            "or a two-class setup with `normal` and `cataract` for auto-splitting. "
            f"Missing data: {', '.join(missing)}."
        )

    mild_dir.mkdir(parents=True, exist_ok=True)
    severe_dir.mkdir(parents=True, exist_ok=True)

    cataract_images = [
        path for path in cataract_dir.iterdir() if path.suffix.lower() in IMAGE_EXTENSIONS
    ]
    if not cataract_images:
        raise FileNotFoundError("No cataract images found to split into mild and severe classes.")

    ranked_images = sorted(cataract_images, key=opacity_score)
    split_index = len(ranked_images) // 2
    mild_images = ranked_images[:split_index]
    severe_images = ranked_images[split_index:]

    for target_dir, images in ((mild_dir, mild_images), (severe_dir, severe_images)):
        for image_path in images:
            destination = target_dir / image_path.name
            if not destination.exists():
                shutil.copy2(image_path, destination)

    print(
        "Prepared a three-class dataset by splitting the `cataract` folder into "
        f"`mild` ({len(mild_images)}) and `severe` ({len(severe_images)}) using opacity analysis."
    )


def collect_samples(dataset_dir: Path) -> Tuple[np.ndarray, np.ndarray]:
    image_paths: List[str] = []
    labels: List[int] = []

    for index, folder_name in enumerate(CANONICAL_FOLDERS):
        class_dir = dataset_dir / folder_name
        files = sorted(path for path in class_dir.iterdir() if path.suffix.lower() in IMAGE_EXTENSIONS)
        if not files:
            raise FileNotFoundError(f"No images found inside `{class_dir}`.")

        image_paths.extend(str(path) for path in files)
        labels.extend([index] * len(files))

    return np.array(image_paths), np.array(labels, dtype=np.int32)


def split_dataset(image_paths: np.ndarray, labels: np.ndarray) -> Dict[str, Tuple[np.ndarray, np.ndarray]]:
    train_paths, temp_paths, train_labels, temp_labels = train_test_split(
        image_paths,
        labels,
        test_size=0.30,
        random_state=SEED,
        stratify=labels,
    )
    val_paths, test_paths, val_labels, test_labels = train_test_split(
        temp_paths,
        temp_labels,
        test_size=0.50,
        random_state=SEED,
        stratify=temp_labels,
    )

    return {
        "train": (train_paths, train_labels),
        "val": (val_paths, val_labels),
        "test": (test_paths, test_labels),
    }


def decode_and_resize(path: tf.Tensor, label: tf.Tensor) -> Tuple[tf.Tensor, tf.Tensor]:
    image = tf.io.read_file(path)
    image = tf.image.decode_image(image, channels=3, expand_animations=False)
    image = tf.image.resize(image, Config.IMG_SIZE)
    image = tf.cast(image, tf.float32) / 255.0
    label = tf.one_hot(label, depth=len(Config.CLASSES))
    return image, label


def build_augmentation() -> tf.keras.Sequential:
    return tf.keras.Sequential(
        [
            layers.RandomRotation(20 / 360),
            layers.RandomFlip("horizontal"),
            layers.RandomZoom(0.2),
            layers.RandomBrightness(0.2, value_range=(0, 1)),
        ],
        name="augmentation",
    )


def build_dataset(
    image_paths: Sequence[str],
    labels: Sequence[int],
    training: bool = False,
) -> tf.data.Dataset:
    dataset = tf.data.Dataset.from_tensor_slices((list(image_paths), list(labels)))
    dataset = dataset.map(decode_and_resize, num_parallel_calls=AUTOTUNE)

    if training:
        augmenter = build_augmentation()
        dataset = dataset.shuffle(buffer_size=max(len(image_paths), BATCH_SIZE), seed=SEED)
        dataset = dataset.map(
            lambda image, label: (augmenter(image, training=True), label),
            num_parallel_calls=AUTOTUNE,
        )

    return dataset.batch(BATCH_SIZE).prefetch(AUTOTUNE)


def build_model() -> tf.keras.Model:
    base_model = MobileNetV2(
        input_shape=(*Config.IMG_SIZE, 3),
        include_top=False,
        weights="imagenet",
    )
    base_model.trainable = False

    inputs = layers.Input(shape=(*Config.IMG_SIZE, 3))
    x = base_model(inputs, training=False)
    x = layers.GlobalAveragePooling2D()(x)
    x = layers.Dense(256, activation="relu")(x)
    x = layers.Dropout(0.5)(x)
    x = layers.Dense(128, activation="relu")(x)
    x = layers.Dropout(0.3)(x)
    outputs = layers.Dense(len(Config.CLASSES), activation="softmax")(x)

    model = models.Model(inputs, outputs)
    model.compile(
        optimizer=optimizers.Adam(learning_rate=0.0001),
        loss="categorical_crossentropy",
        metrics=["accuracy"],
    )
    return model


def plot_training_history(history: tf.keras.callbacks.History, output_path: Path) -> None:
    figure, axes = plt.subplots(1, 2, figsize=(14, 5))

    axes[0].plot(history.history["accuracy"], label="Train Accuracy", linewidth=2)
    axes[0].plot(history.history["val_accuracy"], label="Val Accuracy", linewidth=2)
    axes[0].set_title("Training Accuracy")
    axes[0].set_xlabel("Epoch")
    axes[0].set_ylabel("Accuracy")
    axes[0].legend()

    axes[1].plot(history.history["loss"], label="Train Loss", linewidth=2)
    axes[1].plot(history.history["val_loss"], label="Val Loss", linewidth=2)
    axes[1].set_title("Training Loss")
    axes[1].set_xlabel("Epoch")
    axes[1].set_ylabel("Loss")
    axes[1].legend()

    figure.tight_layout()
    figure.savefig(output_path, dpi=200, bbox_inches="tight")
    plt.close(figure)


def plot_confusion_matrix(matrix: np.ndarray, output_path: Path) -> None:
    figure, axis = plt.subplots(figsize=(7, 6))
    axis.imshow(matrix, interpolation="nearest", cmap=plt.cm.Blues)
    axis.set_title("Confusion Matrix")
    axis.set_xticks(range(len(Config.CLASSES)))
    axis.set_xticklabels(Config.CLASSES, rotation=20)
    axis.set_yticks(range(len(Config.CLASSES)))
    axis.set_yticklabels(Config.CLASSES)
    axis.set_ylabel("True Label")
    axis.set_xlabel("Predicted Label")

    threshold = matrix.max() / 2 if matrix.size else 0
    for row in range(matrix.shape[0]):
        for column in range(matrix.shape[1]):
            axis.text(
                column,
                row,
                int(matrix[row, column]),
                ha="center",
                va="center",
                color="white" if matrix[row, column] > threshold else "black",
            )

    figure.tight_layout()
    figure.savefig(output_path, dpi=200, bbox_inches="tight")
    plt.close(figure)


def evaluate_model(model: tf.keras.Model, test_dataset: tf.data.Dataset) -> Tuple[str, np.ndarray]:
    true_labels = np.concatenate(
        [np.argmax(batch_labels.numpy(), axis=1) for _, batch_labels in test_dataset],
        axis=0,
    )
    predictions = model.predict(test_dataset, verbose=0)
    predicted_labels = np.argmax(predictions, axis=1)

    report = classification_report(
        true_labels,
        predicted_labels,
        target_names=Config.CLASSES,
        digits=4,
    )
    matrix = confusion_matrix(true_labels, predicted_labels)
    return report, matrix


def save_evaluation_artifacts(report: str, matrix: np.ndarray) -> None:
    report_path = CURRENT_DIR / "classification_report.txt"
    matrix_csv_path = CURRENT_DIR / "confusion_matrix.csv"
    matrix_png_path = CURRENT_DIR / "confusion_matrix.png"

    report_path.write_text(report, encoding="utf-8")
    np.savetxt(matrix_csv_path, matrix, delimiter=",", fmt="%d")
    plot_confusion_matrix(matrix, matrix_png_path)


def main() -> None:
    args = parse_args()
    dataset_dir = Path(args.dataset_dir).resolve()

    if not dataset_dir.exists():
        raise FileNotFoundError(f"Dataset directory does not exist: {dataset_dir}")

    ensure_three_class_dataset(dataset_dir)
    image_paths, labels = collect_samples(dataset_dir)
    splits = split_dataset(image_paths, labels)

    print(
        "Dataset split sizes:",
        {split_name: len(split_data[0]) for split_name, split_data in splits.items()},
    )

    train_dataset = build_dataset(*splits["train"], training=True)
    val_dataset = build_dataset(*splits["val"], training=False)
    test_dataset = build_dataset(*splits["test"], training=False)

    model = build_model()
    checkpoint_callback = callbacks.ModelCheckpoint(
        Config.MODEL_PATH,
        monitor="val_accuracy",
        mode="max",
        save_best_only=True,
        verbose=1,
    )
    early_stopping_callback = callbacks.EarlyStopping(
        monitor="val_loss",
        patience=5,
        restore_best_weights=True,
        verbose=1,
    )

    history = model.fit(
        train_dataset,
        validation_data=val_dataset,
        epochs=EPOCHS,
        callbacks=[checkpoint_callback, early_stopping_callback],
        verbose=1,
    )

    plot_training_history(history, CURRENT_DIR / "training_history.png")

    best_model = load_model(Config.MODEL_PATH)
    report, matrix = evaluate_model(best_model, test_dataset)
    print("\nClassification Report:\n")
    print(report)
    print("Confusion Matrix:\n", matrix)

    save_evaluation_artifacts(report, matrix)
    print("\nSaved artifacts:")
    print(f"- Model: {Config.MODEL_PATH}")
    print(f"- Training graph: {CURRENT_DIR / 'training_history.png'}")
    print(f"- Classification report: {CURRENT_DIR / 'classification_report.txt'}")
    print(f"- Confusion matrix: {CURRENT_DIR / 'confusion_matrix.csv'}")
    print(f"- Confusion matrix heatmap: {CURRENT_DIR / 'confusion_matrix.png'}")


if __name__ == "__main__":
    main()
