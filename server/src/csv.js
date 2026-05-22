// CSV export. Hand-rolled to avoid pulling in a dependency for ~20 lines of code.
// Properly escapes per RFC 4180: wrap any cell containing a comma, quote, CR, or LF
// in double quotes and double up any internal quotes.

const HEADERS = [
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
    'endorsements',
    'remarks',
];

function escapeCell(value) {
    if (value === null || value === undefined) return '';
    const s = String(value);
    if (/[",\r\n]/.test(s)) {
        return '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
}

export function flightsToCsv(flights) {
    const lines = [HEADERS.join(',')];
    for (const f of flights) {
        const endorsementSummary = (f.endorsements ?? [])
            .map((e) => `${e.kind}:${e.instructor_cfi}`)
            .join('; ');
        lines.push([
            f.flight_date,
            f.aircraft_type,
            f.tail_number,
            f.route ?? '',
            f.total_hours,
            f.pic_hours,
            f.dual_received_hours,
            f.solo_hours,
            f.night_hours,
            f.cross_country_hours,
            f.landings_day,
            f.landings_night,
            endorsementSummary,
            f.remarks ?? '',
        ].map(escapeCell).join(','));
    }
    // CRLF line endings. Excel on Windows is picky and CRLF works everywhere.
    return lines.join('\r\n') + '\r\n';
}
