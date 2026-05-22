const ENDORSEMENT_LABEL = {
    solo: 'Solo',
    cross_country_solo: 'Solo XC',
    complex: 'Complex',
    high_performance: 'High perf',
    tailwheel: 'Tailwheel',
    high_altitude: 'High alt',
    '90_day_passenger': '90-day pax',
    flight_review: 'Flight review',
    ipc: 'IPC',
};

function fmtHours(n) {
    return Number(n ?? 0).toFixed(1);
}

export default function FlightList({ flights, loading, onEdit, onDelete, onEndorse }) {
    if (loading && flights.length === 0) {
        return <p className="muted">Loading flights...</p>;
    }
    if (flights.length === 0) {
        return <p className="muted">No flights yet. Log your first above.</p>;
    }

    return (
        <table className="flight-table">
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Aircraft</th>
                    <th>Tail</th>
                    <th>Route</th>
                    <th>Total</th>
                    <th>PIC</th>
                    <th>Solo</th>
                    <th>XC</th>
                    <th>Ldgs</th>
                    <th>Endorsements</th>
                    <th></th>
                </tr>
            </thead>
            <tbody>
                {flights.map((f) => (
                    <tr key={f.id}>
                        <td>{f.flight_date}</td>
                        <td>{f.aircraft_type}</td>
                        <td>{f.tail_number}</td>
                        <td className="route">{f.route ?? ''}</td>
                        <td className="num">{fmtHours(f.total_hours)}</td>
                        <td className="num">{fmtHours(f.pic_hours)}</td>
                        <td className="num">{fmtHours(f.solo_hours)}</td>
                        <td className="num">{fmtHours(f.cross_country_hours)}</td>
                        <td className="num">
                            {f.landings_day}
                            {f.landings_night > 0 && (
                                <span className="muted"> + {f.landings_night}n</span>
                            )}
                        </td>
                        <td>
                            {f.endorsements && f.endorsements.length > 0 ? (
                                <ul className="endorsement-chips">
                                    {f.endorsements.map((e) => (
                                        <li key={e.id} title={`${e.instructor_name} (CFI ${e.instructor_cfi}), signed ${e.signed_at}`}>
                                            {ENDORSEMENT_LABEL[e.kind] ?? e.kind}
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <span className="muted">N/A</span>
                            )}
                        </td>
                        <td className="actions">
                            <button onClick={() => onEdit(f)} className="ghost">Edit</button>
                            <button onClick={() => onEndorse(f)} className="ghost">Endorse</button>
                            <button onClick={() => onDelete(f.id)} className="danger">Delete</button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}
