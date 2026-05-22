import { useCallback, useEffect, useMemo, useState } from 'react';
import { api, currentPilotEmail, setPilotEmail } from './api.js';
import FlightForm from './components/FlightForm.jsx';
import FlightList from './components/FlightList.jsx';
import SummaryCard from './components/SummaryCard.jsx';
import EndorsementModal from './components/EndorsementModal.jsx';

const emptyFilters = { aircraft_type: '', from: '', to: '' };

export default function App() {
    const [pilotEmail, setPilotEmailState] = useState(currentPilotEmail());
    const [flights, setFlights] = useState([]);
    const [summary, setSummary] = useState(null);
    const [editing, setEditing] = useState(null);
    const [filters, setFilters] = useState(emptyFilters);
    const [endorseFor, setEndorseFor] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    const refresh = useCallback(async () => {
        setLoading(true);
        try {
            const [{ flights }, summary] = await Promise.all([
                api.listFlights(filters),
                api.summary(),
            ]);
            setFlights(flights);
            setSummary(summary);
            setError(null);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        refresh();
    }, [refresh, pilotEmail]);

    const aircraftTypes = useMemo(() => {
        const set = new Set(flights.map((f) => f.aircraft_type));
        return Array.from(set).sort();
    }, [flights]);

    async function handleSubmit(values) {
        try {
            if (editing) {
                await api.updateFlight(editing.id, values);
            } else {
                await api.createFlight(values);
            }
            setEditing(null);
            await refresh();
        } catch (err) {
            setError(err.message);
        }
    }

    async function handleDelete(id) {
        if (!confirm('Delete this flight? This cannot be undone.')) return;
        try {
            await api.deleteFlight(id);
            await refresh();
        } catch (err) {
            setError(err.message);
        }
    }

    function handlePilotChange(e) {
        e.preventDefault();
        const next = new FormData(e.currentTarget).get('email')?.toString().trim().toLowerCase();
        if (next) {
            setPilotEmail(next);
            setPilotEmailState(next);
        }
    }

    return (
        <div className="app">
            <header className="app-header">
                <div>
                    <h1>Flight Log Tracker</h1>
                    <p className="subtitle">Hours, landings, and endorsements for student pilots.</p>
                </div>
                <form className="pilot-switch" onSubmit={handlePilotChange}>
                    <label htmlFor="pilot-email">Pilot</label>
                    <input
                        id="pilot-email"
                        name="email"
                        type="email"
                        defaultValue={pilotEmail}
                        autoComplete="email"
                    />
                    <button type="submit">Switch</button>
                </form>
            </header>

            {error && (
                <div className="error" role="alert">
                    {error} <button onClick={() => setError(null)}>dismiss</button>
                </div>
            )}

            <SummaryCard summary={summary} loading={loading && !summary} />

            <section className="card">
                <h2>{editing ? `Edit flight ${editing.flight_date}` : 'Log a flight'}</h2>
                <FlightForm
                    key={editing?.id ?? 'new'}
                    initial={editing}
                    onSubmit={handleSubmit}
                    onCancel={editing ? () => setEditing(null) : null}
                />
            </section>

            <section className="card">
                <div className="list-toolbar">
                    <h2>Flights</h2>
                    <div className="filters">
                        <select
                            value={filters.aircraft_type}
                            onChange={(e) => setFilters((f) => ({ ...f, aircraft_type: e.target.value }))}
                        >
                            <option value="">All aircraft</option>
                            {aircraftTypes.map((t) => (
                                <option key={t} value={t}>{t}</option>
                            ))}
                        </select>
                        <input
                            type="date"
                            value={filters.from}
                            onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))}
                            aria-label="from date"
                        />
                        <input
                            type="date"
                            value={filters.to}
                            onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))}
                            aria-label="to date"
                        />
                        <button onClick={() => setFilters(emptyFilters)} disabled={
                            !filters.aircraft_type && !filters.from && !filters.to
                        }>
                            Clear
                        </button>
                        <a className="button" href={api.exportCsvUrl()} download>
                            Export CSV
                        </a>
                    </div>
                </div>
                <FlightList
                    flights={flights}
                    loading={loading}
                    onEdit={setEditing}
                    onDelete={handleDelete}
                    onEndorse={setEndorseFor}
                />
            </section>

            {endorseFor && (
                <EndorsementModal
                    flight={endorseFor}
                    onClose={() => setEndorseFor(null)}
                    onSaved={async () => {
                        setEndorseFor(null);
                        await refresh();
                    }}
                />
            )}
        </div>
    );
}
