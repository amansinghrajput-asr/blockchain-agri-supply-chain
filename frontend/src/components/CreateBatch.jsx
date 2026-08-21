import { useState, useEffect } from "react";
import { createBatch } from "../api";
import { useToast } from "../App";

const PRESET_CROPS = [
  "Wheat",
  "Rice",
  "Tomato",
  "Potato",
  "Apple",
  "Mango",
  "Maize",
  "Cotton",
  "Soybean",
  "Sugarcane",
];

export default function CreateBatch({ navigate }) {
  const addToast = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    farmer: "",
    crop: "Wheat",
    quantity: "",
    location: "",
  });
  const [customCrop, setCustomCrop] = useState("");
  const [isCustom, setIsCustom] = useState(false);

  const update = (key, val) => setForm((prev) => ({ ...prev, [key]: val }));

  async function handleSubmit(e) {
    e.preventDefault();
    const finalCrop = isCustom ? customCrop.trim() : form.crop;
    if (!form.farmer || !finalCrop || !form.quantity) {
      addToast("Please fill in all required fields", "error");
      return;
    }

    setLoading(true);
    try {
      const res = await createBatch({
        ...form,
        crop: finalCrop,
        quantity: Number(form.quantity),
      });
      addToast(`Batch for ${finalCrop} created successfully!`, "success");
      navigate("batch", res.data.id);
    } catch (e) {
      addToast(e.response?.data?.error || "Failed to create batch", "error");
    } finally {
      setLoading(false);
    }
  }

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
          <h1>Create New Batch</h1>
        </div>
        <p className="page-desc">
          Register a new crop batch to begin supply-chain tracking and on-chain verification
        </p>
      </div>

      <div className="grid-2">
        <div className="card" style={{ transform: "none" }}>
          <div className="card-header">
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div className="card-icon card-icon-green">🌱</div>
              <h2>Batch Information</h2>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label className="input-label">Farmer / Producer Name *</label>
              <input
                className="input"
                placeholder="e.g. Aman Singh"
                value={form.farmer}
                onChange={(e) => update("farmer", e.target.value)}
                required
              />
            </div>

            {/* Crop Type Selection */}
            <div className="input-group">
              <label className="input-label">Product / Crop Type *</label>
              <div className="crop-pills-container" style={{ marginBottom: "10px" }}>
                {PRESET_CROPS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`crop-pill ${
                      !isCustom && form.crop === c ? "active" : ""
                    }`}
                    onClick={() => {
                      setIsCustom(false);
                      update("crop", c);
                    }}
                  >
                    {c}
                  </button>
                ))}
                <button
                  type="button"
                  className={`crop-pill ${isCustom ? "active" : ""}`}
                  onClick={() => setIsCustom(true)}
                >
                  ✍️ Other (Custom)
                </button>
              </div>

              {isCustom ? (
                <input
                  className="input fade-in"
                  placeholder="Enter custom crop name (e.g. Organic Turmeric, Dragon Fruit)"
                  value={customCrop}
                  onChange={(e) => setCustomCrop(e.target.value)}
                  autoFocus
                  required
                />
              ) : null}
            </div>

            <div className="input-group">
              <label className="input-label">Quantity (kg) *</label>
              <input
                className="input"
                type="number"
                min="1"
                placeholder="e.g. 500"
                value={form.quantity}
                onChange={(e) => update("quantity", e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <label className="input-label">Farm / Harvest Location</label>
              <input
                className="input"
                placeholder="e.g. Bihar, India"
                value={form.location}
                onChange={(e) => update("location", e.target.value)}
              />
            </div>

            <button
              className="btn btn-primary btn-lg btn-full"
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner" /> Creating...
                </>
              ) : (
                "Create Batch & Generate QR"
              )}
            </button>
          </form>
        </div>

        <div>
          <div className="card" style={{ transform: "none" }}>
            <div className="card-header">
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div className="card-icon card-icon-blue">ℹ️</div>
                <h2>How It Works</h2>
              </div>
            </div>
            <div style={{ color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: "1.8" }}>
              <p style={{ marginBottom: "16px" }}>
                <strong style={{ color: "var(--text-primary)" }}>1. Create</strong> — Register your crop batch with farmer info and quantity.
              </p>
              <p style={{ marginBottom: "16px" }}>
                <strong style={{ color: "var(--text-primary)" }}>2. Quality Check</strong> — Upload a crop image for AI-powered quality assessment.
              </p>
              <p style={{ marginBottom: "16px" }}>
                <strong style={{ color: "var(--text-primary)" }}>3. Track</strong> — Follow the batch through transit with QR codes.
              </p>
              <p style={{ marginBottom: "16px" }}>
                <strong style={{ color: "var(--text-primary)" }}>4. Settle</strong> — Smart contract settles payment based on quality.
              </p>
              <p>
                <strong style={{ color: "var(--text-primary)" }}>5. Verify</strong> — Anyone can scan the QR code to verify the batch history on-chain.
              </p>
            </div>
          </div>

          <div
            className="card"
            style={{
              transform: "none",
              marginTop: "20px",
              background: "rgba(34, 197, 94, 0.05)",
              borderColor: "rgba(34, 197, 94, 0.15)",
            }}
          >
            <div style={{ display: "flex", gap: "12px", alignItems: "start" }}>
              <span style={{ fontSize: "1.5rem" }}>🔒</span>
              <div>
                <h3 style={{ marginBottom: "6px" }}>Blockchain Secured</h3>
                <p
                  style={{
                    fontSize: "0.85rem",
                    color: "var(--text-secondary)",
                    lineHeight: "1.6",
                  }}
                >
                  Every batch is recorded on the Polygon blockchain for immutable transparency. Quality scores and settlements are verified on-chain.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
