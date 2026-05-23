// lib/foodAnalysis.js
// Tách riêng logic gọi API và các hàm tiện ích

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

/**
 * Gửi ảnh lên backend để phân tích calorie
 * @param {File} imageFile - File ảnh từ input hoặc camera
 * @returns {Promise<object>} Kết quả từ API
 */
export async function analyzeFood(imageFile) {
  const formData = new FormData();
  formData.append("file", imageFile);

  const response = await fetch(`${API_URL}/predict`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Error ${response.status}: ${errorText}`);
  }

  return response.json();
}

/**
 * Chuyển blob URL (từ camera) thành File object
 * @param {string} blobUrl
 * @param {string} fileName
 * @returns {Promise<File>}
 */
export async function blobUrlToFile(blobUrl, fileName = "capture.jpg") {
  const res = await fetch(blobUrl);
  const blob = await res.blob();
  return new File([blob], fileName, { type: "image/jpeg" });
}

/**
 * Format số calorie có dấu phân cách hàng nghìn
 * @param {number|string} cal
 * @returns {string}
 */
export function formatCalories(cal) {
  return Number(cal).toLocaleString("vi-VN");
}

/**
 * Tính màu thanh confidence theo phần trăm
 * @param {number} confidence 0–1
 * @returns {string} CSS color
 */
export function confidenceColor(confidence) {
  if (confidence >= 0.85) return "#22c55e";
  if (confidence >= 0.6) return "#f59e0b";
  return "#ef4444";
}

/**
 * Label mô tả mức confidence
 * @param {number} confidence 0–1
 * @returns {string}
 */
export function confidenceLabel(confidence) {
  if (confidence >= 0.85) return "Cao";
  if (confidence >= 0.6) return "Trung bình";
  return "Thấp";
}