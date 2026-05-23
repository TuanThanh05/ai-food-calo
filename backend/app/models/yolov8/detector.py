from ultralytics import YOLO
from PIL import Image
import numpy as np

model = YOLO("yolov8n.pt")

FOOD_CLASSES = [
    "pizza",
    "hot dog",
    "donut",
    "cake",
    "sandwich",
    "bowl"
]


def detect_food(image: Image.Image):

    image_np = np.array(image)

    results = model(image_np)

    detections = []

    for result in results:

        boxes = result.boxes

        for box in boxes:

            class_id = int(box.cls[0])

            class_name = model.names[class_id]

            confidence = float(box.conf[0])

            # Chỉ giữ food classes
            if class_name not in FOOD_CLASSES:
                continue

            x1, y1, x2, y2 = box.xyxy[0].tolist()

            detections.append({
                "bbox": [
                    int(x1),
                    int(y1),
                    int(x2),
                    int(y2)
                ],
                "confidence": round(confidence, 4),
                "class_id": class_id,
                "class_name": class_name
            })

    return detections