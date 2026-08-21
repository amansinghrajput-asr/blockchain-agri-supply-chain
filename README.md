# 🌾 AgriChain — Blockchain Agricultural Supply Chain Transparency

A full-stack MVP for farm-to-market traceability with AI crop quality assessment, QR traceability, supply-chain status tracking, and EVM smart-contract settlement.

## Architecture

| Layer | Technology | Description |
|-------|-----------|-------------|
| **Frontend** | React + Vite | Premium dark-mode dashboard with routing, QR codes, quality assessment |
| **Backend API** | Node.js + Express | RESTful API with PostgreSQL, blockchain integration |
| **AI Service** | FastAPI + OpenCV | Computer-vision crop quality scoring |
| **Blockchain** | Solidity + Hardhat | On-chain batch creation, quality recording, payment settlement |
| **Database** | PostgreSQL | Batch storage, event timeline tracking |
| **Container** | Docker Compose | Full containerized deployment |

## Features

- **Batch Management** — Create, track, and settle crop batches through the supply chain
- **AI Quality Assessment** — Upload crop images for automated quality scoring (sharpness, saturation, brightness)
- **Supply-Chain Status Tracking** — HARVESTED → QUALITY_CHECKED → IN_TRANSIT → DELIVERED → SETTLED
- **QR Traceability** — Generate and scan QR codes for instant batch verification
- **Blockchain Settlement** — On-chain batch creation, quality recording, and payment via Polygon
- **Activity Timeline** — Full history of every batch event for auditing

## Local Setup

### 1. Start PostgreSQL
```bash
docker compose up -d postgres
```

### 2. Backend
```bash
cd backend
npm install
copy .env.example .env    # Windows
# cp .env.example .env    # Linux/macOS
npm run db:init
npm run dev
```

### 3. AI Service
```bash
cd ai-service
python -m venv .venv
# Windows: .venv\Scripts\activate
# Linux/macOS: source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 4. Frontend
```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

## Smart Contract

```bash
cd blockchain
npm install
copy .env.example .env
npm run compile
npm run test
npm run deploy:local
```

For Polygon Amoy, add `RPC_URL` and `PRIVATE_KEY` to `.env`, then:
```bash
npm run deploy:amoy
```

After deployment, copy the contract address from `deployment-address.json` into `backend/.env` as `CONTRACT_ADDRESS`.

**Never commit a private key.**

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| POST | `/api/batches` | Create a new batch |
| GET | `/api/batches` | List all batches |
| GET | `/api/batches/:id` | Get batch details |
| PATCH | `/api/batches/:id/status` | Update batch status |
| POST | `/api/quality/assess` | AI quality assessment (multipart image) |
| GET | `/api/batches/:id/events` | Get batch event timeline |
| POST | `/api/batches/:id/settle` | Settle payment |

## Docker (Full Stack)

```bash
docker compose up --build
```

This starts PostgreSQL, Backend (port 4000), AI Service (port 8000), and Frontend (port 5173).

## Production Deployment

- **Frontend**: Vercel / Netlify
- **Backend**: Render / Railway / Fly.io
- **AI Service**: Render / Railway
- **PostgreSQL**: Neon / Supabase / Render
- **Contract**: Polygon Amoy (demo) → Polygon PoS (production after audit)

Set `VITE_API_URL` in frontend to the public backend URL and `AI_SERVICE_URL` in backend to the public AI URL.

## Important Notes

- The AI service uses an OpenCV baseline heuristic, not a trained ML model. A trained YOLOv8/TensorFlow model can be plugged into `ai-service/main.py` when model weights are available.
- The blockchain contract should receive a security audit before handling real money on mainnet.
- Blockchain integration is best-effort — the app works fully with just the database if no contract is deployed.
