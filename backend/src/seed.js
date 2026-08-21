import db from "./db.js";
import crypto from "crypto";

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

try {
  db.exec("ALTER TABLE batches ADD COLUMN user_id TEXT REFERENCES users(id);");
} catch (e) {
  // Column already exists
}

// 1. Create Demo User
const demoUserId = "usr-aman-singh-001";
const now = new Date().toISOString();
const demoEmail = "demo@agrichain.com";
const passwordHash = hashPassword("password123");

db.prepare(`
  INSERT OR REPLACE INTO users (id, name, email, password_hash, role, created_at)
  VALUES (?, ?, ?, ?, ?, ?)
`).run(demoUserId, "Aman Singh", demoEmail, passwordHash, "Farmer", now);

// 2. Demo Batches across all supply-chain stages
const batches = [
  {
    id: "batch-mango-ratnagiri",
    farmer: "Aman Singh",
    crop: "Alphonso Mango",
    quantity: 850,
    location: "Ratnagiri, Maharashtra",
    status: "SETTLED",
    harvest_score: 92,
    delivery_score: 88,
    user_id: demoUserId,
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    events: [
      { status: "HARVESTED", desc: "Batch harvested from Ratnagiri organic orchards by Aman Singh", daysAgo: 5 },
      { status: "QUALITY_CHECKED", desc: "AI quality score: 92 (Grade A - Premium Export Quality)", daysAgo: 4 },
      { status: "IN_TRANSIT", desc: "Dispatched via refrigerated container truck MH-08-AB-1234", daysAgo: 3 },
      { status: "DELIVERED", desc: "Delivered to Mumbai Central APMC Market Hub", daysAgo: 1 },
      { status: "SETTLED", desc: "Polygon smart contract payment settlement verified on-chain", daysAgo: 0 }
    ]
  },
  {
    id: "batch-turmeric-kerala",
    farmer: "Aman Singh",
    crop: "Organic Turmeric",
    quantity: 450,
    location: "Wayanad, Kerala",
    status: "IN_TRANSIT",
    harvest_score: 86,
    delivery_score: null,
    user_id: demoUserId,
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    events: [
      { status: "HARVESTED", desc: "Harvested from Wayanad hillside plantation by Aman Singh", daysAgo: 3 },
      { status: "QUALITY_CHECKED", desc: "AI quality score: 86 (Grade B - High Curcumin Content)", daysAgo: 2 },
      { status: "IN_TRANSIT", desc: "Loaded for interstate transit to Bengaluru Distribution Hub", daysAgo: 1 }
    ]
  },
  {
    id: "batch-apples-shimla",
    farmer: "Aman Singh",
    crop: "Shimla Apples",
    quantity: 600,
    location: "Shimla, Himachal Pradesh",
    status: "DELIVERED",
    harvest_score: 84,
    delivery_score: 82,
    user_id: demoUserId,
    created_at: new Date(Date.now() - 4 * 86400000).toISOString(),
    events: [
      { status: "HARVESTED", desc: "Harvested at high-altitude Shimla orchard", daysAgo: 4 },
      { status: "QUALITY_CHECKED", desc: "AI quality score: 84 (Grade B - Crisp & Uniform)", daysAgo: 3 },
      { status: "IN_TRANSIT", desc: "Departed cold storage in transit to Delhi Wholesale Center", daysAgo: 2 },
      { status: "DELIVERED", desc: "Received and inspected at Azadpur Terminal", daysAgo: 0 }
    ]
  },
  {
    id: "batch-rice-basmati",
    farmer: "Aman Singh",
    crop: "Basmati Rice",
    quantity: 1200,
    location: "Karnal, Haryana",
    status: "QUALITY_CHECKED",
    harvest_score: 78,
    delivery_score: null,
    user_id: demoUserId,
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    events: [
      { status: "HARVESTED", desc: "Grain harvest completed across 4 acres", daysAgo: 2 },
      { status: "QUALITY_CHECKED", desc: "AI quality score: 78 (Grade B - Long Grain Certified)", daysAgo: 1 }
    ]
  },
  {
    id: "batch-wheat-sharbati",
    farmer: "Aman Singh",
    crop: "Sharbati Wheat",
    quantity: 1500,
    location: "Sehore, Madhya Pradesh",
    status: "HARVESTED",
    harvest_score: null,
    delivery_score: null,
    user_id: demoUserId,
    created_at: new Date(Date.now() - 4 * 3600000).toISOString(),
    events: [
      { status: "HARVESTED", desc: "Batch registered by Aman Singh, ready for initial AI inspection", daysAgo: 0 }
    ]
  }
];

// Clean existing batches to prevent duplicate demo entries
db.prepare("DELETE FROM batch_events").run();
db.prepare("DELETE FROM batches").run();

for (const b of batches) {
  db.prepare(`
    INSERT INTO batches (id, farmer, crop, quantity, location, status, harvest_score, delivery_score, user_id, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(b.id, b.farmer, b.crop, b.quantity, b.location, b.status, b.harvest_score, b.delivery_score, b.user_id, b.created_at);

  for (const ev of b.events) {
    const evTime = new Date(Date.now() - ev.daysAgo * 86400000 + 3600000).toISOString();
    db.prepare(`
      INSERT INTO batch_events (batch_id, status, description, created_at)
      VALUES (?, ?, ?, ?)
    `).run(b.id, ev.status, ev.desc, evTime);
  }
}

console.log(`✅ Successfully seeded 5 realistic demo batches and demo user (demo@agrichain.com / password123)!`);
db.close();
