import React, { useState } from 'react';
import './App.css';

const DEFAULT_PORTION = 1.0;
const MIN_PORTION = 0.1;
const PORTION_STEP = 0.1;

const formatPortion = (value) => value.toFixed(1);

const normalizePortion = (value) => {
  const parsed = Number.parseFloat(String(value).replace(',', '.'));

  if (!Number.isFinite(parsed)) {
    return DEFAULT_PORTION;
  }

  return Math.max(MIN_PORTION, Math.round(parsed * 10) / 10);
};

const formatFoodName = (name = '') => {
  return name.replace(/_/g, ' ').trim() || 'Món ăn';
};

function App() {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [portionInput, setPortionInput] = useState(formatPortion(DEFAULT_PORTION));
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const portion = normalizePortion(portionInput);
  const baseCalories = result ? Number(result.base_calories) || 0 : 0;
  const displayCalories = result ? (baseCalories * portion).toFixed(0) : 0;
  const alternativePredictions = Array.isArray(result?.top_3) ? result.top_3.slice(1) : [];

  const handleDragOver = (event) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);

    if (event.dataTransfer.files && event.dataTransfer.files[0]) {
      processFile(event.dataTransfer.files[0]);
    }
  };

  const handleImageChange = (event) => {
    if (event.target.files && event.target.files[0]) {
      processFile(event.target.files[0]);
    }
  };

  const processFile = (file) => {
    if (preview) {
      URL.revokeObjectURL(preview);
    }

    setImage(file);
    setPreview(URL.createObjectURL(file));
    setResult(null);
    setPortionInput(formatPortion(DEFAULT_PORTION));
  };

  const handlePortionChange = (amount) => {
    const nextPortion = normalizePortion(portion + amount);
    setPortionInput(formatPortion(nextPortion));
  };

  const handlePortionInputChange = (event) => {
    const nextValue = event.target.value.replace(',', '.');

    if (nextValue === '' || /^\d*\.?\d*$/.test(nextValue)) {
      setPortionInput(nextValue);
    }
  };

  const handlePortionBlur = () => {
    setPortionInput(formatPortion(normalizePortion(portionInput)));
  };

  const resetAll = () => {
    if (preview) {
      URL.revokeObjectURL(preview);
    }

    setImage(null);
    setPreview(null);
    setResult(null);
    setPortionInput(formatPortion(DEFAULT_PORTION));
  };

  const handleSubmit = async () => {
    if (!image) return;

    const normalizedPortion = normalizePortion(portionInput);
    setPortionInput(formatPortion(normalizedPortion));
    setLoading(true);

    const formData = new FormData();
    formData.append('file', image);
    formData.append('portion', String(normalizedPortion));

    try {
      const response = await fetch('http://localhost:8000/predict/', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();

      if (data.success) {
        setResult(data);
      } else {
        alert(`Lỗi từ server: ${data.error}`);
      }
    } catch (error) {
      alert('Không thể kết nối đến server AI.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="app-shell">
      <header className="hero-header">
        <div className="brand-block">
          <div className="brand-mark">AI</div>
          <div>
            <p className="eyebrow">Food vision assistant</p>
            <h1 className="logo-text">CalorieCam</h1>
          </div>
        </div>
        <p className="hero-copy">
          Nhận diện món ăn từ ảnh, điều chỉnh khẩu phần thực tế và ước tính năng lượng trong vài giây.
        </p>
      </header>

      {!preview ? (
        <section className="upload-wrapper" aria-label="Tải ảnh món ăn">
          <label
            className={`upload-dashed ${isDragging ? 'dragging' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              type="file"
              accept="image/jpeg, image/png, image/webp"
              className="upload-input"
              onChange={handleImageChange}
            />
            <span className="upload-symbol" aria-hidden="true">
              <span />
            </span>
            <strong>Tải ảnh món ăn lên</strong>
            <span>Kéo thả ảnh vào đây hoặc nhấn để chọn từ thiết bị</span>
            <small>JPG, PNG hoặc WEBP</small>
          </label>
        </section>
      ) : (
        <section className="content-grid">
          <div className="left-panel">
            <div className="image-stage">
              <img src={preview} alt="Ảnh món ăn đã chọn" className="image-preview" />
            </div>
            <button type="button" onClick={resetAll} className="btn-retake">
              Chọn ảnh khác
            </button>
          </div>

          <div className={`right-panel ${result ? 'has-result' : 'is-ready'}`}>
            {!result ? (
              <div className="ready-panel">
                <p className="eyebrow">Ảnh đã sẵn sàng</p>
                <h2>Phân tích dinh dưỡng</h2>
                <p>
                  CalorieCam sẽ dự đoán món ăn, mức độ tin cậy và lượng calo theo khẩu phần mặc định.
                </p>
                <button type="button" onClick={handleSubmit} className="btn-analyze" disabled={loading}>
                  {loading ? (
                    <>
                      <span className="loading-dot" aria-hidden="true" />
                      Đang phân tích...
                    </>
                  ) : (
                    'Bắt đầu nhận diện'
                  )}
                </button>
              </div>
            ) : (
              <>
                <div className="result-heading">
                  <p className="eyebrow">Kết quả nhận diện</p>
                  <h2 className="food-title">{formatFoodName(result.predicted_class)}</h2>
                  <p className="confidence-text">
                    Độ chính xác {(result.confidence * 100).toFixed(1)}% · Mặc định {baseCalories} kcal/phần
                  </p>
                </div>

                <div className="calorie-box">
                  <span className="calorie-label">Ước tính hiện tại</span>
                  <div className="calorie-number">
                    {displayCalories}
                    <span className="calorie-unit">kcal</span>
                  </div>
                </div>

                <div className="portion-row">
                  <div className="portion-copy">
                    <span className="portion-label">Khẩu phần thực tế</span>
                    <small>Nhập số thập phân hoặc tăng giảm từng 0.1 phần.</small>
                  </div>
                  <div className="portion-controls">
                    <button
                      type="button"
                      className="portion-btn"
                      onClick={() => handlePortionChange(-PORTION_STEP)}
                      aria-label="Giảm khẩu phần 0.1"
                    >
                      −
                    </button>
                    <input
                      className="portion-input"
                      type="number"
                      min={MIN_PORTION}
                      step={PORTION_STEP}
                      inputMode="decimal"
                      value={portionInput}
                      onChange={handlePortionInputChange}
                      onBlur={handlePortionBlur}
                      aria-label="Khẩu phần thực tế"
                    />
                    <button
                      type="button"
                      className="portion-btn"
                      onClick={() => handlePortionChange(PORTION_STEP)}
                      aria-label="Tăng khẩu phần 0.1"
                    >
                      +
                    </button>
                  </div>
                </div>

                {alternativePredictions.length > 0 && (
                  <div className="alt-section">
                    <span>Dự đoán thay thế</span>
                    <div className="alt-tags">
                      {alternativePredictions.map((item) => (
                        <button
                          type="button"
                          key={`${item.class}-${item.confidence}`}
                          className="tag"
                          onClick={() => alert('Tính năng chuyển món đang được phát triển.')}
                        >
                          {formatFoodName(item.class)} ({(item.confidence * 100).toFixed(0)}%)
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      )}
    </main>
  );
}

export default App;
