# Cataract Detection System

AI-powered cataract screening web application built with Flask, TensorFlow, React, and SQLite.

## Overview

This system classifies eye images into:

- `Normal` - Clear lens, no treatment needed
- `Mild` - Early stage, doctor consultation advised
- `Severe` - Advanced stage, surgery recommended

The application includes:

- Flask REST API for authentication, predictions, reports, and dashboard stats
- MobileNetV2 transfer-learning training pipeline
- React dashboard with upload, webcam capture, report history, charts, dark mode, and exports
- SQLite persistence for users and screening reports

## Tech Stack

- Backend: Python, Flask, TensorFlow, OpenCV, SQLite
- Frontend: React, Vite, Tailwind CSS, Recharts, Axios
- Extras: Webcam capture, PDF export, EmailJS integration, doctor lookup, severity meter

## Folder Structure

```text
cataract-detection/
├── backend/
├── frontend/
├── dataset/
└── README.md
```

## Backend Details

### API Endpoints

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/predict`
- `GET /api/reports`
- `GET /api/reports/<id>`
- `GET /api/stats`
- `GET /api/health`

### Model Training

The training script in [train.py](/c:/Cataract/cataract-detection/backend/model/train.py) uses:

- MobileNetV2 pretrained on ImageNet
- Image size `224x224`
- Batch size `32`
- Epochs `25`
- Adam optimizer with learning rate `0.0001`
- Data augmentation: rotation, horizontal flip, zoom, brightness adjustment
- Train/validation/test split: `70/15/15`
- Early stopping and best-model checkpointing

Generated artifacts:

- `backend/model/cataract_model.h5`
- `backend/model/training_history.png`
- `backend/model/classification_report.txt`
- `backend/model/confusion_matrix.csv`
- `backend/model/confusion_matrix.png`

## Frontend Features

- Login/register flow with token storage in `localStorage`
- Drag-and-drop image upload
- Real-time webcam capture using `MediaDevices`
- Probability bar chart and stage badge
- Animated severity meter
- SQLite-backed report history with pagination
- Pie chart for stage distribution
- PDF export for reports
- Nearby ophthalmologist lookup using geolocation
- Dark mode toggle
- EmailJS-powered report email button

## Dataset Setup

Place your data in:

```text
dataset/
  normal/
  mild/
  severe/
```

Recommended target sizes:

- `normal`: about 500 images
- `mild`: about 300 images
- `severe`: about 300 images

If you only have `normal/` and `cataract/`, [train.py](/c:/Cataract/cataract-detection/backend/model/train.py) can auto-split the cataract images into `mild` and `severe` using a simple brightness and opacity heuristic.

Important note: some copied prompts point to a Kaggle URL for a brain tumor MRI dataset. That is not suitable here. Use an eye-image cataract dataset instead.

## How To Run

### 1. Backend setup

```bash
cd backend
pip install -r requirements.txt
python model/train.py
python app.py
```

The Flask API runs on `http://localhost:5000`.

### 2. Frontend setup

```bash
cd frontend
npm install
npm run dev
```

The React app runs on `http://localhost:5173`.

## EmailJS Setup

Create a frontend `.env` file from [frontend/.env.example](/c:/Cataract/cataract-detection/frontend/.env.example):

```powershell
Copy-Item .env.example .env
```

Add:

- `VITE_EMAILJS_SERVICE_ID`
- `VITE_EMAILJS_TEMPLATE_ID`
- `VITE_EMAILJS_PUBLIC_KEY`

## Database Schema

The SQLite database is created automatically at [cataract.db](/c:/Cataract/cataract-detection/backend/database/cataract.db) when the backend starts.

Tables:

- `users`
- `reports`

## Interview Talking Points

- This system assists doctors; it does not replace clinical judgment.
- The model uses MobileNetV2 transfer learning fine-tuned for cataract screening.
- Outputs are three-class: Normal, Mild, Severe, each with confidence probabilities.
- The stack combines Python, TensorFlow, Flask, React, and SQLite.
- It is useful for rural health camps, mobile clinics, and early screening workflows.

## Notes

- `POST /api/predict` saves reports automatically and returns the new `report_id`.
- If the model file is missing, prediction requests return a clear error telling you to train first.
- I added `matplotlib` to backend requirements because training graphs and confusion matrix images need it.
