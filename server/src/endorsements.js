import { pool } from './db.js';
import { normalizeFlightDate } from './dates.js';

const ALLOWED_KINDS = new Set([
    'solo',
    'cross_country_solo',
    'complex',
    'high_performance',
    'tailwheel',
    'high_altitude',
    '90_day_passenger',
    'flight_review',
    'ipc',
]);

export async function addEndorsement(pilotId, flightId, body) {
    // Verify the flight belongs to this pilot before allowing endorsement insert.
    // Without this check, a pilot could attach an endorsement to anyone's flight.
    const { rows: owns } = await pool.query(
        'SELECT 1 FROM flights WHERE id = $1 AND pilot_id = $2',
        [flightId, pilotId],
    );
    if (owns.length === 0) return null;

    const kind = String(body.kind ?? '');
    if (!ALLOWED_KINDS.has(kind)) {
        throw Object.assign(new Error(`Unknown endorsement kind: ${kind}`), { status: 400 });
    }
    const instructorName = String(body.instructor_name ?? '').trim();
    const instructorCfi = String(body.instructor_cfi ?? '').trim();
    if (!instructorName || !instructorCfi) {
        throw Object.assign(new Error('instructor_name and instructor_cfi required'), { status: 400 });
    }
    const signedAt = normalizeFlightDate(body.signed_at);
    const notes = body.notes ? String(body.notes).trim() : null;

    const { rows } = await pool.query(
        `INSERT INTO endorsements (flight_id, kind, instructor_name, instructor_cfi, signed_at, notes)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, flight_id, kind, instructor_name, instructor_cfi, signed_at, notes`,
        [flightId, kind, instructorName, instructorCfi, signedAt, notes],
    );
    return rows[0];
}

export async function removeEndorsement(pilotId, flightId, endorsementId) {
    const { rowCount } = await pool.query(
        `DELETE FROM endorsements e
         USING flights f
         WHERE e.id = $1 AND e.flight_id = $2 AND f.id = e.flight_id AND f.pilot_id = $3`,
        [endorsementId, flightId, pilotId],
    );
    return rowCount > 0;
}
