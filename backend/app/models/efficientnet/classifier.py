import json
import numpy as np
import tensorflow as tf

from PIL import Image
from tensorflow.keras.applications.efficientnet import preprocess_input

MODEL_PATH = "app/models/efficientnet/food_model.keras"
LABELS_PATH = "app/models/efficientnet/labels.json"

IMG_SIZE = (224, 224)

model = tf.keras.models.load_model(MODEL_PATH)

with open(LABELS_PATH, "r", encoding="utf-8") as f:
    labels = json.load(f)


def preprocess_image(image: Image.Image):

    img = image.resize(IMG_SIZE)

    img_array = tf.keras.preprocessing.image.img_to_array(img)

    img_array = np.expand_dims(img_array, axis=0)

    img_array = preprocess_input(img_array)

    return img_array


def predict_food(image: Image.Image):

    processed = preprocess_image(image)

    predictions = model.predict(processed)[0]

    max_index = int(np.argmax(predictions))

    confidence = float(predictions[max_index])

    predicted_class = labels[str(max_index)]

    top_3_indices = np.argsort(predictions)[-3:][::-1]

    top_3 = [
        {
            "food": labels[str(i)],
            "confidence": round(float(predictions[i]), 4)
        }
        for i in top_3_indices
    ]

    return {
        "food": predicted_class,
        "confidence": round(confidence, 4),
        "top_3": top_3
    }