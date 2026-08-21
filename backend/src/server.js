import express from "express";
import cors from "cors";
import multer from "multer";
import axios from "axios";
import dotenv from "dotenv";
import { v4 as uuid } from "uuid";
import { ethers } from "ethers";
import { pool } from "./db.js";

import crypto from "crypto";

dotenv.config();

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors({ origin: process.env.CORS_ORIGIN?.split(",") || "*" }));
app.use(express.json());

// ── Password hashing utilities ──
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password, storedHash) {
  const [salt, key] = storedHash.split(":");
  if (!salt || !key) return false;
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(key, "hex"));
}

// ── Contract ABI (subset needed for backend calls) ──
const CONTRACT_ABI = [
  "function createBatch(bytes32 id, string calldata crop, uint256 quantity) external",
  "function recordQuality(bytes32 id, uint8 score, bool harvest) external",
  "function settle(bytes32 id) external payable",
  "function batches(bytes32) view returns (string crop, uint256 quantity, uint8 harvestScore, uint8 deliveryScore, address farmer, bool settled)",
  "event BatchCreated(bytes32 indexed id, string crop, uint256 quantity, address indexed farmer)",
  "event QualityRecorded(bytes32 indexed id, uint8 score, bool harvest)",
  "event PaymentSettled(bytes32 indexed id, address indexed farmer, uint256 amount)",
];

function getContract() {
  const { RPC_URL, CONTRACT_ADDRESS, PRIVATE_KEY } = process.env;
  if (!RPC_URL || !CONTRACT_ADDRESS || !PRIVATE_KEY) return null;
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(
    PRIVATE_KEY.startsWith("0x") ? PRIVATE_KEY : `0x${PRIVATE_KEY}`,
    provider
  );
  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, wallet);
}

// ── Status flow ──
const STATUS_FLOW = [
  "HARVESTED",
  "QUALITY_CHECKED",
  "IN_TRANSIT",
  "DELIVERED",
  "SETTLED",
];

// ── Health ──
app.get("/health", (_req, res) =>
  res.json({ ok: true, service: "agri-chain-api" })
);

// ── Auth Endpoints ──
app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ error: "Name, email, and password are required" });
    }
    if (password.length < 6) {
      return res
        .status(400)
        .json({ error: "Password must be at least 6 characters" });
    }
    const cleanEmail = email.toLowerCase().trim();
    const existing = await pool.query("SELECT id FROM users WHERE email = $1", [
      cleanEmail,
    ]);
    if (existing.rowCount > 0) {
      return res
        .status(400)
        .json({ error: "An account with this email already exists" });
    }

    const id = uuid();
    const password_hash = hashPassword(password);
    const userRole = role || "Farmer";
    const now = new Date().toISOString();

    await pool.query(
      "INSERT INTO users(id, name, email, password_hash, role, created_at) VALUES($1,$2,$3,$4,$5,$6)",
      [id, name.trim(), cleanEmail, password_hash, userRole, now]
    );

    const user = {
      id,
      name: name.trim(),
      email: cleanEmail,
      role: userRole,
      created_at: now,
    };
    res.status(201).json({ user, token: `agr_${id}_${Date.now()}` });
  } catch (e) {
    console.error("Registration error:", e);
    res.status(500).json({ error: "Registration failed" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const cleanEmail = email.toLowerCase().trim();
    const r = await pool.query("SELECT * FROM users WHERE email = $1", [
      cleanEmail,
    ]);
    if (r.rowCount === 0) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const userRow = r.rows[0];
    const valid = verifyPassword(password, userRow.password_hash);
    if (!valid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const user = {
      id: userRow.id,
      name: userRow.name,
      email: userRow.email,
      role: userRow.role,
      created_at: userRow.created_at,
    };
    res.json({ user, token: `agr_${user.id}_${Date.now()}` });
  } catch (e) {
    console.error("Login error:", e);
    res.status(500).json({ error: "Login failed" });
  }
});

app.get("/api/auth/me", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "Unauthorized" });
    const token = authHeader.replace("Bearer ", "");
    const parts = token.split("_");
    const userId = parts[1];
    if (!userId) return res.status(401).json({ error: "Invalid token" });

    const r = await pool.query(
      "SELECT id, name, email, role, created_at FROM users WHERE id = $1",
      [userId]
    );
    if (r.rowCount === 0)
      return res.status(404).json({ error: "User not found" });
    res.json(r.rows[0]);
  } catch (e) {
    res.status(500).json({ error: "Auth verification failed" });
  }
});

// ── Create batch ──
app.post("/api/batches", async (req, res) => {
  try {
    const { farmer, crop, quantity, location } = req.body;
    if (!farmer || !crop || !quantity)
      return res
        .status(400)
        .json({ error: "farmer, crop and quantity are required" });

    const id = uuid();
    const now = new Date().toISOString();
    const r = await pool.query(
      "INSERT INTO batches(id, farmer, crop, quantity, location, created_at) VALUES($1,$2,$3,$4,$5,$6) RETURNING *",
      [id, farmer, crop, quantity, location || "", now]
    );

    // Record batch event
    await pool.query(
      "INSERT INTO batch_events(batch_id, status, description, created_at) VALUES($1,$2,$3,$4)",
      [id, "HARVESTED", `Batch created by ${farmer}`, now]
    );

    // On-chain creation (best-effort)
    const contract = getContract();
    let txHash = null;
    if (contract) {
      try {
        const batchId = ethers.keccak256(ethers.toUtf8Bytes(id));
        const tx = await contract.createBatch(batchId, crop, Number(quantity));
        txHash = tx.hash;
      } catch (e) {
        console.warn("On-chain createBatch failed:", e.message);
      }
    }

    res.status(201).json({ ...r.rows[0], txHash });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Database error" });
  }
});

// ── List all batches ──
app.get("/api/batches", async (_req, res) => {
  try {
    const r = await pool.query(
      "SELECT * FROM batches ORDER BY created_at DESC"
    );
    res.json(r.rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Database error" });
  }
});

// ── Get single batch ──
app.get("/api/batches/:id", async (req, res) => {
  try {
    const r = await pool.query("SELECT * FROM batches WHERE id=$1", [
      req.params.id,
    ]);
    if (!r.rowCount)
      return res.status(404).json({ error: "Batch not found" });
    res.json(r.rows[0]);
  } catch (e) {
    res.status(500).json({ error: "Database error" });
  }
});

// ── Get batch timeline ──
app.get("/api/batches/:id/events", async (req, res) => {
  try {
    const r = await pool.query(
      "SELECT * FROM batch_events WHERE batch_id=$1 ORDER BY created_at ASC",
      [req.params.id]
    );
    res.json(r.rows);
  } catch (e) {
    res.status(500).json({ error: "Database error" });
  }
});

// ── AI quality assessment (fixed: proper multipart forwarding) ──
app.post("/api/quality/assess", upload.single("image"), async (req, res) => {
  if (!req.file)
    return res.status(400).json({ error: "Image is required" });

  try {
    // Build a proper multipart form to forward to the AI service
    const FormData = (await import("form-data")).default;
    const form = new FormData();
    form.append("image", req.file.buffer, {
      filename: req.file.originalname || "upload.jpg",
      contentType: req.file.mimetype,
    });

    const r = await axios.post(
      `${process.env.AI_SERVICE_URL}/assess`,
      form,
      { headers: form.getHeaders() }
    );

    // Save quality score to batch if batchId provided
    const batchId = req.body?.batchId;
    if (batchId && r.data?.score != null) {
      const isHarvest = req.body?.stage !== "delivery";
      const col = isHarvest ? "harvest_score" : "delivery_score";
      await pool.query(`UPDATE batches SET ${col}=$1 WHERE id=$2`, [
        r.data.score,
        batchId,
      ]);

      // Update status and log event
      if (isHarvest) {
        await pool.query(
          "UPDATE batches SET status='QUALITY_CHECKED' WHERE id=$1 AND status='HARVESTED'",
          [batchId]
        );
        await pool.query(
          "INSERT INTO batch_events(batch_id, status, description, created_at) VALUES($1,$2,$3,$4)",
          [
            batchId,
            "QUALITY_CHECKED",
            `AI quality assessment: score ${r.data.score}, grade ${r.data.grade}`,
            new Date().toISOString(),
          ]
        );
      }

      // On-chain quality recording (best-effort)
      const contract = getContract();
      if (contract) {
        try {
          const onChainId = ethers.keccak256(ethers.toUtf8Bytes(batchId));
          await contract.recordQuality(
            onChainId,
            Math.round(r.data.score),
            isHarvest
          );
        } catch (e) {
          console.warn("On-chain recordQuality failed:", e.message);
        }
      }
    }

    res.json(r.data);
  } catch (e) {
    console.error(e.response?.data || e.message);
    res.status(502).json({ error: "AI service unavailable" });
  }
});

// ── Update batch status ──
app.patch("/api/batches/:id/status", async (req, res) => {
  try {
    const { status, description } = req.body;
    if (!status || !STATUS_FLOW.includes(status))
      return res.status(400).json({
        error: `Invalid status. Must be one of: ${STATUS_FLOW.join(", ")}`,
      });

    const current = await pool.query(
      "SELECT status FROM batches WHERE id=$1",
      [req.params.id]
    );
    if (!current.rowCount)
      return res.status(404).json({ error: "Batch not found" });

    const currentIdx = STATUS_FLOW.indexOf(current.rows[0].status);
    const newIdx = STATUS_FLOW.indexOf(status);
    if (newIdx <= currentIdx)
      return res.status(400).json({
        error: `Cannot move from ${current.rows[0].status} to ${status}`,
      });

    const r = await pool.query(
      "UPDATE batches SET status=$1 WHERE id=$2 RETURNING *",
      [status, req.params.id]
    );

    await pool.query(
      "INSERT INTO batch_events(batch_id, status, description, created_at) VALUES($1,$2,$3,$4)",
      [req.params.id, status, description || `Status updated to ${status}`, new Date().toISOString()]
    );

    res.json(r.rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Database error" });
  }
});

// ── Settle payment ──
app.post("/api/batches/:id/settle", async (req, res) => {
  try {
    const batch = await pool.query("SELECT * FROM batches WHERE id=$1", [
      req.params.id,
    ]);
    if (!batch.rowCount)
      return res.status(404).json({ error: "Batch not found" });
    if (batch.rows[0].status === "SETTLED")
      return res.status(400).json({ error: "Already settled" });

    const r = await pool.query(
      "UPDATE batches SET status='SETTLED' WHERE id=$1 RETURNING *",
      [req.params.id]
    );

    await pool.query(
      "INSERT INTO batch_events(batch_id, status, description, created_at) VALUES($1,$2,$3,$4)",
      [req.params.id, "SETTLED", "Payment settled", new Date().toISOString()]
    );

    // On-chain settlement (best-effort)
    const contract = getContract();
    let txHash = null;
    if (contract) {
      try {
        const onChainId = ethers.keccak256(
          ethers.toUtf8Bytes(req.params.id)
        );
        const tx = await contract.settle(onChainId, {
          value: ethers.parseEther("0.001"),
        });
        txHash = tx.hash;
      } catch (e) {
        console.warn("On-chain settle failed:", e.message);
      }
    }

    res.json({ ...r.rows[0], txHash, settlement: "recorded" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Settlement failed" });
  }
});

// ── Serve Frontend ──
import path from "path";
const frontendPath = path.join(process.cwd(), "../frontend/dist");
app.use(express.static(frontendPath));
app.get("*", (req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

// ── Error handling middleware ──
app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`API running on ${port}`));
