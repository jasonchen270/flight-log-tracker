import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from './db.js';
import {
    listFlights,
    getFlight,
    createFlight,
    updateFlight,
    deleteFlight,
    summarize,
} from './flights.js';
import { addEndorsement, removeEndorsement } from './endorsements.js';
import { flightsToCsv } from './csv.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(express.json({ limit: '64kb' }));
app.use(
    cors({
        origin: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173',
        credentials: true,
    }),
);

// Trivial pilot resolver. The app was built for ~12 classmates in one club,
// so we use a header instead of full auth. Behind a real deployment this would
// be a session lookup; the shape (one pilot per request) is the same.
function resolvePilot(req, res, next) {
    const email = String(req.header('x-pilot-email') ?? 'demo@aviationclub.test').toLowerCase();
    pool.query(
        `INSERT INTO pilots (email, display_name)
         VALUES ($1, $1)
         ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email
         RETURNING id, email, display_name`,
        [email],
    )
        .then(({ rows }) => {
            req.pilot = rows[0];
            next();
        })
        .catch(next);
}

app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
});

app.get('/api/me', resolvePilot, (req, res) => {
    res.json(req.pilot);
});

app.get('/api/flights', resolvePilot, async (req, res, next) => {
    try {
        const flights = await listFlights({
            pilotId: req.pilot.id,
            aircraftType: req.query.aircraft_type,
            from: req.query.from,
            to: req.query.to,
        });
        res.json({ flights });
    } catch (err) {
        next(err);
    }
});

app.get('/api/flights/summary', resolvePilot, async (req, res, next) => {
    try {
        const summary = await summarize(req.pilot.id);
        res.json(summary);
    } catch (err) {
        next(err);
    }
});

app.get('/api/flights/export.csv', resolvePilot, async (req, res, next) => {
    try {
        const flights = await listFlights({ pilotId: req.pilot.id });
        const csv = flightsToCsv(flights);
        res.set('Content-Type', 'text/csv; charset=utf-8');
        res.set(
            'Content-Disposition',
            `attachment; filename="flight-log-${new Date().toISOString().slice(0, 10)}.csv"`,
        );
        res.send(csv);
    } catch (err) {
        next(err);
    }
});

app.get('/api/flights/:id', resolvePilot, async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id)) return res.status(400).json({ error: 'bad id' });
        const flight = await getFlight(req.pilot.id, id);
        if (!flight) return res.status(404).json({ error: 'not found' });
        res.json(flight);
    } catch (err) {
        next(err);
    }
});

app.post('/api/flights', resolvePilot, async (req, res, next) => {
    try {
        const flight = await createFlight(req.pilot.id, req.body ?? {});
        res.status(201).json(flight);
    } catch (err) {
        next(err);
    }
});

app.put('/api/flights/:id', resolvePilot, async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id)) return res.status(400).json({ error: 'bad id' });
        const flight = await updateFlight(req.pilot.id, id, req.body ?? {});
        if (!flight) return res.status(404).json({ error: 'not found' });
        res.json(flight);
    } catch (err) {
        next(err);
    }
});

app.delete('/api/flights/:id', resolvePilot, async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id)) return res.status(400).json({ error: 'bad id' });
        const ok = await deleteFlight(req.pilot.id, id);
        if (!ok) return res.status(404).json({ error: 'not found' });
        res.status(204).end();
    } catch (err) {
        next(err);
    }
});

app.post('/api/flights/:id/endorsements', resolvePilot, async (req, res, next) => {
    try {
        const flightId = Number(req.params.id);
        if (!Number.isInteger(flightId)) return res.status(400).json({ error: 'bad id' });
        const endorsement = await addEndorsement(req.pilot.id, flightId, req.body ?? {});
        if (!endorsement) return res.status(404).json({ error: 'flight not found' });
        res.status(201).json(endorsement);
    } catch (err) {
        next(err);
    }
});

app.delete('/api/flights/:id/endorsements/:endorsementId', resolvePilot, async (req, res, next) => {
    try {
        const flightId = Number(req.params.id);
        const endorsementId = Number(req.params.endorsementId);
        if (!Number.isInteger(flightId) || !Number.isInteger(endorsementId)) {
            return res.status(400).json({ error: 'bad id' });
        }
        const ok = await removeEndorsement(req.pilot.id, flightId, endorsementId);
        if (!ok) return res.status(404).json({ error: 'not found' });
        res.status(204).end();
    } catch (err) {
        next(err);
    }
});

// Serve the built client in production so Render can host both halves on one service.
const clientDist = path.resolve(__dirname, '../../client/dist');
app.use(express.static(clientDist));
app.get(/^(?!\/api\/).+/, (_req, res, next) => {
    res.sendFile(path.join(clientDist, 'index.html'), (err) => {
        if (err) next();
    });
});

app.use((err, _req, res, _next) => {
    const status = err.status ?? 500;
    if (status >= 500) console.error(err);
    res.status(status).json({ error: err.message ?? 'server error' });
});

const port = Number(process.env.PORT ?? 4000);
app.listen(port, () => {
    console.log(`Flight log API listening on :${port}`);
});
