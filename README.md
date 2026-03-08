# Parent–Child Connector App

A real-time mobile safety app that lets parents monitor and stay connected with their children. Built with React Native (Expo), Node.js, PostgreSQL (NeonDB), and Socket.IO.

---

## Table of Contents

1. [Features Overview](#features-overview)
2. [Architecture](#architecture)
3. [Tech Stack](#tech-stack)
4. [Quick Start (Backend Already Deployed)](#quick-start-backend-already-deployed)
5. [Full Local Setup](#full-local-setup)
6. [Demo Walkthrough](#demo-walkthrough)
7. [API Reference](#api-reference)
8. [Socket.IO Events](#socketio-events)
9. [Project Structure](#project-structure)
10. [Deployment (Render.com)](#deployment-rendercom)

---

## Features Overview

### Parent Side
| Feature | Description |
|---|---|
| **Dashboard** | Child status card, active alerts, recent activity feed, battery & connectivity |
| **Live Map** | Real-time child location on OpenStreetMap (no API key needed) |
| **Geofencing** | Tap map to set circular safe zones — breach triggers instant alert |
| **Chat** | Real-time messaging with image sharing and read receipts (✓✓) |
| **Alerts** | SOS alerts, geofence breaches, stale location warnings — all with push notifications |
| **Reminders** | Create timed reminders delivered to the child's device |
| **Video Verification** | Request a selfie from the child; view history with photos |
| **Activity Log** | Full chronological log of all child activity |
| **Profile** | Edit name/phone, logout |

### Child Side
| Feature | Description |
|---|---|
| **Home** | Greeting, parent name, location sharing toggle, SOS button, recent activity |
| **SOS Button** | Large emergency button — vibrates, sends location to parent instantly |
| **Location Sharing** | Start/stop GPS tracking that streams live to parent |
| **Device Status** | Battery level and connectivity auto-sent to parent every 30s |
| **Chat** | Real-time messaging with parent, image sharing, typing indicator |
| **Video Selfie** | Take selfie with camera — uploads and notifies parent |
| **Reminders** | Receive timed push notifications from parent |
| **Profile** | Edit name/phone, logout |

---

## Architecture

```
┌─────────────────┐         ┌──────────────────────┐         ┌─────────────┐
│  Mobile App     │         │  Backend (Node.js)   │         │  Databases  │
│  (React Native) │◄───────►│  REST API + Socket.IO│◄───────►│  NeonDB     │
│                 │         │                      │         │  (Postgres) │
│  Parent tabs:   │         │  /api/v1/auth        │         │             │
│  Dashboard      │         │  /api/v1/location    │         │  Upstash    │
│  Map            │         │  /api/v1/messages    │         │  Redis      │
│  Chat           │         │  /api/v1/alerts      │         │             │
│  Alerts         │         │  /api/v1/geofences   │         │  Cloudinary │
│  Activity       │         │  /api/v1/reminders   │         │  (images)   │
│  Profile        │         │  /api/v1/video       │         └─────────────┘
│                 │         │  /api/v1/media       │
│  Child tabs:    │         │                      │
│  Home           │         │  Socket rooms:       │
│  Chat           │         │  user:{id}           │
│  Video          │         │                      │
│  Profile        │         │  Cron jobs:          │
└─────────────────┘         │  Reminders (1min)    │
                            │  Stale location(5min)│
                            └──────────────────────┘
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile | React Native, Expo SDK 51, TypeScript |
| State | Zustand |
| Navigation | React Navigation v6 (Bottom Tabs + Stack) |
| Backend | Node.js, Express.js |
| Real-time | Socket.IO |
| Database | PostgreSQL via Prisma ORM (NeonDB serverless) |
| Cache/Sessions | Redis (Upstash in production) |
| File Storage | Cloudinary (production) / MinIO (local dev) |
| Map | Leaflet.js via WebView (OpenStreetMap tiles — no API key) |
| Camera | expo-camera (CameraView) |
| Push Notifications | expo-notifications (local) |
| Deployment | Render.com (backend), Expo Go (mobile) |

---

## Quick Start (Backend Already Deployed)

> The backend is live at **https://parent-child-connector.onrender.com**
> You only need to set up the mobile app.

### Prerequisites
- Node.js v20+ → https://nodejs.org
- Expo Go app on your phone (Android or iOS) → search "Expo Go" in your app store

### Steps

```bash
# 1. Clone the repo
git clone https://github.com/Ruchitha1608/parent-child-connector.git
cd parent-child-connector/mobile

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
```

Edit `mobile/.env`:
```env
EXPO_PUBLIC_API_URL=https://parent-child-connector.onrender.com/api/v1
EXPO_PUBLIC_SOCKET_URL=https://parent-child-connector.onrender.com
```

```bash
# 4. Start Expo
npx expo start
```

- Scan the QR code with **Expo Go** on your phone
- Or press `a` to open on Android emulator

### Demo Accounts (pre-seeded, pre-paired)

| Role | Email | Password |
|---|---|---|
| Parent | parent@demo.com | password123 |
| Child | child@demo.com | password123 |

Log into each account on separate devices (or two emulators) to test real-time features.

---

## Full Local Setup

Use this if you want to run everything locally (backend + database + storage).

### Prerequisites

| Tool | Install Link |
|---|---|
| Node.js v20+ | https://nodejs.org |
| NeonDB account (free) | https://neon.tech |
| Redis | https://redis.io/docs/install/ (Windows: https://github.com/tporadowski/redis/releases) |
| MinIO | https://min.io/download |
| Expo Go (phone) | App store |

---

### Step 1 — NeonDB (Free Postgres)

1. Sign up at https://neon.tech (free)
2. Click **New Project** → name it anything → **Create**
3. Go to **Connection Details** → change framework dropdown to **Prisma**
4. Copy the two connection strings shown

---

### Step 2 — Cloudinary (Free Image Storage)

> Alternative to MinIO — easier to set up, works on all platforms.

1. Sign up at https://cloudinary.com (free tier is generous)
2. Go to **Dashboard** → copy **Cloud Name**, **API Key**, **API Secret**

---

### Step 3 — Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env
```

Edit `backend/.env` with your values:

```env
PORT=3000
NODE_ENV=development

# From NeonDB dashboard → Connection Details → Prisma
DATABASE_URL="postgresql://user:pass@ep-xxx.region.aws.neon.tech/dbname?sslmode=require"
DATABASE_URL_UNPOOLED="postgresql://user:pass@ep-xxx.region.aws.neon.tech/dbname?sslmode=require"

# Local Redis
REDIS_URL="redis://localhost:6379"

# Generate random secrets (or use any long string)
JWT_SECRET="any_long_random_string_min_32_chars"
JWT_REFRESH_SECRET="another_long_random_string_min_32"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# Cloudinary (from your dashboard)
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"

# CORS
ALLOWED_ORIGINS="http://localhost:8081,exp://192.168.1.100:8081"
```

```bash
# Start Redis (in a separate terminal)
redis-server

# Run database migrations
npx prisma migrate dev --name init

# Generate Prisma client
npx prisma generate

# Seed demo accounts (parent@demo.com + child@demo.com, already paired)
npm run seed

# Start the backend
npm run dev
```

Backend runs at: **http://localhost:3000**
Health check: http://localhost:3000/health

---

### Step 4 — Mobile Setup

```bash
cd mobile

# Install dependencies
npm install

# Find your machine's local IP
# Windows: run `ipconfig` → look for "IPv4 Address" under Wi-Fi
# Mac/Linux: run `ifconfig` → look for inet under en0

cp .env.example .env
```

Edit `mobile/.env`:
```env
EXPO_PUBLIC_API_URL=http://192.168.1.XXX:3000/api/v1
EXPO_PUBLIC_SOCKET_URL=http://192.168.1.XXX:3000
```

> Replace `192.168.1.XXX` with your actual machine IP.
> Both your phone and your computer must be on the **same Wi-Fi network**.

```bash
npx expo start
```

- Scan QR with Expo Go on your phone, **or**
- Press `a` for Android emulator, `i` for iOS simulator

---

## Demo Walkthrough

### Scenario: Parent monitoring child

**Step 1 — Login**
- Open the app on two devices (or two emulators side by side)
- Device 1: login as `parent@demo.com`
- Device 2: login as `child@demo.com`

**Step 2 — Location Sharing**
- On the child device: tap **▶ Start Sharing Location**
- On the parent device: go to **Live Map** tab — a pin appears showing the child's location
- The map auto-updates every few seconds as location changes
- The Dashboard shows lat/lon coordinates and last-update time

**Step 3 — SOS Alert**
- On the child device: tap the large red **SOS** button → confirm in the alert dialog
- On the parent device: a push notification fires, an in-app alert pops up with coordinates, and the Alerts tab shows a badge

**Step 4 — Chat**
- Both devices: go to the **Chat** tab
- Send messages back and forth
- Typing indicator appears ("typing...")
- Single ✓ = delivered, double ✓✓ = read (updates in real-time when the other opens the chat)

**Step 5 — Video Verification**
- On the parent device: go to **Activity → Reminders tab** (or on some builds, the Video tab) → tap **Request Selfie**
- On the child device: a dialog appears "Video Check-in Request" → tap **Accept**
- The child goes to **Video** tab → takes a photo → taps **Send to Parent**
- The photo uploads to Cloudinary; parent sees it appear in verification history

**Step 6 — Reminders**
- On the parent device: **Activity → Reminders** tab → tap **+ Set Reminder**
- Fill in title (e.g. "Take medicine"), optional message, date (YYYY-MM-DD), time (HH:MM)
- Tap **Save**
- At the set time, the child receives a push notification and an in-app alert

**Step 7 — Geofencing**
- On the parent device: **Live Map** tab
- Tap anywhere on the map to place a geofence (a blue circle appears)
- Enter a name and radius in the prompt
- If the child moves outside that circle, an alert fires on the parent's device

**Step 8 — Device Status**
- On the parent Dashboard, look at the child status card
- You'll see battery percentage (🔋 80%) and connectivity (📶 Online / 📵 Offline)
- This updates every 30 seconds automatically

**Step 9 — Profile**
- On either device: **Profile** tab
- Edit your name or phone number → tap **Save Changes**
- Tap **Logout** to sign out (clears token, disconnects socket)

---

## API Reference

Base URL: `https://parent-child-connector.onrender.com/api/v1`

### Auth

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | None | Register new user |
| POST | `/auth/login` | None | Login, returns JWT tokens |
| POST | `/auth/refresh` | None | Refresh access token |
| POST | `/auth/logout` | Bearer | Logout (invalidates refresh token) |
| POST | `/auth/pair` | Bearer (parent) | Pair with child using 6-digit code |

**Register body:**
```json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "password": "securepassword",
  "role": "parent"
}
```

**Login body:**
```json
{
  "email": "parent@demo.com",
  "password": "password123"
}
```

**Pair body (parent sends child's pair code):**
```json
{ "pairCode": "ABC123" }
```

---

### Users

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/users/me` | Bearer | Get current user profile |
| PATCH | `/users/me` | Bearer | Update name/phone |
| GET | `/users/paired-child` | Bearer (parent) | Get paired child info |
| GET | `/users/paired-parent` | Bearer (child) | Get paired parent info |

---

### Location

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/location/update` | Bearer (child) | Send current GPS coords |
| GET | `/location/latest` | Bearer (parent) | Get child's latest location |
| GET | `/location/history` | Bearer (parent) | Get location history (last 100) |

---

### Alerts

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/alerts/sos` | Bearer (child) | Trigger SOS alert |
| GET | `/alerts` | Bearer (parent) | List all alerts |
| PATCH | `/alerts/:id/resolve` | Bearer (parent) | Mark alert as resolved |

---

### Messages

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/messages` | Bearer | Get conversation (last 50) |
| POST | `/messages/mark-read` | Bearer | Mark messages as read |
| GET | `/messages/unread-count` | Bearer | Get unread count |

---

### Geofences

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/geofences` | Bearer (parent) | Create geofence |
| GET | `/geofences` | Bearer | List all geofences |
| DELETE | `/geofences/:id` | Bearer (parent) | Delete geofence |

---

### Reminders

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/reminders` | Bearer (parent) | Create reminder for child |
| GET | `/reminders` | Bearer | List reminders |
| DELETE | `/reminders/:id` | Bearer | Delete reminder |

---

### Video Verification

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/video/request` | Bearer (parent) | Request selfie from child |
| POST | `/video/selfie` | Bearer (child) | Submit selfie photo URL |
| GET | `/video/history` | Bearer (parent) | View verification history |
| GET | `/video/my-history` | Bearer (child) | Child's own verification history |

---

### Media

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/media/upload` | Bearer | Upload image (returns URL) |

---

## Socket.IO Events

Connect to the socket server with the JWT token:
```js
const socket = io(SOCKET_URL, {
  auth: { token: accessToken }
});
```

The server automatically places each user into a room `user:{userId}`.

### Child → Server

| Event | Payload | Description |
|---|---|---|
| `location:update` | `{ latitude, longitude, accuracy }` | Send GPS position |
| `message:send` | `{ content, mediaUrl, messageType }` | Send a chat message |
| `message:typing` | — | Notify other party of typing |
| `sos:trigger` | `{ latitude?, longitude? }` | Emergency SOS |
| `device:status` | `{ batteryLevel, isCharging, isConnected, networkType }` | Battery/network info |

### Server → Parent

| Event | Payload | Description |
|---|---|---|
| `child:location` | `{ latitude, longitude, timestamp, accuracy }` | Live location update |
| `alert:sos` | `{ childId, childName, latitude, longitude, timestamp }` | SOS triggered |
| `alert:incoming` | `{ alertType, message, ... }` | Geofence or stale location alert |
| `message:receive` | Message object | New message from child |
| `message:read` | `{ messageIds: string[] }` | Child read parent's messages |
| `device:status` | `{ batteryLevel, isCharging, isConnected, networkType, childId }` | Child device status |
| `video:selfie` | `{ sessionId, snapshotUrl, childName, completedAt }` | Child submitted selfie |

### Server → Child

| Event | Payload | Description |
|---|---|---|
| `message:receive` | Message object | New message from parent |
| `message:read` | `{ messageIds: string[] }` | Parent read child's messages |
| `reminder:fire` | `{ title, body, remindAt }` | Scheduled reminder notification |
| `video:request` | `{ sessionId }` | Parent requesting selfie |

---

## Project Structure

```
parent-child-connector/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma          # Database models
│   │   └── seed.js                # Demo accounts seeder
│   ├── src/
│   │   ├── controllers/           # Route handlers
│   │   │   ├── auth.controller.js
│   │   │   ├── location.controller.js
│   │   │   ├── message.controller.js
│   │   │   ├── alert.controller.js
│   │   │   ├── geofence.controller.js
│   │   │   ├── reminder.controller.js
│   │   │   ├── video.controller.js
│   │   │   └── media.controller.js
│   │   ├── routes/                # Express routers
│   │   ├── middleware/
│   │   │   └── auth.js            # JWT verify + role check
│   │   ├── services/
│   │   │   ├── auth.service.js    # Pairing logic
│   │   │   └── reminder.service.js # Cron: reminders + stale location
│   │   ├── sockets/
│   │   │   └── index.js           # All Socket.IO event handlers
│   │   └── lib/
│   │       ├── prisma.js          # Prisma client singleton
│   │       ├── redis.js           # Redis client
│   │       └── cloudinary.js      # Cloudinary config
│   ├── server.js                  # Entry point
│   ├── .env.example
│   └── package.json
│
├── mobile/
│   ├── App.tsx                    # Root: notifications setup + ErrorBoundary
│   ├── src/
│   │   ├── navigation/
│   │   │   ├── index.tsx          # Auth gate → Parent or Child navigator
│   │   │   ├── ParentNavigator.tsx
│   │   │   └── ChildNavigator.tsx
│   │   ├── screens/
│   │   │   ├── parent/
│   │   │   │   ├── DashboardScreen.tsx  # Child status, alerts, activity
│   │   │   │   ├── MapScreen.tsx        # Leaflet WebView map + geofencing
│   │   │   │   ├── ChatScreen.tsx       # Real-time messaging
│   │   │   │   ├── AlertsScreen.tsx     # Alert management
│   │   │   │   ├── ActivityScreen.tsx   # Activity log + reminders
│   │   │   │   └── VideoCallScreen.tsx  # Selfie verification history
│   │   │   ├── child/
│   │   │   │   ├── ChildHomeScreen.tsx  # SOS, location toggle, activity
│   │   │   │   ├── ChildChatScreen.tsx  # Real-time messaging
│   │   │   │   └── ChildVideoScreen.tsx # Camera selfie capture
│   │   │   ├── ProfileScreen.tsx        # Shared profile + logout
│   │   │   ├── LoginScreen.tsx
│   │   │   └── RegisterScreen.tsx
│   │   ├── services/
│   │   │   ├── api.ts             # All REST API calls (axios)
│   │   │   ├── socket.ts          # Socket.IO connection + emitters
│   │   │   └── location.ts        # expo-location background tracking
│   │   ├── store/
│   │   │   └── useStore.ts        # Zustand global state
│   │   └── types/
│   │       └── index.ts           # TypeScript interfaces
│   ├── .env.example
│   └── package.json
│
├── render.yaml                    # Render.com deployment config
└── README.md
```

---

## Deployment (Render.com)

The backend is already deployed. If you fork this repo and want your own deployment:

### 1. Fork & push to GitHub

### 2. Create Render Web Service

1. Go to https://render.com → **New** → **Web Service**
2. Connect your GitHub repo
3. Settings:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install && npx prisma generate && npx prisma migrate deploy`
   - **Start Command**: `node backend/server.js`

### 3. Set Environment Variables in Render Dashboard

| Variable | Value |
|---|---|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | Your NeonDB pooled URL |
| `DATABASE_URL_UNPOOLED` | Your NeonDB direct URL |
| `REDIS_URL` | Your Upstash Redis URL |
| `JWT_SECRET` | Any long random string |
| `JWT_REFRESH_SECRET` | Another long random string |
| `CLOUDINARY_CLOUD_NAME` | Your Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Your Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Your Cloudinary API secret |

### 4. Seed demo data

After first deploy, open Render Shell and run:
```bash
node prisma/seed.js
```

### 5. Update mobile app

Point `mobile/.env` to your new Render URL:
```env
EXPO_PUBLIC_API_URL=https://your-app-name.onrender.com/api/v1
EXPO_PUBLIC_SOCKET_URL=https://your-app-name.onrender.com
```

> **Note:** Render free tier spins down after 15 min of inactivity. First request may take 30–60 seconds to wake up.

---

## Common Issues

**"CANNOT GET /api"** — The base path is `/api/v1/...`. Test with `/api/v1/auth/login`.

**Socket not connecting** — Make sure `EXPO_PUBLIC_SOCKET_URL` does NOT have `/api/v1` at the end — it's just the base URL.

**Map shows blank** — The map uses WebView + Leaflet. Make sure `expo-web-view` is installed. No Google Maps API key needed.

**Location not updating on parent map** — Child must tap "Start Sharing Location" first. Both must be connected to the internet.

**Expo Go crashes on startup** — Check the error boundary output. Usually a missing package — run `npm install` again.

**Backend sleeping (Render free tier)** — Send a request to `https://parent-child-connector.onrender.com/health` first to wake it up.

---

## Pairing a New Account

If you register fresh accounts (not the demo ones):

1. Register a **child** account → note the 6-character **Pair Code** shown on the child's home screen
2. Register a **parent** account → go to **Pair with Child** screen → enter that code
3. Both accounts are now linked
