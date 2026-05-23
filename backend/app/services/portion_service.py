def estimate_portion(
    bbox,
    image_width,
    image_height,
    avg_depth
):

    x1, y1, x2, y2 = bbox

    # Diện tích object
    bbox_area = (x2 - x1) * (y2 - y1)

    # Diện tích toàn ảnh
    image_area = image_width * image_height

    # Tỷ lệ diện tích
    area_ratio = bbox_area / image_area

    # Portion score
    portion_score = area_ratio * (avg_depth / 255)

    # Mapping portion
    if portion_score > 0.5:
        portion = "large"
        multiplier = 1.5

    elif portion_score > 0.25:
        portion = "medium"
        multiplier = 1.0

    else:
        portion = "small"
        multiplier = 0.7

    return {
        "portion": portion,
        "multiplier": multiplier,
        "area_ratio": round(area_ratio, 4),
        "portion_score": round(portion_score, 4)
    }