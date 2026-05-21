from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
import tensorflow as tf
from tensorflow.keras.applications.efficientnet import preprocess_input # <--- IMPORT HÀM TIỀN XỬ LÝ CHUẨN
import numpy as np
from PIL import Image
import io

app = FastAPI(title="Food Calorie API")

# Cấu hình CORS để cho phép frontend gọi API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load model (Khởi tạo 1 lần khi chạy server)
model = tf.keras.models.load_model('unified_food_model_v3.keras')
IMG_SIZE = (224, 224)

# Database Calo hoàn chỉnh
CALORIE_DB = {
    "apple_pie": 320,
    "baby_back_ribs": 550,
    "baklava": 290,
    "banh_bao": 300,
    "banh_beo": 250,
    "banh_bot_loc": 280,
    "banh_can": 350,
    "banh_canh": 450,
    "banh_chung": 600,
    "banh_cuon": 320,
    "banh_duc": 250,
    "banh_gio": 350,
    "banh_khot": 400,
    "banh_mi": 450,
    "banh_pia": 420,
    "banh_tet": 550,
    "banh_trang_nuong": 500,
    "banh_xeo": 600,
    "beef_carpaccio": 220,
    "beef_tartare": 300,
    "beet_salad": 180,
    "beignets": 350,
    "bibimbap": 550,
    "bo_kho": 500,
    "bread_pudding": 400,
    "breakfast_burrito": 700,
    "bruschetta": 180,
    "bun_bo_hue": 650,
    "bun_cha": 600,
    "bun_dau_mam_tom": 750,
    "bun_mam": 650,
    "bun_rieu": 550,
    "bun_thit_nuong": 600,
    "caesar_salad": 450,
    "ca_kho_to": 350,
    "canh_chua": 250,
    "cannoli": 320,
    "cao_lau": 550,
    "caprese_salad": 320,
    "carrot_cake": 430,
    "ceviche": 250,
    "chao_long": 500,
    "cheesecake": 450,
    "cheese_plate": 500,
    "chicken_curry": 550,
    "chicken_quesadilla": 650,
    "chicken_wings": 500,
    "chocolate_cake": 450,
    "chocolate_mousse": 350,
    "churros": 320,
    "clam_chowder": 350,
    "club_sandwich": 650,
    "com_tam": 700,
    "crab_cakes": 400,
    "creme_brulee": 300,
    "croque_madame": 700,
    "cup_cakes": 300,
    "deviled_eggs": 180,
    "donuts": 300,
    "dumplings": 320,
    "edamame": 190,
    "eggs_benedict": 600,
    "escargots": 220,
    "falafel": 350,
    "filet_mignon": 500,
    "fish_and_chips": 850,
    "foie_gras": 450,
    "french_fries": 420,
    "french_onion_soup": 300,
    "french_toast": 450,
    "fried_calamari": 500,
    "fried_rice": 550,
    "frozen_yogurt": 250,
    "garlic_bread": 300,
    "gnocchi": 450,
    "goi_cuon": 180,
    "greek_salad": 280,
    "grilled_cheese_sandwich": 450,
    "grilled_salmon": 500,
    "guacamole": 250,
    "gyoza": 350,
    "hamburger": 650,
    "hot_and_sour_soup": 250,
    "hot_dog": 450,
    "huevos_rancheros": 500,
    "hummus": 280,
    "hu_tieu": 500,
    "hu_tieu_nam_vang": 550,
    "ice_cream": 270,
    "lasagna": 650,
    "lobster_bisque": 300,
    "lobster_roll_sandwich": 550,
    "macaroni_and_cheese": 700,
    "macarons": 250,
    "mi_quang": 550,
    "miso_soup": 80,
    "mussels": 350,
    "nachos": 700,
    "nem_chua": 150,
    "omelette": 350,
    "onion_rings": 450,
    "oysters": 150,
    "pad_thai": 700,
    "paella": 650,
    "pancakes": 500,
    "panna_cotta": 350,
    "peking_duck": 700,
    "pho": 500,
    "pizza": 800,
    "pork_chop": 550,
    "poutine": 900,
    "prime_rib": 700,
    "pulled_pork_sandwich": 650,
    "ramen": 650,
    "ravioli": 500,
    "red_velvet_cake": 450,
    "risotto": 550,
    "samosa": 300,
    "sashimi": 250,
    "scallops": 300,
    "seaweed_salad": 150,
    "shrimp_and_grits": 600,
    "spaghetti_bolognese": 650,
    "spaghetti_carbonara": 750,
    "spring_rolls": 250,
    "steak": 700,
    "strawberry_shortcake": 400,
    "sushi": 400,
    "tacos": 500,
    "takoyaki": 350,
    "tiramisu": 450,
    "tuna_tartare": 250,
    "waffles": 500,
    "xoi_xeo": 650
}

CLASS_NAMES = list(CALORIE_DB.keys())

@app.post("/predict/")
async def predict_food(
    file: UploadFile = File(...),
    portion: float = Form(1.0) # Nhận phần ăn người dùng nhập, mặc định là 1.0
):
    try:
        # Đọc dữ liệu file ảnh và đảm bảo hệ màu RGB
        image_bytes = await file.read()
        image = Image.open(io.BytesIO(image_bytes)).convert('RGB')
        
        # 1. Đồng bộ kích thước (Resizing)
        img = image.resize(IMG_SIZE)
        
        # 2. Chuyển đổi Tensor
        img_array = tf.keras.preprocessing.image.img_to_array(img)
        img_array = np.expand_dims(img_array, axis=0)
        
        # 3. Chuẩn hóa RIÊNG CHO EFFICIENTNET (Đã xóa /255.0)
        img_array = preprocess_input(img_array)
        
        # Dự đoán
        predictions = model.predict(img_array)[0]
        max_index = int(np.argmax(predictions))
        predicted_class = CLASS_NAMES[max_index]
        confidence = float(predictions[max_index])
        
        # Lấy top 3 dự đoán
        top_3_indices = np.argsort(predictions)[-3:][::-1]
        top_3 = [
            {"class": CLASS_NAMES[i], "confidence": float(predictions[i])} 
            for i in top_3_indices
        ]
        
        # Tính toán calo
        base_calories = CALORIE_DB.get(predicted_class, 0)
        total_calories = base_calories * portion
        
        return {
            "success": True,
            "predicted_class": predicted_class,
            "confidence": confidence,
            "base_calories": base_calories,
            "portion": portion,
            "total_calories": total_calories,
            "top_3": top_3
        }
        
    except Exception as e:
        return {"success": False, "error": str(e)}