# Zero-Cost Real-Time Inventory System

This is a production-style inventory management system handling real-time stock updates, distributed locking, and concurrent orders using a free open-source stack.


## Tech Stack
- **Backend**: Node.js, Express, Socket.IO
- **Frontend**: React (Vite), Redux Toolkit
- **Database**: PostgreSQL (via Docker)
- **Cache/Sync**: Redis (via Docker)

## Prerequisites
- Node.js (v18+)
- Docker & Docker Compose (Critical for DB/Redis)

## Setup Steps

### 1. Start Infrastructure
Make sure Docker is running, then start the database and redis:
```bash
docker compose up -d
```

### 2. Initialize Database
Once the containers are running, run the schema migration:
```bash
cd apps/api
npx ts-node src/db/init.ts
```

### 3. Start Backend
```bash
cd apps/api
npm run dev
```
Server runs on `http://localhost:3000`.

### 4. Start Frontend
```bash
cd apps/client
npm run dev
```
Client runs on `http://localhost:5173`.

### 5. Testing Real-Time Sync
1. Open the Frontend in two different browser windows.
2. Login in both (Register manually in DB or modify code to allow registration).
3. Place an order in Window A.
4. Watch StockTable in Window B update instantly.

## Architecture Highlights
- **Inventory Service**: Uses `redis` to acquire locks on specific products before processing orders.
- **Atomic Transactions**: Updates inventory using PostgreSQL transactions (`BEGIN` ... `COMMIT`).
- **Real-Time**: Publishes events via Redis Pub/Sub so that scaled backend instances can broadcast via Socket.IO.

## Troubleshooting

### "The term 'docker' is not recognized..."
This error means **Docker Desktop** is not installed or running.
1. Download Docker Desktop from [docker.com](https://www.docker.com/products/docker-desktop/).
2. Install it and **start the application**.
3. Verify by running `docker --version` in your terminal.
4. Try `docker compose up -d` again.

### Alternative (No Docker)
If you cannot install Docker, you must install PostgreSQL and Redis manually:
1. Install **PostgreSQL 15+** locally.
2. Install **Redis 7+** locally.
3. Update `.env` (create one in `apps/api`) to point to `localhost` instead of docker container names.
