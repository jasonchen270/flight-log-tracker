import 'dotenv/config';
import pg from 'pg';

// NUMERIC columns ship as strings by default to preserve precision.
// We coerce to Number at the API boundary so JSON consumers don't
// have to think about it. Safe here because total_hours fits in
// JS Number range (NUMERIC(4,1) maxes at 999.9).
pg.types.setTypeParser(1700, (val) => (val === null ? null : Number(val)));

// DATE columns (oid 1082) parse to JS Date by default, which re-introduces
// the very timezone problem we're avoiding. Keep as 'YYYY-MM-DD' string.
pg.types.setTypeParser(1082, (val) => val);

const { DATABASE_URL } = process.env;
if (!DATABASE_URL) {
    throw new Error('DATABASE_URL is required');
}

export const pool = new pg.Pool({
    connectionString: DATABASE_URL,
    ssl: DATABASE_URL.includes('render.com') ? { rejectUnauthorized: false } : false,
    max: 5,
});
