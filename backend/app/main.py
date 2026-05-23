from fastapi import FastAPI, UploadFile, File
from PIL import Image
import io
from fastapi.middleware.cors import CORSMiddleware

from app.services.portion_service import estimate_portion
from app.models.midas.depth_estimator import estimate_depth
from app.services.nutrition_service import get_calories
from app.models.efficientnet.classifier import predict_food
from app.models.yolov8.detector import detect_food

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    return {
        "message": "AI Food Calorie API Running"
    }


@app.post("/predict")
async def predict(file: UploadFile = File(...)):

    try:
        # Đọc ảnh
        image_bytes = await file.read()

        image = Image.open(
            io.BytesIO(image_bytes)
        ).convert("RGB")

        # YOLO detect object
        detections = detect_food(image)

        # Không detect được gì
        if len(detections) == 0:
            return {
                "success": False,
                "message": "No object detected"
            }

        # Chọn detection có confidence cao nhất
        best_detection = max(
            detections,
            key=lambda x: x["confidence"]
        )

        x1, y1, x2, y2 = best_detection["bbox"]

        # Crop object
        cropped_food = image.crop((x1, y1, x2, y2))

        # EfficientNet predict
        prediction = predict_food(cropped_food)

        # MiDaS depth estimation
        depth_info = estimate_depth(cropped_food)
        
        # Portion estimation
        portion_info = estimate_portion(
    bbox=best_detection["bbox"],
    image_width=image.width,
    image_height=image.height,
    avg_depth=depth_info["avg_depth"]
)
# Nutrition lookup
        nutrition_info = get_calories(
            prediction["food"]
)

        # Calories calculation
        estimated_calories = None

        if nutrition_info["found"]:

            base_calories = nutrition_info["calories_per_100g"]

            multiplier = portion_info["multiplier"]

            estimated_calories = round(
                    base_calories * multiplier,
                    2
    )

        return {
    "success": True,
    "detection": best_detection,
    "prediction": prediction,
    "depth": depth_info,
    "portion": portion_info,
    "nutrition": nutrition_info,
    "estimated_calories": estimated_calories
}

   

 
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }