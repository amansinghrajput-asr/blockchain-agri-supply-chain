import { useState, useEffect } from "react";
import { listBatches, assess } from "../api";
import { useToast } from "../App";

const PRESET_CROPS = [
  { name: "Wheat", icon: "🌾" },
  { name: "Rice", icon: "🍚" },
  { name: "Tomato", icon: "🍅" },
  { name: "Potato", icon: "🥔" },
  { name: "Apple", icon: "🍎" },
  { name: "Mango", icon: "🥭" },
  { name: "Maize", icon: "🌽" },
  { name: "Cotton", icon: "🌿" },
  { name: "Soybean", icon: "🫘" },
  { name: "Grapes", icon: "🍇" },
];

export default function QualityAssess({ navigate }) {
  const addToast = useToast();
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState("");
  const [selectedCrop, setSelectedCrop] = useState("Wheat");
  const [customCrop, setCustomCrop] = useState("");
  const [isCustom, setIsCustom] = useState(false);
  const [stage, setStage] = useState("harvest");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    listBatches()
      .then((r) => setBatches(r.data))
      .catch(() => {});
  }, []);

  // When a batch is selected, auto-sync the crop name
  function handleBatchChange(bId) {
    setSelectedBatch(bId);
    if (bId) {
      const b = batches.find((item) => item.id === bId);
      if (b && b.crop) {
        const found = PRESET_CROPS.find(
          (c) => c.name.toLowerCase() === b.crop.toLowerCase()
        );
        if (found) {
          setSelectedCrop(found.name);
          setIsCustom(false);
        } else {
          setIsCustom(true);
          setCustomCrop(b.crop);
        }
      }
    }
  }

  function handleFile(e) {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setResult(null);
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result);
    reader.readAsDataURL(f);
  }

  const activeCropName = isCustom
    ? customCrop.trim() || "Custom Product"
    : selectedCrop;

  async function handleAssess() {
    if (!file) {
      addToast("Please select a crop image first", "error");
      return;
    }
    if (isCustom && !customCrop.trim()) {
      addToast("Please enter your custom product name", "error");
      return;
    }

    setLoading(true);
    try {
      const form = new FormData();
      form.append("image", file);
      form.append("productName", activeCropName);
      if (selectedBatch) {
        form.append("batchId", selectedBatch);
        form.append("stage", stage);
      }

      const res = await assess(form);
      setResult({ ...res.data, scannedProduct: activeCropName });
      addToast(
        `Quality assessment complete for ${activeCropName}: Grade ${res.data.grade}`,
        "success"
      );
    } catch (e) {
      addToast(
        e.response?.data?.error || "AI service unavailable",
        "error"
      );
    } finally {
      setLoading(false);
    }
  }

  const getScoreColor = (score) => {
    if (score >= 80) return "var(--green-400)";
    if (score >= 65) return "var(--blue-400)";
    if (score >= 50) return "var(--amber-400)";
    return "var(--red-400)";
  };

  return (
    <>
      <div className="page-header">
        <div className="page-title">
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => navigate("dashboard")}
          >
            ← Back
          </button>
          <h1>AI Quality Assessment</h1>
        </div>
        <p className="page-desc">
          Upload a crop image for computer-vision powered quality scoring & defect analysis
        </p>
      </div>

      <div className="grid-2">
        {/* Upload & Options Form */}
        <div className="card" style={{ transform: "none" }}>
          <div className="card-header">
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div className="card-icon card-icon-green">🔬</div>
              <h2>Select Product & Upload</h2>
            </div>
          </div>

          {/* Product / Crop Selection Section */}
          <div className="input-group">
            <label className="input-label">
              Choose Product / Crop to Scan
            </label>
            <div className="crop-pills-container">
              {PRESET_CROPS.map((c) => (
                <button
                  key={c.name}
                  type="button"
                  className={`crop-pill ${
                    !isCustom && selectedCrop === c.name ? "active" : ""
                  }`}
                  onClick={() => {
                    setIsCustom(false);
                    setSelectedCrop(c.name);
                  }}
                >
                  <span>{c.icon}</span> {c.name}
                </button>
              ))}
              <button
                type="button"
                className={`crop-pill ${isCustom ? "active" : ""}`}
                onClick={() => setIsCustom(true)}
              >
                <span>✍️</span> Other (Write custom)
              </button>
            </div>
          </div>

          {/* Custom Product Text Input (Shown when "Other" is selected) */}
          {isCustom && (
            <div className="input-group fade-in">
              <label className="input-label">Custom Product Name *</label>
              <input
                className="input"
                type="text"
                placeholder="e.g. Organic Turmeric, Dragon Fruit, Cardamom"
                value={customCrop}
                onChange={(e) => setCustomCrop(e.target.value)}
                autoFocus
              />
            </div>
          )}

          {/* Batch selector (optional) */}
          {batches.length > 0 && (
            <div className="input-group">
              <label className="input-label">
                Link to Supply Chain Batch (optional)
              </label>
              <select
                className="input"
                value={selectedBatch}
                onChange={(e) => handleBatchChange(e.target.value)}
              >
                <option value="">— No batch (Standalone assessment) —</option>
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.crop} — {b.farmer} ({b.id.slice(0, 8)}…)
                  </option>
                ))}
              </select>
            </div>
          )}

          {selectedBatch && (
            <div className="input-group">
              <label className="input-label">Assessment Stage</label>
              <select
                className="input"
                value={stage}
                onChange={(e) => setStage(e.target.value)}
              >
                <option value="harvest">Harvest (Pre-shipment baseline)</option>
                <option value="delivery">Delivery (Post-shipment verification)</option>
              </select>
            </div>
          )}

          {/* File drop */}
          <div className="input-file" style={{ marginBottom: "16px" }}>
            <input type="file" accept="image/*" onChange={handleFile} />
            {preview ? (
              <img
                src={preview}
                alt="Preview"
                style={{
                  maxWidth: "100%",
                  maxHeight: "220px",
                  borderRadius: "var(--radius-md)",
                }}
              />
            ) : (
              <>
                <div className="input-file-icon">📸</div>
                <div className="input-file-text">
                  <strong>Click to upload</strong> or drag & drop crop photo
                  <br />
                  JPG, PNG, WEBP up to 10 MB
                </div>
              </>
            )}
          </div>

          <button
            className="btn btn-primary btn-lg btn-full"
            onClick={handleAssess}
            disabled={loading || !file}
          >
            {loading ? (
              <>
                <span className="spinner" /> Analyzing {activeCropName}...
              </>
            ) : (
              `Assess Quality for ${activeCropName}`
            )}
          </button>
        </div>

        {/* Results / Info */}
        <div>
          {result ? (
            <div className="card score-card" style={{ transform: "none" }}>
              <div className="card-header">
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div className="card-icon card-icon-green">📊</div>
                  <div>
                    <h2>Quality Analysis Result</h2>
                    <span className="badge badge-harvested" style={{ marginTop: "4px" }}>
                      Product: {result.scannedProduct || activeCropName}
                    </span>
                  </div>
                </div>
                <span
                  className="badge"
                  style={{
                    fontSize: "1rem",
                    padding: "6px 14px",
                    background: `${getScoreColor(result.score)}20`,
                    color: getScoreColor(result.score),
                    border: `1px solid ${getScoreColor(result.score)}40`,
                  }}
                >
                  Grade {result.grade}
                </span>
              </div>

              {/* Score Ring */}
              <div className="score-ring">
                <svg viewBox="0 0 160 160">
                  <circle className="score-ring-bg" cx="80" cy="80" r="70" />
                  <circle
                    className="score-ring-fill"
                    cx="80"
                    cy="80"
                    r="70"
                    stroke={getScoreColor(result.score)}
                    strokeDasharray={`${(result.score / 100) * 440} 440`}
                  />
                </svg>
                <div className="score-ring-text">
                  <div
                    className="score-ring-value"
                    style={{ color: getScoreColor(result.score) }}
                  >
                    {result.score}
                  </div>
                  <div className="score-ring-label">out of 100</div>
                </div>
              </div>

              {/* Metrics */}
              {result.metrics && (
                <div style={{ marginTop: "24px" }}>
                  <div className="metric-row">
                    <span className="metric-label">Sharpness (Clarity)</span>
                    <span className="metric-value">
                      {result.metrics.sharpness}
                    </span>
                  </div>
                  <div className="metric-bar">
                    <div
                      className="metric-bar-fill"
                      style={{
                        width: `${Math.min(result.metrics.sharpness, 100)}%`,
                        background: "var(--green-400)",
                      }}
                    />
                  </div>

                  <div className="metric-row" style={{ marginTop: "12px" }}>
                    <span className="metric-label">Color Saturation</span>
                    <span className="metric-value">
                      {result.metrics.saturation}
                    </span>
                  </div>
                  <div className="metric-bar">
                    <div
                      className="metric-bar-fill"
                      style={{
                        width: `${Math.min(result.metrics.saturation, 100)}%`,
                        background: "var(--blue-400)",
                      }}
                    />
                  </div>

                  <div className="metric-row" style={{ marginTop: "12px" }}>
                    <span className="metric-label">Brightness</span>
                    <span className="metric-value">
                      {result.metrics.brightness}
                    </span>
                  </div>
                  <div className="metric-bar">
                    <div
                      className="metric-bar-fill"
                      style={{
                        width: `${Math.min(result.metrics.brightness, 100)}%`,
                        background: "var(--amber-400)",
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Explanation */}
              {result.explanation && (
                <div
                  style={{
                    marginTop: "20px",
                    padding: "12px 16px",
                    borderRadius: "var(--radius-md)",
                    background: "var(--bg-card-alt)",
                    border: "1px solid var(--border-color)",
                    fontSize: "0.85rem",
                    color: "var(--text-secondary)",
                    lineHeight: "1.6",
                  }}
                >
                  💡 {result.explanation}
                </div>
              )}

              {/* Action buttons */}
              {selectedBatch && (
                <button
                  className="btn btn-primary btn-full"
                  style={{ marginTop: "20px" }}
                  onClick={() => navigate("batch", selectedBatch)}
                >
                  View Updated Batch Details →
                </button>
              )}
            </div>
          ) : (
            <div className="card" style={{ transform: "none" }}>
              <div className="card-header">
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div className="card-icon card-icon-amber">ℹ️</div>
                  <h2>About AI Assessment</h2>
                </div>
              </div>
              <div
                style={{
                  color: "var(--text-secondary)",
                  fontSize: "0.9rem",
                  lineHeight: "1.8",
                }}
              >
                <p style={{ marginBottom: "16px" }}>
                  Our computer-vision engine computes a comprehensive quality score based on:
                </p>
                <ul style={{ paddingLeft: "20px", marginBottom: "16px" }}>
                  <li><strong>Laplacian Variance</strong> — measures texture crispness and detects surface rot or blur.</li>
                  <li><strong>HSV Saturation</strong> — checks color richness indicating ripeness and freshness.</li>
                  <li><strong>Luminance Spread</strong> — detects discoloration, spots, or uneven harvesting.</li>
                </ul>
                <p>
                  Scores automatically link to blockchain smart contracts to trigger on-chain settlement payouts!
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
