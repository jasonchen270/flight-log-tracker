# Flight Log Tracker

A small flight-hours logbook for student pilots. Built for ~12 classmates in an
aviation club to track training time, landings, and CFI endorsements; deployed
to Render's free tier so nobody pays a monthly bill.

## Stack

| Layer    | Choice                                  | Why                                                                                  |
| -------- | --------------------------------------- | ------------------------------------------------------------------------------------ |
| Database | Postgres 16 (Render free)               | Normalized schema with a separate `endorsements` table                               |
| API      | Node 20 + Express 4 + `pg`              | No ORM; the table count is small enough that hand-written SQL stays readable         |
| Client   | React 18 + Vite                         | Single-page app, served statically by the Express process in production              |
| Deploy   | Render blueprint (`render.yaml`)        | One free web service + one free Postgres, both provisioned from the file in this repo |

## Local development

```bash
# 1. Postgres
createdb flight_log

# 2. Server
cd server
cp .env.example .env       # edit DATABASE_URL if needed
npm install
npm run migrate            # schema + seed
npm run dev                # API on :4000

# 3. Client (in another terminal)
cd client
npm install
npm run dev                # Vite on :5173
```

Open <http://localhost:5173>. The Vite dev server proxies `/api/*` to the
Express server so you don't need to worry about CORS.

## Deploy to Render

1. Push this repo to GitHub.
2. In Render, **New → Blueprint** and point it at the repo. It reads
   `render.yaml` and provisions both the Postgres DB and the web service.
3. First boot runs `npm run migrate` so the schema lands automatically.

### Free tier caveats

- The free Postgres expires after 90 days. Download a CSV (via the in-app
  button) before it does if you're staying on the free plan.
- The free web service spins down after ~15 minutes idle. First request after
  a cold start takes ~30 seconds; subsequent requests are normal.
