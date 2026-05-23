import json

NUTRITION_DB_PATH = "app/database/nutrition_data.json"

with open(NUTRITION_DB_PATH, "r", encoding="utf-8") as f:
    nutrition_db = json.load(f)


def get_calories(food_name: str):

    food_name = food_name.lower()

    if food_name not in nutrition_db:

        return {
            "found": False,
            "food": food_name
        }

    return {
        "found": True,
        "food": food_name,
        "calories_per_100g": nutrition_db[food_name]
    }