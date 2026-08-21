# Complete deployment guide

## STEP 0 — Prerequisites
Install Node.js 20+, Python 3.12+, Git, Docker Desktop and a Polygon-compatible wallet for testnet deployment.

## STEP 1 — Clone/copy
Put this repository in a new folder and run `npm install` separately in `frontend`, `backend`, and `blockchain`.

## STEP 2 — Database
Run `docker compose up -d postgres`.
Then:
`cd backend`
`copy .env.example .env` on Windows or `cp .env.example .env` on Linux/macOS.
Run `npm run db:init`.

## STEP 3 — AI
`cd ai-service`
Create and activate a virtual environment.
Run `pip install -r requirements.txt`.
Run `uvicorn main:app --reload --port 8000`.

## STEP 4 — API
`cd backend`
Run `npm run dev`.
Health check: `GET /health`.

## STEP 5 — Frontend
`cd frontend`
Copy `.env.example` to `.env`.
Run `npm install` and `npm run dev`.
Open http://localhost:5173.

## STEP 6 — Smart contract
`cd blockchain`
Copy `.env.example` to `.env`.
Run `npm install`, `npm run compile`, `npm test`.

For local Hardhat node:
Terminal A: `npx hardhat node`
Terminal B: `npm run deploy:local`.

For Polygon Amoy:
1. Create a test wallet.
2. Fund it with Amoy test MATIC from a faucet.
3. Put the RPC endpoint and private key in `.env`.
4. Run `npm run deploy:amoy`.
5. Save `deployment-address.json`.
6. Put the deployed contract address into backend/frontend configuration if on-chain calls are enabled.

## STEP 7 — Production
Frontend: deploy `frontend` to Vercel or Netlify.
Backend: deploy `backend` to Render/Railway/Fly.io.
AI: deploy `ai-service` to Render/Railway.
Database: use Neon/Supabase/Render PostgreSQL.
Contract: Polygon Amoy for judging/demo, Polygon PoS only after security review.

## STEP 8 — Environment variables

Frontend:
`VITE_API_URL=https://YOUR-BACKEND.example.com`

Backend:
`PORT=4000`
`DATABASE_URL=...`
`AI_SERVICE_URL=https://YOUR-AI.example.com`
`CORS_ORIGIN=https://YOUR-FRONTEND.example.com`
`RPC_URL=...`
`CONTRACT_ADDRESS=...`
`PRIVATE_KEY=...`

Never put private keys in GitHub, frontend code, screenshots or README.

## STEP 9 — What this MVP already covers
- Batch creation
- PostgreSQL persistence
- AI image upload and quality score
- QR traceability URL
- Supply-chain status
- Smart-contract source and tests
- Dockerized backend/AI
- Production-oriented environment configuration

## STEP 10 — Before claiming production-grade AI/blockchain
The included AI is an OpenCV baseline, not a trained YOLOv8 model. A real production system needs a trained/validated model, dataset, model weights, inference tests and monitoring. The blockchain contract also needs a security audit before handling real money.
