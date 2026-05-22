import { pool } from './db.js';
import { normalizeFlightDate } from './dates.js';

const FLIGHT_COLUMNS = [
    'id',
    'pilot_id',
    'flight_date',
    'aircraft_type',
    'tail_number',
    'route',
    'total_hours',
    'pic_hours',
    'dual_received_hours',
    'solo_hours',
    'night_hours',
    'cross_country_hours',
    'landings_day',
    'landings_night',
    'remarks',
    'created_at',
    'updated_at',
];

const FLIGHT_SELECT = FLIGHT_COLUMNS.map((c) => `f.${c}`).join(', ');

async function attachEndorsements(rows) {
    if (rows.length === 0) return rows;
    const ids = rows.map((r) => r.id);
    const { rows: ends } = await pool.query(
        `SELECT id, flight_id, kind, instructor_name, instructor_cfi, signed_at, notes
         FROM endorsements
         WHERE flight_id = ANY($1)
         ORDER BY signed_at ASC, id ASC`,
        [ids],
    );
    const byFlight = new Map(rows.map((r) => [r.id, []]));
    for (const e of ends) byFlight.get(e.flight_id).push(e);
    return rows.map((r) => ({ ...r, endorsements: byFlight.get(r.id) ?? [] }));
}

export async function listFlights({ pilotId, aircraftType, from, to }) {
    const where = ['f.pilot_id = $1'];
    const params = [pilotId];
    if (aircraftType) {
        params.push(aircraftType);
        where.push(`f.aircraft_type = $${params.length}`);
    }
    if (from) {
        params.push(normalizeFlightDate(from));
        where.push(`f.flight_date >= $${params.length}`);
    }
    if (to) {
        params.push(normalizeFlightDate(to));
        where.push(`f.flight_date <= $${params.length}`);
    }
    const { rows } = await pool.query(
        `SELECT ${FLIGHT_SELECT}
         FROM flights f
         WHERE ${where.join(' AND ')}
         ORDER BY f.flight_date DESC, f.id DESC`,
        params,
    );
    return attachEndorsements(rows);
}

export async function getFlight(pilotId, id) {
    const { rows } = await pool.query(
        `SELECT ${FLIGHT_SELECT}
         FROM flights f
         WHERE f.pilot_id = $1 AND f.id = $2`,
        [pilotId, id],
    );
    if (rows.length === 0) return null;
    const [withEnds] = await attachEndorsements(rows);
    return withEnds;
}

const NUMERIC_FIELDS = [
    'total_hours',
    'pic_hours',
    'dual_received_hours',
    'solo_hours',
    'night_hours',
    'cross_country_hours',
];
const INT_FIELDS = ['landings_day', 'landings_night'];

function sanitizeFlightInput(body) {
    const out = {
        flight_date: normalizeFlightDate(body.flight_date),
        aircraft_type: String(body.aircraft_type ?? '').trim(),
        tail_number: String(body.tail_number ?? '').trim(),
        route: body.route ? String(body.route).trim() : null,
        remarks: body.remarks ? String(body.remarks).trim() : null,
    };
    if (!out.aircraft_type) throw Object.assign(new Error('aircraft_type required'), { status: 400 });
    if (!out.tail_number) throw Object.assign(new Error('tail_number required'), { status: 400 });

    for (const f of NUMERIC_FIELDS) {
        const v = body[f];
        const n = v === undefined || v === null || v === '' ? 0 : Number(v);
        if (!Number.isFinite(n) || n < 0) {
            throw Object.assign(new Error(`${f} must be a non-negative number`), { status: 400 });
        }
        out[f] = Math.round(n * 10) / 10;
    }
    for (const f of INT_FIELDS) {
        const v = body[f];
        const n = v === undefined || v === null || v === '' ? 0 : Number(v);
        if (!Number.isInteger(n) || n < 0) {
            throw Object.assign(new Error(`${f} must be a non-negative integer`), { status: 400 });
        }
        out[f] = n;
    }
    return out;
}

export async function createFlight(pilotId, body) {
    const f = sanitizeFlightInput(body);
    const { rows } = await pool.query(
        `INSERT INTO flights
            (pilot_id, flight_date, aircraft_type, tail_number, route,
             total_hours, pic_hours, dual_received_hours, solo_hours,
             night_hours, cross_country_hours, landings_day, landings_night, remarks)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
         RETURNING ${FLIGHT_COLUMNS.join(', ')}`,
        [
            pilotId, f.flight_date, f.aircraft_type, f.tail_number, f.route,
            f.total_hours, f.pic_hours, f.dual_received_hours, f.solo_hours,
            f.night_hours, f.cross_country_hours, f.landings_day, f.landings_night, f.remarks,
        ],
    );
    return { ...rows[0], endorsements: [] };
}

export async function updateFlight(pilotId, id, body) {
    const f = sanitizeFlightInput(body);
    const { rows } = await pool.query(
        `UPDATE flights SET
            flight_date         = $3,
            aircraft_type       = $4,
            tail_number         = $5,
            route               = $6,
            total_hours         = $7,
            pic_hours           = $8,
            dual_received_hours = $9,
            solo_hours          = $10,
            night_hours         = $11,
            cross_country_hours = $12,
            landings_day        = $13,
            landings_night      = $14,
            remarks             = $15
         WHERE pilot_id = $1 AND id = $2
         RETURNING ${FLIGHT_COLUMNS.join(', ')}`,
        [
            pilotId, id,
            f.flight_date, f.aircraft_type, f.tail_number, f.route,
            f.total_hours, f.pic_hours, f.dual_received_hours, f.solo_hours,
            f.night_hours, f.cross_country_hours, f.landings_day, f.landings_night, f.remarks,
        ],
    );
    if (rows.length === 0) return null;
    const [withEnds] = await attachEndorsements(rows);
    return withEnds;
}

export async function deleteFlight(pilotId, id) {
    const { rowCount } = await pool.query(
        'DELETE FROM flights WHERE pilot_id = $1 AND id = $2',
        [pilotId, id],
    );
    return rowCount > 0;
}

export async function summarize(pilotId) {
    const { rows } = await pool.query(
        `SELECT
            COUNT(*)::int                                  AS flight_count,
            COALESCE(SUM(total_hours), 0)::numeric(7,1)    AS total_hours,
            COALESCE(SUM(pic_hours), 0)::numeric(7,1)      AS pic_hours,
            COALESCE(SUM(solo_hours), 0)::numeric(7,1)     AS solo_hours,
            COALESCE(SUM(cross_country_hours), 0)::numeric(7,1) AS cross_country_hours,
            COALESCE(SUM(night_hours), 0)::numeric(7,1)    AS night_hours,
            COALESCE(SUM(landings_day), 0)::int            AS landings_day,
            COALESCE(SUM(landings_night), 0)::int          AS landings_night
         FROM flights WHERE pilot_id = $1`,
        [pilotId],
    );
    return rows[0];
}
