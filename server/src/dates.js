// Date helpers. Pilots type dates as 'YYYY-MM-DD' (HTML date input).
// We want one canonical parse path so we never accidentally invoke
// `new Date(str)`, which is where the off-by-one bug came from.

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function isValidIsoDate(value) {
    if (typeof value !== 'string' || !ISO_DATE.test(value)) return false;
    const [y, m, d] = value.split('-').map(Number);
    // Roundtrip through a UTC Date to catch impossible dates like 2026-02-30.
    const dt = new Date(Date.UTC(y, m - 1, d));
    return (
        dt.getUTCFullYear() === y &&
        dt.getUTCMonth() === m - 1 &&
        dt.getUTCDate() === d
    );
}

// Pass through to Postgres as a plain string. The DATE column will
// store it without applying a timezone offset.
export function normalizeFlightDate(value) {
    if (!isValidIsoDate(value)) {
        const err = new Error(`Invalid date: ${value}. Expected YYYY-MM-DD.`);
        err.status = 400;
        throw err;
    }
    return value;
}
