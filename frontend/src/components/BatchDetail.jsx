import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { getBatch, getBatchEvents, updateBatchStatus, settle } from "../api";
import { formatDateTime } from "../utils";
import { useToast } from "../App";

const STATUS_FLOW = [
  "HARVESTED",
  "QUALITY_CHECKED",
  "IN_TRANSIT",
  "DELIVERED",
  "SETTLED",
];

const STATUS_LABELS = {
  HARVESTED: "Harvested",
  QUALITY_CHECKED: "Quality Checked",
  IN_TRANSIT: "In Transit",
  DELIVERED: "Delivered",
  SETTLED: "Settled",
};

export default function BatchDetail({ batchId, navigate }) {
  const addToast = useToast();
  const [batch, setBatch] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (batchId) loadBatch();
  }, [batchId]);

  async function loadBatch() {
    setLoading(true);
    try {
      const [batchRes, eventsRes] = await Promise.all([
        getBatch(batchId),
        getBatchEvents(batchId),
      ]);
      setBatch(batchRes.data);
      setEvents(eventsRes.data);
    } catch (e) {
      addToast("Failed to load batch", "error");
    } finally {
      setLoading(false);
    }
  }

  async function handleAdvanceStatus() {
    if (!batch) return;
    const currentIdx = STATUS_FLOW.indexOf(batch.status);
    const nextStatus = STATUS_FLOW[currentIdx + 1];
    if (!nextStatus || nextStatus === "SETTLED") return;

    setActionLoading(true);
    try {
      await updateBatchStatus(batchId, nextStatus);
      addToast(`Status updated to ${STATUS_LABELS[nextStatus]}`, "success");
      loadBatch();
    } catch (e) {
      addToast(
        e.response?.data?.error || "Failed to update status",
        "error"
      );
    } finally {
      setActionLoading(false);
    }
  }

  async function handleSettle() {
    setActionLoading(true);
    try {
      await settle(batchId);
      addToast("Payment settled successfully!", "success");
      loadBatch();
    } catch (e) {
      addToast(
        e.response?.data?.error || "Settlement failed",
        "error"
      );
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <div style={{ padding: "80px 0", textAlign: "center" }}>
        <div className="spinner spinner-lg" style={{ margin: "0 auto" }} />
      </div>
    );
  }

  if (!batch) {
    return (
      <div className="card">
        <div className="empty-state">
          <div className="empty-state-icon">🔍</div>
          <div className="empty-state-title">Batch Not Found</div>
          <p>The batch ID may be incorrect or expired.</p>
          <button
            className="btn btn-primary"
            style={{ marginTop: "16px" }}
            onClick={() => navigate("dashboard")}
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const currentStatusIdx = STATUS_FLOW.indexOf(batch.status);
  const canAdvance =
    currentStatusIdx < STATUS_FLOW.length - 2 &&
    batch.status !== "SETTLED";
  const canSettle =
    batch.status === "DELIVERED" || batch.status === "QUALITY_CHECKED" || batch.status === "IN_TRANSIT";

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
          <h1>{batch.crop}</h1>
          <span
            className={`badge badge-${batch.status?.toLowerCase()}`}
          >
            {batch.status?.replace("_", " ")}
          </span>
        </div>
        <p className="page-desc">Batch {batch.id}</p>
      </div>

      {/* Status steps */}
      <div className="card" style={{ marginBottom: "20px", transform: "none" }}>
        <div className="status-steps">
          {STATUS_FLOW.map((s, i) => (
            <div
              key={s}
              className={`status-step ${
                i < currentStatusIdx
                  ? "completed"
                  : i === currentStatusIdx
                    ? "active"
                    : ""
              }`}
            >
              <div className="status-step-dot" />
              <div className="status-step-label">
                {STATUS_LABELS[s]}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="detail-grid">
        {/* Left column */}
        <div>
          {/* Info */}
          <div className="card" style={{ transform: "none" }}>
            <div className="card-header">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                }}
              >
                <div className="card-icon card-icon-green">📋</div>
                <h2>Batch Details</h2>
              </div>
            </div>
            <div className="info-grid">
              <div className="info-item">
                <div className="info-item-label">Farmer</div>
                <div className="info-item-value">{batch.farmer}</div>
              </div>
              <div className="info-item">
                <div className="info-item-label">Crop</div>
                <div className="info-item-value">{batch.crop}</div>
              </div>
              <div className="info-item">
                <div className="info-item-label">Quantity</div>
                <div className="info-item-value">{batch.quantity} kg</div>
              </div>
              <div className="info-item">
                <div className="info-item-label">Location</div>
                <div className="info-item-value">
                  {batch.location || "Not specified"}
                </div>
              </div>
              <div className="info-item">
                <div className="info-item-label">Harvest Score</div>
                <div className="info-item-value">
                  {batch.harvest_score != null ? (
                    <span
                      style={{
                        color:
                          batch.harvest_score >= 80
                            ? "var(--green-400)"
                            : batch.harvest_score >= 50
                              ? "var(--amber-400)"
                              : "var(--red-400)",
                      }}
                    >
                      {batch.harvest_score}/100
                    </span>
                  ) : (
                    <span style={{ color: "var(--text-muted)" }}>
                      Not assessed
                    </span>
                  )}
                </div>
              </div>
              <div className="info-item">
                <div className="info-item-label">Delivery Score</div>
                <div className="info-item-value">
                  {batch.delivery_score != null ? (
                    <span
                      style={{
                        color:
                          batch.delivery_score >= 80
                            ? "var(--green-400)"
                            : batch.delivery_score >= 50
                              ? "var(--amber-400)"
                              : "var(--red-400)",
                      }}
                    >
                      {batch.delivery_score}/100
                    </span>
                  ) : (
                    <span style={{ color: "var(--text-muted)" }}>
                      Not assessed
                    </span>
                  )}
                </div>
              </div>
              <div className="info-item" style={{ gridColumn: "1 / -1" }}>
                <div className="info-item-label">Created</div>
                <div className="info-item-value">
                  {formatDateTime(batch.created_at, {
                    dateStyle: "long",
                    timeStyle: "short",
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div
            className="card"
            style={{ transform: "none", marginTop: "20px" }}
          >
            <div className="card-header">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                }}
              >
                <div className="card-icon card-icon-blue">📜</div>
                <h2>Activity Timeline</h2>
              </div>
            </div>
            {events.length > 0 ? (
              <div className="timeline">
                {events.map((ev, i) => (
                  <div key={ev.id} className="timeline-item">
                    <div
                      className={`timeline-dot ${
                        i === events.length - 1 ? "timeline-dot-active" : ""
                      }`}
                    />
                    <div className="timeline-time">
                      {formatDateTime(ev.created_at, {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </div>
                    <div className="timeline-title">{ev.status?.replace("_", " ")}</div>
                    <div className="timeline-desc">{ev.description}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p
                style={{
                  color: "var(--text-muted)",
                  textAlign: "center",
                  padding: "20px",
                }}
              >
                No events recorded yet
              </p>
            )}
          </div>
        </div>

        {/* Right column */}
        <div>
          {/* QR Code */}
          <div className="card" style={{ transform: "none" }}>
            <div className="card-header">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                }}
              >
                <div className="card-icon card-icon-amber">📱</div>
                <h2>QR Traceability</h2>
              </div>
            </div>
            <div className="qr-container">
              <QRCodeSVG
                value={`${window.location.origin}/#batch/${batch.id}`}
                size={180}
                bgColor="#ffffff"
                fgColor="#111a15"
                level="M"
              />
              <div className="qr-caption">Scan to trace this batch</div>
            </div>
            <p
              style={{
                fontSize: "0.8rem",
                color: "var(--text-muted)",
                textAlign: "center",
                marginTop: "12px",
                lineHeight: "1.5",
              }}
            >
              Share this QR code with buyers and transporters for full
              supply-chain transparency.
            </p>
          </div>

          {/* Actions */}
          <div
            className="card"
            style={{ transform: "none", marginTop: "20px" }}
          >
            <div className="card-header">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                }}
              >
                <div className="card-icon card-icon-green">⚡</div>
                <h2>Actions</h2>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              {canAdvance && (
                <button
                  className="btn btn-secondary btn-full"
                  onClick={handleAdvanceStatus}
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <span className="spinner" />
                  ) : (
                    `→ Mark as ${STATUS_LABELS[STATUS_FLOW[currentStatusIdx + 1]]}`
                  )}
                </button>
              )}

              {canSettle && (
                <button
                  className="btn btn-primary btn-full"
                  onClick={handleSettle}
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <>
                      <span className="spinner" /> Settling...
                    </>
                  ) : (
                    "💰 Settle Smart Contract Payment"
                  )}
                </button>
              )}

              <button
                className="btn btn-ghost btn-full"
                onClick={() => navigate("quality")}
              >
                🔬 Run Quality Assessment
              </button>

              {batch.status === "SETTLED" && (
                <div
                  style={{
                    textAlign: "center",
                    padding: "16px",
                    background: "rgba(16, 185, 129, 0.08)",
                    borderRadius: "var(--radius-md)",
                    color: "var(--emerald-400)",
                    fontWeight: "600",
                  }}
                >
                  ✅ This batch has been settled
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
