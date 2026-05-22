function num(n, digits = 1) {
    return Number(n ?? 0).toFixed(digits);
}

const STATS = [
    { key: 'total_hours', label: 'Total hours' },
    { key: 'pic_hours', label: 'PIC' },
    { key: 'solo_hours', label: 'Solo' },
    { key: 'cross_country_hours', label: 'XC' },
    { key: 'night_hours', label: 'Night' },
    { key: 'landings_day', label: 'Day ldgs', digits: 0 },
    { key: 'landings_night', label: 'Night ldgs', digits: 0 },
    { key: 'flight_count', label: 'Flights', digits: 0 },
];

export default function SummaryCard({ summary, loading }) {
    return (
        <section className="card summary">
            <h2>Totals</h2>
            {loading ? (
                <p className="muted">Loading...</p>
            ) : (
                <dl className="stat-grid">
                    {STATS.map((s) => (
                        <div key={s.key} className="stat">
                            <dt>{s.label}</dt>
                            <dd>{num(summary?.[s.key], s.digits ?? 1)}</dd>
                        </div>
                    ))}
                </dl>
            )}
        </section>
    );
}
