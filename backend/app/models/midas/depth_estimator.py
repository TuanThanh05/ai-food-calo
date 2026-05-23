import torch
import numpy as np

from PIL import Image
from transformers import pipeline

# Load MiDaS depth estimation pipeline
depth_pipeline = pipeline(
    task="depth-estimation",
    model="Intel/dpt-hybrid-midas"
)


def estimate_depth(image: Image.Image):

    result = depth_pipeline(image)

    depth = result["depth"]

    depth_array = np.array(depth)

    avg_depth = float(np.mean(depth_array))

    max_depth = float(np.max(depth_array))

    min_depth = float(np.min(depth_array))

    return {
        "avg_depth": round(avg_depth, 4),
        "max_depth": round(max_depth, 4),
        "min_depth": round(min_depth, 4)
    }