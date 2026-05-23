"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import s from "@/styles/food.module.css";
import {
  analyzeFood,
  blobUrlToFile,
  formatCalories,
  confidenceColor,
  confidenceLabel,
} from "@/lib/foodAnalysis";

// ─── Icon helpers (inline SVG để không cần cài thêm package) ───
const Icon = {
  Upload: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  ),
  Camera: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  ),
  Snap: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="4" fill="currentColor" />
    </svg>
  ),
  Reset: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="1 4 1 10 7 10" />
      <path d="M3.51 15a9 9 0 1 0 .49-4.95" />
    </svg>
  ),
  Scan: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9V5a2 2 0 0 1 2-2h4M3 15v4a2 2 0 0 0 2 2h4M15 3h4a2 2 0 0 1 2 2v4M15 21h4a2 2 0 0 0 2-2v-4" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  ),
};

// ─── Loading Steps ─────────────────────────────────────────────
const STEPS = [
  { icon: "🔍", label: "Nhận diện thực phẩm (YOLO)" },
  { icon: "🏷️", label: "Phân loại món ăn" },
  { icon: "📐", label: "Ước tính độ sâu (Depth)" },
  { icon: "🔢", label: "Tính toán Calorie" },
];

export default function Home() {
  // ── State ──────────────────────────────────────────────────
  const [tab, setTab] = useState("upload"); // "upload" | "camera"
  const [preview, setPreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // ── Cleanup camera khi unmount ─────────────────────────────
  useEffect(() => {
    return () => stopCamera();
  }, []);

  // ── File chọn từ input ─────────────────────────────────────
  const handleFileChange = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
    setResult(null);
    setError(null);
  };

  // ── Drag & Drop ────────────────────────────────────────────
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileChange(file);
  }, []);

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  // ── Camera ─────────────────────────────────────────────────
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: 1280, height: 960 },
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCameraOn(true);
      setError(null);
    } catch {
      setError("Không thể truy cập camera. Vui lòng cấp quyền camera trong trình duyệt.");
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraOn(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width  = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext("2d").drawImage(videoRef.current, 0, 0);
    const url = canvas.toDataURL("image/jpeg", 0.92);
    setPreview(url);

    // Chuyển dataURL → File
    fetch(url)
      .then((r) => r.blob())
      .then((blob) => {
        const file = new File([blob], `capture_${Date.now()}.jpg`, { type: "image/jpeg" });
        setSelectedFile(file);
      });

    stopCamera();
    setResult(null);
    setError(null);
  };

  const handleTabChange = (newTab) => {
    setTab(newTab);
    if (newTab === "camera") startCamera();
    else stopCamera();
  };

  // ── Analyze ────────────────────────────────────────────────
  const handleAnalyze = async () => {
    if (!selectedFile) return;
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const data = await analyzeFood(selectedFile);
      setResult(data);
    } catch (err) {
      setError(err.message || "Lỗi kết nối API. Kiểm tra backend đang chạy.");
    } finally {
      setLoading(false);
    }
  };

  // ── Reset ──────────────────────────────────────────────────
  const handleReset = () => {
    setPreview(null);
    setSelectedFile(null);
    setResult(null);
    setError(null);
    stopCamera();
  };

  // ── Render ─────────────────────────────────────────────────
  return (
    <div className={s.root}>
      <main className={s.page}>
        <div className={s.container}>

          {/* ── Header ── */}
          <header className={s.header}>
            <div className={s.badge}>
              <span>⚡</span>
              <span>{process.env.NEXT_PUBLIC_APP_NAME || "CalorieLens AI"}</span>
            </div>
            <h1 className={s.title}>
              Tính toán <em>Lượng Calo</em><br />
              trong Hình Ảnh bằng AI
            </h1>
            <p className={s.subtitle}>
              Tải ảnh hoặc chụp trực tiếp — AI sẽ nhận diện món ăn,
              ước tính khẩu phần và tính calo chỉ trong vài giây.
            </p>
          </header>

          {/* ── Upload Section ── */}
          <section className={s.uploadSection}>
            {/* Tab bar */}
            <div className={s.tabBar}>
              <button
                className={`${s.tab} ${tab === "upload" ? s.tabActive : ""}`}
                onClick={() => handleTabChange("upload")}
              >
                <Icon.Upload /> Tải ảnh lên
              </button>
              <button
                className={`${s.tab} ${tab === "camera" ? s.tabActive : ""}`}
                onClick={() => handleTabChange("camera")}
              >
                <Icon.Camera /> Chụp ảnh
              </button>
            </div>

            <div className={s.uploadBody}>
              {/* Upload tab */}
              {tab === "upload" && !preview && (
                <div
                  className={`${s.dropzone} ${dragOver ? s.dropzoneActive : ""}`}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={() => setDragOver(false)}
                >
                  <div className={s.dropIcon}>🍱</div>
                  <p className={s.dropText}>
                    Kéo thả ảnh vào đây hoặc{" "}
                    <strong>nhấp để chọn file</strong>
                  </p>
                  <p className={s.dropText} style={{ marginTop: 6, fontSize: 13 }}>
                    Hỗ trợ JPG, PNG, WEBP
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    className={s.fileInput}
                    onChange={(e) => handleFileChange(e.target.files[0])}
                  />
                </div>
              )}

              {/* Camera tab */}
              {tab === "camera" && !preview && (
                <div className={s.cameraPanel}>
                  <div className={s.videoWrapper}>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className={s.video}
                    />
                    {cameraOn && <div className={s.scanLine} />}
                  </div>
                  <div className={s.cameraControls}>
                    {cameraOn ? (
                      <>
                        <button className={s.analyzeBtn} onClick={capturePhoto}>
                          <Icon.Snap /> Chụp ảnh
                        </button>
                        <button className={s.btnOutline} onClick={stopCamera}>
                          Tắt camera
                        </button>
                      </>
                    ) : (
                      <button className={s.analyzeBtn} onClick={startCamera}>
                        <Icon.Camera /> Bật camera
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Preview row (shared cho cả 2 tab) */}
              {preview && (
                <div className={s.previewRow}>
                  <img src={preview} alt="preview" className={s.previewThumb} />
                  <div className={s.previewMeta}>
                    <div className={s.previewName}>
                      {selectedFile?.name || "Ảnh chụp"}
                    </div>
                    <div className={s.previewSize}>
                      {selectedFile
                        ? `${(selectedFile.size / 1024).toFixed(1)} KB`
                        : "JPEG capture"}
                    </div>
                  </div>
                  <button
                    className={s.btnOutline}
                    onClick={handleReset}
                    style={{ marginRight: 8 }}
                  >
                    <Icon.Reset /> Xóa
                  </button>
                  <button
                    className={s.analyzeBtn}
                    onClick={handleAnalyze}
                    disabled={loading}
                  >
                    {loading ? (
                      <><div className={s.spinner} /> Đang xử lý…</>
                    ) : (
                      <><Icon.Scan /> Phân tích</>
                    )}
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* ── Error ── */}
          {error && (
            <div className={s.errorCard}>
              <span className={s.errorIcon}>⚠️</span>
              <div>
                <div className={s.errorTitle}>Có lỗi xảy ra</div>
                <div className={s.errorMsg}>{error}</div>
              </div>
            </div>
          )}

          {/* ── Loading ── */}
          {loading && (
            <div className={s.loadingCard}>
              <p style={{ fontWeight: 600, marginBottom: 4 }}>AI đang phân tích…</p>
              <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 16 }}>
                Có thể mất 5–15 giây tùy kích thước ảnh
              </p>
              <div className={s.loadingSteps}>
                {STEPS.map((step) => (
                  <div key={step.label} className={s.loadingStep}>
                    <div className={s.stepDot} />
                    <span style={{ fontSize: 16, marginRight: 4 }}>{step.icon}</span>
                    <span className={s.stepLabel}>{step.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Results ── */}
          {result?.success && (
            <>
              <div className={s.resultsHeader}>
                <h2 className={s.resultsTitle}>Kết quả phân tích</h2>
                <button className={s.btnOutline} onClick={handleReset}>
                  <Icon.Reset /> Phân tích ảnh mới
                </button>
              </div>

              <div className={s.grid}>

                {/* Hero — Calorie */}
                <div className={s.cardHero}>
                  <div className={s.heroIcon}>🔥</div>
                  <div className={s.heroContent}>
                    <div className={s.heroLabel}>Ước tính Calorie</div>
                    <div className={s.heroValue}>
                      {formatCalories(result.estimated_calories)}
                    </div>
                    <div className={s.heroUnit}>kcal / khẩu phần</div>
                  </div>
                  <div className={s.heroMeta}>
                    <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 8 }}>
                      Khẩu phần
                    </div>
                    <div className={s.portionBadge}>
                      {result.portion?.portion}
                    </div>
                  </div>
                </div>

                {/* Food Prediction */}
                <div className={s.card} style={{ gridColumn: "1 / -1" }}>
                  <div className={s.cardTitle}>Nhận diện món ăn</div>
                  <div className={s.foodName}>{result.prediction?.food}</div>
                  <div style={{ marginTop: 16 }}>
                    <div className={s.confRow}>
                      <span style={{ fontSize: 13, color: "var(--muted)" }}>Độ chính xác</span>
                      <span
                        className={s.confTag}
                        style={{
                          background: confidenceColor(result.prediction?.confidence) + "22",
                          color: confidenceColor(result.prediction?.confidence),
                        }}
                      >
                        {confidenceLabel(result.prediction?.confidence)}
                      </span>
                    </div>
                    <div className={s.confBar}>
                      <div
                        className={s.confFill}
                        style={{
                          width: `${(result.prediction?.confidence * 100).toFixed(1)}%`,
                          background: confidenceColor(result.prediction?.confidence),
                        }}
                      />
                    </div>
                    <div style={{ marginTop: 6, fontSize: 13, color: "var(--muted)" }}>
                      {(result.prediction?.confidence * 100).toFixed(2)}%
                    </div>
                  </div>
                </div>



              </div>
            </>
          )}

        </div>
      </main>
    </div>
  );
}