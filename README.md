# 🌾 AgriChain — Blockchain-Powered Agricultural Supply Chain

> AI-driven crop quality assessment + Blockchain traceability + QR-code transparency for farm-to-market produce tracking.

## 🚀 Live Demo

**Public URL (Tunnel):** _Run `start-demo.bat` to get a live public URL_

**Demo Login:**
- Email: `demo@agrichain.com`
- Password: `password123`

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔐 **User Authentication** | Register/Login with role-based access (Farmer, Distributor, Retailer, Inspector) |
| 📦 **Batch Management** | Create, track, and manage agricultural batches through supply chain stages |
| 🤖 **AI Quality Assessment** | Upload crop images for automated freshness, sharpness, and color analysis |
| ⛓️ **Blockchain Traceability** | Immutable Polygon smart contract records for every supply chain milestone |
| 📱 **QR Code Scanning** | Scan batch QR codes for instant farm-to-table journey verification |
| 💰 **Smart Contract Settlement** | Automated payment settlement based on AI quality verification |

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite, Vanilla CSS |
| **Backend** | Node.js, Express.js |
| **Database** | SQLite (better-sqlite3) |
| **AI Service** | Python, FastAPI, OpenCV |
| **Blockchain** | Solidity, Hardhat, Polygon (ethers.js) |
| **Tunneling** | Cloudflare Tunnel / Tunnelmole |

---

## 📁 Project Structure

```
blockchain-agri-supply-chain/
├── frontend/          # React + Vite frontend
│   └── src/
│       ├── App.jsx           # Main app with auth & routing
│       ├── api.js            # Axios API client
│       ├── utils.js          # Date/timezone utilities
│       └── components/
│           ├── Login.jsx          # Auth screen (Sign In / Register)
│           ├── Dashboard.jsx      # Batch listing & overview
│           ├── CreateBatch.jsx    # New batch creation form
│           ├── BatchDetail.jsx    # Batch timeline & QR code
│           ├── QualityAssess.jsx  # AI crop scanner
│           └── Toast.jsx          # Notification system
├── backend/           # Express.js REST API
│   └── src/
│       ├── server.js     # API routes, auth, blockchain integration
│       ├── db.js         # SQLite database connector
│       ├── db-init.js    # Schema initialization
│       └── seed.js       # Demo data seeder
├── ai-service/        # FastAPI computer vision service
│   └── main.py           # OpenCV quality analysis endpoints
├── blockchain/        # Solidity smart contracts
│   └── contracts/
│       └── AgriSupplyChain.sol
├── start-demo.bat     # 1-click hackathon launcher
└── README.md
```

---

## ⚡ Quick Start

### Prerequisites
- **Node.js** v18+
- **Python** 3.9+
- **pip** (Python package manager)

### 1. Clone & Install

```bash
git clone https://github.com/amansinghrajput-asr/blockchain-agri-supply-chain.git
cd blockchain-agri-supply-chain
npm install
```

### 2. Install Python Dependencies

```bash
cd ai-service
pip install fastapi uvicorn opencv-python-headless numpy python-multipart
cd ..
```

### 3. Initialize Database & Seed Demo Data

```bash
cd backend
npm run db:init
npm run db:seed
cd ..
```

### 4. Build Frontend

```bash
cd frontend
npm run build
cd ..
```

### 5. Start Everything (Windows)

**Option A — One click:**
```
Double-click start-demo.bat
```

**Option B — Manual:**
```bash
# Terminal 1: AI Service
cd ai-service
uvicorn main:app --host 0.0.0.0 --port 8000

# Terminal 2: Backend + Frontend
cd backend
node src/server.js

# Terminal 3: Public Tunnel (optional)
cloudflared tunnel --url http://localhost:4000
```

### 6. Open Dashboard

Visit **http://localhost:4000** in your browser.

---

## 🎯 Demo Flow

1. **Login** → Use demo credentials or register a new account
2. **Dashboard** → View all batches with status badges and quality scores
3. **Create Batch** → Register a new agricultural batch (crop, quantity, location)
4. **AI Quality Scan** → Upload a crop image for automated quality grading
5. **Track Journey** → Follow batch through: Harvested → Quality Checked → In Transit → Delivered → Settled
6. **QR Verification** → Scan the QR code on any batch to verify its full history
7. **Settlement** → Trigger smart contract payment settlement

---

## 👨‍💻 Author

**Aman Singh** — [GitHub](https://github.com/amansinghrajput-asr)

---

## 📄 License

This project is built for educational and hackathon demonstration purposes.
