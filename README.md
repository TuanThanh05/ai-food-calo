# AI Food Calorie System

AI-powered food recognition and calorie estimation system using computer vision and deep learning.

---

# Overview

This project is an AI-based system capable of:

* Detecting food regions from images
* Classifying food types
* Estimating portion size
* Estimating calorie values
* Providing analysis results through a web interface

The system combines multiple AI models to create a complete food analysis pipeline.

---

# Technologies Used

## Backend

* FastAPI
* TensorFlow
* PyTorch
* OpenCV
* Transformers
* Ultralytics YOLOv8

## Frontend

* Next.js
* React
* TailwindCSS

## AI Models

* YOLOv8 for food detection
* EfficientNetB0 for food classification
* MiDaS for depth estimation

---

# System Architecture

Image Upload
↓
YOLOv8 Detection
↓
Crop Food Region
↓
EfficientNet Classification
↓
MiDaS Depth Estimation
↓
Portion Estimation
↓
Nutrition Lookup
↓
Calories Calculation
↓
JSON Response

---

# Main Features

* Food detection using YOLOv8
* Food classification using EfficientNetB0
* Depth estimation using MiDaS
* Portion size estimation
* Calorie estimation
* REST API with FastAPI
* Modern web interface with Next.js
* Upload image support
* Camera capture support

---

# Project Structure

```bash
ai-food-calorie-system/
│
├── backend/
│   ├── app/
│   │   ├── database/
│   │   ├── models/
│   │   ├── services/
│   │   └── main.py
│   │
│   └── venv/
│
├── frontend/
│
└── README.md
```

---

# Backend Setup

## 1. Navigate to backend

```bash
cd backend
```

## 2. Create virtual environment

```bash
python -m venv venv
```

## 3. Activate virtual environment

### Windows

```bash
venv\Scripts\activate
```

## 4. Install dependencies

```bash
pip install -r requirements.txt
```

## 5. Run backend server

```bash
uvicorn app.main:app --reload
```

Backend URL:

```bash
http://127.0.0.1:8000
```

Swagger Documentation:

```bash
http://127.0.0.1:8000/docs
```

---

# Frontend Setup

## 1. Navigate to frontend

```bash
cd frontend
```

## 2. Install dependencies

```bash
npm install
```

## 3. Run frontend server

```bash
npm run dev
```

Frontend URL:

```bash
http://localhost:3000
```

---

# API Endpoint

## POST /predict

### Request

Content-Type:

```bash
multipart/form-data
```

Field:

```bash
file
```

---

# Example Response

```json
{
  "success": true,
  "prediction": {
    "food": "pizza",
    "confidence": 0.9982
  },
  "portion": {
    "portion": "large"
  },
  "estimated_calories": 399
}
```

---

# Portion Estimation

The system estimates portion size using:

* Bounding box area
* Image area ratio
* Relative depth estimation from MiDaS

Portion categories:

* Small
* Medium
* Large

---

# Current Limitations

* Portion estimation is relative, not exact gram measurement
* YOLOv8 model is not fine-tuned specifically for food datasets
* Multi-food detection is limited
* Accuracy depends on image quality

---

# Future Improvements

* Multi-food support
* YOLOv8 segmentation
* Realtime webcam inference
* Mobile application
* Nutrition tracking
* User history
* AI nutrition recommendation system

---

# Author

AI Food Calorie System Project
