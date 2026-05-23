# Flight Log Tracker

A small flight-hours logbook for student pilots, built for ~12 classmates in an aviation club to track training time, landings, and CFI endorsements. It uses a normalized Postgres schema, a Node + Express API with hand-written SQL via `pg` (no ORM), and a React + Vite single-page client.

## Prerequisites

- Node 20
- Postgres 16

## Installation

```bash
# 1. Postgres
createdb flight_log

# 2. Server
cd server
cp .env.example .env       # edit DATABASE_URL if needed
npm install
npm run migrate            # schema + seed

# 3. Client (in another terminal)
cd client
npm install
```

## Usage

```bash
# Server (API on :4000)
cd server
npm run dev

# Client (Vite on :5173)
cd client
npm run dev
```

Open <http://localhost:5173>. The Vite dev server proxies `/api/*` to the
Express server so you don't need to worry about CORS.
