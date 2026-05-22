# Flight Log Tracker

A small flight-hours logbook for student pilots. Built for ~12 classmates in an
aviation club to track training time, landings, and CFI endorsements; deployed
to Render's free tier so nobody pays a monthly bill.

## Stack

| Layer    | Choice                                  | Why                                                                                  |
| -------- | --------------------------------------- | ------------------------------------------------------------------------------------ |
| Database | Postgres 16 (Render free)               | Normalized schema with a separate `endorsements` table (see below)                   |
| API      | Node 20 + Express 4 + `pg`              | No ORM; the table count is small enough that hand-written SQL stays readable         |
| Client   | React 18 + Vite                         | Single-page app, served statically by the Express process in production              |
| Deploy   | Render blueprint (`render.yaml`)        | One free web service + one free Postgres, both provisioned from the file in this repo |

## Why normalized endorsements?

The first cut used a `JSONB endorsements` column on `flights`. It worked until I
needed queries like *"list all flights with a tailwheel endorsement signed by
CFI 3456789"*, which turned into nested `jsonb_path_exists` predicates that
didn't compose cleanly with date filters. Splitting into an `endorsements`
table with `flight_id` FK + `kind` enum-ish text gave me two simple btree
indexes (`endorsements_flight_idx`, `endorsements_kind_idx`) and ordinary
joins. Reads are one extra batched query (`WHERE flight_id = ANY($1)`), which
is cheap up to thousands of flights.

## The date parsing bug (v0.2.0)

Symptom: a pilot logged a flight on April 15 at 7pm Pacific and the row showed
up as April 16 in the table.

Root cause: the column was `TIMESTAMPTZ` and the client built the date with
`new Date().toISOString().slice(0, 10)`. Local 7pm PDT serializes to UTC 2am
next day, so `toISOString()` returned the next day's date.

Fix (in this repo):

1. `flight_date` is now `DATE`, not `TIMESTAMPTZ`. See [`server/db/schema.sql`](server/db/schema.sql).
2. `pg.types.setTypeParser(1082, ...)` keeps it as a `'YYYY-MM-DD'` string on
   the way out instead of letting the driver wrap it in a `Date`. See
   [`server/src/db.js`](server/src/db.js).
3. `todayLocalIso()` reads `getFullYear/getMonth/getDate` (local time) instead
   of going through ISO. See [`client/src/components/FlightForm.jsx`](client/src/components/FlightForm.jsx).
4. The API rejects any flight_date that isn't `YYYY-MM-DD`. See
   [`server/src/dates.js`](server/src/dates.js).

## CSV export (v0.2.1)

Pilots wanted to import their hours into Excel and ForeFlight before checkrides.
`GET /api/flights/export.csv` streams a CSV with one row per flight. Encoding
follows RFC 4180, so commas, quotes, and newlines inside remarks get escaped
correctly. Endorsements are flattened into a `kind:cfi#` semicolon list so the
single-row-per-flight shape stays clean for spreadsheet pivot tables.

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

## API surface

| Method | Path                                              | Notes                                                  |
| ------ | ------------------------------------------------- | ------------------------------------------------------ |
| GET    | `/api/health`                                     | Liveness probe                                         |
| GET    | `/api/me`                                         | Echoes pilot resolved from `x-pilot-email`             |
| GET    | `/api/flights?aircraft_type=&from=&to=`           | List, with optional filters                            |
| GET    | `/api/flights/summary`                            | Totals (hours, landings, count)                        |
| GET    | `/api/flights/export.csv`                         | Full export                                            |
| GET    | `/api/flights/:id`                                | Single flight + its endorsements                       |
| POST   | `/api/flights`                                    | Create                                                 |
| PUT    | `/api/flights/:id`                                | Update                                                 |
| DELETE | `/api/flights/:id`                                | Delete                                                 |
| POST   | `/api/flights/:id/endorsements`                   | Add endorsement (kind, instructor, CFI, signed_at)     |
| DELETE | `/api/flights/:id/endorsements/:endorsementId`    | Remove endorsement                                     |

Identity is a header (`x-pilot-email`). That's fine for a known group of classmates,
not fine for the open internet. Wiring up real auth would be a future task.

## Layout

```
flight-log-tracker/
├── render.yaml              # one-click Render deploy
├── package.json             # npm workspaces root
├── server/
│   ├── db/
│   │   ├── schema.sql       # flights + endorsements + indexes
│   │   ├── seed.sql         # demo data
│   │   └── migrate.js       # applies schema + seed
│   └── src/
│       ├── index.js         # Express entry, route table
│       ├── db.js            # pg Pool, custom type parsers
│       ├── dates.js         # ISO date validation
│       ├── flights.js       # CRUD + summary
│       ├── endorsements.js  # add/remove
│       └── csv.js           # RFC 4180 export
└── client/
    ├── index.html
    ├── vite.config.js
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── api.js
        ├── styles.css
        └── components/
            ├── FlightForm.jsx
            ├── FlightList.jsx
            ├── SummaryCard.jsx
            └── EndorsementModal.jsx
```
