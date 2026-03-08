# Parent-Child Connector App — Local Setup Guide

## Prerequisites

Install the following on your machine:
- Node.js v20+ (https://nodejs.org)
- NeonDB account — free at https://neon.tech (replaces local PostgreSQL)
- Redis (Windows: https://github.com/tporadowski/redis/releases)
- MinIO (https://min.io/docs/minio/windows/index.html)
- Expo CLI: `npm install -g expo-cli`
- Android Studio (for emulator) or Expo Go app on a physical device

---

## Step 1 — NeonDB Setup (free, no install required)

1. Go to https://neon.tech and create a free account
2. Click **New Project** → name it `parentchild-db` → click **Create Project**
3. On the dashboard go to **Connection Details** → select **Prisma** from the framework dropdown
4. Copy the two connection strings shown and paste them into `backend/.env`:

```env
DATABASE_URL="postgresql://user:pass@ep-xxx.region.aws.neon.tech/parentchild_db?sslmode=require"
DATABASE_URL_UNPOOLED="postgresql://user:pass@ep-xxx.region.aws.neon.tech/parentchild_db?sslmode=require"
```

> `DATABASE_URL` is the pooled URL (used at runtime).
> `DATABASE_URL_UNPOOLED` is the direct URL (used for migrations).

---

## Step 2 — Redis Setup

Start Redis locally:
```bash
# Windows (via downloaded binary)
redis-server

# macOS / Linux
redis-server
```

---

## Step 3 — MinIO Setup

```bash
# Download minio.exe from https://min.io/download
# Run in terminal:
minio server C:\minio-data --console-address ":9001"
```
MinIO Console: http://localhost:9001 (user: minioadmin / pass: minioadmin123)

---

## Step 4 — Backend Setup

```bash
cd backend

# Copy and configure environment
cp .env.example .env
# Edit .env with your DB credentials, JWT secrets, etc.

# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev --name init

# Seed demo data
npm run seed

# Start the server
npm run dev
```

Server runs at: http://localhost:3000
Health check: http://localhost:3000/health

---

## Step 5 — Mobile App Setup

```bash
cd mobile

# Copy environment file
cp .env.example .env

# Edit .env — replace 192.168.1.100 with your machine's LAN IP
# Find your IP: run `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
# Look for IPv4 Address under your Wi-Fi adapter

# Install dependencies
npm install

# Start Expo
npx expo start
```

Then:
- Press `a` for Android emulator
- Press `i` for iOS simulator
- Scan QR code with Expo Go app (Android/iOS) on physical device

---

## Step 6 — Test the App

### Demo Accounts (seeded)
| Role   | Email              | Password     |
|--------|--------------------|--------------|
| Parent | parent@demo.com    | password123  |
| Child  | child@demo.com     | password123  |

These are pre-paired — login with each on separate devices/emulators.

### Two-device testing
- Both devices must be on the same Wi-Fi network
- The backend IP in `.env` must be your machine's LAN IP (not localhost)

---

## API Endpoints Summary

| Method | Endpoint                    | Description               |
|--------|-----------------------------|---------------------------|
| POST   | /api/v1/auth/register       | Register user             |
| POST   | /api/v1/auth/login          | Login                     |
| POST   | /api/v1/auth/pair           | Parent pairs with child   |
| POST   | /api/v1/location/update     | Child updates location    |
| GET    | /api/v1/location/latest     | Get latest child location |
| GET    | /api/v1/location/history    | Get location history      |
| POST   | /api/v1/alerts/sos          | Child triggers SOS        |
| GET    | /api/v1/alerts              | Parent views alerts       |
| POST   | /api/v1/geofences           | Create geofence           |
| GET    | /api/v1/messages            | Get conversation          |
| POST   | /api/v1/video/request       | Request video check-in    |
| POST   | /api/v1/media/upload        | Upload image/file         |

## Socket.IO Events

| Event              | Direction          | Description                    |
|--------------------|--------------------|--------------------------------|
| location:update    | Child → Server     | Real-time location update      |
| child:location     | Server → Parent    | Broadcast location to parent   |
| message:send       | Client → Server    | Send a message                 |
| message:receive    | Server → Client    | Receive a message              |
| alert:sos          | Child → Server     | SOS trigger via socket         |
| alert:incoming     | Server → Parent    | Alert broadcast                |
| video:request      | Server → Child     | Parent requested video         |
| video:offer        | Parent → Child     | WebRTC offer                   |
| video:answer       | Child → Parent     | WebRTC answer                  |
| video:ice-candidate| Both directions    | WebRTC ICE candidates          |
| reminder:fire      | Server → Child     | Reminder notification          |
