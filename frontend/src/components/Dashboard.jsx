import { useEffect, useState } from "react";
import { listBatches } from "../api";
import { formatDate } from "../utils";
import { useToast } from "../App";

const STATUS_ICONS = {
  HARVESTED: "🌱",
  QUALITY_CHECKED: "🔬",
  IN_TRANSIT: "🚛",
  DELIVERED: "📦",
  SETTLED: "✅",
};

export default function Dashboard({ navigate }) {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const addToast = useToast();

  useEffect(() => {
    loadBatches();
  }, []);

  async function loadBatches() {
    setLoading(true);
    try {
      const res = await listBatches();
      setBatches(res.data);
    } catch (e) {
      addToast("Failed to load batches", "error");
    } finally {
      setLoading(false);
    }
  }

  const stats = {
    total: batches.length,
    harvested: batches.filter((b) => b.status === "HARVESTED").length,
    inTransit: batches.filter((b) => b.status === "IN_TRANSIT").length,
    settled: batches.filter((b) => b.status === "SETTLED").length,
  };

  return (
    <>
      <div className="page-header">
        <div className="page-title">
          <h1>Dashboard</h1>
        </div>
        <p className="page-desc">
          Overview of all supply-chain batches and their current status
        </p>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Batches</div>
          <div className="stat-value" style={{ color: "var(--green-400)" }}>
            {stats.total}
          </div>
          <div className="stat-sub">All time</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Harvested</div>
          <div className="stat-value" style={{ color: "var(--emerald-400)" }}>
            {stats.harvested}
          </div>
          <div className="stat-sub">Awaiting quality check</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">In Transit</div>
          <div className="stat-value" style={{ color: "var(--amber-400)" }}>
            {stats.inTransit}
          </div>
          <div className="stat-sub">On the move</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Settled</div>
          <div className="stat-value" style={{ color: "var(--blue-400)" }}>
            {stats.settled}
          </div>
          <div className="stat-sub">Payment complete</div>
        </div>
      </div>

      {/* Actions */}
      <div className="section">
        <div className="section-header">
          <h2>Recent Batches</h2>
          <div style={{ display: "flex", gap: "8px" }}>
            <button className="btn btn-ghost btn-sm" onClick={loadBatches}>
              ↻ Refresh
            </button>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => navigate("create")}
            >
              + New Batch
            </button>
          </div>
        </div>

        {loading ? (
          <div className="card" style={{ padding: "40px", textAlign: "center" }}>
            <div className="spinner spinner-lg" style={{ margin: "0 auto" }} />
          </div>
        ) : batches.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <div className="empty-state-icon">📦</div>
              <div className="empty-state-title">No batches yet</div>
              <p>Create your first supply-chain batch to get started</p>
              <button
                className="btn btn-primary"
                style={{ marginTop: "16px" }}
                onClick={() => navigate("create")}
              >
                Create Batch
              </button>
            </div>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Crop</th>
                  <th>Farmer</th>
                  <th>Quantity</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th>Quality</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {batches.map((b) => (
                  <tr
                    key={b.id}
                    style={{ cursor: "pointer" }}
                    onClick={() => navigate("batch", b.id)}
                  >
                    <td className="table-link">
                      {STATUS_ICONS[b.status] || "📋"} {b.crop}
                    </td>
                    <td>{b.farmer}</td>
                    <td>{b.quantity} kg</td>
                    <td>{b.location || "—"}</td>
                    <td>
                      <span
                        className={`badge badge-${b.status?.toLowerCase()}`}
                      >
                        {b.status?.replace("_", " ")}
                      </span>
                    </td>
                    <td>
                      {b.harvest_score != null
                        ? `${b.harvest_score}/100`
                        : "—"}
                    </td>
                    <td>
                      {formatDate(b.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
