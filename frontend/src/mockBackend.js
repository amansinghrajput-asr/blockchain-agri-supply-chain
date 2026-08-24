/**
 * Mock Backend — localStorage-based fallback for GitHub Pages deployment.
 *
 * When the real Express backend is unreachable (GitHub Pages is static-only),
 * this module intercepts API calls and provides fully functional responses
 * using localStorage as the persistence layer.
 */

const LS_USERS = "agri_mock_users";
const LS_BATCHES = "agri_mock_batches";
const LS_EVENTS = "agri_mock_events";

// ── Helpers ──
function uid() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function getStore(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch {
    return [];
  }
}

function setStore(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

// ── Seed demo data on first load ──
function ensureSeeded() {
  if (localStorage.getItem("agri_mock_seeded")) return;

  const demoUser = {
    id: uid(),
    name: "Aman Singh",
    email: "demo@agrichain.com",
    password: "password123",
    role: "Farmer",
    created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
  };

  const batches = [
    {
      id: uid(),
      farmer: "Aman Singh",
      crop: "Wheat",
      quantity: 500,
      location: "Bihar, India",
      status: "SETTLED",
      harvest_score: 87,
      delivery_score: 82,
      created_at: new Date(Date.now() - 6 * 86400000).toISOString(),
    },
    {
      id: uid(),
      farmer: "Aman Singh",
      crop: "Rice",
      quantity: 300,
      location: "Punjab, India",
      status: "IN_TRANSIT",
      harvest_score: 92,
      delivery_score: null,
      created_at: new Date(Date.now() - 4 * 86400000).toISOString(),
    },
    {
      id: uid(),
      farmer: "Priya Patel",
      crop: "Tomato",
      quantity: 120,
      location: "Gujarat, India",
      status: "QUALITY_CHECKED",
      harvest_score: 74,
      delivery_score: null,
      created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    },
    {
      id: uid(),
      farmer: "Rajesh Kumar",
      crop: "Mango",
      quantity: 200,
      location: "Uttar Pradesh, India",
      status: "DELIVERED",
      harvest_score: 95,
      delivery_score: 88,
      created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    },
    {
      id: uid(),
      farmer: "Aman Singh",
      crop: "Potato",
      quantity: 450,
      location: "Bihar, India",
      status: "HARVESTED",
      harvest_score: null,
      delivery_score: null,
      created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    },
  ];

  const events = [];
  const STATUS_FLOW = ["HARVESTED", "QUALITY_CHECKED", "IN_TRANSIT", "DELIVERED", "SETTLED"];
  const STATUS_DESCS = {
    HARVESTED: (b) => `Batch created by ${b.farmer}`,
    QUALITY_CHECKED: (b) => `AI quality assessment: score ${b.harvest_score || 80}, grade A`,
    IN_TRANSIT: () => "Batch dispatched for delivery",
    DELIVERED: () => "Batch delivered to retailer",
    SETTLED: () => "Payment settled via smart contract",
  };

  for (const b of batches) {
    const idx = STATUS_FLOW.indexOf(b.status);
    for (let i = 0; i <= idx; i++) {
      events.push({
        id: uid(),
        batch_id: b.id,
        status: STATUS_FLOW[i],
        description: STATUS_DESCS[STATUS_FLOW[i]](b),
        created_at: new Date(
          new Date(b.created_at).getTime() + i * 3600000
        ).toISOString(),
      });
    }
  }

  setStore(LS_USERS, [demoUser]);
  setStore(LS_BATCHES, batches);
  setStore(LS_EVENTS, events);
  localStorage.setItem("agri_mock_seeded", "true");
}

// ── Mock API functions ──

export function mockRegister({ name, email, password, role }) {
  ensureSeeded();
  const users = getStore(LS_USERS);
  const cleanEmail = email.toLowerCase().trim();
  if (users.find((u) => u.email === cleanEmail)) {
    throw { response: { data: { error: "An account with this email already exists" } } };
  }
  if (!password || password.length < 6) {
    throw { response: { data: { error: "Password must be at least 6 characters" } } };
  }
  const id = uid();
  const newUser = {
    id,
    name: name.trim(),
    email: cleanEmail,
    password,
    role: role || "Farmer",
    created_at: new Date().toISOString(),
  };
  users.push(newUser);
  setStore(LS_USERS, users);
  const { password: _pw, ...safeUser } = newUser;
  return { data: { user: safeUser, token: `agr_${id}_${Date.now()}` } };
}

export function mockLogin({ email, password }) {
  ensureSeeded();
  const users = getStore(LS_USERS);
  const cleanEmail = email.toLowerCase().trim();
  const user = users.find((u) => u.email === cleanEmail);
  if (!user || user.password !== password) {
    throw { response: { data: { error: "Invalid email or password" } } };
  }
  const { password: _pw, ...safeUser } = user;
  return { data: { user: safeUser, token: `agr_${user.id}_${Date.now()}` } };
}

export function mockGetMe() {
  ensureSeeded();
  const token = localStorage.getItem("agri_token");
  if (!token) throw { response: { status: 401 } };
  const userId = token.split("_")[1];
  const users = getStore(LS_USERS);
  const user = users.find((u) => u.id === userId);
  if (!user) throw { response: { status: 404 } };
  const { password: _pw, ...safeUser } = user;
  return { data: safeUser };
}

export function mockListBatches() {
  ensureSeeded();
  const batches = getStore(LS_BATCHES);
  batches.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  return { data: batches };
}

export function mockGetBatch(id) {
  ensureSeeded();
  const batches = getStore(LS_BATCHES);
  const batch = batches.find((b) => b.id === id);
  if (!batch) throw { response: { data: { error: "Batch not found" }, status: 404 } };
  return { data: batch };
}

export function mockCreateBatch({ farmer, crop, quantity, location }) {
  ensureSeeded();
  const id = uid();
  const now = new Date().toISOString();
  const batch = {
    id,
    farmer,
    crop,
    quantity: Number(quantity),
    location: location || "",
    status: "HARVESTED",
    harvest_score: null,
    delivery_score: null,
    created_at: now,
  };
  const batches = getStore(LS_BATCHES);
  batches.unshift(batch);
  setStore(LS_BATCHES, batches);

  // Add event
  const events = getStore(LS_EVENTS);
  events.push({
    id: uid(),
    batch_id: id,
    status: "HARVESTED",
    description: `Batch created by ${farmer}`,
    created_at: now,
  });
  setStore(LS_EVENTS, events);

  return { data: { ...batch, txHash: "0x" + uid().replace(/-/g, "") } };
}

export function mockGetBatchEvents(batchId) {
  ensureSeeded();
  const events = getStore(LS_EVENTS);
  const filtered = events
    .filter((e) => e.batch_id === batchId)
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  return { data: filtered };
}

const STATUS_FLOW = ["HARVESTED", "QUALITY_CHECKED", "IN_TRANSIT", "DELIVERED", "SETTLED"];

export function mockUpdateBatchStatus(id, status, description) {
  ensureSeeded();
  const batches = getStore(LS_BATCHES);
  const batch = batches.find((b) => b.id === id);
  if (!batch) throw { response: { data: { error: "Batch not found" } } };

  const currentIdx = STATUS_FLOW.indexOf(batch.status);
  const newIdx = STATUS_FLOW.indexOf(status);
  if (newIdx <= currentIdx) {
    throw { response: { data: { error: `Cannot move from ${batch.status} to ${status}` } } };
  }

  batch.status = status;
  setStore(LS_BATCHES, batches);

  const events = getStore(LS_EVENTS);
  events.push({
    id: uid(),
    batch_id: id,
    status,
    description: description || `Status updated to ${status}`,
    created_at: new Date().toISOString(),
  });
  setStore(LS_EVENTS, events);

  return { data: batch };
}

export function mockSettle(id) {
  ensureSeeded();
  const batches = getStore(LS_BATCHES);
  const batch = batches.find((b) => b.id === id);
  if (!batch) throw { response: { data: { error: "Batch not found" } } };
  if (batch.status === "SETTLED") throw { response: { data: { error: "Already settled" } } };

  batch.status = "SETTLED";
  setStore(LS_BATCHES, batches);

  const events = getStore(LS_EVENTS);
  events.push({
    id: uid(),
    batch_id: id,
    status: "SETTLED",
    description: "Payment settled via smart contract",
    created_at: new Date().toISOString(),
  });
  setStore(LS_EVENTS, events);

  return { data: { ...batch, txHash: "0x" + uid().replace(/-/g, ""), settlement: "recorded" } };
}

export function mockAssess(formData) {
  // Simulate AI quality assessment on the client side
  const score = Math.floor(Math.random() * 30) + 65; // 65-95 range
  const grade = score >= 90 ? "A+" : score >= 80 ? "A" : score >= 70 ? "B" : score >= 60 ? "C" : "D";

  const result = {
    score,
    grade,
    metrics: {
      sharpness: Math.floor(Math.random() * 25) + 60,
      saturation: Math.floor(Math.random() * 30) + 55,
      brightness: Math.floor(Math.random() * 20) + 65,
    },
    explanation: `AI quality scan complete. Overall quality score: ${score}/100 (Grade ${grade}). Sharpness and color saturation indicate ${score >= 80 ? "excellent" : score >= 65 ? "good" : "fair"} produce condition.`,
  };

  // If linked to a batch, update its score
  const batchId = formData.get?.("batchId");
  if (batchId) {
    const batches = getStore(LS_BATCHES);
    const batch = batches.find((b) => b.id === batchId);
    if (batch) {
      const stage = formData.get?.("stage");
      if (stage === "delivery") {
        batch.delivery_score = score;
      } else {
        batch.harvest_score = score;
        if (batch.status === "HARVESTED") {
          batch.status = "QUALITY_CHECKED";
        }
      }
      setStore(LS_BATCHES, batches);

      // Add event
      const events = getStore(LS_EVENTS);
      events.push({
        id: uid(),
        batch_id: batchId,
        status: "QUALITY_CHECKED",
        description: `AI quality assessment: score ${score}, grade ${grade}`,
        created_at: new Date().toISOString(),
      });
      setStore(LS_EVENTS, events);
    }
  }

  return { data: result };
}
